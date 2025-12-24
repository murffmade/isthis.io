import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Activity, TrendingDown, TrendingUp, AlertTriangle, CheckCircle2, Brain, Target, AlertCircle, RefreshCw } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function ModelPerformance() {
  const [user, setUser] = useState(null);
  const [calculating, setCalculating] = useState(false);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => setUser(null));
  }, []);

  const { data: metrics, isLoading, refetch } = useQuery({
    queryKey: ['modelPerformanceMetrics'],
    queryFn: () => base44.entities.ModelPerformanceMetric.list('-metric_date', 30),
    initialData: []
  });

  const { data: trainingFeedback } = useQuery({
    queryKey: ['allTrainingFeedback'],
    queryFn: () => base44.entities.TrainingFeedback.list('-created_date', 1000),
    initialData: []
  });

  const calculateMetrics = async () => {
    setCalculating(true);
    try {
      // Calculate metrics from training feedback
      const today = new Date().toISOString().split('T')[0];
      
      // Filter feedback from last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const recentFeedback = trainingFeedback.filter(fb => 
        new Date(fb.created_date) >= thirtyDaysAgo
      );

      if (recentFeedback.length === 0) {
        toast.error('No training feedback available to calculate metrics');
        setCalculating(false);
        return;
      }

      // Calculate overall accuracy
      const correctPredictions = recentFeedback.filter(fb => fb.confidence_match).length;
      const totalPredictions = recentFeedback.length;
      const accuracyPercentage = (correctPredictions / totalPredictions) * 100;

      // Calculate false positive rate (real flagged as AI)
      const realContent = recentFeedback.filter(fb => fb.actual_label === 'real');
      const falsePositives = realContent.filter(fb => 
        fb.ai_prediction === 'likely_ai' || fb.ai_prediction === 'likely_deepfake'
      ).length;
      const falsePositiveRate = realContent.length > 0 ? (falsePositives / realContent.length) * 100 : 0;

      // Calculate false negative rate (AI flagged as real)
      const aiContent = recentFeedback.filter(fb => fb.actual_label === 'ai_generated');
      const falseNegatives = aiContent.filter(fb => fb.ai_prediction === 'likely_real').length;
      const falseNegativeRate = aiContent.length > 0 ? (falseNegatives / aiContent.length) * 100 : 0;

      // Accuracy by content type
      const imageAccuracy = calculateTypeAccuracy(recentFeedback.filter(fb => fb.content_type === 'image'));
      const videoAccuracy = calculateTypeAccuracy(recentFeedback.filter(fb => fb.content_type === 'video'));
      const urlAccuracy = calculateTypeAccuracy(recentFeedback.filter(fb => fb.content_type === 'url'));

      // Find challenging artifacts
      const artifactMisdetections = {};
      recentFeedback.forEach(fb => {
        if (!fb.confidence_match && fb.observed_artifacts) {
          fb.observed_artifacts.forEach(artifact => {
            artifactMisdetections[artifact] = (artifactMisdetections[artifact] || 0) + 1;
          });
        }
      });

      const challengingArtifacts = Object.entries(artifactMisdetections)
        .map(([artifact, count]) => ({
          artifact_type: artifact,
          misdetection_count: count,
          severity: count > 5 ? 'high' : count > 2 ? 'medium' : 'low'
        }))
        .sort((a, b) => b.misdetection_count - a.misdetection_count)
        .slice(0, 10);

      // Calculate drift score (compare to baseline accuracy of 85%)
      const baselineAccuracy = 85;
      const driftScore = Math.max(0, baselineAccuracy - accuracyPercentage) * 2;

      // Confidence calibration
      const lowConfFeedback = recentFeedback.filter(fb => 
        fb.ai_prediction === 'uncertain' || fb.ai_prediction?.includes('uncertain')
      );
      const medConfFeedback = recentFeedback.filter(fb => 
        fb.confidence_match === true && !fb.ai_prediction?.includes('uncertain')
      );
      
      const lowConfAccuracy = lowConfFeedback.length > 0 
        ? (lowConfFeedback.filter(fb => fb.confidence_match).length / lowConfFeedback.length) * 100 
        : 0;
      const medConfAccuracy = medConfFeedback.length > 0
        ? (medConfFeedback.filter(fb => fb.confidence_match).length / medConfFeedback.length) * 100
        : 0;
      const highConfAccuracy = accuracyPercentage;

      // Determine if retraining is needed
      const requiresRetraining = 
        accuracyPercentage < 80 || 
        driftScore > 20 || 
        falsePositiveRate > 15 || 
        falseNegativeRate > 15;

      let retrainingReason = null;
      if (requiresRetraining) {
        const reasons = [];
        if (accuracyPercentage < 80) reasons.push(`Low accuracy: ${accuracyPercentage.toFixed(1)}%`);
        if (driftScore > 20) reasons.push(`High drift score: ${driftScore.toFixed(1)}`);
        if (falsePositiveRate > 15) reasons.push(`High false positive rate: ${falsePositiveRate.toFixed(1)}%`);
        if (falseNegativeRate > 15) reasons.push(`High false negative rate: ${falseNegativeRate.toFixed(1)}%`);
        retrainingReason = reasons.join('; ');
      }

      // Create new metric record
      await base44.entities.ModelPerformanceMetric.create({
        metric_date: today,
        total_predictions: totalPredictions,
        correct_predictions: correctPredictions,
        accuracy_percentage: parseFloat(accuracyPercentage.toFixed(2)),
        false_positive_rate: parseFloat(falsePositiveRate.toFixed(2)),
        false_negative_rate: parseFloat(falseNegativeRate.toFixed(2)),
        accuracy_by_content_type: {
          image: imageAccuracy,
          video: videoAccuracy,
          url: urlAccuracy
        },
        challenging_artifacts: challengingArtifacts,
        drift_score: parseFloat(driftScore.toFixed(2)),
        confidence_calibration: {
          low_confidence_accuracy: parseFloat(lowConfAccuracy.toFixed(2)),
          medium_confidence_accuracy: parseFloat(medConfAccuracy.toFixed(2)),
          high_confidence_accuracy: parseFloat(highConfAccuracy.toFixed(2))
        },
        requires_retraining: requiresRetraining,
        retraining_reason: retrainingReason,
        sample_size: totalPredictions
      });

      toast.success('Model performance metrics calculated successfully');
      refetch();
    } catch (error) {
      console.error('Metrics calculation error:', error);
      toast.error('Failed to calculate metrics');
    } finally {
      setCalculating(false);
    }
  };

  const calculateTypeAccuracy = (feedback) => {
    if (feedback.length === 0) return 0;
    const correct = feedback.filter(fb => fb.confidence_match).length;
    return parseFloat(((correct / feedback.length) * 100).toFixed(2));
  };

  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl border-2 border-slate-200 p-8 text-center max-w-md">
          <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-900 mb-2">Admin Access Required</h2>
          <p className="text-slate-600">You need admin privileges to view model performance metrics.</p>
        </div>
      </div>
    );
  }

  const latestMetric = metrics[0];
  const chartData = metrics.slice(0, 14).reverse().map(m => ({
    date: new Date(m.metric_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    accuracy: m.accuracy_percentage,
    drift: m.drift_score,
    falsePositive: m.false_positive_rate,
    falseNegative: m.false_negative_rate
  }));

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
              <Brain className="w-8 h-8 text-indigo-600" />
              Model Performance Monitoring
            </h1>
            <Button
              onClick={calculateMetrics}
              disabled={calculating || trainingFeedback.length === 0}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              {calculating ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Calculating...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Recalculate Metrics
                </>
              )}
            </Button>
          </div>
          <p className="text-slate-600">
            Track AI detection accuracy, identify drift, and guide model improvements
          </p>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-slate-600">Loading metrics...</p>
          </div>
        ) : metrics.length === 0 ? (
          <div className="bg-white rounded-2xl border-2 border-slate-200 p-12 text-center">
            <Activity className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-slate-900 mb-2">No Metrics Yet</h3>
            <p className="text-slate-600 mb-6">
              Calculate your first model performance snapshot based on trainer feedback
            </p>
            <Button
              onClick={calculateMetrics}
              disabled={calculating || trainingFeedback.length === 0}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              {trainingFeedback.length === 0 ? 'No Training Data Available' : 'Calculate First Metrics'}
            </Button>
          </div>
        ) : (
          <>
            {/* Alert Banner */}
            {latestMetric?.requires_retraining && (
              <div className="bg-gradient-to-r from-red-50 to-orange-50 border-2 border-red-200 rounded-2xl p-6 mb-8">
                <div className="flex items-start gap-4">
                  <AlertCircle className="w-8 h-8 text-red-600 flex-shrink-0 mt-1" />
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-red-900 mb-2">⚠️ Retraining Recommended</h3>
                    <p className="text-red-700 mb-3">{latestMetric.retraining_reason}</p>
                    <p className="text-sm text-red-600">
                      The model is showing signs of degradation. Consider initiating a retraining cycle.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Key Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-2xl border-2 border-slate-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <Target className="w-8 h-8 text-emerald-600" />
                  {latestMetric.accuracy_percentage >= 85 ? (
                    <TrendingUp className="w-5 h-5 text-emerald-600" />
                  ) : (
                    <TrendingDown className="w-5 h-5 text-red-600" />
                  )}
                </div>
                <div className="text-3xl font-bold text-slate-900 mb-1">
                  {latestMetric.accuracy_percentage.toFixed(1)}%
                </div>
                <div className="text-sm text-slate-600">Overall Accuracy</div>
                <div className="text-xs text-slate-500 mt-2">
                  {latestMetric.correct_predictions} / {latestMetric.total_predictions} predictions
                </div>
              </div>

              <div className="bg-white rounded-2xl border-2 border-slate-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <Activity className="w-8 h-8 text-blue-600" />
                </div>
                <div className="text-3xl font-bold text-slate-900 mb-1">
                  {latestMetric.drift_score.toFixed(1)}
                </div>
                <div className="text-sm text-slate-600">Drift Score</div>
                <div className="text-xs text-slate-500 mt-2">
                  {latestMetric.drift_score < 10 ? 'Low drift' : latestMetric.drift_score < 20 ? 'Moderate drift' : 'High drift'}
                </div>
              </div>

              <div className="bg-white rounded-2xl border-2 border-slate-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <AlertTriangle className="w-8 h-8 text-amber-600" />
                </div>
                <div className="text-3xl font-bold text-slate-900 mb-1">
                  {latestMetric.false_positive_rate.toFixed(1)}%
                </div>
                <div className="text-sm text-slate-600">False Positive Rate</div>
                <div className="text-xs text-slate-500 mt-2">Real flagged as AI</div>
              </div>

              <div className="bg-white rounded-2xl border-2 border-slate-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <AlertTriangle className="w-8 h-8 text-red-600" />
                </div>
                <div className="text-3xl font-bold text-slate-900 mb-1">
                  {latestMetric.false_negative_rate.toFixed(1)}%
                </div>
                <div className="text-sm text-slate-600">False Negative Rate</div>
                <div className="text-xs text-slate-500 mt-2">AI flagged as real</div>
              </div>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* Accuracy Trend */}
              <div className="bg-white rounded-2xl border-2 border-slate-200 p-6">
                <h3 className="text-lg font-bold text-slate-900 mb-4">Accuracy Trend (14 Days)</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="date" stroke="#64748b" style={{ fontSize: 12 }} />
                    <YAxis stroke="#64748b" style={{ fontSize: 12 }} domain={[0, 100]} />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="accuracy" stroke="#10b981" strokeWidth={3} name="Accuracy %" />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Error Rates */}
              <div className="bg-white rounded-2xl border-2 border-slate-200 p-6">
                <h3 className="text-lg font-bold text-slate-900 mb-4">Error Rates Trend</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="date" stroke="#64748b" style={{ fontSize: 12 }} />
                    <YAxis stroke="#64748b" style={{ fontSize: 12 }} domain={[0, 30]} />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="falsePositive" stroke="#f59e0b" strokeWidth={2} name="False Positive %" />
                    <Line type="monotone" dataKey="falseNegative" stroke="#ef4444" strokeWidth={2} name="False Negative %" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Content Type Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <div className="bg-white rounded-2xl border-2 border-slate-200 p-6">
                <h3 className="text-lg font-bold text-slate-900 mb-4">Accuracy by Content Type</h3>
                <div className="space-y-4">
                  {Object.entries(latestMetric.accuracy_by_content_type || {}).map(([type, accuracy]) => (
                    <div key={type}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-slate-700 capitalize">{type}</span>
                        <span className="text-sm font-bold text-slate-900">{accuracy.toFixed(1)}%</span>
                      </div>
                      <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            accuracy >= 85 ? 'bg-emerald-500' : accuracy >= 75 ? 'bg-amber-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${accuracy}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-2xl border-2 border-slate-200 p-6">
                <h3 className="text-lg font-bold text-slate-900 mb-4">Confidence Calibration</h3>
                <div className="space-y-4">
                  {latestMetric.confidence_calibration && (
                    <>
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-slate-700">Low Confidence</span>
                          <span className="text-sm font-bold text-slate-900">
                            {latestMetric.confidence_calibration.low_confidence_accuracy.toFixed(1)}%
                          </span>
                        </div>
                        <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-slate-400 rounded-full"
                            style={{ width: `${latestMetric.confidence_calibration.low_confidence_accuracy}%` }}
                          />
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-slate-700">Medium Confidence</span>
                          <span className="text-sm font-bold text-slate-900">
                            {latestMetric.confidence_calibration.medium_confidence_accuracy.toFixed(1)}%
                          </span>
                        </div>
                        <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-500 rounded-full"
                            style={{ width: `${latestMetric.confidence_calibration.medium_confidence_accuracy}%` }}
                          />
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-slate-700">High Confidence</span>
                          <span className="text-sm font-bold text-slate-900">
                            {latestMetric.confidence_calibration.high_confidence_accuracy.toFixed(1)}%
                          </span>
                        </div>
                        <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-emerald-500 rounded-full"
                            style={{ width: `${latestMetric.confidence_calibration.high_confidence_accuracy}%` }}
                          />
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Challenging Artifacts */}
            {latestMetric.challenging_artifacts && latestMetric.challenging_artifacts.length > 0 && (
              <div className="bg-white rounded-2xl border-2 border-slate-200 p-6">
                <h3 className="text-lg font-bold text-slate-900 mb-4">
                  🎯 Challenging Artifacts (Model Struggles)
                </h3>
                <p className="text-sm text-slate-600 mb-4">
                  These artifacts are frequently associated with misdetections. Focus training efforts here.
                </p>
                <div className="space-y-3">
                  {latestMetric.challenging_artifacts.map((artifact, idx) => (
                    <div
                      key={idx}
                      className={`p-4 rounded-xl border-2 ${
                        artifact.severity === 'high'
                          ? 'border-red-200 bg-red-50'
                          : artifact.severity === 'medium'
                          ? 'border-amber-200 bg-amber-50'
                          : 'border-slate-200 bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-bold ${
                              artifact.severity === 'high'
                                ? 'bg-red-600 text-white'
                                : artifact.severity === 'medium'
                                ? 'bg-amber-600 text-white'
                                : 'bg-slate-600 text-white'
                            }`}
                          >
                            {artifact.severity.toUpperCase()}
                          </span>
                          <span className="font-semibold text-slate-900 capitalize">
                            {artifact.artifact_type.replace(/_/g, ' ')}
                          </span>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-slate-900">
                            {artifact.misdetection_count}
                          </div>
                          <div className="text-xs text-slate-600">misdetections</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}