import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { History as HistoryIcon, Shield, CheckCircle, AlertTriangle, Heart, Trash2, ArrowLeft, Filter } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import moment from 'moment';

const Analysis = base44.entities.Analysis;

const modeConfig = {
  real: { icon: Shield, color: 'slate', label: 'Is This Real?' },
  true: { icon: CheckCircle, color: 'blue', label: 'Is This True?' },
  scam: { icon: AlertTriangle, color: 'amber', label: 'Is This a Scam?' },
  safe: { icon: Heart, color: 'emerald', label: 'Is This Safe?' }
};

export default function HistoryPage() {
  const [filterMode, setFilterMode] = useState('all');
  const queryClient = useQueryClient();

  const { data: analyses = [], isLoading } = useQuery({
    queryKey: ['analyses', filterMode],
    queryFn: () => {
      if (filterMode === 'all') {
        return Analysis.list('-created_date', 50);
      }
      return Analysis.filter({ mode: filterMode }, '-created_date', 50);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => Analysis.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['analyses']);
      toast.success('Analysis deleted');
    }
  });

  const handleDelete = (id) => {
    if (confirm('Delete this analysis?')) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <header className="border-b border-slate-100 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link to={createPageUrl('Home')} className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center">
                <HistoryIcon className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-slate-800 leading-tight">Analysis History</h1>
                <p className="text-xs text-slate-500">Your saved verifications</p>
              </div>
            </Link>

            <Link
              to={createPageUrl('Home')}
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors text-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Home</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-6 py-12">
        {/* Filters */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-5 h-5 text-slate-400" />
            <span className="text-sm font-medium text-slate-700">Filter by mode:</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFilterMode('all')}
              className={`px-4 py-2 rounded-xl font-medium transition-colors ${
                filterMode === 'all'
                  ? 'bg-slate-900 text-white'
                  : 'bg-white border-2 border-slate-200 text-slate-700 hover:border-slate-300'
              }`}
            >
              All
            </button>
            {Object.entries(modeConfig).map(([mode, config]) => {
              const Icon = config.icon;
              return (
                <button
                  key={mode}
                  onClick={() => setFilterMode(mode)}
                  className={`px-4 py-2 rounded-xl font-medium transition-colors flex items-center gap-2 ${
                    filterMode === mode
                      ? `bg-${config.color}-600 text-white`
                      : 'bg-white border-2 border-slate-200 text-slate-700 hover:border-slate-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {config.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Results */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block w-8 h-8 border-4 border-slate-200 border-t-slate-900 rounded-full animate-spin" />
          </div>
        ) : analyses.length === 0 ? (
          <div className="text-center py-16">
            <HistoryIcon className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-slate-900 mb-2">No analyses yet</h3>
            <p className="text-slate-500 mb-6">Start verifying content to build your history</p>
            <Link
              to={createPageUrl('Home')}
              className="inline-block px-6 py-3 bg-slate-900 text-white rounded-xl font-medium hover:bg-slate-800 transition-colors"
            >
              Start Verification
            </Link>
          </div>
        ) : (
          <div className="grid gap-4">
            {analyses.map((analysis, index) => {
              const config = modeConfig[analysis.mode];
              const Icon = config.icon;
              
              return (
                <motion.div
                  key={analysis.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-white rounded-2xl border-2 border-slate-200 p-6 hover:border-slate-300 transition-colors"
                >
                  <div className="flex items-start gap-4">
                    {/* Mode Icon */}
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br from-${config.color}-600 to-${config.color}-700 flex items-center justify-center flex-shrink-0`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4 mb-3">
                        <div>
                          <div className="text-sm text-slate-500 mb-1">{config.label}</div>
                          <h3 className="font-bold text-slate-900 text-lg">{analysis.summary}</h3>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <div className="text-2xl font-bold text-slate-900 mb-1">{analysis.score}</div>
                          <div className="text-xs text-slate-500">{analysis.score_label}</div>
                        </div>
                      </div>

                      {/* Input Preview */}
                      {analysis.input_type === 'text' && (
                        <div className="mb-3 p-3 bg-slate-50 rounded-lg">
                          <p className="text-sm text-slate-600 line-clamp-2">{analysis.input_value}</p>
                        </div>
                      )}

                      {analysis.input_type === 'url' && (
                        <div className="mb-3">
                          <a
                            href={analysis.input_value}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-blue-600 hover:underline truncate block"
                          >
                            {analysis.input_value}
                          </a>
                        </div>
                      )}

                      {(analysis.input_type === 'image' || analysis.input_type === 'video') && analysis.thumbnail_url && (
                        <div className="mb-3">
                          <img
                            src={analysis.thumbnail_url}
                            alt="Analysis thumbnail"
                            className="w-full h-32 object-cover rounded-lg"
                          />
                        </div>
                      )}

                      {/* Meta */}
                      <div className="flex items-center justify-between">
                        <div className="text-xs text-slate-400">
                          {moment(analysis.created_date).fromNow()}
                        </div>
                        <button
                          onClick={() => handleDelete(analysis.id)}
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}