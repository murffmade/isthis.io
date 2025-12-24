import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation } from '@tanstack/react-query';
import { Search, TrendingUp, AlertCircle, CheckCircle2, Loader2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

export default function SEOScorer({ title, body, metadata }) {
  const [seoData, setSeoData] = useState(null);
  const [autoAnalyze, setAutoAnalyze] = useState(true);

  // Calculate basic SEO metrics
  const calculateBasicMetrics = () => {
    const plainText = body.replace(/<[^>]*>/g, ' ');
    const wordCount = plainText.split(/\s+/).filter(w => w.length > 0).length;
    const titleLength = title.length;
    
    return {
      wordCount,
      titleLength,
      hasTitle: titleLength > 0,
      titleOptimal: titleLength >= 50 && titleLength <= 70,
      wordCountOptimal: wordCount >= 300 && wordCount <= 2500
    };
  };

  // AI-powered SEO analysis
  const analyzeMutation = useMutation({
    mutationFn: async () => {
      const plainText = body.replace(/<[^>]*>/g, ' ');
      
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Analyze this article for SEO optimization:

TITLE: ${title || 'No title'}
TOPIC: ${metadata.topic || 'General'}
CONTENT: ${plainText.substring(0, 3000)}

Provide a comprehensive SEO analysis including:

1. Overall SEO Score (0-100)
2. Primary keyword suggestions (3-5 keywords)
3. Keyword density analysis
4. Readability score (Flesch reading ease equivalent, 0-100)
5. Meta description suggestion (150-160 characters, compelling)
6. Title optimization suggestions
7. Content structure analysis (headings, paragraphs)
8. Specific actionable improvements (5-7 items)

Consider:
- Target audience: ${metadata.audience_level}
- Content tone: ${metadata.tone}
- Search intent and user value
- Competitive keywords
- Natural language and readability`,
        response_json_schema: {
          type: "object",
          properties: {
            overall_score: { type: "number" },
            primary_keywords: {
              type: "array",
              items: { type: "string" }
            },
            keyword_analysis: {
              type: "object",
              properties: {
                density: { type: "string" },
                assessment: { type: "string" }
              }
            },
            readability_score: { type: "number" },
            readability_assessment: { type: "string" },
            meta_description: { type: "string" },
            title_suggestions: {
              type: "array",
              items: { type: "string" }
            },
            structure_analysis: { type: "string" },
            improvements: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  category: { type: "string" },
                  issue: { type: "string" },
                  fix: { type: "string" },
                  priority: { type: "string", enum: ["high", "medium", "low"] }
                }
              }
            }
          }
        }
      });

      return result;
    },
    onSuccess: (data) => {
      setSeoData(data);
    }
  });

  // Auto-analyze on content change
  useEffect(() => {
    if (autoAnalyze && title && body) {
      const timer = setTimeout(() => {
        analyzeMutation.mutate();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [title, body, autoAnalyze]);

  const basicMetrics = calculateBasicMetrics();

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-emerald-600';
    if (score >= 60) return 'text-amber-600';
    return 'text-red-600';
  };

  const getScoreBgColor = (score) => {
    if (score >= 80) return 'bg-emerald-600';
    if (score >= 60) return 'bg-amber-600';
    return 'bg-red-600';
  };

  const getPriorityColor = (priority) => {
    if (priority === 'high') return 'bg-red-100 text-red-700';
    if (priority === 'medium') return 'bg-amber-100 text-amber-700';
    return 'bg-slate-100 text-slate-700';
  };

  return (
    <div className="h-full flex flex-col p-6">
      <div className="mb-6">
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2 mb-2">
          <Search className="w-5 h-5 text-emerald-600" />
          SEO Analyzer
        </h2>
        <p className="text-sm text-slate-600">
          Optimize your content for search engines
        </p>
      </div>

      <div className="space-y-6 flex-1 overflow-y-auto">
        {/* Quick Stats */}
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <h3 className="font-semibold text-slate-900 mb-3">Quick Stats</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-600">Title Length:</span>
              <span className={basicMetrics.titleOptimal ? 'text-emerald-600 font-medium' : 'text-slate-900'}>
                {basicMetrics.titleLength} chars {basicMetrics.titleOptimal ? '✓' : ''}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Word Count:</span>
              <span className={basicMetrics.wordCountOptimal ? 'text-emerald-600 font-medium' : 'text-slate-900'}>
                {basicMetrics.wordCount} words {basicMetrics.wordCountOptimal ? '✓' : ''}
              </span>
            </div>
          </div>
        </div>

        {/* Analyze Button */}
        {!seoData && !analyzeMutation.isPending && (
          <Button
            onClick={() => analyzeMutation.mutate()}
            disabled={!title || !body}
            className="w-full bg-emerald-600 hover:bg-emerald-700"
          >
            <TrendingUp className="w-4 h-4 mr-2" />
            Run SEO Analysis
          </Button>
        )}

        {analyzeMutation.isPending && (
          <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
            <Loader2 className="w-8 h-8 text-slate-400 animate-spin mx-auto mb-3" />
            <p className="text-sm text-slate-600">Analyzing SEO...</p>
          </div>
        )}

        {/* SEO Score */}
        {seoData && (
          <>
            <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-xl border-2 border-emerald-200 p-6">
              <div className="text-center mb-4">
                <div className={`text-5xl font-bold ${getScoreColor(seoData.overall_score)} mb-2`}>
                  {seoData.overall_score}
                </div>
                <div className="text-sm text-slate-600">Overall SEO Score</div>
              </div>
              <Progress value={seoData.overall_score} className="h-3" />
              <div className="mt-3 flex items-center justify-center gap-2">
                <Button
                  onClick={() => analyzeMutation.mutate()}
                  size="sm"
                  variant="outline"
                >
                  <RefreshCw className="w-3 h-3 mr-1" />
                  Re-analyze
                </Button>
              </div>
            </div>

            {/* Readability */}
            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                📖 Readability
              </h3>
              <div className="mb-3">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-slate-600">Reading Ease</span>
                  <span className={`font-bold ${getScoreColor(seoData.readability_score)}`}>
                    {seoData.readability_score}/100
                  </span>
                </div>
                <Progress value={seoData.readability_score} className="h-2" />
              </div>
              <p className="text-sm text-slate-600">{seoData.readability_assessment}</p>
            </div>

            {/* Keywords */}
            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                🎯 Target Keywords
              </h3>
              <div className="flex flex-wrap gap-2 mb-3">
                {seoData.primary_keywords.map((keyword, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm font-medium"
                  >
                    {keyword}
                  </span>
                ))}
              </div>
              <div className="text-sm bg-slate-50 rounded-lg p-3">
                <div className="font-semibold text-slate-700 mb-1">Density Analysis:</div>
                <p className="text-slate-600">{seoData.keyword_analysis.assessment}</p>
              </div>
            </div>

            {/* Meta Description */}
            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                📝 Suggested Meta Description
              </h3>
              <div className="bg-slate-50 rounded-lg p-3 text-sm text-slate-700 leading-relaxed">
                {seoData.meta_description}
              </div>
              <div className="text-xs text-slate-500 mt-2">
                {seoData.meta_description.length} characters
              </div>
            </div>

            {/* Title Suggestions */}
            {seoData.title_suggestions && seoData.title_suggestions.length > 0 && (
              <div className="bg-white rounded-xl border border-slate-200 p-4">
                <h3 className="font-semibold text-slate-900 mb-3">💡 Title Alternatives</h3>
                <div className="space-y-2">
                  {seoData.title_suggestions.map((suggestion, idx) => (
                    <div key={idx} className="text-sm p-2 bg-slate-50 rounded-lg text-slate-700">
                      {suggestion}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Structure Analysis */}
            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <h3 className="font-semibold text-slate-900 mb-3">🏗️ Content Structure</h3>
              <p className="text-sm text-slate-600">{seoData.structure_analysis}</p>
            </div>

            {/* Improvements */}
            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Recommended Improvements
              </h3>
              <div className="space-y-3">
                {seoData.improvements.map((item, idx) => (
                  <div key={idx} className="border border-slate-200 rounded-lg p-3">
                    <div className="flex items-start gap-2 mb-2">
                      <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${getPriorityColor(item.priority)}`}>
                        {item.priority}
                      </span>
                      <div className="flex-1">
                        <div className="font-semibold text-slate-900 text-sm mb-1">
                          {item.category}
                        </div>
                        <div className="text-sm text-slate-600 mb-2">
                          <span className="font-medium">Issue:</span> {item.issue}
                        </div>
                        <div className="text-sm text-emerald-700 bg-emerald-50 rounded p-2">
                          <span className="font-medium">Fix:</span> {item.fix}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}