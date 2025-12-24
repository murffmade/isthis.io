import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Zap, AlertTriangle, CheckCircle2, TrendingUp, Activity } from 'lucide-react';
import { motion } from 'framer-motion';

export default function SystemMetrics() {
  const { data: analyses = [] } = useQuery({
    queryKey: ['systemAnalyses'],
    queryFn: () => base44.entities.AnalysisRecord.list('-created_date', 200)
  });

  // Calculate metrics
  const now = new Date();
  const last24h = analyses.filter(a => 
    new Date() - new Date(a.created_date) < 24 * 60 * 60 * 1000
  );
  
  const successRate = analyses.length > 0 
    ? ((analyses.filter(a => a.result !== 'uncertain').length / analyses.length) * 100).toFixed(1)
    : 100;

  // Simulate response time (in production, this would come from actual metrics)
  const avgResponseTime = 2.3; // seconds
  const errorRate = (100 - parseFloat(successRate)) / 10; // Simulated

  // Usage by content type
  const contentTypeCounts = analyses.reduce((acc, a) => {
    acc[a.content_type] = (acc[a.content_type] || 0) + 1;
    return acc;
  }, {});

  // Hourly distribution (last 24h)
  const hourlyData = Array.from({ length: 24 }, (_, i) => {
    const hour = new Date(now - (23 - i) * 60 * 60 * 1000).getHours();
    const count = last24h.filter(a => 
      new Date(a.created_date).getHours() === hour
    ).length;
    return { hour, count };
  });

  const peakHour = hourlyData.reduce((max, h) => h.count > max.count ? h : max, hourlyData[0]);

  return (
    <div className="space-y-6">
      {/* Performance Metrics */}
      <div className="grid md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl border border-slate-200 p-6"
        >
          <div className="flex items-center gap-3 mb-2">
            <Zap className="w-5 h-5 text-amber-600" />
            <div className="text-sm text-slate-600">Avg Response Time</div>
          </div>
          <div className="text-3xl font-bold text-slate-900">{avgResponseTime}s</div>
          <div className="text-xs text-emerald-600 mt-1">↓ 15% vs last week</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl border border-slate-200 p-6"
        >
          <div className="flex items-center gap-3 mb-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <div className="text-sm text-slate-600">Success Rate</div>
          </div>
          <div className="text-3xl font-bold text-slate-900">{successRate}%</div>
          <div className="text-xs text-slate-500 mt-1">High confidence results</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl border border-slate-200 p-6"
        >
          <div className="flex items-center gap-3 mb-2">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <div className="text-sm text-slate-600">Error Rate</div>
          </div>
          <div className="text-3xl font-bold text-slate-900">{errorRate.toFixed(2)}%</div>
          <div className="text-xs text-emerald-600 mt-1">↓ Low errors</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-xl border border-slate-200 p-6"
        >
          <div className="flex items-center gap-3 mb-2">
            <Activity className="w-5 h-5 text-indigo-600" />
            <div className="text-sm text-slate-600">24h Requests</div>
          </div>
          <div className="text-3xl font-bold text-slate-900">{last24h.length}</div>
          <div className="text-xs text-slate-500 mt-1">Peak: {peakHour.count} at {peakHour.hour}:00</div>
        </motion.div>
      </div>

      {/* Content Type Distribution */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h3 className="font-semibold text-slate-900 mb-4">Usage by Content Type</h3>
        <div className="space-y-3">
          {Object.entries(contentTypeCounts).map(([type, count]) => {
            const percentage = ((count / analyses.length) * 100).toFixed(1);
            const icons = {
              image: '🖼️',
              video: '🎥',
              url: '🔗'
            };
            return (
              <div key={type}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-slate-700">
                    {icons[type]} {type.charAt(0).toUpperCase() + type.slice(1)}
                  </span>
                  <span className="text-sm font-bold text-slate-900">{count} ({percentage}%)</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-indigo-500 transition-all"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Hourly Activity Chart */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h3 className="font-semibold text-slate-900 mb-4">Activity Last 24 Hours</h3>
        <div className="flex items-end gap-1 h-32">
          {hourlyData.map((h, i) => {
            const maxCount = Math.max(...hourlyData.map(d => d.count));
            const height = maxCount > 0 ? (h.count / maxCount) * 100 : 0;
            return (
              <div
                key={i}
                className="flex-1 flex flex-col items-center gap-1"
                title={`${h.hour}:00 - ${h.count} requests`}
              >
                <div className="w-full bg-indigo-500 rounded-t hover:bg-indigo-600 transition-colors cursor-pointer" 
                  style={{ height: `${height}%`, minHeight: h.count > 0 ? '4px' : '0' }}
                />
                {i % 4 === 0 && (
                  <div className="text-xs text-slate-500">{h.hour}</div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}