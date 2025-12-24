import React from 'react';
import { Trophy, Target, Zap, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ProgressDashboard({ stats }) {
  const metrics = [
    {
      icon: Trophy,
      label: 'Modules Completed',
      value: stats.modulesCompleted || 0,
      total: stats.totalModules || 0,
      color: 'from-yellow-400 to-orange-500'
    },
    {
      icon: Target,
      label: 'Quiz Average',
      value: `${stats.quizAverage || 0}%`,
      color: 'from-blue-400 to-indigo-500'
    },
    {
      icon: Zap,
      label: 'Total Points',
      value: stats.totalPoints || 0,
      color: 'from-purple-400 to-pink-500'
    },
    {
      icon: TrendingUp,
      label: 'Current Streak',
      value: `${stats.streak || 0} days`,
      color: 'from-green-400 to-emerald-500'
    }
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
      {metrics.map((metric, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1 }}
          className="bg-white rounded-xl border-2 border-slate-200 p-4"
        >
          <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${metric.color} flex items-center justify-center mb-3`}>
            <metric.icon className="w-5 h-5 text-white" />
          </div>
          <p className="text-2xl font-bold text-slate-900 mb-1">
            {metric.value}
            {metric.total && <span className="text-sm text-slate-500">/{metric.total}</span>}
          </p>
          <p className="text-xs text-slate-600">{metric.label}</p>
        </motion.div>
      ))}
    </div>
  );
}