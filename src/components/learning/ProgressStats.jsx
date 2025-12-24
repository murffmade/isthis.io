import React from 'react';
import { Trophy, Target, Flame, Award } from 'lucide-react';

export default function ProgressStats({ stats }) {
  const { totalPoints = 0, modulesCompleted = 0, currentStreak = 0, achievementsUnlocked = 0 } = stats;

  const statCards = [
    { icon: Trophy, label: 'Total Points', value: totalPoints, color: 'from-yellow-400 to-yellow-600' },
    { icon: Target, label: 'Modules Completed', value: modulesCompleted, color: 'from-blue-400 to-blue-600' },
    { icon: Flame, label: 'Day Streak', value: currentStreak, color: 'from-orange-400 to-red-600' },
    { icon: Award, label: 'Achievements', value: achievementsUnlocked, color: 'from-purple-400 to-purple-600' }
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {statCards.map((stat, i) => (
        <div key={i} className="bg-white rounded-xl border border-slate-200 p-4">
          <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${stat.color} flex items-center justify-center mb-3`}>
            <stat.icon className="w-5 h-5 text-white" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mb-1">{stat.value}</div>
          <div className="text-xs text-slate-600">{stat.label}</div>
        </div>
      ))}
    </div>
  );
}