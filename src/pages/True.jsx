import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, ArrowLeft, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import UnifiedInput from '../components/shared/UnifiedInput';
import ResultsDisplay from '../components/shared/ResultsDisplay';

const Analysis = base44.entities.Analysis;

export default function TruePage() {
  const [step, setStep] = useState('input');
  const [currentResult, setCurrentResult] = useState(null);
  const queryClient = useQueryClient();

  const analyzeMutation = useMutation({
    mutationFn: async (inputData) => {
      // Show analyzing state
      setStep('analyzing');

      // Extract claims from the input
      let analysisPrompt = '';
      
      if (inputData.input_type === 'text') {
        analysisPrompt = `Fact-check this claim: "${inputData.input_value}"`;
      } else if (inputData.input_type === 'url') {
        analysisPrompt = `Fact-check the claims in this article/post: ${inputData.input_value}`;
      } else {
        analysisPrompt = `Extract and fact-check claims from this image/video content`;
      }

      if (inputData.context) {
        analysisPrompt += `\n\nAdditional context: ${inputData.context}`;
      }

      // Call LLM with internet search for fact-checking
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a professional fact-checker. ${analysisPrompt}

Your task:
1. Identify 1-3 key checkable claims
2. Search for evidence from authoritative sources (government, academic, official organizations, primary data)
3. Evaluate each claim's truthfulness
4. Provide clear citations

Important guidelines:
- Be neutral and non-political
- Separate facts from interpretation
- If evidence conflicts, present both sides
- Use calibrated language - avoid certainty where unclear
- Always cite your sources

Provide a thorough, balanced fact-check.`,
        file_urls: inputData.input_type === 'image' || inputData.input_type === 'video' ? [inputData.input_value] : undefined,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            score: {
              type: "number",
              description: "Likelihood claim is true (0-100)"
            },
            score_label: {
              type: "string",
              enum: ["Likely True", "Needs Verification", "Likely False", "Unverifiable"],
              description: "Label for the score"
            },
            summary: {
              type: "string",
              description: "One sentence verdict"
            },
            claims: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  claim: { type: "string" },
                  verdict: { type: "string" },
                  evidence: { type: "string" }
                }
              },
              description: "Individual claims analyzed"
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
              description: "Evidence for/against"
            },
            sources: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  url: { type: "string" },
                  domain: { type: "string" },
                  date: { type: "string" }
                }
              },
              description: "Citations used"
            },
            recommended_actions: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  action: { type: "string" },
                  description: { type: "string" }
                }
              }
            },
            method_explanation: {
              type: "string",
              description: "How the fact-check was conducted"
            },
            missing_info: {
              type: "string",
              description: "What information would change this assessment"
            }
          },
          required: ["score", "summary", "signals", "sources", "recommended_actions"]
        }
      });

      // Save to database
      const record = await Analysis.create({
        mode: 'true',
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
      toast.error('Analysis failed. Please try again.');
      setStep('input');
    }
  });

  const handleStartOver = () => {
    setStep('input');
    setCurrentResult(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Header */}
      <header className="border-b border-blue-100 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link to={createPageUrl('Home')} className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-slate-800 leading-tight">Is This True?</h1>
                <p className="text-xs text-slate-500">Fact verification with citations</p>
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
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-100 text-blue-700 text-sm mb-6"
                >
                  <Sparkles className="w-4 h-4" />
                  Verified with citations from authoritative sources
                </motion.div>
                <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4 leading-tight">
                  Verify Claims & Check Facts
                </h1>
                <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                  Get fact-checked analysis with citations from trusted sources. We verify claims against authoritative evidence and present findings neutrally.
                </p>
              </div>

              <UnifiedInput
                mode="true"
                onSubmit={analyzeMutation.mutate}
                acceptTypes={['text', 'url', 'image']}
              />

              {/* Examples */}
              <div className="mt-12">
                <h3 className="text-sm font-semibold text-slate-700 mb-4 text-center">Common Use Cases</h3>
                <div className="grid md:grid-cols-3 gap-4">
                  {[
                    'Fact-check viral claims',
                    'Verify news articles',
                    'Check social media posts'
                  ].map((example, i) => (
                    <div key={i} className="text-center p-4 bg-white rounded-xl border border-blue-100">
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
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-blue-100 mb-6 animate-pulse">
                <CheckCircle className="w-10 h-10 text-blue-600" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mb-3">Fact-Checking...</h2>
              <p className="text-slate-600 mb-8">Searching authoritative sources and verifying claims</p>
              <div className="flex items-center justify-center gap-2">
                <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
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
                mode="true"
                onStartOver={handleStartOver}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}