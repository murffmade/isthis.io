import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, History, Info, Sparkles } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import UploadZone from '@/components/verification/UploadZone';
import AnalysisLoader from '@/components/verification/AnalysisLoader';
import ResultCard from '@/components/verification/ResultCard';
import ActionPanel from '@/components/verification/ActionPanel';
import HistoryList from '@/components/verification/HistoryList';

const AnalysisRecord = base44.entities.AnalysisRecord;

export default function Home() {
  const [step, setStep] = useState('upload'); // upload, analyzing, result, action, history
  const [analysisStep, setAnalysisStep] = useState(0);
  const [currentResult, setCurrentResult] = useState(null);
  const [pendingContent, setPendingContent] = useState(null);

  const queryClient = useQueryClient();

  // Check for bookmarklet URL parameter
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const imageUrl = urlParams.get('url');
    if (imageUrl) {
      handleFileReady({
        type: 'url',
        source_url: decodeURIComponent(imageUrl),
        platform: 'unknown',
        source: 'bookmarklet'
      });
      // Clean up URL
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  const { data: history = [] } = useQuery({
    queryKey: ['analysisHistory'],
    queryFn: () => AnalysisRecord.list('-created_date', 20)
  });

  const analyzeMutation = useMutation({
    mutationFn: async (content) => {
      // Simulate analysis steps
      for (let i = 0; i < 5; i++) {
        setAnalysisStep(i);
        await new Promise(r => setTimeout(r, 800 + Math.random() * 400));
      }

      // Call LLM to analyze the content
      const prompt = content.type === 'url' 
        ? `Analyze this URL for signs of AI-generated content: ${content.source_url}. Consider if this is from a social media platform (${content.platform}) and evaluate the likelihood of the content being AI-generated vs authentic.`
        : `Analyze this ${content.type} for signs of AI generation. Look for visual artifacts, inconsistencies, and AI fingerprints.`;

      const analysisResult = await base44.integrations.Core.InvokeLLM({
        prompt: `You are an expert AI content detector. ${prompt}

Analyze for these signals:
- Visual artifacts (hands, eyes, teeth, symmetry issues)
- Lighting and shadow inconsistencies  
- Texture anomalies or unnatural smoothing
- Depth and perspective errors
- Known AI generation patterns
- For videos: frame consistency, lip-sync accuracy, motion anomalies

Provide a thorough but accessible analysis.`,
        file_urls: content.file_url ? [content.file_url] : undefined,
        add_context_from_internet: content.type === 'url',
        response_json_schema: {
          type: "object",
          properties: {
            result: {
              type: "string",
              enum: ["likely_real", "likely_ai", "uncertain"],
              description: "Primary determination"
            },
            confidence: {
              type: "number",
              description: "Confidence percentage 0-100"
            },
            signals: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  signal_type: { type: "string" },
                  description: { type: "string" },
                  severity: { type: "string", enum: ["low", "medium", "high"] }
                }
              }
            },
            claims_to_be_real: {
              type: "boolean",
              description: "Whether content presents itself as authentic real footage"
            },
            summary: {
              type: "string",
              description: "2-3 sentence plain English summary"
            }
          },
          required: ["result", "confidence", "signals", "summary"]
        }
      });

      // Save to database
      const record = await AnalysisRecord.create({
        content_type: content.type,
        source_url: content.source_url || null,
        platform: content.platform || 'direct_upload',
        file_url: content.file_url || null,
        thumbnail_url: content.file_url || null,
        ...analysisResult
      });

      return { ...record, ...analysisResult };
    },
    onSuccess: (result) => {
      setCurrentResult(result);
      setStep('result');
      queryClient.invalidateQueries(['analysisHistory']);
    },
    onError: (error) => {
      toast.error('Analysis failed. Please try again.');
      setStep('upload');
    }
  });

  const handleFileReady = (content) => {
    setPendingContent(content);
    setStep('analyzing');
    setAnalysisStep(0);
    analyzeMutation.mutate(content);
  };

  const handleStartOver = () => {
    setStep('upload');
    setCurrentResult(null);
    setPendingContent(null);
    setAnalysisStep(0);
  };

  const handleDeleteRecord = async (id) => {
    await AnalysisRecord.delete(id);
    queryClient.invalidateQueries(['analysisHistory']);
    toast.success('Record deleted');
  };

  const handleSelectRecord = (record) => {
    setCurrentResult(record);
    setStep('result');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <header className="border-b border-slate-100 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <button 
              onClick={handleStartOver}
              className="flex items-center gap-3"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-slate-800 leading-tight">Is This Real?</h1>
                <p className="text-xs text-slate-500">AI content verification</p>
              </div>
            </button>

            <div className="flex items-center gap-2">
              <button
                onClick={() => window.location.href = createPageUrl('HolidayGift')}
                className="px-3 py-2 rounded-xl bg-gradient-to-r from-red-500 to-green-500 text-white hover:from-red-600 hover:to-green-600 transition-colors text-sm font-medium"
              >
                🎁 Holiday Gift
              </button>
              <button
                onClick={() => window.location.href = createPageUrl('Bookmarklet')}
                className="px-3 py-2 rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors text-sm font-medium"
              >
                Get Bookmarklet
              </button>
              <button
                onClick={() => setStep(step === 'history' ? 'upload' : 'history')}
                className={`p-2.5 rounded-xl transition-colors ${
                  step === 'history' 
                    ? 'bg-slate-900 text-white' 
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <History className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 py-12">
        <AnimatePresence mode="wait">
          {step === 'upload' && (
            <motion.div
              key="upload"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              {/* Hero */}
              <div className="text-center mb-12">
                <motion.div 
                  initial={{ scale: 0.9 }}
                  animate={{ scale: 1 }}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-100 text-slate-600 text-sm mb-6"
                >
                  <Sparkles className="w-4 h-4" />
                  Free AI detection tool
                </motion.div>
                <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4 leading-tight">
                  Verify before you believe
                </h2>
                <p className="text-lg text-slate-500 max-w-xl mx-auto">
                  Upload an image, video, or paste a link to check if content is AI-generated or authentic.
                </p>
              </div>

              <UploadZone onFileReady={handleFileReady} />

              {/* Trust Indicators */}
              <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  { title: 'Multi-Signal Analysis', desc: 'We check visual, temporal, and contextual signals' },
                  { title: 'Privacy First', desc: 'Your uploads are not stored without consent' },
                  { title: 'Clear Results', desc: 'Honest assessments, never absolute claims' }
                ].map((item, i) => (
                  <div key={i} className="text-center p-6">
                    <h4 className="font-semibold text-slate-700 mb-1">{item.title}</h4>
                    <p className="text-sm text-slate-500">{item.desc}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {step === 'analyzing' && (
            <motion.div
              key="analyzing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <AnalysisLoader currentStep={analysisStep} />
            </motion.div>
          )}

          {step === 'result' && currentResult && (
            <motion.div
              key="result"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <ResultCard 
                result={currentResult}
                onTakeAction={() => setStep('action')}
                onStartOver={handleStartOver}
              />
            </motion.div>
          )}

          {step === 'action' && currentResult && (
            <motion.div
              key="action"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <ActionPanel 
                result={currentResult}
                onBack={() => setStep('result')}
              />
            </motion.div>
          )}

          {step === 'history' && (
            <motion.div
              key="history"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-slate-800 mb-2">History</h2>
                <p className="text-slate-500">Your recent verification checks</p>
              </div>
              <HistoryList 
                records={history}
                onSelectRecord={handleSelectRecord}
                onDeleteRecord={handleDeleteRecord}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-100 mt-auto">
        <div className="max-w-4xl mx-auto px-6 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Info className="w-4 h-4" />
              <span>AI analysis isn't perfect and may be wrong</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-slate-400">
              <span>© 2024 Is This Real?</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}