import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, ArrowLeft, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import UnifiedInput from '../components/shared/UnifiedInput';
import ResultsDisplay from '../components/shared/ResultsDisplay';

const Analysis = base44.entities.Analysis;

export default function ScamPage() {
  const [step, setStep] = useState('input');
  const [currentResult, setCurrentResult] = useState(null);
  const queryClient = useQueryClient();

  const analyzeMutation = useMutation({
    mutationFn: async (inputData) => {
      setStep('analyzing');

      let analysisPrompt = '';
      
      if (inputData.input_type === 'text') {
        analysisPrompt = `Analyze this message/listing for scam patterns: "${inputData.input_value}"`;
      } else if (inputData.input_type === 'url') {
        analysisPrompt = `Analyze this URL/listing for scam indicators: ${inputData.input_value}`;
      } else {
        analysisPrompt = `Analyze this screenshot/image for scam red flags`;
      }

      if (inputData.context) {
        analysisPrompt += `\n\nContext: ${inputData.context}`;
      }

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a scam detection expert. ${analysisPrompt}

Look for these scam signals:
- Payment method red flags (gift cards, crypto, wire transfer, prepaid cards)
- Urgency/pressure tactics ("Act now!", "Limited time", threats)
- Too-good-to-be-true offers
- Impersonation (fake support, fake officials, fake brands)
- Off-platform communication requests
- Grammar/spelling issues in "official" messages
- Suspicious links or domains
- Request for sensitive personal info
- Verification mismatches
- Emotional manipulation

Provide:
1. Overall scam likelihood (0-100, where 100 = definitely a scam)
2. Specific red flags found
3. Concrete next steps for the user
4. Information on how to report

Be clear and actionable.`,
        file_urls: inputData.input_type === 'image' || inputData.input_type === 'video' ? [inputData.input_value] : undefined,
        add_context_from_internet: inputData.input_type === 'url',
        response_json_schema: {
          type: "object",
          properties: {
            score: {
              type: "number",
              description: "Scam likelihood 0-100 (higher = more likely scam)"
            },
            score_label: {
              type: "string",
              enum: ["Appears Safe", "Suspicious", "High Scam Risk", "Definite Scam"],
              description: "Label for the score"
            },
            summary: {
              type: "string",
              description: "One sentence verdict"
            },
            signals: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  description: { type: "string" },
                  severity: { type: "string", enum: ["low", "medium", "high"] }
                }
              },
              description: "Scam red flags detected"
            },
            recommended_actions: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  action: { type: "string" },
                  description: { type: "string" }
                }
              },
              description: "What user should do next"
            },
            platform_detected: {
              type: "string",
              description: "Platform if identified (facebook, instagram, email, sms, etc)"
            },
            report_guidance: {
              type: "string",
              description: "How to report this scam"
            },
            method_explanation: {
              type: "string",
              description: "How the analysis was done"
            }
          },
          required: ["score", "summary", "signals", "recommended_actions"]
        }
      });

      // Save to database
      const record = await Analysis.create({
        mode: 'scam',
        input_type: inputData.input_type,
        input_value: inputData.input_value,
        context: inputData.context,
        file_url: inputData.input_type === 'image' || inputData.input_type === 'video' ? inputData.input_value : null,
        ...result
      });

      return { ...record, ...result };
    },
    onSuccess: (result) => {
      setCurrentResult(result);
      setStep('result');
      queryClient.invalidateQueries(['analyses']);
    },
    onError: (error) => {
      console.error('Analysis error:', error);
      const errorMessage = error?.message?.includes('timeout') 
        ? 'Analysis timed out. Please try with a smaller file or shorter text.'
        : error?.message?.includes('rate limit')
        ? 'Too many requests. Please wait a moment and try again.'
        : 'Analysis failed. Please check your input and try again.';
      toast.error(errorMessage);
      setStep('input');
    }
  });

  const handleStartOver = () => {
    setStep('input');
    setCurrentResult(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white">
      {/* Header */}
      <header className="border-b border-amber-100 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link to={createPageUrl('Home')} className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-600 to-amber-700 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-slate-800 leading-tight">IsThis.io</h1>
                <p className="text-xs text-slate-500">Is This a Scam?</p>
              </div>
            </Link>

            <Link
              to={createPageUrl('Home')}
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors text-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">All Modes</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 py-12">
        <AnimatePresence mode="wait">
          {step === 'input' && (
            <motion.div
              key="input"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <div className="text-center mb-12">
                <motion.div 
                  initial={{ scale: 0.9 }}
                  animate={{ scale: 1 }}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-100 text-amber-700 text-sm mb-6"
                >
                  <Sparkles className="w-4 h-4" />
                  Advanced scam pattern detection
                </motion.div>
                <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4 leading-tight">
                  Detect Scams & Stay Protected
                </h1>
                <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                  Upload screenshots, paste messages, or share links. We'll analyze for common scam patterns and tell you what to do next.
                </p>
              </div>

              <UnifiedInput
                mode="scam"
                onSubmit={analyzeMutation.mutate}
                acceptTypes={['image', 'text', 'url']}
              />

              {/* Examples */}
              <div className="mt-12">
                <h3 className="text-sm font-semibold text-slate-700 mb-4 text-center">What We Check For</h3>
                <div className="grid md:grid-cols-3 gap-4">
                  {[
                    'Suspicious messages',
                    'Fake marketplace listings',
                    'Phishing attempts'
                  ].map((example, i) => (
                    <div key={i} className="text-center p-4 bg-white rounded-xl border border-amber-100">
                      <p className="text-sm text-slate-600">{example}</p>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {step === 'analyzing' && (
            <motion.div
              key="analyzing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center py-24"
            >
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-amber-100 mb-6 animate-pulse">
                <AlertTriangle className="w-10 h-10 text-amber-600" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mb-3">Analyzing for Scams...</h2>
              <div className="space-y-2 max-w-md mx-auto mb-8">
                <p className="text-slate-600">🔍 Scanning for red flags</p>
                <p className="text-slate-600">💳 Checking payment methods</p>
                <p className="text-slate-600">⚠️ Detecting pressure tactics</p>
                <p className="text-slate-600">✓ Preparing safety report</p>
              </div>
              <div className="flex items-center justify-center gap-2">
                <div className="w-2 h-2 bg-amber-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-amber-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-amber-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
              <p className="text-xs text-slate-500 mt-6">This may take 10-20 seconds</p>
            </motion.div>
          )}

          {step === 'result' && currentResult && (
            <motion.div
              key="result"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <ResultsDisplay
                result={currentResult}
                mode="scam"
                onStartOver={handleStartOver}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}