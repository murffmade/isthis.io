import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, X } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function AchievementNotification({ achievement, onClose }) {
  useEffect(() => {
    if (achievement) {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.8 }
      });
    }
  }, [achievement]);

  const rarityColors = {
    common: 'from-slate-400 to-slate-600',
    rare: 'from-blue-400 to-blue-600',
    epic: 'from-purple-400 to-purple-600',
    legendary: 'from-yellow-400 to-yellow-600'
  };

  return (
    <AnimatePresence>
      {achievement && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50, scale: 0.9 }}
          className="fixed bottom-6 right-6 z-50 max-w-sm"
        >
          <div className="bg-white rounded-2xl border-2 border-slate-200 shadow-2xl p-6 relative">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>
            
            <div className="flex items-start gap-4">
              <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${rarityColors[achievement.rarity]} flex items-center justify-center flex-shrink-0`}>
                <Trophy className="w-8 h-8 text-white" />
              </div>
              
              <div className="flex-1">
                <div className="text-xs text-slate-500 mb-1 uppercase font-semibold">
                  Achievement Unlocked!
                </div>
                <h4 className="text-lg font-bold text-slate-900 mb-1">
                  {achievement.title}
                </h4>
                <p className="text-sm text-slate-600 mb-2">
                  {achievement.description}
                </p>
                <div className="flex items-center gap-2 text-xs">
                  <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full font-semibold">
                    +{achievement.points} pts
                  </span>
                  <span className={`px-2 py-1 rounded-full font-semibold ${
                    achievement.rarity === 'legendary' ? 'bg-yellow-100 text-yellow-700' :
                    achievement.rarity === 'epic' ? 'bg-purple-100 text-purple-700' :
                    achievement.rarity === 'rare' ? 'bg-blue-100 text-blue-700' :
                    'bg-slate-100 text-slate-700'
                  }`}>
                    {achievement.rarity}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}