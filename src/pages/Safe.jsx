import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, ArrowLeft, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import UnifiedInput from '../components/shared/UnifiedInput';
import ResultsDisplay from '../components/shared/ResultsDisplay';

const Analysis = base44.entities.Analysis;

export default function SafePage() {
  const [step, setStep] = useState('input');
  const [currentResult, setCurrentResult] = useState(null);
  const queryClient = useQueryClient();

  const analyzeMutation = useMutation({
    mutationFn: async (inputData) => {
      setStep('analyzing');

      let analysisPrompt = '';
      
      if (inputData.input_type === 'text') {
        analysisPrompt = `Assess the safety of this situation: "${inputData.input_value}"`;
      } else if (inputData.input_type === 'url') {
        analysisPrompt = `Assess the safety of this product/place/service: ${inputData.input_value}`;
      } else {
        analysisPrompt = `Assess safety concerns from this image/video`;
      }

      if (inputData.context) {
        analysisPrompt += `\n\nContext: ${inputData.context}`;
      }

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a safety assessment expert. ${analysisPrompt}

Evaluate safety across relevant domains:
- Personal safety (physical threats, uncomfortable situations)
- Online safety (privacy, security, harassment)
- Travel safety (locations, transportation)
- Product safety (recalls, hazards, certifications)
- Child safety (age-appropriate, protective measures)
- Workplace safety (regulations, hazards)
- Health safety (medical products, food safety)

Provide:
1. Risk level (0-100, where 100 = very high risk)
2. Specific concerns identified
3. Conservative safety recommendations
4. When to seek professional help (medical/legal/emergency)

CRITICAL:
- Use cautious, conservative guidance
- Include disclaimers for medical/legal advice
- Provide emergency resources when relevant
- If self-harm or violence detected, provide crisis resources
- No instructions for illegal activities

Be practical and protective.`,
        file_urls: inputData.input_type === 'image' || inputData.input_type === 'video' ? [inputData.input_value] : undefined,
        add_context_from_internet: inputData.input_type === 'url',
        response_json_schema: {
          type: "object",
          properties: {
            score: {
              type: "number",
              description: "Risk level 0-100 (higher = higher risk)"
            },
            score_label: {
              type: "string",
              enum: ["Appears Safe", "Some Risk", "High Risk", "Immediate Danger"],
              description: "Label for the score"
            },
            summary: {
              type: "string",
              description: "One sentence safety assessment"
            },
            safety_domain: {
              type: "string",
              description: "Primary safety category"
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
              description: "Safety concerns identified"
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
              description: "Safety recommendations"
            },
            escalation_guidance: {
              type: "string",
              description: "When and how to seek professional help"
            },
            emergency_resources: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  contact: { type: "string" },
                  when_to_use: { type: "string" }
                }
              },
              description: "Emergency contacts if applicable"
            },
            method_explanation: {
              type: "string",
              description: "How the assessment was done"
            },
            disclaimer: {
              type: "string",
              description: "Important disclaimers"
            }
          },
          required: ["score", "summary", "signals", "recommended_actions"]
        }
      });

      // Save to database
      const record = await Analysis.create({
        mode: 'safe',
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
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white">
      {/* Header */}
      <header className="border-b border-emerald-100 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link to={createPageUrl('Home')} className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-600 to-emerald-700 flex items-center justify-center">
                <Heart className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-slate-800 leading-tight">Is This Safe?</h1>
                <p className="text-xs text-slate-500">Safety assessment & guidance</p>
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
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-100 text-emerald-700 text-sm mb-6"
                >
                  <Sparkles className="w-4 h-4" />
                  Conservative, protective guidance
                </motion.div>
                <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4 leading-tight">
                  Get Safety Guidance & Risk Assessment
                </h1>
                <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                  Check situations, products, places, or decisions for safety concerns. Get practical recommendations and know when to seek help.
                </p>
              </div>

              <UnifiedInput
                mode="safe"
                onSubmit={analyzeMutation.mutate}
                acceptTypes={['text', 'url', 'image']}
              />

              {/* Examples */}
              <div className="mt-12">
                <h3 className="text-sm font-semibold text-slate-700 mb-4 text-center">Safety Domains We Cover</h3>
                <div className="grid md:grid-cols-3 gap-4">
                  {[
                    'Personal safety',
                    'Product safety',
                    'Travel safety'
                  ].map((example, i) => (
                    <div key={i} className="text-center p-4 bg-white rounded-xl border border-emerald-100">
                      <p className="text-sm text-slate-600">{example}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Disclaimer */}
              <div className="mt-8 p-4 bg-slate-50 rounded-xl border border-slate-200">
                <p className="text-xs text-slate-600 text-center">
                  <strong>Disclaimer:</strong> This tool provides general safety guidance only and is not a substitute for professional medical, legal, or emergency services. In case of emergency, contact local authorities immediately.
                </p>
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
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-emerald-100 mb-6 animate-pulse">
                <Heart className="w-10 h-10 text-emerald-600" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mb-3">Assessing Safety...</h2>
              <p className="text-slate-600 mb-8">Evaluating risks and preparing recommendations</p>
              <div className="flex items-center justify-center gap-2">
                <div className="w-2 h-2 bg-emerald-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-emerald-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-emerald-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
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
                mode="safe"
                onStartOver={handleStartOver}
              />

              {/* Emergency Resources if present */}
              {currentResult.emergency_resources && currentResult.emergency_resources.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-6 bg-red-50 border-2 border-red-200 rounded-2xl p-6"
                >
                  <h3 className="text-lg font-bold text-red-900 mb-4">Emergency Resources</h3>
                  <div className="space-y-3">
                    {currentResult.emergency_resources.map((resource, i) => (
                      <div key={i} className="bg-white rounded-xl p-4">
                        <div className="font-semibold text-red-900 mb-1">{resource.name}</div>
                        <div className="text-red-700 font-mono mb-2">{resource.contact}</div>
                        <div className="text-sm text-red-600">{resource.when_to_use}</div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Disclaimer */}
              {currentResult.disclaimer && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mt-6 p-4 bg-slate-50 rounded-xl border border-slate-200"
                >
                  <p className="text-sm text-slate-600">
                    <strong>Important:</strong> {currentResult.disclaimer}
                  </p>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}