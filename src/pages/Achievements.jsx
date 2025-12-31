import React from 'react';
import { motion } from 'framer-motion';
import { Trophy, ArrowLeft, Star, Award, Target } from 'lucide-react';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import AchievementCard from '@/components/achievements/AchievementCard';
import BottomNav from '@/components/mobile/BottomNav';

export default function Achievements() {
  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me().catch(() => null)
  });

  const { data: achievements = [] } = useQuery({
    queryKey: ['achievements'],
    queryFn: async () => {
      if (!currentUser) return [];
      return await base44.entities.Achievement.filter({ created_by: currentUser.email });
    },
    enabled: !!currentUser
  });

  const { data: userProgress = [] } = useQuery({
    queryKey: ['userProgress'],
    queryFn: async () => {
      if (!currentUser) return [];
      return await base44.entities.UserProgress.filter({ created_by: currentUser.email });
    },
    enabled: !!currentUser
  });

  const totalPoints = achievements.reduce((sum, a) => sum + (a.points || 0), 0);
  const completedModules = userProgress.filter(p => p.completed).length;

  const moduleAchievements = achievements.filter(a => a.module_slug);
  const otherAchievements = achievements.filter(a => !a.module_slug);

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex items-center justify-center p-6">
        <div className="text-center">
          <Trophy className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Sign In to View Achievements</h2>
          <p className="text-slate-600 mb-6">Complete learning modules to earn badges and points</p>
          <a
            href={createPageUrl('Learn')}
            className="inline-block px-6 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
          >
            Start Learning
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white pb-20 md:pb-0">
      <header className="border-b border-slate-100 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <a 
              href={createPageUrl('Learn')}
              className="flex items-center gap-3"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
                <Trophy className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-slate-800 leading-tight">My Achievements</h1>
                <p className="text-xs text-slate-500">{totalPoints} total points</p>
              </div>
            </a>
            <a
              href={createPageUrl('Learn')}
              className="flex items-center gap-2 text-slate-500 hover:text-slate-700 text-sm font-medium"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </a>
          </div>
        </div>
      </header>

      <section className="py-12 px-6">
        <div className="max-w-6xl mx-auto">
          {/* Stats Cards */}
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl p-6 shadow-md border-2 border-slate-200"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center">
                  <Star className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-sm text-slate-600">Total Points</p>
                  <p className="text-2xl font-bold text-slate-900">{totalPoints}</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-2xl p-6 shadow-md border-2 border-slate-200"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <Award className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-sm text-slate-600">Badges Earned</p>
                  <p className="text-2xl font-bold text-slate-900">{achievements.length}</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-2xl p-6 shadow-md border-2 border-slate-200"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center">
                  <Target className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-sm text-slate-600">Modules Completed</p>
                  <p className="text-2xl font-bold text-slate-900">{completedModules}</p>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Module Achievements */}
          {moduleAchievements.length > 0 && (
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-slate-900 mb-6">Learning Badges 🎓</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                {moduleAchievements.map((achievement) => (
                  <motion.div
                    key={achievement.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center"
                  >
                    <AchievementCard achievement={achievement} unlocked={true} size="lg" />
                    <h3 className="text-lg font-bold text-slate-900 mt-4">{achievement.name}</h3>
                    <p className="text-sm text-slate-600 mt-1">{achievement.description}</p>
                    <div className="mt-2 inline-flex items-center gap-1 px-3 py-1 bg-amber-100 rounded-full">
                      <Star className="w-4 h-4 text-amber-600" />
                      <span className="text-sm font-bold text-amber-700">+{achievement.points} pts</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Other Achievements */}
          {otherAchievements.length > 0 && (
            <div>
              <h2 className="text-2xl font-bold text-slate-900 mb-6">Special Achievements 🌟</h2>
              <div className="grid md:grid-cols-3 gap-6">
                {otherAchievements.map((achievement) => (
                  <motion.div
                    key={achievement.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-2xl p-6 shadow-md border-2 border-slate-200"
                  >
                    <div className="flex items-start gap-4">
                      <AchievementCard achievement={achievement} unlocked={true} size="md" />
                      <div className="flex-1">
                        <h3 className="font-bold text-slate-900 mb-1">{achievement.name}</h3>
                        <p className="text-sm text-slate-600 mb-2">{achievement.description}</p>
                        <div className="inline-flex items-center gap-1 px-2 py-1 bg-amber-100 rounded-full">
                          <Star className="w-3 h-3 text-amber-600" />
                          <span className="text-xs font-bold text-amber-700">+{achievement.points}</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {achievements.length === 0 && (
            <div className="text-center py-16">
              <Trophy className="w-24 h-24 text-slate-300 mx-auto mb-6" />
              <h2 className="text-3xl font-bold text-slate-900 mb-4">Start Your Journey!</h2>
              <p className="text-xl text-slate-600 mb-8">
                Complete learning modules to earn badges and points
              </p>
              <a
                href={createPageUrl('Learn')}
                className="inline-block px-8 py-4 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors"
              >
                Browse Modules
              </a>
            </div>
          )}
        </div>
      </section>

      <BottomNav />
    </div>
  );
}