import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { History as HistoryIcon, Shield, CheckCircle, AlertTriangle, Heart, Trash2, ArrowLeft, Filter, SortAsc, Lock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import BottomNav from '@/components/mobile/BottomNav';
import moment from 'moment';

const AnalysisRecord = base44.entities.AnalysisRecord;

const modeConfig = {
  real: { icon: Shield, color: 'slate', label: 'Is This Real?' },
  true: { icon: CheckCircle, color: 'blue', label: 'Is This True?' },
  scam: { icon: AlertTriangle, color: 'amber', label: 'Is This a Scam?' },
  safe: { icon: Heart, color: 'emerald', label: 'Is This Safe?' }
};

export default function HistoryPage() {
  const queryClient = useQueryClient();
  const PAGE_SIZE = 50;
  const [filterType, setFilterType] = useState('all');
  const [sortBy, setSortBy] = useState('date');
  const [showFilters, setShowFilters] = useState(false);

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me().catch(() => null)
  });

  const { data: subscription } = useQuery({
    queryKey: ['subscription'],
    queryFn: async () => {
      if (!currentUser) return null;
      const subs = await base44.entities.Subscription.filter({ created_by: currentUser.email });
      return subs[0] || null;
    },
    enabled: !!currentUser
  });

  const isPremium = subscription && ['active'].includes(subscription.status) && ['annual', 'lifetime'].includes(subscription.plan);

  const { data: analyses = [], isLoading } = useQuery({
    queryKey: ['analysisHistory'],
    queryFn: async () => {
      const records = await AnalysisRecord.list('-created_date', PAGE_SIZE);
      return records;
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => AnalysisRecord.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['analysisHistory']);
      toast.success('Analysis deleted');
    }
  });

  const handleDelete = (id) => {
    if (confirm('Delete this analysis?')) {
      deleteMutation.mutate(id);
    }
  };

  // Filter and sort
  const filteredAnalyses = analyses
    .filter(a => {
      if (filterType === 'all') return true;
      return a.classification === filterType;
    })
    .sort((a, b) => {
      if (sortBy === 'date') {
        return new Date(b.created_date) - new Date(a.created_date);
      } else if (sortBy === 'confidence') {
        return b.confidence - a.confidence;
      }
      return 0;
    });

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white pb-20 md:pb-0">
      {/* Header */}
      <header className="border-b border-slate-100 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link to={createPageUrl('Home')} className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center">
                <HistoryIcon className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-slate-800 leading-tight">IsThis.io</h1>
                <p className="text-xs text-slate-500">Analysis History</p>
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
        {/* Title */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Analysis History</h2>
              <p className="text-slate-600">All your image and video verifications</p>
            </div>
            {!isPremium && (
              <Link
                to={createPageUrl('Home')}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
              >
                <Lock className="w-4 h-4" />
                Upgrade to Premium
              </Link>
            )}
          </div>

          {/* Filters - Premium Only */}
          {isPremium && (
            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
                >
                  <Filter className="w-4 h-4" />
                  Filters
                </button>

                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500"
                >
                  <option value="all">All Types</option>
                  <option value="photo">Photos</option>
                  <option value="screenshot">Screenshots</option>
                  <option value="digital_art">Digital Art</option>
                  <option value="illustration">Illustrations</option>
                </select>

                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500"
                >
                  <option value="date">Sort by Date</option>
                  <option value="confidence">Sort by Confidence</option>
                </select>

                <div className="ml-auto text-sm text-slate-600">
                  {filteredAnalyses.length} results
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Premium Gate or Results */}
        {!isPremium ? (
          <div className="text-center py-16">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center mx-auto mb-6">
              <Lock className="w-10 h-10 text-indigo-600" />
            </div>
            <h3 className="text-2xl font-bold text-slate-900 mb-3">Premium Feature</h3>
            <p className="text-slate-600 mb-8 max-w-md mx-auto">
              Upgrade to Premium to access your full analysis history with advanced filtering and sorting capabilities
            </p>
            <Link
              to={createPageUrl('Home')}
              className="inline-block px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-bold hover:shadow-xl transition-all"
            >
              Upgrade to Premium
            </Link>
          </div>
        ) : isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block w-8 h-8 border-4 border-slate-200 border-t-slate-900 rounded-full animate-spin" />
          </div>
        ) : filteredAnalyses.length === 0 ? (
          <div className="text-center py-16">
            <HistoryIcon className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-slate-900 mb-2">
              {analyses.length === 0 ? 'No analyses yet' : 'No results found'}
            </h3>
            <p className="text-slate-500 mb-6">
              {analyses.length === 0 
                ? 'Start verifying content to build your history'
                : 'Try adjusting your filters'
              }
            </p>
            {analyses.length === 0 && (
              <Link
                to={createPageUrl('Home')}
                className="inline-block px-6 py-3 bg-slate-900 text-white rounded-xl font-medium hover:bg-slate-800 transition-colors"
              >
                Start Verification
              </Link>
            )}
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredAnalyses.map((analysis, index) => {
              const resultConfig = {
                likely_real: { color: 'emerald', icon: CheckCircle, label: 'Likely Real' },
                likely_ai: { color: 'red', icon: AlertTriangle, label: 'Likely AI' },
                uncertain: { color: 'amber', icon: Shield, label: 'Uncertain' }
              };
              
              const config = resultConfig[analysis.result] || resultConfig.uncertain;
              const Icon = config.icon;

              const typeLabels = {
                photo: 'Photo',
                screenshot: 'Screenshot',
                digital_art: 'Digital Art',
                illustration: 'Illustration',
                image: 'Image',
                video: 'Video'
              };
              
              return (
                <motion.div
                  key={analysis.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-white rounded-2xl border-2 border-slate-200 p-6 hover:border-slate-300 transition-colors"
                >
                  <div className="flex items-start gap-4">
                    {/* Thumbnail */}
                    {analysis.file_url && (
                      <div className="w-24 h-24 rounded-xl overflow-hidden flex-shrink-0 bg-slate-100">
                        <img
                          src={analysis.thumbnail_url || analysis.file_url}
                          alt="Analysis"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4 mb-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`px-2 py-1 rounded-lg text-xs font-bold bg-${config.color}-100 text-${config.color}-700`}>
                              {config.label}
                            </span>
                            {analysis.classification && (
                              <span className="px-2 py-1 rounded-lg text-xs font-semibold bg-slate-100 text-slate-600">
                                {typeLabels[analysis.classification] || analysis.classification}
                              </span>
                            )}
                          </div>
                          <h3 className="font-bold text-slate-900 text-lg">{analysis.summary || 'Analysis Complete'}</h3>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <div className="text-2xl font-bold text-slate-900 mb-1">{analysis.confidence}%</div>
                          <div className="text-xs text-slate-500">Confidence</div>
                        </div>
                      </div>

                      {/* Signals Preview */}
                      {analysis.signals && analysis.signals.length > 0 && (
                        <div className="mb-3">
                          <p className="text-sm text-slate-600">
                            {analysis.signals.length} signal{analysis.signals.length !== 1 ? 's' : ''} detected
                          </p>
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

            {/* Pagination Notice */}
            {filteredAnalyses.length === PAGE_SIZE && (
              <div className="mt-8 text-center p-4 bg-slate-50 rounded-xl border border-slate-200">
                <p className="text-sm text-slate-600">
                  Showing {PAGE_SIZE} most recent analyses
                </p>
              </div>
            )}
          </div>
        )}
      </main>

      <BottomNav currentPage="history" />
    </div>
  );
}