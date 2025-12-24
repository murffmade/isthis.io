import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Clock, Trophy, Lock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function ModuleCard({ module, progress, isLocked }) {
  const isCompleted = progress?.status === 'completed';
  const isInProgress = progress?.status === 'in_progress';
  
  const difficultyColors = {
    beginner: 'bg-green-100 text-green-700',
    intermediate: 'bg-yellow-100 text-yellow-700',
    advanced: 'bg-red-100 text-red-700'
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      className="relative"
    >
      <Link
        to={isLocked ? '#' : `${createPageUrl('LearnModule')}?id=${module.id}`}
        className={`block bg-white rounded-2xl border-2 p-6 transition-all ${
          isLocked 
            ? 'border-slate-200 opacity-60 cursor-not-allowed' 
            : 'border-slate-200 hover:border-[#3498DB]'
        }`}
      >
        {/* Status Badge */}
        <div className="flex items-center justify-between mb-4">
          <span className={`text-xs px-2 py-1 rounded-full font-semibold ${difficultyColors[module.difficulty]}`}>
            {module.difficulty}
          </span>
          {isCompleted && (
            <div className="flex items-center gap-1 text-emerald-600">
              <CheckCircle2 className="w-4 h-4" />
              <span className="text-xs font-bold">Completed</span>
            </div>
          )}
          {isLocked && (
            <div className="flex items-center gap-1 text-slate-400">
              <Lock className="w-4 h-4" />
              <span className="text-xs font-bold">Locked</span>
            </div>
          )}
        </div>

        {/* Title & Description */}
        <h3 className="text-xl font-bold text-slate-900 mb-2">{module.title}</h3>
        <p className="text-sm text-slate-600 mb-4 line-clamp-2">{module.description}</p>

        {/* Progress Bar */}
        {isInProgress && progress?.progress_percentage > 0 && (
          <div className="mb-4">
            <div className="flex items-center justify-between text-xs text-slate-600 mb-1">
              <span>Progress</span>
              <span>{Math.round(progress.progress_percentage)}%</span>
            </div>
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-[#3498DB] rounded-full transition-all"
                style={{ width: `${progress.progress_percentage}%` }}
              />
            </div>
          </div>
        )}

        {/* Meta Info */}
        <div className="flex items-center gap-4 text-sm text-slate-500">
          <div className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            <span>{module.estimated_time} min</span>
          </div>
          <div className="flex items-center gap-1">
            <Trophy className="w-4 h-4" />
            <span>{module.points} pts</span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}