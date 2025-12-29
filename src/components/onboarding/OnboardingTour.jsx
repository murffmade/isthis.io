import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Shield, Upload, Zap, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

const steps = [
  {
    id: 'welcome',
    icon: Shield,
    title: 'Welcome to IsThis.io',
    content: "Let's take a quick 30-second tour of how to verify if content is real or AI-generated.",
    image: null
  },
  {
    id: 'upload',
    icon: Upload,
    title: 'Upload Your Content',
    content: 'Upload an image or video, or paste a URL from any social media platform. We support all major formats.',
    image: null
  },
  {
    id: 'verify',
    icon: Zap,
    title: 'Instant AI Detection',
    content: 'Our advanced AI analyzes visual artifacts, metadata, compression patterns, and multiple regions to detect AI generation.',
    image: null
  },
  {
    id: 'results',
    icon: CheckCircle2,
    title: 'Get Clear Results',
    content: 'Receive a confidence score (0-100) with detailed explanations. Lower scores = real content, higher scores = AI-generated.',
    image: null
  }
];

export default function OnboardingTour({ onComplete }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    const hasSeenTour = localStorage.getItem('onboarding-completed');
    if (!hasSeenTour) {
      setTimeout(() => setIsActive(true), 1000);
    }
  }, []);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
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
  const Icon = step.icon;
  const progress = ((currentStep + 1) / steps.length) * 100;

  return (
    <AnimatePresence>
      {isActive && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4"
        >
          {/* Animated background */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute top-20 left-20 w-96 h-96 bg-[#3498DB]/20 rounded-full blur-3xl animate-pulse" />
            <div className="absolute bottom-20 right-20 w-96 h-96 bg-[#2C3E50]/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
          </div>

          {/* Skip button at top */}
          <button
            onClick={handleSkip}
            className="absolute top-8 right-8 text-slate-400 hover:text-white transition-colors text-sm z-10"
          >
            Skip tour
          </button>

          {/* Content */}
          <div className="relative w-full max-w-3xl">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="text-center"
              >
                {/* Icon */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', duration: 0.6 }}
                  className="inline-flex items-center justify-center w-24 h-24 rounded-3xl bg-gradient-to-br from-[#3498DB] to-[#2C3E50] mb-8 shadow-2xl"
                >
                  <Icon className="w-12 h-12 text-white" />
                </motion.div>

                {/* Title */}
                <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 tracking-tight">
                  {step.title}
                </h2>

                {/* Content */}
                <p className="text-xl text-slate-300 mb-12 max-w-2xl mx-auto leading-relaxed">
                  {step.content}
                </p>

                {/* Navigation */}
                <div className="flex flex-col items-center gap-6">
                  <Button
                    onClick={handleNext}
                    size="lg"
                    className="bg-[#3498DB] hover:bg-[#2980b9] text-white px-12 py-6 text-lg rounded-xl shadow-2xl hover:shadow-[#3498DB]/50 transition-all"
                  >
                    {currentStep === steps.length - 1 ? "Let's Get Started" : 'Continue'}
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Progress indicators */}
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 flex items-center gap-2 mt-12">
              {steps.map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: i * 0.1 }}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    i === currentStep
                      ? 'w-12 bg-[#3498DB]'
                      : i < currentStep
                      ? 'w-2 bg-[#3498DB]/50'
                      : 'w-2 bg-slate-600'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Step counter */}
          <div className="absolute top-8 left-8 text-slate-400 text-sm font-medium">
            {currentStep + 1} / {steps.length}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}