import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, ArrowLeft, Trophy, Lock, CheckCircle2, Star, PlayCircle } from 'lucide-react';
import { createPageUrl } from '@/utils';
import BottomNav from '@/components/mobile/BottomNav';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import Quiz from '@/components/learning/Quiz';
import InteractiveGuide from '@/components/learning/InteractiveGuide';
import AchievementBadge from '@/components/learning/AchievementBadge';
import ProgressDashboard from '@/components/learning/ProgressDashboard';
import SpotTheDeepfake from '@/components/learning/SpotTheDeepfake';
import HowAIWorks from '@/components/learning/HowAIWorks';
import DetectionSignals from '@/components/learning/DetectionSignals';
import confetti from 'canvas-confetti';
import { toast } from 'sonner';

export default function Learn() {
  const [selectedModule, setSelectedModule] = useState(null);
  const [activeTab, setActiveTab] = useState('guide');
  const queryClient = useQueryClient();

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me().catch(() => null)
  });

  const { data: modules = [] } = useQuery({
    queryKey: ['learningModules'],
    queryFn: async () => {
      const mods = await base44.entities.LearningModule.filter({ published: true });
      return mods.sort((a, b) => (a.order || 0) - (b.order || 0));
    }
  });

  const { data: userProgress = [] } = useQuery({
    queryKey: ['userProgress'],
    queryFn: async () => {
      if (!currentUser) return [];
      return await base44.entities.UserProgress.filter({ created_by: currentUser.email });
    },
    enabled: !!currentUser
  });

  const { data: achievements = [] } = useQuery({
    queryKey: ['achievements'],
    queryFn: async () => {
      if (!currentUser) return [];
      return await base44.entities.Achievement.filter({ created_by: currentUser.email });
    },
    enabled: !!currentUser
  });

  const saveProgressMutation = useMutation({
    mutationFn: async (data) => {
      const existing = userProgress.find(p => p.module_id === data.module_id);
      if (existing) {
        return await base44.entities.UserProgress.update(existing.id, data);
      } else {
        return await base44.entities.UserProgress.create(data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userProgress'] });
    }
  });

  const unlockAchievementMutation = useMutation({
    mutationFn: async (achievement) => {
      return await base44.entities.Achievement.create({
        ...achievement,
        earned_at: new Date().toISOString()
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['achievements'] });
      confetti({
        particleCount: 150,
        spread: 100,
        origin: { y: 0.5 }
      });
    }
  });

  const handleQuizComplete = async ({ score, attempts }) => {
    const module = selectedModule;
    const progress = userProgress.find(p => p.module_id === module.id);
    
    await saveProgressMutation.mutateAsync({
      module_id: module.id,
      quiz_score: score,
      quiz_attempts: (progress?.quiz_attempts || 0) + attempts,
      points_earned: (progress?.points_earned || 0) + (module.points || 100),
      completed: score >= 70,
      completed_at: score >= 70 ? new Date().toISOString() : undefined
    });

    if (score === 100) {
      await unlockAchievementMutation.mutateAsync({
        name: `Perfect Score: ${module.title}`,
        description: `Achieved 100% on ${module.title} quiz`,
        icon: 'star',
        type: 'quiz_perfect',
        points: 50
      });
    }

    if (score >= 70) {
      toast.success('Module completed! Points earned: ' + (module.points || 100));
    }
  };

  const handleGuideComplete = async ({ stepsCompleted, completedAll, techniquesLearned, score, categoriesCompleted }) => {
    const module = selectedModule;
    await saveProgressMutation.mutateAsync({
      module_id: module.id,
      steps_completed: stepsCompleted,
      completed: true,
      completed_at: new Date().toISOString(),
      points_earned: module.points || 100
    });

    // Award module-specific badge
    await unlockAchievementMutation.mutateAsync({
      name: module.title,
      description: `Mastered ${module.title}`,
      icon: 'trophy',
      type: 'module_complete',
      module_slug: module.slug,
      points: module.points || 100
    });

    toast.success(`🎉 Badge earned: ${module.title}!`);
    setSelectedModule(null);
  };

  const getModuleProgress = (moduleId) => {
    return userProgress.find(p => p.module_id === moduleId);
  };

  const calculateStats = () => {
    const completed = userProgress.filter(p => p.completed).length;
    const avgScore = userProgress.length > 0
      ? Math.round(userProgress.reduce((sum, p) => sum + (p.quiz_score || 0), 0) / userProgress.length)
      : 0;
    const totalPoints = userProgress.reduce((sum, p) => sum + (p.points_earned || 0), 0) 
      + achievements.reduce((sum, a) => sum + (a.points || 0), 0);
    
    return {
      modulesCompleted: completed,
      totalModules: modules.length,
      quizAverage: avgScore,
      totalPoints,
      streak: 0
    };
  };

  if (selectedModule) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white pb-20 md:pb-0">
        <header className="border-b border-slate-100 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
          <div className="max-w-6xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <button
                onClick={() => setSelectedModule(null)}
                className="flex items-center gap-2 text-slate-500 hover:text-slate-700 text-sm font-medium"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Modules
              </button>
              {selectedModule.content?.component ? null : (
                <div className="flex gap-2">
                  <Button
                    onClick={() => setActiveTab('guide')}
                    variant={activeTab === 'guide' ? 'default' : 'outline'}
                    size="sm"
                  >
                    📖 Guide
                  </Button>
                  <Button
                    onClick={() => setActiveTab('quiz')}
                    variant={activeTab === 'quiz' ? 'default' : 'outline'}
                    size="sm"
                  >
                    ❓ Quiz
                  </Button>
                </div>
              )}
            </div>
          </div>
        </header>

        <div className="max-w-6xl mx-auto px-6 py-12">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-slate-900 mb-3">{selectedModule.title}</h1>
            <p className="text-xl text-slate-600">{selectedModule.description}</p>
          </div>

          <AnimatePresence mode="wait">
            {/* Interactive Components */}
            {selectedModule.content?.component === 'SpotTheDeepfake' && (
              <motion.div
                key="spot-deepfake"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <SpotTheDeepfake onComplete={handleQuizComplete} />
              </motion.div>
            )}

            {selectedModule.content?.component === 'HowAIWorks' && (
              <motion.div
                key="how-ai-works"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <HowAIWorks onComplete={handleGuideComplete} />
              </motion.div>
            )}

            {selectedModule.content?.component === 'DetectionSignals' && (
              <motion.div
                key="detection-signals"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <DetectionSignals onComplete={handleQuizComplete} />
              </motion.div>
            )}

            {/* Original Guide & Quiz */}
            {activeTab === 'guide' && selectedModule.content?.steps && (
              <motion.div
                key="guide"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <InteractiveGuide
                  steps={selectedModule.content.steps}
                  onComplete={handleGuideComplete}
                />
              </motion.div>
            )}

            {activeTab === 'quiz' && selectedModule.quiz && (
              <motion.div
                key="quiz"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <Quiz
                  questions={selectedModule.quiz}
                  onComplete={handleQuizComplete}
                  moduleId={selectedModule.id}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <BottomNav />
      </div>
    );
  }

  const stats = calculateStats();

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white pb-20 md:pb-0">
      <header className="border-b border-slate-100 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <a 
              href={createPageUrl('Home')}
              className="flex items-center gap-3"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center">
                <Trophy className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-slate-800 leading-tight">Interactive Learning</h1>
                <p className="text-xs text-slate-500">Master AI Detection</p>
              </div>
            </a>
            <a
              href={createPageUrl('Home')}
              className="flex items-center gap-2 text-slate-500 hover:text-slate-700 text-sm font-medium"
            >
              <ArrowLeft className="w-4 h-4" />
              Home
            </a>
          </div>
        </div>
      </header>

      <section className="py-12 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
              Learn by Doing 🎯
            </h2>
            <p className="text-xl text-slate-600">
              Interactive modules, quizzes, and achievements to master AI content verification
            </p>
          </motion.div>

          {currentUser && <ProgressDashboard stats={stats} />}

          {achievements.length > 0 && (
            <div className="mb-12">
              <h3 className="text-2xl font-bold text-slate-900 mb-6">Your Achievements 🏆</h3>
              <div className="flex gap-4 flex-wrap">
                {achievements.map((achievement) => (
                  <div key={achievement.id} className="text-center">
                    <AchievementBadge achievement={achievement} unlocked={true} size="lg" />
                    <p className="text-sm font-semibold text-slate-900 mt-2">{achievement.name}</p>
                    <p className="text-xs text-slate-600">+{achievement.points} pts</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-8">
            {['beginner', 'intermediate', 'advanced'].map((category) => {
              const categoryModules = modules.filter(m => m.category === category);
              if (categoryModules.length === 0) return null;

              return (
                <div key={category}>
                  <h3 className="text-2xl font-bold text-slate-900 mb-6 capitalize flex items-center gap-2">
                    {category === 'beginner' && '🌱'}
                    {category === 'intermediate' && '⚡'}
                    {category === 'advanced' && '🚀'}
                    {category} Level
                  </h3>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {categoryModules.map((module, i) => {
                      const progress = getModuleProgress(module.id);
                      const isLocked = module.prerequisites?.some(
                        prereq => !userProgress.find(p => p.module_id === prereq && p.completed)
                      );

                      return (
                        <motion.button
                          key={module.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.1 }}
                          onClick={() => !isLocked && setSelectedModule(module)}
                          disabled={isLocked}
                          className={`bg-white rounded-2xl border-2 p-6 text-left transition-all ${
                            isLocked
                              ? 'border-slate-200 opacity-50 cursor-not-allowed'
                              : 'border-slate-200 hover:border-indigo-500 hover:shadow-lg'
                          }`}
                        >
                          <div className="flex justify-between items-start mb-4">
                            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${
                              progress?.completed
                                ? 'from-green-400 to-emerald-500'
                                : 'from-indigo-400 to-purple-500'
                            } flex items-center justify-center`}>
                              {isLocked ? (
                                <Lock className="w-6 h-6 text-white" />
                              ) : progress?.completed ? (
                                <CheckCircle2 className="w-6 h-6 text-white" />
                              ) : (
                                <PlayCircle className="w-6 h-6 text-white" />
                              )}
                            </div>
                            {progress?.completed && (
                              <div className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-bold">
                                <Star className="w-3 h-3" />
                                {module.points} pts
                              </div>
                            )}
                          </div>

                          <h4 className="text-lg font-bold text-slate-900 mb-2">
                            {module.title}
                          </h4>
                          <p className="text-sm text-slate-600 mb-4">
                            {module.description}
                          </p>

                          <div className="flex items-center justify-between text-xs text-slate-500">
                            <span>⏱️ {module.estimated_time}min</span>
                            {progress?.quiz_score && (
                              <span className="font-semibold text-indigo-600">
                                Score: {progress.quiz_score}%
                              </span>
                            )}
                          </div>
                        </motion.button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {modules.length === 0 && (
            <div className="text-center py-16">
              <Trophy className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-slate-900 mb-2">Coming Soon!</h3>
              <p className="text-slate-600">Interactive learning modules are being prepared.</p>
            </div>
          )}
        </div>
      </section>

      <BottomNav />
    </div>
  );
}