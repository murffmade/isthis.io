import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Award, TrendingUp, CheckCircle2, BarChart3, Shield } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import BottomNav from '@/components/mobile/BottomNav';

export default function TrainerDashboard() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.auth.me().then(currentUser => {
      setUser(currentUser);
      setLoading(false);
    }).catch(() => {
      setLoading(false);
    });
  }, []);

  const { data: feedback } = useQuery({
    queryKey: ['trainerFeedback', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      return await base44.entities.TrainingFeedback.filter({ created_by: user.email });
    },
    enabled: !!user?.email
  });

  const { data: allFeedback } = useQuery({
    queryKey: ['allTrainingFeedback'],
    queryFn: () => base44.entities.TrainingFeedback.list(),
    enabled: user?.role === 'admin'
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-slate-200 border-t-slate-900 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user?.is_trainer && user?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <Shield className="w-16 h-16 text-slate-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Trainer Access Required</h1>
          <p className="text-slate-600 mb-6">
            You need trainer privileges to access this dashboard. Contact an administrator to request access.
          </p>
          <Link
            to={createPageUrl('Home')}
            className="inline-block px-6 py-3 bg-slate-900 text-white rounded-xl font-semibold hover:bg-slate-800 transition-colors"
          >
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  const myContributions = user?.training_contributions || 0;
  const totalFeedback = allFeedback?.length || 0;
  const agreementRate = feedback?.filter(f => f.confidence_match).length / (feedback?.length || 1) * 100 || 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white pb-20 md:pb-0">
      {/* Header */}
      <header className="border-b border-slate-100 bg-white/95 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link to={createPageUrl('Home')} className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-slate-800">Trainer Dashboard</h1>
                <p className="text-xs text-slate-500">Help improve AI detection</p>
              </div>
            </Link>
            <span className="px-3 py-1 bg-blue-600 text-white text-xs font-bold rounded-full">
              TRAINER
            </span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-6 py-8">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border-2 border-blue-200 p-8 mb-8"
        >
          <div className="flex items-center gap-3 mb-4">
            <Award className="w-10 h-10 text-blue-600" />
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Welcome, Trainer!</h2>
              <p className="text-slate-600">Every label you provide helps make our AI smarter</p>
            </div>
          </div>
          <p className="text-sm text-slate-600">
            As a trainer, your expert feedback on real vs. AI-generated content directly improves our detection accuracy. 
            Your contributions help millions of users make informed decisions about content authenticity.
          </p>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl border border-slate-200 p-6"
          >
            <div className="flex items-center gap-3 mb-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-500" />
              <div className="text-3xl font-bold text-slate-900">{myContributions}</div>
            </div>
            <div className="text-sm text-slate-600">Labels Provided</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-2xl border border-slate-200 p-6"
          >
            <div className="flex items-center gap-3 mb-2">
              <TrendingUp className="w-8 h-8 text-blue-500" />
              <div className="text-3xl font-bold text-slate-900">{agreementRate.toFixed(0)}%</div>
            </div>
            <div className="text-sm text-slate-600">Agreement with AI</div>
          </motion.div>

          {user?.role === 'admin' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-2xl border border-slate-200 p-6"
            >
              <div className="flex items-center gap-3 mb-2">
                <BarChart3 className="w-8 h-8 text-purple-500" />
                <div className="text-3xl font-bold text-slate-900">{totalFeedback}</div>
              </div>
              <div className="text-sm text-slate-600">Total Community Labels</div>
            </motion.div>
          )}
        </div>

        {/* Recent Feedback */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <h3 className="font-bold text-slate-900 mb-4 text-lg">Your Recent Labels</h3>
          {feedback && feedback.length > 0 ? (
            <div className="space-y-3">
              {feedback.slice(0, 10).map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                      item.actual_label === 'real' ? 'bg-emerald-100' :
                      item.actual_label === 'ai_generated' ? 'bg-amber-100' : 'bg-slate-200'
                    }`}>
                      <span className="text-2xl">
                        {item.actual_label === 'real' ? '✓' : 
                         item.actual_label === 'ai_generated' ? '🤖' : '❓'}
                      </span>
                    </div>
                    <div>
                      <div className="font-semibold text-slate-900 capitalize">
                        {item.actual_label.replace('_', ' ')}
                      </div>
                      <div className="text-xs text-slate-500">
                        {item.content_type} • {new Date(item.created_date).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <div>
                    {item.confidence_match ? (
                      <span className="px-3 py-1 bg-emerald-100 text-emerald-700 text-xs font-semibold rounded-full">
                        AI Agreed
                      </span>
                    ) : (
                      <span className="px-3 py-1 bg-amber-100 text-amber-700 text-xs font-semibold rounded-full">
                        AI Disagreed
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-4xl mb-4">📊</div>
              <p className="text-slate-600 mb-4">You haven't provided any labels yet</p>
              <Link
                to={createPageUrl('Home')}
                className="inline-block px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors"
              >
                Start Labeling Content
              </Link>
            </div>
          )}
        </div>
      </main>

      <BottomNav currentPage="trainer" />
    </div>
  );
}