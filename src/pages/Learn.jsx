import React from 'react';
import { motion } from 'framer-motion';
import { Shield, ArrowLeft, Trophy, Edit, BarChart3, ExternalLink } from 'lucide-react';
import { createPageUrl } from '@/utils';
import { Link } from 'react-router-dom';
import BottomNav from '@/components/mobile/BottomNav';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import ModuleCard from '@/components/learning/ModuleCard';
import ProgressStats from '@/components/learning/ProgressStats';

export default function Learn() {
  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me().catch(() => null)
  });

  const { data: modules = [], isLoading } = useQuery({
    queryKey: ['learningModules'],
    queryFn: async () => {
      const mods = await base44.entities.LearningModule.filter({ published: true });
      return mods.sort((a, b) => (a.order || 0) - (b.order || 0));
    }
  });

  const { data: userProgress = [] } = useQuery({
    queryKey: ['userProgress', currentUser?.email],
    queryFn: async () => {
      if (!currentUser) return [];
      return base44.entities.UserProgress.filter({ user_email: currentUser.email });
    },
    enabled: !!currentUser
  });

  const { data: userAchievements = [] } = useQuery({
    queryKey: ['userAchievements', currentUser?.email],
    queryFn: async () => {
      if (!currentUser) return [];
      return base44.entities.UserAchievement.filter({ user_email: currentUser.email });
    },
    enabled: !!currentUser
  });

  const stats = {
    totalPoints: userProgress.reduce((sum, p) => sum + (modules.find(m => m.id === p.module_id)?.points || 0), 0) + 
                 userAchievements.length * 50,
    modulesCompleted: userProgress.filter(p => p.status === 'completed').length,
    currentStreak: 0,
    achievementsUnlocked: userAchievements.length
  };

  const dashboards = [
    {
      title: 'Blog Dashboard',
      description: 'Manage articles and educational content',
      icon: Edit,
      link: createPageUrl('BlogDashboard'),
      color: 'from-indigo-600 to-purple-600'
    },
    {
      title: 'Analytics Dashboard',
      description: 'View content performance and insights',
      icon: BarChart3,
      link: createPageUrl('AnalysisDashboard'),
      color: 'from-blue-600 to-cyan-600'
    }
  ];

  const categorizedModules = {
    getting_started: modules.filter(m => m.category === 'getting_started'),
    advanced: modules.filter(m => m.category === 'advanced'),
    developer: modules.filter(m => m.category === 'developer')
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white pb-20 md:pb-0">
      {/* Header */}
      <header className="border-b border-slate-100 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <a 
              href={createPageUrl('Home')}
              className="flex items-center gap-3"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-slate-800 leading-tight">Is This Real?</h1>
                <p className="text-xs text-slate-500">Learning Center</p>
              </div>
            </a>
            <a
              href={createPageUrl('Home')}
              className="flex items-center gap-2 text-slate-500 hover:text-slate-700 text-sm font-medium"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </a>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="py-12 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-yellow-100 text-yellow-700 text-sm font-semibold mb-4">
              <Trophy className="w-4 h-4" />
              Interactive Learning
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
              Master AI Content Verification
            </h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              Learn through interactive modules, quizzes, and earn achievements as you progress
            </p>
          </motion.div>

          {/* Progress Stats */}
          {currentUser && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <ProgressStats stats={stats} />
            </motion.div>
          )}
        </div>
      </section>

      {/* Dashboards */}
      <section className="py-8 px-6">
        <div className="max-w-5xl mx-auto">
          <h3 className="text-2xl font-bold text-slate-900 mb-6">Content Dashboards</h3>
          <div className="grid md:grid-cols-2 gap-6 mb-12">
            {dashboards.map((dashboard, i) => (
              <Link
                key={i}
                to={dashboard.link}
                className="bg-white rounded-2xl border-2 border-slate-200 p-8 hover:border-slate-900 transition-all group"
              >
                <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${dashboard.color} flex items-center justify-center mb-4`}>
                  <dashboard.icon className="w-7 h-7 text-white" />
                </div>
                <h4 className="text-xl font-bold text-slate-900 mb-2 group-hover:text-slate-700">
                  {dashboard.title}
                </h4>
                <p className="text-slate-600 mb-4">{dashboard.description}</p>
                <div className="flex items-center text-slate-900 font-medium group-hover:gap-2 transition-all">
                  <span>Open Dashboard</span>
                  <ExternalLink className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Learning Modules */}
      <section className="py-8 px-6">
        <div className="max-w-6xl mx-auto">
          {isLoading ? (
            <div className="text-center py-12">
              <div className="w-8 h-8 border-2 border-slate-300 border-t-slate-900 rounded-full animate-spin mx-auto"></div>
            </div>
          ) : modules.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">No modules yet</h3>
              <p className="text-slate-600">Check back soon for interactive learning content</p>
            </div>
          ) : (
            <div className="space-y-12">
              {/* Getting Started */}
              {categorizedModules.getting_started.length > 0 && (
                <div>
                  <h3 className="text-2xl font-bold text-slate-900 mb-6">Getting Started</h3>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {categorizedModules.getting_started.map((module) => {
                      const progress = userProgress.find(p => p.module_id === module.id);
                      return (
                        <ModuleCard
                          key={module.id}
                          module={module}
                          progress={progress}
                          isLocked={false}
                        />
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Advanced */}
              {categorizedModules.advanced.length > 0 && (
                <div>
                  <h3 className="text-2xl font-bold text-slate-900 mb-6">Advanced Topics</h3>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {categorizedModules.advanced.map((module) => {
                      const progress = userProgress.find(p => p.module_id === module.id);
                      const completedBasics = userProgress.filter(p => 
                        p.status === 'completed' && 
                        modules.find(m => m.id === p.module_id && m.category === 'getting_started')
                      ).length;
                      const isLocked = completedBasics === 0;
                      
                      return (
                        <ModuleCard
                          key={module.id}
                          module={module}
                          progress={progress}
                          isLocked={isLocked}
                        />
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Developer */}
              {categorizedModules.developer.length > 0 && (
                <div>
                  <h3 className="text-2xl font-bold text-slate-900 mb-6">For Developers</h3>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {categorizedModules.developer.map((module) => {
                      const progress = userProgress.find(p => p.module_id === module.id);
                      return (
                        <ModuleCard
                          key={module.id}
                          module={module}
                          progress={progress}
                          isLocked={false}
                        />
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-6 bg-slate-900 mt-12">
        <div className="max-w-4xl mx-auto text-center">
          <h3 className="text-3xl font-bold text-white mb-4">
            Ready to Start Verifying?
          </h3>
          <p className="text-slate-300 mb-8">
            Try our free verification tool and see how easy it is
          </p>
          <a
            href={createPageUrl('Home')}
            className="inline-block px-8 py-3 bg-white text-slate-900 rounded-xl font-semibold hover:bg-slate-100 transition-colors"
          >
            Get Started
          </a>
        </div>
      </section>

      <BottomNav />
    </div>
  );
}