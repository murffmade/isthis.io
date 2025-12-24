import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Activity, Shield, CreditCard, FileText, Clock } from 'lucide-react';
import { motion } from 'framer-motion';

export default function UserActivityLogs() {
  const { data: analyses = [] } = useQuery({
    queryKey: ['recentActivity'],
    queryFn: () => base44.entities.AnalysisRecord.list('-created_date', 50)
  });

  const { data: subscriptions = [] } = useQuery({
    queryKey: ['recentSubscriptions'],
    queryFn: () => base44.entities.Subscription.list('-created_date', 20)
  });

  // Combine activities
  const activities = [
    ...analyses.map(a => ({
      type: 'analysis',
      user: a.created_by,
      action: `Analyzed ${a.content_type}`,
      timestamp: a.created_date,
      details: `Result: ${a.result}`,
      icon: Shield
    })),
    ...subscriptions.map(s => ({
      type: 'subscription',
      user: s.created_by,
      action: `Subscribed to ${s.plan}`,
      timestamp: s.created_date || s.purchased_at,
      details: `$${(s.amount_paid / 100).toFixed(2)}`,
      icon: CreditCard
    }))
  ].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, 30);

  const activityStats = {
    last24h: activities.filter(a => 
      new Date() - new Date(a.timestamp) < 24 * 60 * 60 * 1000
    ).length,
    lastWeek: activities.filter(a => 
      new Date() - new Date(a.timestamp) < 7 * 24 * 60 * 60 * 1000
    ).length
  };

  return (
    <div className="space-y-6">
      {/* Activity Stats */}
      <div className="grid md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center gap-3 mb-2">
            <Activity className="w-5 h-5 text-indigo-600" />
            <div className="text-sm text-slate-600">Last 24 Hours</div>
          </div>
          <div className="text-3xl font-bold text-slate-900">{activityStats.last24h}</div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center gap-3 mb-2">
            <Clock className="w-5 h-5 text-blue-600" />
            <div className="text-sm text-slate-600">Last 7 Days</div>
          </div>
          <div className="text-3xl font-bold text-slate-900">{activityStats.lastWeek}</div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center gap-3 mb-2">
            <FileText className="w-5 h-5 text-emerald-600" />
            <div className="text-sm text-slate-600">Total Tracked</div>
          </div>
          <div className="text-3xl font-bold text-slate-900">{activities.length}</div>
        </div>
      </div>

      {/* Activity Log */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h3 className="font-semibold text-slate-900 mb-4">Recent Activity</h3>
        <div className="space-y-2 max-h-[500px] overflow-y-auto">
          {activities.map((activity, i) => {
            const Icon = activity.icon;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.02 }}
                className="flex items-center gap-3 p-3 hover:bg-slate-50 rounded-lg transition-colors"
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  activity.type === 'analysis' ? 'bg-indigo-100' : 'bg-emerald-100'
                }`}>
                  <Icon className={`w-4 h-4 ${
                    activity.type === 'analysis' ? 'text-indigo-600' : 'text-emerald-600'
                  }`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-slate-900">{activity.action}</div>
                  <div className="text-xs text-slate-500 truncate">{activity.user}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-slate-600">{activity.details}</div>
                  <div className="text-xs text-slate-400">
                    {new Date(activity.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}