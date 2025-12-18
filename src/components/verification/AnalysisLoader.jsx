import React from 'react';
import { motion } from 'framer-motion';
import { Scan, Eye, Fingerprint, Layers, Brain } from 'lucide-react';

const steps = [
  { icon: Scan, text: 'Scanning visual patterns' },
  { icon: Eye, text: 'Analyzing inconsistencies' },
  { icon: Fingerprint, text: 'Checking for AI signatures' },
  { icon: Layers, text: 'Evaluating metadata' },
  { icon: Brain, text: 'Processing final assessment' },
];

export default function AnalysisLoader({ currentStep = 0 }) {
  return (
    <div className="w-full max-w-md mx-auto py-12">
      <div className="text-center mb-10">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
          className="w-20 h-20 mx-auto mb-6 rounded-full border-2 border-slate-100 flex items-center justify-center relative"
        >
          <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-blue-500 animate-spin" />
          <Brain className="w-8 h-8 text-slate-700" />
        </motion.div>
        <h3 className="text-xl font-semibold text-slate-800 mb-2">
          Analyzing content
        </h3>
        <p className="text-slate-500">
          This may take a few moments
        </p>
      </div>

      <div className="space-y-3">
        {steps.map((step, index) => {
          const Icon = step.icon;
          const isActive = index === currentStep;
          const isComplete = index < currentStep;
          
          return (
            <motion.div
              key={index}
              initial={{ opacity: 0.5 }}
              animate={{ 
                opacity: isComplete ? 0.5 : isActive ? 1 : 0.3,
                x: isActive ? 4 : 0
              }}
              className={`flex items-center gap-3 p-3 rounded-xl transition-colors ${
                isActive ? 'bg-blue-50' : ''
              }`}
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                isComplete 
                  ? 'bg-green-100 text-green-600' 
                  : isActive 
                    ? 'bg-blue-100 text-blue-600' 
                    : 'bg-slate-100 text-slate-400'
              }`}>
                <Icon className="w-4 h-4" />
              </div>
              <span className={`text-sm ${
                isActive ? 'text-slate-800 font-medium' : 'text-slate-500'
              }`}>
                {step.text}
              </span>
              {isActive && (
                <motion.div
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="ml-auto w-2 h-2 rounded-full bg-blue-500"
                />
              )}
              {isComplete && (
                <span className="ml-auto text-green-600 text-xs font-medium">✓</span>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}