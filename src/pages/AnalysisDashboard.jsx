import React, { useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Activity, TrendingUp, FileImage, Video, AlertTriangle, CheckCircle2, HelpCircle } from 'lucide-react';

export default function AnalysisDashboard() {
  const { data: analyses, isLoading } = useQuery({
    queryKey: ['allAnalyses'],
    queryFn: () => base44.entities.AnalysisRecord.list('-created_date', 1000),
    initialData: []
  });

  const stats = useMemo(() => {
    if (analyses.length === 0) return null;

    // Overall metrics
    const total = analyses.length;
    const likelyReal = analyses.filter(a => a.result === 'likely_real').length;
    const likelyAI = analyses.filter(a => a.result === 'likely_ai').length;
    const likelyDeepfake = analyses.filter(a => a.result === 'likely_deepfake').length;
    const uncertain = analyses.filter(a => a.result === 'uncertain').length;

    // Content type breakdown
    const images = analyses.filter(a => a.content_type === 'image');
    const videos = analyses.filter(a => a.content_type === 'video');
    const urls = analyses.filter(a => a.content_type === 'url');

    // Average confidence
    const avgConfidence = analyses.reduce((sum, a) => sum + (a.confidence || 0), 0) / total;

    // Time series data (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentAnalyses = analyses.filter(a => new Date(a.created_date) >= thirtyDaysAgo);
    const dailyData = {};
    
    recentAnalyses.forEach(a => {
      const date = new Date(a.created_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      if (!dailyData[date]) {
        dailyData[date] = { date, real: 0, ai: 0, deepfake: 0, uncertain: 0 };
      }
      if (a.result === 'likely_real') dailyData[date].real++;
      else if (a.result === 'likely_ai') dailyData[date].ai++;
      else if (a.result === 'likely_deepfake') dailyData[date].deepfake++;
      else dailyData[date].uncertain++;
    });

    const timeSeriesData = Object.values(dailyData).slice(-14);

    // Artifact frequency
    const artifactCounts = {};
    analyses.forEach(a => {
      if (a.signals && Array.isArray(a.signals)) {
        a.signals.forEach(signal => {
          const type = signal.signal_type || 'Unknown';
          artifactCounts[type] = (artifactCounts[type] || 0) + 1;
        });
      }
    });

    const topArtifacts = Object.entries(artifactCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([name, count]) => ({ name: name.substring(0, 30), count }));

    // Content type accuracy
    const imageStats = {
      total: images.length,
      real: images.filter(a => a.result === 'likely_real').length,
      ai: images.filter(a => a.result === 'likely_ai').length,
      uncertain: images.filter(a => a.result === 'uncertain').length
    };

    const videoStats = {
      total: videos.length,
      real: videos.filter(a => a.result === 'likely_real').length,
      ai: videos.filter(a => a.result === 'likely_ai' || a.result === 'likely_deepfake').length,
      uncertain: videos.filter(a => a.result === 'uncertain').length
    };

    return {
      total,
      likelyReal,
      likelyAI: likelyAI + likelyDeepfake,
      uncertain,
      avgConfidence,
      images: images.length,
      videos: videos.length,
      urls: urls.length,
      timeSeriesData,
      topArtifacts,
      imageStats,
      videoStats,
      distributionData: [
        { name: 'Likely Real', value: likelyReal, color: '#10b981' },
        { name: 'Likely AI', value: likelyAI + likelyDeepfake, color: '#f59e0b' },
        { name: 'Uncertain', value: uncertain, color: '#64748b' }
      ]
    };
  }, [analyses]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!stats || analyses.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl border-2 border-slate-200 p-12 text-center max-w-md">
          <Activity className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-900 mb-2">No Data Yet</h2>
          <p className="text-slate-600">Start analyzing content to see dashboard metrics</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2 flex items-center gap-3">
            <Activity className="w-8 h-8 text-indigo-600" />
            Analysis Dashboard
          </h1>
          <p className="text-slate-600">
            Comprehensive metrics and trends for content verification
          </p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-2xl border-2 border-slate-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <Activity className="w-8 h-8 text-indigo-600" />
            </div>
            <div className="text-3xl font-bold text-slate-900 mb-1">{stats.total.toLocaleString()}</div>
            <div className="text-sm text-slate-600">Total Analyses</div>
          </div>

          <div className="bg-white rounded-2xl border-2 border-slate-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <CheckCircle2 className="w-8 h-8 text-emerald-600" />
            </div>
            <div className="text-3xl font-bold text-slate-900 mb-1">
              {stats.avgConfidence.toFixed(1)}%
            </div>
            <div className="text-sm text-slate-600">Avg. Confidence</div>
          </div>

          <div className="bg-white rounded-2xl border-2 border-slate-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <FileImage className="w-8 h-8 text-blue-600" />
            </div>
            <div className="text-3xl font-bold text-slate-900 mb-1">{stats.images.toLocaleString()}</div>
            <div className="text-sm text-slate-600">Images Analyzed</div>
          </div>

          <div className="bg-white rounded-2xl border-2 border-slate-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <Video className="w-8 h-8 text-purple-600" />
            </div>
            <div className="text-3xl font-bold text-slate-900 mb-1">{stats.videos.toLocaleString()}</div>
            <div className="text-sm text-slate-600">Videos Analyzed</div>
          </div>
        </div>

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Detection Distribution */}
          <div className="bg-white rounded-2xl border-2 border-slate-200 p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Detection Distribution</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={stats.distributionData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value, percent }) => 
                    `${name}: ${value} (${(percent * 100).toFixed(1)}%)`
                  }
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {stats.distributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="grid grid-cols-3 gap-4 mt-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-emerald-600">{stats.likelyReal}</div>
                <div className="text-xs text-slate-600">Real</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-amber-600">{stats.likelyAI}</div>
                <div className="text-xs text-slate-600">AI/Deepfake</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-slate-600">{stats.uncertain}</div>
                <div className="text-xs text-slate-600">Uncertain</div>
              </div>
            </div>
          </div>

          {/* Content Type Breakdown */}
          <div className="bg-white rounded-2xl border-2 border-slate-200 p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Results by Content Type</h3>
            <div className="space-y-6">
              {/* Images */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <FileImage className="w-5 h-5 text-blue-600" />
                    <span className="font-semibold text-slate-900">Images</span>
                  </div>
                  <span className="text-sm text-slate-600">{stats.imageStats.total} total</span>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-emerald-700">Real</span>
                    <span className="font-bold">{stats.imageStats.real} ({((stats.imageStats.real/stats.imageStats.total)*100).toFixed(1)}%)</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500" style={{ width: `${(stats.imageStats.real/stats.imageStats.total)*100}%` }} />
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-amber-700">AI</span>
                    <span className="font-bold">{stats.imageStats.ai} ({((stats.imageStats.ai/stats.imageStats.total)*100).toFixed(1)}%)</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-amber-500" style={{ width: `${(stats.imageStats.ai/stats.imageStats.total)*100}%` }} />
                  </div>
                </div>
              </div>

              {/* Videos */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Video className="w-5 h-5 text-purple-600" />
                    <span className="font-semibold text-slate-900">Videos</span>
                  </div>
                  <span className="text-sm text-slate-600">{stats.videoStats.total} total</span>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-emerald-700">Real</span>
                    <span className="font-bold">{stats.videoStats.real} ({stats.videoStats.total > 0 ? ((stats.videoStats.real/stats.videoStats.total)*100).toFixed(1) : 0}%)</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500" style={{ width: stats.videoStats.total > 0 ? `${(stats.videoStats.real/stats.videoStats.total)*100}%` : '0%' }} />
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-amber-700">AI/Deepfake</span>
                    <span className="font-bold">{stats.videoStats.ai} ({stats.videoStats.total > 0 ? ((stats.videoStats.ai/stats.videoStats.total)*100).toFixed(1) : 0}%)</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-amber-500" style={{ width: stats.videoStats.total > 0 ? `${(stats.videoStats.ai/stats.videoStats.total)*100}%` : '0%' }} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Charts Row 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Detection Trends Over Time */}
          <div className="bg-white rounded-2xl border-2 border-slate-200 p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Detection Trends (14 Days)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={stats.timeSeriesData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="date" stroke="#64748b" style={{ fontSize: 12 }} />
                <YAxis stroke="#64748b" style={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="real" stroke="#10b981" strokeWidth={2} name="Real" />
                <Line type="monotone" dataKey="ai" stroke="#f59e0b" strokeWidth={2} name="AI" />
                <Line type="monotone" dataKey="deepfake" stroke="#ef4444" strokeWidth={2} name="Deepfake" />
                <Line type="monotone" dataKey="uncertain" stroke="#64748b" strokeWidth={2} name="Uncertain" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Top AI Artifacts */}
          <div className="bg-white rounded-2xl border-2 border-slate-200 p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Most Detected Artifacts</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stats.topArtifacts} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis type="number" stroke="#64748b" style={{ fontSize: 12 }} />
                <YAxis dataKey="name" type="category" stroke="#64748b" style={{ fontSize: 11 }} width={120} />
                <Tooltip />
                <Bar dataKey="count" fill="#6366f1" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-2xl border-2 border-indigo-200 p-8">
          <h3 className="text-xl font-bold text-slate-900 mb-6">📊 Key Insights</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <div className="text-sm text-slate-600 mb-1">Detection Rate</div>
              <div className="text-2xl font-bold text-indigo-900">
                {((stats.likelyReal + stats.likelyAI) / stats.total * 100).toFixed(1)}%
              </div>
              <div className="text-xs text-slate-500 mt-1">Decisive classifications</div>
            </div>
            <div>
              <div className="text-sm text-slate-600 mb-1">AI Content Ratio</div>
              <div className="text-2xl font-bold text-indigo-900">
                {(stats.likelyAI / stats.total * 100).toFixed(1)}%
              </div>
              <div className="text-xs text-slate-500 mt-1">Of all analyzed content</div>
            </div>
            <div>
              <div className="text-sm text-slate-600 mb-1">Uncertainty Rate</div>
              <div className="text-2xl font-bold text-indigo-900">
                {(stats.uncertain / stats.total * 100).toFixed(1)}%
              </div>
              <div className="text-xs text-slate-500 mt-1">Requires human review</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}