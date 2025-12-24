import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Shield, ArrowLeft, CheckCircle2, ChevronRight } from 'lucide-react';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import Quiz from '@/components/learning/Quiz';
import AchievementNotification from '@/components/learning/AchievementNotification';
import { toast } from 'sonner';

export default function LearnModule() {
  const queryClient = useQueryClient();
  const [currentStep, setCurrentStep] = useState(0);
  const [showQuiz, setShowQuiz] = useState(false);
  const [newAchievement, setNewAchievement] = useState(null);
  const [startTime] = useState(Date.now());

  const urlParams = new URLSearchParams(window.location.search);
  const moduleId = urlParams.get('id');

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me().catch(() => null)
  });

  const { data: module, isLoading } = useQuery({
    queryKey: ['module', moduleId],
    queryFn: async () => {
      const modules = await base44.entities.LearningModule.filter({ id: moduleId });
      return modules[0];
    },
    enabled: !!moduleId
  });

  const { data: progress } = useQuery({
    queryKey: ['progress', moduleId, currentUser?.email],
    queryFn: async () => {
      if (!currentUser) return null;
      const prog = await base44.entities.UserProgress.filter({
        module_id: moduleId,
        user_email: currentUser.email
      });
      return prog[0] || null;
    },
    enabled: !!moduleId && !!currentUser
  });

  const updateProgressMutation = useMutation({
    mutationFn: async (data) => {
      if (progress) {
        return base44.entities.UserProgress.update(progress.id, data);
      } else {
        return base44.entities.UserProgress.create({
          module_id: moduleId,
          user_email: currentUser.email,
          ...data
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['progress']);
    }
  });

  const checkAchievementsMutation = useMutation({
    mutationFn: async (score) => {
      const allProgress = await base44.entities.UserProgress.filter({
        user_email: currentUser.email,
        status: 'completed'
      });
      
      const achievements = await base44.entities.Achievement.list();
      const userAchievements = await base44.entities.UserAchievement.filter({
        user_email: currentUser.email
      });
      
      const earnedIds = new Set(userAchievements.map(ua => ua.achievement_id));
      
      for (const achievement of achievements) {
        if (earnedIds.has(achievement.id)) continue;
        
        let earned = false;
        if (achievement.criteria.type === 'modules_completed') {
          earned = allProgress.length >= achievement.criteria.value;
        } else if (achievement.criteria.type === 'quiz_score') {
          earned = score >= achievement.criteria.value;
        } else if (achievement.criteria.type === 'specific_module') {
          earned = moduleId === achievement.criteria.module_id;
        }
        
        if (earned) {
          await base44.entities.UserAchievement.create({
            user_email: currentUser.email,
            achievement_id: achievement.id
          });
          setNewAchievement(achievement);
          break;
        }
      }
    }
  });

  useEffect(() => {
    if (module && currentUser && progress?.current_step !== currentStep) {
      const progressPercentage = ((currentStep + 1) / ((module.content?.steps?.length || 0) + 1)) * 100;
      updateProgressMutation.mutate({
        status: 'in_progress',
        current_step: currentStep,
        progress_percentage: progressPercentage
      });
    }
  }, [currentStep]);

  const handleNextStep = () => {
    const totalSteps = module.content?.steps?.length || 0;
    if (currentStep < totalSteps - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      setShowQuiz(true);
    }
  };

  const handleQuizComplete = async (score) => {
    const timeSpent = Math.round((Date.now() - startTime) / 60000);
    
    await updateProgressMutation.mutateAsync({
      status: 'completed',
      progress_percentage: 100,
      quiz_score: score,
      quiz_attempts: (progress?.quiz_attempts || 0) + 1,
      completed_date: new Date().toISOString(),
      time_spent: timeSpent
    });
    
    await checkAchievementsMutation.mutateAsync(score);
    
    toast.success('Module completed!');
    setTimeout(() => {
      window.location.href = createPageUrl('Learn');
    }, 2000);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-slate-300 border-t-slate-900 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!module) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-600 mb-4">Module not found</p>
          <a href={createPageUrl('Learn')} className="text-[#3498DB] hover:underline">
            Back to Learning Center
          </a>
        </div>
      </div>
    );
  }

  const steps = module.content?.steps || [];
  const currentStepData = steps[currentStep];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white pb-20">
      {/* Header */}
      <header className="border-b border-slate-100 bg-white/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <a href={createPageUrl('Learn')} className="flex items-center gap-2 text-slate-600 hover:text-slate-900">
              <ArrowLeft className="w-5 h-5" />
              <span className="font-medium">Back</span>
            </a>
            
            {/* Progress */}
            <div className="flex items-center gap-3">
              <div className="text-sm text-slate-600">
                Step {currentStep + 1} of {steps.length}
              </div>
              <div className="w-32 h-2 bg-slate-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-[#3498DB] transition-all"
                  style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-6 py-12">
        {!showQuiz ? (
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            {/* Module Title */}
            {currentStep === 0 && (
              <div className="mb-8">
                <h1 className="text-4xl font-bold text-slate-900 mb-4">{module.title}</h1>
                <p className="text-xl text-slate-600">{module.description}</p>
              </div>
            )}

            {/* Step Content */}
            {currentStepData && (
              <div className="bg-white rounded-2xl border-2 border-slate-200 p-8 mb-6">
                <h2 className="text-2xl font-bold text-slate-900 mb-4">
                  {currentStepData.title}
                </h2>
                
                {currentStepData.image_url && (
                  <img 
                    src={currentStepData.image_url}
                    alt={currentStepData.title}
                    className="w-full rounded-xl mb-6"
                  />
                )}
                
                <div className="prose prose-slate max-w-none">
                  <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">
                    {currentStepData.content}
                  </p>
                </div>

                {currentStepData.interactive_element && (
                  <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                    <p className="text-sm text-blue-900 font-medium mb-2">Try it yourself:</p>
                    <p className="text-sm text-blue-800">{currentStepData.interactive_element}</p>
                  </div>
                )}
              </div>
            )}

            {/* Navigation */}
            <div className="flex justify-between items-center">
              <Button
                variant="outline"
                onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
                disabled={currentStep === 0}
              >
                Previous
              </Button>
              
              <Button
                onClick={handleNextStep}
                className="bg-[#3498DB] hover:bg-[#2980b9] gap-2"
              >
                {currentStep === steps.length - 1 ? 'Take Quiz' : 'Next Step'}
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </motion.div>
        ) : (
          <div>
            <h2 className="text-3xl font-bold text-slate-900 mb-2">Test Your Knowledge</h2>
            <p className="text-slate-600 mb-6">Complete this quiz to finish the module</p>
            <Quiz quiz={module.quiz} onComplete={handleQuizComplete} />
          </div>
        )}
      </main>

      {/* Achievement Notification */}
      <AchievementNotification
        achievement={newAchievement}
        onClose={() => setNewAchievement(null)}
      />
    </div>
  );
}