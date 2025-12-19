import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, Gift, MousePointer, Sparkles, ArrowRight, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';

const steps = [
  {
    id: 1,
    title: 'Pick Your Plan',
    shortDesc: '1 Year or Lifetime access - both include everything',
    icon: Gift,
    color: 'from-red-500 to-pink-500',
    bgColor: 'bg-red-50',
    details: [
      'Choose between 1-year premium ($29) or lifetime access ($99)',
      'All features included in both plans',
      'Unlimited verifications and priority processing',
      'Perfect for parents, grandparents, or anyone who needs help online'
    ],
    visual: '🎁'
  },
  {
    id: 2,
    title: 'Personalize Your Card',
    shortDesc: 'Create a beautiful holiday card with a custom message',
    icon: Sparkles,
    color: 'from-emerald-500 to-green-500',
    bgColor: 'bg-emerald-50',
    details: [
      'Choose from festive themes: Christmas, Hanukkah, Kwanzaa, or General',
      'Add the recipient\'s name for a personal touch',
      'Write a heartfelt message explaining the gift',
      'Preview before finalizing'
    ],
    visual: '✨'
  },
  {
    id: 3,
    title: 'Deliver Instantly',
    shortDesc: 'Email, text, or print - delivered in seconds',
    icon: MousePointer,
    color: 'from-blue-500 to-cyan-500',
    bgColor: 'bg-blue-50',
    details: [
      'Download as a beautiful image to share anywhere',
      'Email directly with a pre-written message',
      'Print it out for a physical gift',
      'Get a shareable link that never expires'
    ],
    visual: '⚡'
  }
];

export default function InteractiveSteps() {
  const [activeStep, setActiveStep] = useState(1);
  const currentStep = steps.find(s => s.id === activeStep);

  const handleNext = () => {
    if (activeStep < steps.length) {
      setActiveStep(activeStep + 1);
    }
  };

  const handlePrev = () => {
    if (activeStep > 1) {
      setActiveStep(activeStep - 1);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Step Indicators */}
      <div className="flex justify-center items-center gap-4 mb-12">
        {steps.map((step, i) => (
          <React.Fragment key={step.id}>
            <button
              onClick={() => setActiveStep(step.id)}
              className={`relative flex items-center justify-center w-12 h-12 rounded-full font-bold text-lg transition-all ${
                step.id === activeStep
                  ? 'bg-gradient-to-r ' + step.color + ' text-white scale-110 shadow-lg'
                  : step.id < activeStep
                  ? 'bg-emerald-500 text-white'
                  : 'bg-white/20 text-white/60 border-2 border-white/30'
              }`}
            >
              {step.id < activeStep ? (
                <Check className="w-6 h-6" />
              ) : (
                step.id
              )}
              
              {step.id === activeStep && (
                <motion.div
                  layoutId="activeRing"
                  className="absolute inset-0 rounded-full border-4 border-white/50"
                  initial={false}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
            </button>
            {i < steps.length - 1 && (
              <div className={`h-1 w-16 rounded-full transition-all ${
                step.id < activeStep ? 'bg-emerald-500' : 'bg-white/20'
              }`} />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Active Step Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
          className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 overflow-hidden"
        >
          {/* Header */}
          <div className={`bg-gradient-to-r ${currentStep.color} p-8 text-center relative overflow-hidden`}>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200 }}
              className="text-7xl mb-4"
            >
              {currentStep.visual}
            </motion.div>
            <h3 className="text-3xl font-bold text-white mb-2">
              {currentStep.title}
            </h3>
            <p className="text-white/90 text-lg">
              {currentStep.shortDesc}
            </p>
            
            {/* Decorative circles */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2" />
          </div>

          {/* Details */}
          <div className="p-8">
            <ul className="space-y-4 mb-8">
              {currentStep.details.map((detail, i) => (
                <motion.li
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="flex items-start gap-4"
                >
                  <div className={`w-8 h-8 rounded-full bg-gradient-to-r ${currentStep.color} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                    <Check className="w-5 h-5 text-white" />
                  </div>
                  <p className="text-white text-lg leading-relaxed">{detail}</p>
                </motion.li>
              ))}
            </ul>

            {/* Navigation Buttons */}
            <div className="flex justify-between items-center gap-4">
              <Button
                onClick={handlePrev}
                disabled={activeStep === 1}
                variant="outline"
                className="bg-white/10 border-white/20 text-white hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-5 h-5 mr-2 rotate-180" />
                Previous
              </Button>

              <div className="text-white/60 text-sm">
                Step {activeStep} of {steps.length}
              </div>

              {activeStep < steps.length ? (
                <Button
                  onClick={handleNext}
                  className={`bg-gradient-to-r ${currentStep.color} hover:opacity-90 text-white`}
                >
                  Next Step
                  <ChevronRight className="w-5 h-5 ml-2" />
                </Button>
              ) : (
                <Button
                  onClick={() => document.getElementById('pricing-section')?.scrollIntoView({ behavior: 'smooth' })}
                  className={`bg-gradient-to-r ${currentStep.color} hover:opacity-90 text-white`}
                >
                  Get Started
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              )}
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Quick Jump */}
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        {steps.map((step) => (
          <button
            key={step.id}
            onClick={() => setActiveStep(step.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              step.id === activeStep
                ? 'bg-white/20 text-white border border-white/30'
                : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white/80'
            }`}
          >
            {step.title}
          </button>
        ))}
      </div>
    </div>
  );
}