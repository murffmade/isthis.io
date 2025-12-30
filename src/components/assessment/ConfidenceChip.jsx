import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

export default function ConfidenceChip({ level }) {
  const configs = {
    LOW: {
      bg: 'bg-slate-100',
      text: 'text-slate-700',
      icon: TrendingDown,
      label: 'Low Confidence'
    },
    MEDIUM: {
      bg: 'bg-blue-100',
      text: 'text-blue-700',
      icon: Minus,
      label: 'Medium Confidence'
    },
    HIGH: {
      bg: 'bg-purple-100',
      text: 'text-purple-700',
      icon: TrendingUp,
      label: 'High Confidence'
    }
  };

  const config = configs[level] || configs.MEDIUM;
  const Icon = config.icon;

  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${config.bg} ${config.text}`}>
      <Icon className="w-3 h-3" />
      {config.label}
    </span>
  );
}