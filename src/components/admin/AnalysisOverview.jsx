import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Shield, TrendingUp, AlertTriangle, HelpCircle, Filter } from 'lucide-react';
import { motion } from 'framer-motion';

export default function AnalysisOverview() {
  const [filterResult, setFilterResult] = useState('all');

  const { data: analyses = [] } = useQuery({
    queryKey: ['allAnalyses'],
    queryFn: () => base44.entities.AnalysisRecord.list('-created_date', 100)
  });

  const filtered = filterResult === 'all' 
    ? analyses 
    : analyses.filter(a => a.result === filterResult);

  // Statistics
  const stats = {
    total: analyses.length,
    likely_real: analyses.filter(a => a.result === 'likely_real').length,
    likely_ai: analyses.filter(a => a.result === 'likely_ai').length,
    uncertain: analyses.filter(a => a.result === 'uncertain').length
  };

  const avgConfidence = analyses.length > 0
    ? (analyses.reduce((sum, a) => sum + (a.confidence || 0), 0) / analyses.length).toFixed(1)
    : 0;

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center gap-3 mb-2">
            <Shield className="w-5 h-5 text-slate-600" />
            <div className="text-sm text-slate-600">Total Analyses</div>
          </div>
          <div className="text-3xl font-bold text-slate-900">{stats.total}</div>
        </div>

        <div className="bg-white rounded-xl border border-emerald-200 bg-emerald-50 p-6">
          <div className="flex items-center gap-3 mb-2">
            <Shield className="w-5 h-5 text-emerald-600" />
            <div className="text-sm text-emerald-700">Likely Real</div>
          </div>
          <div className="text-3xl font-bold text-emerald-900">{stats.likely_real}</div>
          <div className="text-xs text-emerald-600 mt-1">
            {stats.total > 0 ? ((stats.likely_real / stats.total) * 100).toFixed(1) : 0}%
          </div>
        </div>

        <div className="bg-white rounded-xl border border-amber-200 bg-amber-50 p-6">
          <div className="flex items-center gap-3 mb-2">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
            <div className="text-sm text-amber-700">Likely AI</div>
          </div>
          <div className="text-3xl font-bold text-amber-900">{stats.likely_ai}</div>
          <div className="text-xs text-amber-600 mt-1">
            {stats.total > 0 ? ((stats.likely_ai / stats.total) * 100).toFixed(1) : 0}%
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center gap-3 mb-2">
            <HelpCircle className="w-5 h-5 text-slate-600" />
            <div className="text-sm text-slate-600">Uncertain</div>
          </div>
          <div className="text-3xl font-bold text-slate-900">{stats.uncertain}</div>
          <div className="text-xs text-slate-500 mt-1">Avg confidence: {avgConfidence}%</div>
        </div>
      </div>

      {/* Recent Analyses */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-slate-900">Recent Analyses</h3>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-500" />
            <select
              value={filterResult}
              onChange={(e) => setFilterResult(e.target.value)}
              className="text-sm border border-slate-200 rounded-lg px-3 py-1"
            >
              <option value="all">All Results</option>
              <option value="likely_real">Likely Real</option>
              <option value="likely_ai">Likely AI</option>
              <option value="uncertain">Uncertain</option>
            </select>
          </div>
        </div>

        <div className="space-y-2 max-h-[500px] overflow-y-auto">
          {filtered.map((analysis, i) => {
            const resultColors = {
              likely_real: 'bg-emerald-100 text-emerald-700',
              likely_ai: 'bg-amber-100 text-amber-700',
              uncertain: 'bg-slate-100 text-slate-700'
            };

            return (
              <motion.div
                key={analysis.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.02 }}
                className="flex items-center gap-3 p-3 hover:bg-slate-50 rounded-lg transition-colors border border-slate-100"
              >
                <div className="w-12 h-12 rounded-lg bg-slate-100 overflow-hidden flex-shrink-0">
                  {analysis.thumbnail_url ? (
                    <img src={analysis.thumbnail_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-400">
                      {analysis.content_type === 'video' ? '🎥' : '🔗'}
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${resultColors[analysis.result]}`}>
                      {analysis.result.replace('_', ' ')}
                    </span>
                    <span className="text-xs text-slate-500">
                      {analysis.confidence}% confidence
                    </span>
                  </div>
                  <div className="text-xs text-slate-600 truncate">
                    {analysis.summary || 'No summary available'}
                  </div>
                  <div className="text-xs text-slate-400 mt-1">
                    {new Date(analysis.created_date).toLocaleString()} • {analysis.created_by}
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-xs text-slate-500">
                    {analysis.signals?.length || 0} signals
                  </div>
                </div>
              </motion.div>
            );
          })}

          {filtered.length === 0 && (
            <div className="text-center py-12 text-slate-500">
              No analyses found
            </div>
          )}
        </div>
      </div>
    </div>
  );
}