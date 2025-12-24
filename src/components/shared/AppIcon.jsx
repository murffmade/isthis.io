import React from 'react';
import { Sparkles, Shield, Zap } from 'lucide-react';

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
    <div className={`${sizes[size]} rounded-xl bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 flex items-center justify-center shadow-lg shadow-purple-500/30 relative overflow-hidden ${className}`}>
      <div className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent"></div>
      <div className="relative flex items-center justify-center">
        <Shield className={`${iconSizes[size]} text-white`} />
        <Sparkles className={`${iconSizes[size]} text-white absolute opacity-60 animate-pulse`} style={{ fontSize: '60%' }} />
      </div>
    </div>
  );
}