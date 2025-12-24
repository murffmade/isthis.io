import React from 'react';
import { motion } from 'framer-motion';
import { Trophy, Star, Zap, Target, Award, Crown } from 'lucide-react';

export default function AchievementBadge({ achievement, unlocked = false, size = 'md' }) {
  const icons = {
    module_complete: Trophy,
    quiz_perfect: Star,
    streak: Zap,
    speed: Target,
    master: Crown
  };

  const Icon = icons[achievement.type] || Award;
  
  const sizes = {
    sm: 'w-12 h-12',
    md: 'w-16 h-16',
    lg: 'w-24 h-24'
  };

  const iconSizes = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };

  return (
    <motion.div
      whileHover={unlocked ? { scale: 1.05 } : {}}
      className={`relative ${sizes[size]} rounded-full flex items-center justify-center ${
        unlocked
          ? 'bg-gradient-to-br from-yellow-400 via-orange-500 to-red-500 shadow-lg'
          : 'bg-slate-200'
      }`}
    >
      <Icon className={`${iconSizes[size]} ${unlocked ? 'text-white' : 'text-slate-400'}`} />
      
      {unlocked && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center border-2 border-white"
        >
          <span className="text-white text-xs">✓</span>
        </motion.div>
      )}

      {!unlocked && (
        <div className="absolute inset-0 bg-slate-900 bg-opacity-50 rounded-full flex items-center justify-center">
          <span className="text-white text-2xl">🔒</span>
        </div>
      )}
    </motion.div>
  );
}