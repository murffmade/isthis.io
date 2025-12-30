import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle2, 
  TrendingUp,
  TrendingDown,
  FileText,
  Link as LinkIcon,
  Loader2,
  BarChart3,
  PieChart,
  Eye,
  Calendar,
  Shield
} from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

export default function AnalysisDashboard() {
  const queryClient = useQueryClient();
  const [inputType, setInputType] = useState('text');
  const [textContent, setTextContent] = useState('');
  const [urlContent, setUrlContent] = useState('');
  const [analysisTypes, setAnalysisTypes] = useState(['moderation', 'bias', 'sentiment']);
  const [selectedAnalysis, setSelectedAnalysis] = useState(null);

  const { data: analysisHistory = [], isLoading } = useQuery({
    queryKey: ['analysisHistory'],
    queryFn: () => base44.entities.AIAnalysisHistory.list('-created_date')
  });

  const analyzeMutation = useMutation({
    mutationFn: async ({ content, analysisType }) => {
      const functionName = analysisType === 'moderation' ? 'moderateContent' :
                          analysisType === 'bias' ? 'analyzeBias' :
                          analysisType === 'sentiment' ? 'analyzeSentiment' :
                          'summarizeAnalysis';
      
      const payload = content.startsWith('http') 
        ? { file_url: content, content_type: 'url' }
        : { content };

      const result = await base44.functions.invoke(functionName, payload);
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['analysisHistory']);
      setTextContent('');
      setUrlContent('');
      toast.success('Analysis complete');
    },
    onError: (error) => {
      toast.error('Analysis failed: ' + error.message);
    }
  });

  const handleAnalyze = async () => {
    const content = inputType === 'text' ? textContent : urlContent;
    
    if (!content) {
      toast.error('Please enter content to analyze');
      return;
    }

    for (const type of analysisTypes) {
      await analyzeMutation.mutateAsync({ content, analysisType: type });
    }
  };

  const toggleAnalysisType = (type) => {
    setAnalysisTypes(prev => 
      prev.includes(type) 
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  };

  // Calculate statistics
  const totalAnalyses = analysisHistory.length;
  const recentAnalyses = analysisHistory.slice(0, 30);
  const flaggedCount = recentAnalyses.filter(a => 
    a.outcome === 'flagged' || a.outcome === 'rejected' || a.outcome === 'high_risk'
  ).length;
  const approvedCount = recentAnalyses.filter(a => 
    a.outcome === 'approved' || a.outcome === 'low_risk' || a.outcome === 'positive'
  ).length;
  const avgConfidence = recentAnalyses.reduce((sum, a) => sum + (a.confidence_score || 0), 0) / (recentAnalyses.length || 1);

  // Group by analysis type
  const analysisByType = analysisHistory.reduce((acc, analysis) => {
    acc[analysis.analysis_type] = (acc[analysis.analysis_type] || 0) + 1;
    return acc;
  }, {});

  // Group by outcome
  const outcomeStats = analysisHistory.reduce((acc, analysis) => {
    acc[analysis.outcome] = (acc[analysis.outcome] || 0) + 1;
    return acc;
  }, {});

  const getOutcomeBadge = (outcome) => {
    const configs = {
      approved: { bg: 'bg-emerald-100', text: 'text-emerald-700', icon: CheckCircle2 },
      flagged: { bg: 'bg-amber-100', text: 'text-amber-700', icon: AlertTriangle },
      rejected: { bg: 'bg-red-100', text: 'text-red-700', icon: AlertTriangle },
      neutral: { bg: 'bg-slate-100', text: 'text-slate-700', icon: Activity },
      positive: { bg: 'bg-emerald-100', text: 'text-emerald-700', icon: CheckCircle2 },
      negative: { bg: 'bg-red-100', text: 'text-red-700', icon: AlertTriangle },
      low_risk: { bg: 'bg-emerald-100', text: 'text-emerald-700', icon: CheckCircle2 },
      medium_risk: { bg: 'bg-amber-100', text: 'text-amber-700', icon: AlertTriangle },
      high_risk: { bg: 'bg-red-100', text: 'text-red-700', icon: AlertTriangle }
    };

    const config = configs[outcome] || configs.neutral;
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${config.bg} ${config.text}`}>
        <Icon className="w-3 h-3" />
        {outcome.replace('_', ' ')}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <Activity className="w-8 h-8 text-blue-600" />
            <TrendingUp className="w-5 h-5 text-blue-500" />
          </div>
          <div className="text-3xl font-bold text-slate-900">{totalAnalyses}</div>
          <div className="text-sm text-slate-600">Total Analyses</div>
        </div>

        <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-xl border border-emerald-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-600" />
            <div className="text-xs text-emerald-700">{recentAnalyses.length > 0 ? Math.round((approvedCount / recentAnalyses.length) * 100) : 0}%</div>
          </div>
          <div className="text-3xl font-bold text-slate-900">{approvedCount}</div>
          <div className="text-sm text-slate-600">Approved (Last 30)</div>
        </div>

        <div className="bg-gradient-to-br from-amber-50 to-yellow-50 rounded-xl border border-amber-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <AlertTriangle className="w-8 h-8 text-amber-600" />
            <div className="text-xs text-amber-700">{recentAnalyses.length > 0 ? Math.round((flaggedCount / recentAnalyses.length) * 100) : 0}%</div>
          </div>
          <div className="text-3xl font-bold text-slate-900">{flaggedCount}</div>
          <div className="text-sm text-slate-600">Flagged (Last 30)</div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl border border-purple-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <BarChart3 className="w-8 h-8 text-purple-600" />
          </div>
          <div className="text-3xl font-bold text-slate-900">{avgConfidence.toFixed(0)}%</div>
          <div className="text-sm text-slate-600">Avg Confidence</div>
        </div>
      </div>

      {/* Analysis Form */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
          <Shield className="w-5 h-5 text-indigo-600" />
          Quick Analysis
        </h3>

        <div className="space-y-4">
          <div className="flex gap-2">
            <Button
              size="sm"
              variant={inputType === 'text' ? 'default' : 'outline'}
              onClick={() => setInputType('text')}
              className={inputType === 'text' ? 'bg-indigo-600' : ''}
            >
              <FileText className="w-4 h-4 mr-2" />
              Text
            </Button>
            <Button
              size="sm"
              variant={inputType === 'url' ? 'default' : 'outline'}
              onClick={() => setInputType('url')}
              className={inputType === 'url' ? 'bg-indigo-600' : ''}
            >
              <LinkIcon className="w-4 h-4 mr-2" />
              URL
            </Button>
          </div>

          {inputType === 'text' ? (
            <Textarea
              value={textContent}
              onChange={(e) => setTextContent(e.target.value)}
              placeholder="Enter text content to analyze..."
              className="min-h-32"
            />
          ) : (
            <Input
              value={urlContent}
              onChange={(e) => setUrlContent(e.target.value)}
              placeholder="https://example.com/content"
            />
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Analysis Types
            </label>
            <div className="flex flex-wrap gap-2">
              {['moderation', 'bias', 'sentiment', 'summary'].map((type) => (
                <button
                  key={type}
                  onClick={() => toggleAnalysisType(type)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    analysisTypes.includes(type)
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          <Button
            onClick={handleAnalyze}
            disabled={analyzeMutation.isPending || analysisTypes.length === 0}
            className="w-full bg-indigo-600 hover:bg-indigo-700"
          >
            {analyzeMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Activity className="w-4 h-4 mr-2" />
                Analyze Content
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Analysis Type Distribution */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
            <PieChart className="w-5 h-5 text-indigo-600" />
            By Analysis Type
          </h3>
          <div className="space-y-3">
            {Object.entries(analysisByType).map(([type, count]) => (
              <div key={type} className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1">
                  <div className="w-2 h-2 rounded-full bg-indigo-600"></div>
                  <span className="text-sm text-slate-700 capitalize">{type}</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden" style={{ width: '100px' }}>
                    <div 
                      className="h-full bg-indigo-600 rounded-full"
                      style={{ width: `${(count / totalAnalyses) * 100}%` }}
                    />
                  </div>
                  <span className="text-sm font-semibold text-slate-900 w-12 text-right">{count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-indigo-600" />
            By Outcome
          </h3>
          <div className="space-y-3">
            {Object.entries(outcomeStats).map(([outcome, count]) => (
              <div key={outcome} className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1">
                  {getOutcomeBadge(outcome)}
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden" style={{ width: '100px' }}>
                    <div 
                      className={`h-full rounded-full ${
                        outcome.includes('approve') || outcome.includes('positive') || outcome === 'low_risk' ? 'bg-emerald-600' :
                        outcome.includes('flag') || outcome === 'medium_risk' ? 'bg-amber-600' : 'bg-red-600'
                      }`}
                      style={{ width: `${(count / totalAnalyses) * 100}%` }}
                    />
                  </div>
                  <span className="text-sm font-semibold text-slate-900 w-12 text-right">{count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Analysis History */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-200">
          <h3 className="font-bold text-slate-900 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-indigo-600" />
            Recent Analyses
          </h3>
        </div>

        {isLoading ? (
          <div className="p-12 text-center">
            <Loader2 className="w-8 h-8 animate-spin text-slate-400 mx-auto" />
          </div>
        ) : analysisHistory.length === 0 ? (
          <div className="p-12 text-center">
            <Activity className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-600">No analyses yet</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {analysisHistory.slice(0, 10).map((analysis) => (
              <div key={analysis.id} className="p-6 hover:bg-slate-50 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="px-2 py-1 bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-full capitalize">
                        {analysis.analysis_type}
                      </span>
                      {getOutcomeBadge(analysis.outcome)}
                      {analysis.confidence_score && (
                        <span className="text-xs text-slate-500">
                          {analysis.confidence_score}% confidence
                        </span>
                      )}
                    </div>

                    {analysis.content_preview && (
                      <p className="text-sm text-slate-600 mb-2 line-clamp-2">
                        {analysis.content_preview}
                      </p>
                    )}

                    {analysis.tags && analysis.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-2">
                        {analysis.tags.slice(0, 3).map((tag, idx) => (
                          <span key={idx} className="px-2 py-0.5 bg-slate-100 text-slate-600 text-xs rounded">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <Calendar className="w-3 h-3" />
                      {new Date(analysis.created_date).toLocaleString()}
                    </div>
                  </div>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setSelectedAnalysis(analysis)}
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    View
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedAnalysis && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedAnalysis(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-auto"
            >
              <div className="p-6 border-b border-slate-200 sticky top-0 bg-white">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-slate-900 text-xl">Analysis Details</h3>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setSelectedAnalysis(null)}
                  >
                    Close
                  </Button>
                </div>
              </div>

              <div className="p-6 space-y-6">
                <div>
                  <label className="text-sm font-semibold text-slate-700 mb-2 block">Type & Outcome</label>
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 bg-indigo-100 text-indigo-700 text-sm font-semibold rounded-full capitalize">
                      {selectedAnalysis.analysis_type}
                    </span>
                    {getOutcomeBadge(selectedAnalysis.outcome)}
                  </div>
                </div>

                {selectedAnalysis.content_preview && (
                  <div>
                    <label className="text-sm font-semibold text-slate-700 mb-2 block">Content</label>
                    <div className="p-4 bg-slate-50 rounded-lg text-sm text-slate-700">
                      {selectedAnalysis.content_preview}
                    </div>
                  </div>
                )}

                {selectedAnalysis.result && (
                  <div>
                    <label className="text-sm font-semibold text-slate-700 mb-2 block">Results</label>
                    <pre className="p-4 bg-slate-900 text-slate-300 rounded-lg text-xs overflow-auto">
                      {JSON.stringify(selectedAnalysis.result, null, 2)}
                    </pre>
                  </div>
                )}

                <div className="flex items-center gap-4 text-xs text-slate-500">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {new Date(selectedAnalysis.created_date).toLocaleString()}
                  </div>
                  {selectedAnalysis.confidence_score && (
                    <div>Confidence: {selectedAnalysis.confidence_score}%</div>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}