import React from 'react';
import { Shield } from 'lucide-react';

export default function AppIcon({ size = 'md', className = '' }) {
  const sizes = {
    sm: 'w-6 h-6',
    md: 'w-10 h-10',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24'
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-5 h-5',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12'
  };

  return (
    <div className={`${sizes[size]} rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center ${className}`}>
      <Shield className={`${iconSizes[size]} text-white`} />
    </div>
  );
}