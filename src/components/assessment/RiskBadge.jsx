import React from 'react';
import { AlertTriangle, CheckCircle2, AlertCircle } from 'lucide-react';

export default function RiskBadge({ level, size = 'md' }) {
  const configs = {
    LOW: {
      bg: 'bg-emerald-100',
      text: 'text-emerald-700',
      border: 'border-emerald-300',
      icon: CheckCircle2
    },
    MEDIUM: {
      bg: 'bg-amber-100',
      text: 'text-amber-700',
      border: 'border-amber-300',
      icon: AlertCircle
    },
    HIGH: {
      bg: 'bg-red-100',
      text: 'text-red-700',
      border: 'border-red-300',
      icon: AlertTriangle
    }
  };

  const sizes = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-3 py-1.5',
    lg: 'text-base px-4 py-2'
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  };

  const config = configs[level] || configs.MEDIUM;
  const Icon = config.icon;

  return (
    <span className={`inline-flex items-center gap-2 rounded-full font-semibold border ${config.bg} ${config.text} ${config.border} ${sizes[size]}`}>
      <Icon className={iconSizes[size]} />
      {level} Risk
    </span>
  );
}