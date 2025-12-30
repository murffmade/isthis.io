import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, TrendingUp, AlertTriangle, Sparkles, ChevronDown, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function AIInsights({ content, analysisData }) {
  const [loading, setLoading] = useState(false);
  const [biasAnalysis, setBiasAnalysis] = useState(null);
  const [sentimentAnalysis, setSentimentAnalysis] = useState(null);
  const [summary, setSummary] = useState(null);
  const [expandedSections, setExpandedSections] = useState({
    bias: false,
    sentiment: false,
    summary: false
  });

  const analyzeBias = async () => {
    if (biasAnalysis) {
      setExpandedSections(prev => ({ ...prev, bias: !prev.bias }));
      return;
    }
    
    setLoading(true);
    try {
      const { data } = await base44.functions.invoke('analyzeBias', { content });
      if (data.success) {
        setBiasAnalysis(data.analysis);
        setExpandedSections(prev => ({ ...prev, bias: true }));
        toast.success('Bias analysis complete');
      }
    } catch (error) {
      toast.error('Failed to analyze bias');
    } finally {
      setLoading(false);
    }
  };

  const analyzeSentiment = async () => {
    if (sentimentAnalysis) {
      setExpandedSections(prev => ({ ...prev, sentiment: !prev.sentiment }));
      return;
    }
    
    setLoading(true);
    try {
      const { data } = await base44.functions.invoke('analyzeSentiment', { content });
      if (data.success) {
        setSentimentAnalysis(data.analysis);
        setExpandedSections(prev => ({ ...prev, sentiment: true }));
        toast.success('Sentiment analysis complete');
      }
    } catch (error) {
      toast.error('Failed to analyze sentiment');
    } finally {
      setLoading(false);
    }
  };

  const generateSummary = async () => {
    if (summary) {
      setExpandedSections(prev => ({ ...prev, summary: !prev.summary }));
      return;
    }
    
    setLoading(true);
    try {
      const { data } = await base44.functions.invoke('summarizeAnalysis', { analysisData });
      if (data.success) {
        setSummary(data.summary);
        setExpandedSections(prev => ({ ...prev, summary: true }));
        toast.success('Summary generated');
      }
    } catch (error) {
      toast.error('Failed to generate summary');
    } finally {
      setLoading(false);
    }
  };

  const getBiasColor = (level) => {
    switch (level) {
      case 'low': return 'text-emerald-600 bg-emerald-50';
      case 'moderate': return 'text-amber-600 bg-amber-50';
      case 'high': return 'text-red-600 bg-red-50';
      default: return 'text-slate-600 bg-slate-50';
    }
  };

  const getSentimentColor = (sentiment) => {
    switch (sentiment) {
      case 'positive': return 'text-emerald-600 bg-emerald-50';
      case 'negative': return 'text-red-600 bg-red-50';
      case 'neutral': return 'text-slate-600 bg-slate-50';
      case 'mixed': return 'text-purple-600 bg-purple-50';
      default: return 'text-slate-600 bg-slate-50';
    }
  };

  const getRiskColor = (risk) => {
    switch (risk) {
      case 'critical': return 'text-red-700 bg-red-100 border-red-200';
      case 'high': return 'text-orange-700 bg-orange-100 border-orange-200';
      case 'medium': return 'text-amber-700 bg-amber-100 border-amber-200';
      case 'low': return 'text-emerald-700 bg-emerald-100 border-emerald-200';
      default: return 'text-slate-700 bg-slate-100 border-slate-200';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="w-5 h-5 text-purple-600" />
        <h3 className="text-lg font-semibold text-slate-900">AI-Powered Insights</h3>
      </div>

      {/* Bias Analysis */}
      <motion.div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <button
          onClick={analyzeBias}
          disabled={loading}
          className="w-full px-6 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <Brain className="w-5 h-5 text-blue-600" />
            <div className="text-left">
              <div className="font-semibold text-slate-900">Bias Detection</div>
              <div className="text-sm text-slate-500">Identify political, cultural, and emotional biases</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {loading && !biasAnalysis ? (
              <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
            ) : (
              <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform ${expandedSections.bias ? 'rotate-180' : ''}`} />
            )}
          </div>
        </button>

        <AnimatePresence>
          {expandedSections.bias && biasAnalysis && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="border-t border-slate-200"
            >
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">Overall Bias Score</span>
                  <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getBiasColor(biasAnalysis.bias_level)}`}>
                    {biasAnalysis.bias_level} ({biasAnalysis.overall_score}/100)
                  </span>
                </div>

                {biasAnalysis.detected_biases?.length > 0 && (
                  <div className="space-y-3">
                    <div className="font-medium text-slate-900">Detected Biases:</div>
                    {biasAnalysis.detected_biases.map((bias, i) => (
                      <div key={i} className="bg-slate-50 rounded-lg p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div className="font-medium text-slate-900">{bias.type}</div>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${getBiasColor(bias.severity)}`}>
                            {bias.severity}
                          </span>
                        </div>
                        <div className="text-sm text-slate-600 mb-2">{bias.explanation}</div>
                        <div className="text-xs text-slate-500 bg-white rounded p-2 border border-slate-200">
                          <span className="font-medium">Example:</span> {bias.example}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {biasAnalysis.recommendations?.length > 0 && (
                  <div className="space-y-2">
                    <div className="font-medium text-slate-900">Recommendations:</div>
                    <ul className="space-y-1">
                      {biasAnalysis.recommendations.map((rec, i) => (
                        <li key={i} className="text-sm text-slate-600 flex items-start gap-2">
                          <span className="text-blue-600 mt-1">•</span>
                          {rec}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Sentiment & Sarcasm Analysis */}
      <motion.div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <button
          onClick={analyzeSentiment}
          disabled={loading}
          className="w-full px-6 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <TrendingUp className="w-5 h-5 text-purple-600" />
            <div className="text-left">
              <div className="font-semibold text-slate-900">Advanced Sentiment Analysis</div>
              <div className="text-sm text-slate-500">Detect sarcasm, irony, and nuanced emotions</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {loading && !sentimentAnalysis ? (
              <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
            ) : (
              <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform ${expandedSections.sentiment ? 'rotate-180' : ''}`} />
            )}
          </div>
        </button>

        <AnimatePresence>
          {expandedSections.sentiment && sentimentAnalysis && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="border-t border-slate-200"
            >
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">Primary Sentiment</span>
                  <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getSentimentColor(sentimentAnalysis.primary_sentiment)}`}>
                    {sentimentAnalysis.primary_sentiment} ({Math.round(sentimentAnalysis.sentiment_score * 100)}%)
                  </span>
                </div>

                {sentimentAnalysis.sarcasm_detected && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="w-4 h-4 text-amber-600" />
                      <span className="font-semibold text-amber-900">Sarcasm Detected</span>
                      <span className="ml-auto text-sm text-amber-700">
                        {Math.round(sentimentAnalysis.sarcasm_confidence * 100)}% confidence
                      </span>
                    </div>
                    {sentimentAnalysis.sarcasm_indicators?.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {sentimentAnalysis.sarcasm_indicators.map((indicator, i) => (
                          <div key={i} className="text-sm text-amber-700">• {indicator}</div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {sentimentAnalysis.emotional_tones?.length > 0 && (
                  <div className="space-y-2">
                    <div className="font-medium text-slate-900">Emotional Tones:</div>
                    {sentimentAnalysis.emotional_tones.map((tone, i) => (
                      <div key={i} className="bg-slate-50 rounded-lg p-3">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium text-slate-900 capitalize">{tone.emotion}</span>
                          <span className="text-sm text-slate-600">{tone.intensity}</span>
                        </div>
                        <div className="text-sm text-slate-600">{tone.evidence}</div>
                      </div>
                    ))}
                  </div>
                )}

                {sentimentAnalysis.subtext && (
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                    <div className="font-medium text-purple-900 mb-2">Subtext Analysis:</div>
                    <div className="text-sm text-purple-700">{sentimentAnalysis.subtext}</div>
                  </div>
                )}

                {sentimentAnalysis.overall_analysis && (
                  <div className="text-sm text-slate-600 bg-slate-50 rounded-lg p-4">
                    {sentimentAnalysis.overall_analysis}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Analysis Summary */}
      <motion.div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <button
          onClick={generateSummary}
          disabled={loading}
          className="w-full px-6 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <Sparkles className="w-5 h-5 text-emerald-600" />
            <div className="text-left">
              <div className="font-semibold text-slate-900">Executive Summary</div>
              <div className="text-sm text-slate-500">Key findings and recommended actions</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {loading && !summary ? (
              <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
            ) : (
              <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform ${expandedSections.summary ? 'rotate-180' : ''}`} />
            )}
          </div>
        </button>

        <AnimatePresence>
          {expandedSections.summary && summary && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="border-t border-slate-200"
            >
              <div className="p-6 space-y-4">
                <div className="bg-slate-50 rounded-lg p-4">
                  <div className="font-medium text-slate-900 mb-2">Executive Summary</div>
                  <div className="text-sm text-slate-600 leading-relaxed">{summary.executive_summary}</div>
                </div>

                <div className={`rounded-lg p-4 border-2 ${getRiskColor(summary.risk_assessment?.overall_risk)}`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold">Risk Assessment</span>
                    <span className="text-sm font-bold uppercase">{summary.risk_assessment?.overall_risk}</span>
                  </div>
                  {summary.risk_assessment?.specific_risks?.length > 0 && (
                    <ul className="space-y-1 mt-2">
                      {summary.risk_assessment.specific_risks.map((risk, i) => (
                        <li key={i} className="text-sm flex items-start gap-2">
                          <AlertTriangle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                          {risk}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {summary.key_findings?.length > 0 && (
                  <div className="space-y-2">
                    <div className="font-medium text-slate-900">Key Findings:</div>
                    {summary.key_findings.map((finding, i) => (
                      <div key={i} className={`rounded-lg p-3 border ${getRiskColor(finding.importance)}`}>
                        <div className="font-medium mb-1">{finding.finding}</div>
                        <div className="text-sm opacity-90">{finding.details}</div>
                      </div>
                    ))}
                  </div>
                )}

                {summary.red_flags?.length > 0 && (
                  <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4">
                    <div className="font-semibold text-red-900 mb-2 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4" />
                      Red Flags
                    </div>
                    <ul className="space-y-1">
                      {summary.red_flags.map((flag, i) => (
                        <li key={i} className="text-sm text-red-700">• {flag}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {summary.recommended_actions?.length > 0 && (
                  <div className="space-y-2">
                    <div className="font-medium text-slate-900">Recommended Actions:</div>
                    <ul className="space-y-2">
                      {summary.recommended_actions.map((action, i) => (
                        <li key={i} className="text-sm text-slate-600 bg-blue-50 rounded-lg p-3 border border-blue-200">
                          {action}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}