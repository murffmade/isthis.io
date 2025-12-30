import React from 'react';
import { motion } from 'framer-motion';
import { Activity, LogIn, LogOut, Shield, CreditCard, Settings, User, FileText, Award, BookOpen, Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import moment from 'moment';

const actionIcons = {
  login: { icon: LogIn, color: 'text-blue-600', bg: 'bg-blue-100' },
  logout: { icon: LogOut, color: 'text-slate-600', bg: 'bg-slate-100' },
  analysis_created: { icon: Shield, color: 'text-indigo-600', bg: 'bg-indigo-100' },
  subscription_purchased: { icon: CreditCard, color: 'text-emerald-600', bg: 'bg-emerald-100' },
  subscription_cancelled: { icon: CreditCard, color: 'text-red-600', bg: 'bg-red-100' },
  profile_updated: { icon: User, color: 'text-purple-600', bg: 'bg-purple-100' },
  settings_changed: { icon: Settings, color: 'text-amber-600', bg: 'bg-amber-100' },
  report_generated: { icon: FileText, color: 'text-blue-600', bg: 'bg-blue-100' },
  feedback_submitted: { icon: FileText, color: 'text-green-600', bg: 'bg-green-100' },
  achievement_unlocked: { icon: Award, color: 'text-yellow-600', bg: 'bg-yellow-100' },
  module_completed: { icon: BookOpen, color: 'text-teal-600', bg: 'bg-teal-100' }
};

export default function RecentActivity({ currentUser }) {
  // Fetch user activities
  const { data: activities = [], isLoading } = useQuery({
    queryKey: ['userActivity', currentUser?.email],
    queryFn: async () => {
      if (!currentUser?.email) return [];
      const acts = await base44.entities.UserActivity.filter(
        { user_email: currentUser.email },
        '-created_date',
        20
      );
      return acts;
    },
    enabled: !!currentUser?.email
  });

  // Fetch recent analyses as fallback activity
  const { data: recentAnalyses = [] } = useQuery({
    queryKey: ['recentAnalyses', currentUser?.email],
    queryFn: async () => {
      if (!currentUser?.email) return [];
      const analyses = await base44.entities.AnalysisRecord.filter(
        { created_by: currentUser.email },
        '-created_date',
        10
      );
      return analyses;
    },
    enabled: !!currentUser?.email
  });

  // Combine activities with analyses
  const combinedActivities = [
    ...activities.map(a => ({ ...a, source: 'activity' })),
    ...recentAnalyses.map(a => ({
      action_type: 'analysis_created',
      description: `Analyzed ${a.content_type}: ${a.result}`,
      created_date: a.created_date,
      metadata: { result: a.result, confidence: a.confidence },
      source: 'analysis'
    }))
  ].sort((a, b) => new Date(b.created_date) - new Date(a.created_date)).slice(0, 15);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl border-2 border-slate-200 p-8"
    >
      <div className="flex items-center gap-2 mb-6">
        <Activity className="w-6 h-6 text-slate-700" />
        <h2 className="text-2xl font-bold text-slate-900">Recent Activity</h2>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
        </div>
      ) : combinedActivities.length === 0 ? (
        <div className="text-center py-12 bg-slate-50 rounded-xl">
          <Activity className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <p className="text-slate-600">No recent activity to display</p>
        </div>
      ) : (
        <div className="space-y-3 max-h-[500px] overflow-y-auto">
          {combinedActivities.map((activity, idx) => {
            const actionConfig = actionIcons[activity.action_type] || actionIcons.login;
            const Icon = actionConfig.icon;

            return (
              <div
                key={activity.id || idx}
                className="flex items-start gap-4 p-4 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
              >
                <div className={`w-10 h-10 rounded-lg ${actionConfig.bg} flex items-center justify-center flex-shrink-0`}>
                  <Icon className={`w-5 h-5 ${actionConfig.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-slate-900 mb-1">
                    {activity.description || activity.action_type.replace(/_/g, ' ')}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-500">
                    <span>{moment(activity.created_date).fromNow()}</span>
                    {activity.metadata?.confidence && (
                      <span className="px-2 py-0.5 bg-slate-100 rounded">
                        {activity.metadata.confidence}% confidence
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}