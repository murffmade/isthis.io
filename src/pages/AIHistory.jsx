import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Brain, Filter, Search, Calendar, TrendingUp, Shield, Sparkles, ExternalLink, ChevronDown, Lock } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import BottomNav from '@/components/mobile/BottomNav';

export default function AIHistory() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterOutcome, setFilterOutcome] = useState('all');
  const [expandedId, setExpandedId] = useState(null);

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const { data: subscription } = useQuery({
    queryKey: ['userSubscription'],
    queryFn: async () => {
      if (!currentUser) return null;
      const subs = await base44.entities.Subscription.filter({ created_by: currentUser.email });
      return subs[0] || null;
    },
    enabled: !!currentUser
  });

  const isPremium = subscription && 
    (subscription.plan === 'annual' || subscription.plan === 'lifetime') && 
    subscription.status === 'active';

  const { data: history = [], isLoading } = useQuery({
    queryKey: ['aiAnalysisHistory'],
    queryFn: () => base44.entities.AIAnalysisHistory.list('-created_date', 100),
    enabled: isPremium
  });

  const filteredHistory = history.filter(item => {
    const matchesSearch = searchTerm === '' || 
      item.content_preview?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesType = filterType === 'all' || item.analysis_type === filterType;
    const matchesOutcome = filterOutcome === 'all' || item.outcome === filterOutcome;
    
    return matchesSearch && matchesType && matchesOutcome;
  });

  const getTypeIcon = (type) => {
    switch (type) {
      case 'bias': return <Brain className="w-5 h-5 text-blue-600" />;
      case 'sentiment': return <TrendingUp className="w-5 h-5 text-purple-600" />;
      case 'moderation': return <Shield className="w-5 h-5 text-red-600" />;
      case 'summary': return <Sparkles className="w-5 h-5 text-emerald-600" />;
      default: return <Brain className="w-5 h-5 text-slate-600" />;
    }
  };

  const getOutcomeBadge = (outcome) => {
    const colors = {
      approved: 'bg-emerald-100 text-emerald-700',
      flagged: 'bg-amber-100 text-amber-700',
      rejected: 'bg-red-100 text-red-700',
      neutral: 'bg-slate-100 text-slate-700',
      positive: 'bg-emerald-100 text-emerald-700',
      negative: 'bg-red-100 text-red-700',
      low_risk: 'bg-blue-100 text-blue-700',
      medium_risk: 'bg-amber-100 text-amber-700',
      high_risk: 'bg-red-100 text-red-700'
    };
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${colors[outcome] || 'bg-slate-100 text-slate-700'}`}>
        {outcome.replace('_', ' ')}
      </span>
    );
  };

  if (!isPremium) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white pb-20 md:pb-0">
        <header className="border-b border-slate-100 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
          <div className="max-w-6xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-purple-800 flex items-center justify-center">
                  <Brain className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-slate-800">AI Analysis History</h1>
                  <p className="text-xs text-slate-500">Premium Feature</p>
                </div>
              </div>
              <Link to={createPageUrl('Home')}>
                <Button variant="outline" size="sm">Back</Button>
              </Link>
            </div>
          </div>
        </header>

        <div className="max-w-2xl mx-auto px-6 py-20 text-center">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-600 to-purple-800 flex items-center justify-center mx-auto mb-6">
            <Lock className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-slate-900 mb-4">Premium Feature</h2>
          <p className="text-lg text-slate-600 mb-8">
            Upgrade to Premium to access your complete AI analysis history with advanced search and filtering.
          </p>
          <Link to={createPageUrl('Pricing')}>
            <Button className="bg-gradient-to-r from-purple-600 to-purple-800 hover:from-purple-700 hover:to-purple-900">
              Upgrade to Premium
            </Button>
          </Link>
        </div>

        <BottomNav currentPage="account" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white pb-20 md:pb-0">
      <header className="border-b border-slate-100 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-purple-800 flex items-center justify-center">
                <Brain className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-slate-800">AI Analysis History</h1>
                <p className="text-xs text-slate-500">{filteredHistory.length} analyses</p>
              </div>
            </div>
            <Link to={createPageUrl('Home')}>
              <Button variant="outline" size="sm">Back</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Search and Filters */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
          <div className="grid md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search content or tags..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-4 py-2 rounded-lg border border-slate-200 bg-white text-sm"
            >
              <option value="all">All Types</option>
              <option value="bias">Bias Detection</option>
              <option value="sentiment">Sentiment Analysis</option>
              <option value="moderation">Content Moderation</option>
              <option value="summary">Summaries</option>
            </select>

            <select
              value={filterOutcome}
              onChange={(e) => setFilterOutcome(e.target.value)}
              className="px-4 py-2 rounded-lg border border-slate-200 bg-white text-sm"
            >
              <option value="all">All Outcomes</option>
              <option value="approved">Approved</option>
              <option value="flagged">Flagged</option>
              <option value="rejected">Rejected</option>
              <option value="low_risk">Low Risk</option>
              <option value="medium_risk">Medium Risk</option>
              <option value="high_risk">High Risk</option>
            </select>
          </div>
        </div>

        {/* History List */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full mx-auto" />
            <p className="text-slate-600 mt-4">Loading history...</p>
          </div>
        ) : filteredHistory.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
            <Brain className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-600">No analysis history found</p>
            <p className="text-sm text-slate-500 mt-2">Start analyzing content to build your history</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredHistory.map((item) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-xl border border-slate-200 overflow-hidden hover:border-slate-300 transition-colors"
              >
                <button
                  onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
                  className="w-full px-6 py-4 flex items-start gap-4 text-left hover:bg-slate-50 transition-colors"
                >
                  <div className="mt-1">{getTypeIcon(item.analysis_type)}</div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <div>
                        <div className="font-semibold text-slate-900 capitalize mb-1">
                          {item.analysis_type.replace('_', ' ')} Analysis
                        </div>
                        <div className="text-sm text-slate-500 flex items-center gap-2">
                          <Calendar className="w-3 h-3" />
                          {new Date(item.created_date).toLocaleString()}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {getOutcomeBadge(item.outcome)}
                        <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform ${expandedId === item.id ? 'rotate-180' : ''}`} />
                      </div>
                    </div>
                    
                    <div className="text-sm text-slate-600 line-clamp-2 mb-2">
                      {item.content_preview}
                    </div>
                    
                    {item.tags?.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {item.tags.slice(0, 4).map((tag, i) => (
                          <span key={i} className="px-2 py-0.5 bg-slate-100 text-slate-600 text-xs rounded-full">
                            {tag}
                          </span>
                        ))}
                        {item.tags.length > 4 && (
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-xs rounded-full">
                            +{item.tags.length - 4}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </button>

                {expandedId === item.id && (
                  <div className="border-t border-slate-200 p-6 bg-slate-50">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <div className="text-sm font-semibold text-slate-900 mb-2">Details</div>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-slate-600">Content Type</span>
                            <span className="font-medium text-slate-900 capitalize">{item.content_type}</span>
                          </div>
                          {item.confidence_score && (
                            <div className="flex justify-between">
                              <span className="text-slate-600">Confidence</span>
                              <span className="font-medium text-slate-900">{item.confidence_score}%</span>
                            </div>
                          )}
                          {item.file_url && (
                            <a 
                              href={item.file_url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 text-blue-600 hover:text-blue-700"
                            >
                              View File <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                      </div>

                      <div>
                        <div className="text-sm font-semibold text-slate-900 mb-2">Key Results</div>
                        <div className="bg-white rounded-lg p-4 text-sm text-slate-700">
                          {item.result && typeof item.result === 'object' && (
                            <pre className="whitespace-pre-wrap max-h-40 overflow-y-auto">
                              {JSON.stringify(item.result, null, 2)}
                            </pre>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </main>

      <BottomNav currentPage="account" />
    </div>
  );
}