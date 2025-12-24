import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronRight, ChevronLeft, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

const steps = [
  {
    id: 'welcome',
    target: null,
    title: '👋 Welcome to IsThis.io!',
    content: "Let's take a quick tour to help you verify if content is real or AI-generated. This will only take 30 seconds!",
    position: 'center'
  },
  {
    id: 'upload',
    target: '[data-tour="upload-zone"]',
    title: '📤 Upload Your Content',
    content: 'Start by uploading an image or video, or paste a URL. We support all major formats and social media links.',
    position: 'bottom'
  },
  {
    id: 'verify',
    target: '[data-tour="verify-button"]',
    title: '⚡ Instant Verification',
    content: 'Click "Verify Now" to analyze your content. Our AI will examine multiple regions, metadata, and visual patterns in seconds.',
    position: 'top'
  },
  {
    id: 'features',
    target: '[data-tour="how-it-works"]',
    title: '🔍 How We Detect AI',
    content: 'We analyze visual artifacts, metadata, compression patterns, and more. Each signal is weighted by confidence to give you an accurate result.',
    position: 'top'
  },
  {
    id: 'results-tip',
    target: null,
    title: '📊 Understanding Results',
    content: 'After analysis, you\'ll see: <strong>Likely Real</strong> (authentic), <strong>Likely AI</strong> (generated), or <strong>Uncertain</strong>. Each comes with a confidence score and detailed explanations.',
    position: 'center'
  },
  {
    id: 'confidence-tip',
    target: null,
    title: '🎯 Confidence Scores',
    content: 'Scores range 0-100. <strong>Lower scores (0-42)</strong> suggest real content, <strong>higher scores (58-100)</strong> suggest AI generation. The middle range (43-57) means we\'re uncertain.',
    position: 'center'
  },
  {
    id: 'share-tip',
    target: null,
    title: '🎨 Share Your Findings',
    content: 'After verification, you can create beautiful shareable cards to spread awareness about AI content detection on social media!',
    position: 'center'
  },
  {
    id: 'complete',
    target: null,
    title: '🎉 You\'re All Set!',
    content: 'Now you\'re ready to verify content. Remember: our analysis is a tool to help you, but always check multiple sources for important decisions.',
    position: 'center'
  }
];

export default function OnboardingTour({ onComplete }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  useEffect(() => {
    const hasSeenTour = localStorage.getItem('onboarding-completed');
    if (!hasSeenTour) {
      setTimeout(() => setIsActive(true), 1000);
    }
  }, []);

  useEffect(() => {
    if (!isActive) return;

    const step = steps[currentStep];
    if (step.target) {
      const element = document.querySelector(step.target);
      if (element) {
        const rect = element.getBoundingClientRect();
        const scrollY = window.scrollY;
        
        // Calculate position based on step.position
        let top, left;
        if (step.position === 'bottom') {
          top = rect.bottom + scrollY + 20;
          left = rect.left + rect.width / 2;
        } else if (step.position === 'top') {
          top = rect.top + scrollY - 20;
          left = rect.left + rect.width / 2;
        }
        
        setPosition({ top, left });

        // Highlight element
        element.style.position = 'relative';
        element.style.zIndex = '60';
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }

    return () => {
      // Cleanup highlight
      const element = document.querySelector(step.target);
      if (element) {
        element.style.position = '';
        element.style.zIndex = '';
      }
    };
  }, [currentStep, isActive]);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    setIsActive(false);
    localStorage.setItem('onboarding-completed', 'true');
    if (onComplete) onComplete();
  };

  const handleSkip = () => {
    handleComplete();
  };

  const step = steps[currentStep];

  return (
    <>
      {/* Backdrop overlay */}
      <AnimatePresence>
        {isActive && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            onClick={handleSkip}
          />
        )}
      </AnimatePresence>

      {/* Tooltip */}
      <AnimatePresence>
        {isActive && (
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className={`fixed z-50 ${
              step.position === 'center' 
                ? 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2' 
                : ''
            }`}
            style={step.position !== 'center' ? {
              top: `${position.top}px`,
              left: `${position.left}px`,
              transform: step.position === 'bottom' ? 'translateX(-50%)' : 'translate(-50%, -100%)'
            } : {}}
          >
            <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-md border-2 border-indigo-200">
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-indigo-600" />
                  <h3 className="text-lg font-bold text-slate-900">{step.title}</h3>
                </div>
                <button
                  onClick={handleSkip}
                  className="p-1 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>

              {/* Content */}
              <div 
                className="text-slate-700 mb-6 leading-relaxed"
                dangerouslySetInnerHTML={{ __html: step.content }}
              />

              {/* Footer */}
              <div className="flex items-center justify-between">
                <div className="flex gap-1">
                  {steps.map((_, i) => (
                    <div
                      key={i}
                      className={`h-1.5 rounded-full transition-all ${
                        i === currentStep 
                          ? 'w-8 bg-indigo-600' 
                          : 'w-1.5 bg-slate-200'
                      }`}
                    />
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  {currentStep > 0 && (
                    <Button
                      onClick={handleBack}
                      variant="outline"
                      size="sm"
                      className="gap-1"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      Back
                    </Button>
                  )}
                  <Button
                    onClick={handleNext}
                    size="sm"
                    className="bg-indigo-600 hover:bg-indigo-700 gap-1"
                  >
                    {currentStep === steps.length - 1 ? 'Get Started' : 'Next'}
                    {currentStep < steps.length - 1 && <ChevronRight className="w-4 h-4" />}
                  </Button>
                </div>
              </div>

              {/* Skip link */}
              {currentStep < steps.length - 1 && (
                <div className="text-center mt-4">
                  <button
                    onClick={handleSkip}
                    className="text-xs text-slate-500 hover:text-slate-700 transition-colors"
                  >
                    Skip tour
                  </button>
                </div>
              )}
            </div>

            {/* Arrow pointer for positioned tooltips */}
            {step.position !== 'center' && (
              <div
                className={`absolute left-1/2 -translate-x-1/2 w-0 h-0 ${
                  step.position === 'bottom'
                    ? 'top-0 -translate-y-full border-l-8 border-r-8 border-b-8 border-l-transparent border-r-transparent border-b-white'
                    : 'bottom-0 translate-y-full border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-white'
                }`}
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}