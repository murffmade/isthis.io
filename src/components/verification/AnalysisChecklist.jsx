import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Loader2 } from 'lucide-react';

const analysisSteps = [
  { id: 'upload', label: 'Processing image', duration: 800 },
  { id: 'exif', label: 'Extracting camera metadata', duration: 1200 },
  { id: 'patches', label: 'Generating image patches for detailed analysis', duration: 1500 },
  { id: 'forensics', label: 'Running forensic analysis', duration: 1800 },
  { id: 'llm', label: 'AI analyzing visual artifacts and patterns', duration: 3000 },
  { id: 'ensemble', label: 'Calculating confidence score', duration: 1000 }
];

export default function AnalysisChecklist() {
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    if (currentStep < analysisSteps.length) {
      const timer = setTimeout(() => {
        setCurrentStep(currentStep + 1);
      }, analysisSteps[currentStep].duration);
      return () => clearTimeout(timer);
    }
  }, [currentStep]);

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-full bg-slate-900 flex items-center justify-center">
            <Loader2 className="w-5 h-5 text-white animate-spin" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900">Analyzing Image</h3>
            <p className="text-sm text-slate-500">This may take 15-30 seconds</p>
          </div>
        </div>

        <div className="space-y-3">
          {analysisSteps.map((step, index) => {
            const isComplete = index < currentStep;
            const isCurrent = index === currentStep;
            const isPending = index > currentStep;

            return (
              <motion.div
                key={step.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                  isCurrent ? 'bg-slate-50' : ''
                }`}
              >
                <div className="flex-shrink-0">
                  {isComplete && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                    >
                      <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                    </motion.div>
                  )}
                  {isCurrent && (
                    <Loader2 className="w-5 h-5 text-slate-900 animate-spin" />
                  )}
                  {isPending && (
                    <div className="w-5 h-5 rounded-full border-2 border-slate-200" />
                  )}
                </div>
                <p className={`text-sm ${
                  isComplete ? 'text-slate-600' : 
                  isCurrent ? 'text-slate-900 font-medium' : 
                  'text-slate-400'
                }`}>
                  {step.label}
                </p>
              </motion.div>
            );
          })}
        </div>

        <div className="mt-6 pt-6 border-t border-slate-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-500">Progress</span>
            <span className="text-xs font-medium text-slate-700">
              {Math.round((currentStep / analysisSteps.length) * 100)}%
            </span>
          </div>
          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-slate-900 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${(currentStep / analysisSteps.length) * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}