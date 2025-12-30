import React from 'react';
import { AlertCircle, HelpCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export default function DisclaimerBanner({ variant = 'warning' }) {
  const variants = {
    warning: {
      bg: 'bg-amber-50',
      border: 'border-amber-200',
      text: 'text-amber-900',
      icon: AlertCircle
    },
    info: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      text: 'text-blue-900',
      icon: HelpCircle
    }
  };

  const config = variants[variant] || variants.warning;
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex items-start gap-3 p-4 rounded-xl border ${config.bg} ${config.border}`}
    >
      <Icon className={`w-5 h-5 flex-shrink-0 mt-0.5 ${config.text}`} />
      <div className={`text-sm ${config.text}`}>
        <p className="font-semibold mb-1">This is a probabilistic assessment, not a definitive determination.</p>
        <p className="text-xs opacity-90">
          False positives can occur, especially with short or highly edited text. Use this assessment as one factor in your decision-making process.
        </p>
      </div>
    </motion.div>
  );
}