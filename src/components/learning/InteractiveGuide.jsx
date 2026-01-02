import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, ArrowRight, ArrowLeft, Upload, Lightbulb } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function InteractiveGuide({ steps = [], onComplete }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState([]);
  const [taskCompleted, setTaskCompleted] = useState(false);
  const [userInput, setUserInput] = useState('');

  // Filter out invalid steps
  const validSteps = steps.filter(step => step && step.title && step.content);
  const step = validSteps[currentStep];
  const progress = ((completedSteps.length) / validSteps.length) * 100;
  
  // Handle case where no valid steps exist
  if (validSteps.length === 0) {
    return (
      <div className="max-w-3xl mx-auto text-center p-12">
        <p className="text-slate-600">No content available for this module yet.</p>
      </div>
    );
  }

  const handleTaskComplete = () => {
    if (!completedSteps.includes(currentStep)) {
      setCompletedSteps([...completedSteps, currentStep]);
    }
    setTaskCompleted(true);
    toast.success('Step completed!');
  };

  const handleNext = () => {
    if (currentStep < validSteps.length - 1) {
      setCurrentStep(currentStep + 1);
      setTaskCompleted(false);
      setUserInput('');
    } else {
      onComplete({ stepsCompleted: completedSteps });
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      setTaskCompleted(completedSteps.includes(currentStep - 1));
    }
  };

  const renderInteractiveTask = (task) => {
    if (!task) return null;

    switch (task.type) {
      case 'upload':
        return (
          <div className="mt-6 p-6 bg-indigo-50 border-2 border-indigo-200 rounded-xl">
            <h4 className="font-semibold text-indigo-900 mb-3 flex items-center gap-2">
              <Upload className="w-5 h-5" />
              Interactive Task
            </h4>
            <p className="text-slate-700 mb-4">{task.instructions}</p>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                if (e.target.files[0]) {
                  handleTaskComplete();
                }
              }}
              className="w-full p-3 border-2 border-indigo-300 rounded-lg"
            />
          </div>
        );

      case 'identify':
        return (
          <div className="mt-6 p-6 bg-indigo-50 border-2 border-indigo-200 rounded-xl">
            <h4 className="font-semibold text-indigo-900 mb-3 flex items-center gap-2">
              <Lightbulb className="w-5 h-5" />
              Try It Yourself
            </h4>
            <p className="text-slate-700 mb-4">{task.instructions}</p>
            <input
              type="text"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              placeholder="Type your answer..."
              className="w-full p-3 border-2 border-indigo-300 rounded-lg mb-3"
            />
            <Button
              onClick={() => {
                if (userInput.toLowerCase().includes(task.correct_answer.toLowerCase())) {
                  handleTaskComplete();
                  toast.success('Correct! Great job!');
                } else {
                  toast.error('Not quite. Try again!');
                }
              }}
              disabled={!userInput}
              className="w-full"
            >
              Check Answer
            </Button>
          </div>
        );

      case 'compare':
        return (
          <div className="mt-6 p-6 bg-indigo-50 border-2 border-indigo-200 rounded-xl">
            <h4 className="font-semibold text-indigo-900 mb-3">Compare & Identify</h4>
            <p className="text-slate-700 mb-4">{task.instructions}</p>
            <Button
              onClick={handleTaskComplete}
              className="w-full"
            >
              Mark as Reviewed
            </Button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      {/* Progress */}
      <div className="mb-8">
        <div className="flex justify-between text-sm text-slate-600 mb-2">
          <span>Step {currentStep + 1} of {steps.length}</span>
          <span>{completedSteps.length}/{steps.length} completed</span>
        </div>
        <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
          <motion.div
            animate={{ width: `${progress}%` }}
            className="h-full bg-gradient-to-r from-indigo-500 to-purple-500"
          />
        </div>
      </div>

      {/* Step Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="bg-white rounded-2xl border-2 border-slate-200 p-8 mb-6"
        >
          {completedSteps.includes(currentStep) && (
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-semibold mb-4">
              <CheckCircle2 className="w-4 h-4" />
              Completed
            </div>
          )}
          
          <h3 className="text-2xl font-bold text-slate-900 mb-4">
            {step.title}
          </h3>

          {step.image_url && (
            <img
              src={step.image_url}
              alt={step.title}
              className="w-full rounded-xl mb-6"
            />
          )}

          <div 
            className="prose prose-slate max-w-none text-slate-700 mb-6"
            dangerouslySetInnerHTML={{ __html: step.content }}
          />

          {step.interactive_task && renderInteractiveTask(step.interactive_task)}

          {!step.interactive_task && !completedSteps.includes(currentStep) && (
            <Button
              onClick={handleTaskComplete}
              className="w-full mt-4"
            >
              Mark Step as Complete
            </Button>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Navigation */}
      <div className="flex gap-4">
        <Button
          onClick={handlePrevious}
          disabled={currentStep === 0}
          variant="outline"
          className="flex-1"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Previous
        </Button>
        <Button
          onClick={handleNext}
          disabled={!taskCompleted && !completedSteps.includes(currentStep)}
          className="flex-1"
        >
          {currentStep < steps.length - 1 ? (
            <>
              Next Step
              <ArrowRight className="w-4 h-4 ml-2" />
            </>
          ) : (
            'Complete Guide'
          )}
        </Button>
      </div>
    </div>
  );
}