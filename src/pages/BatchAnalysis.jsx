import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, ArrowLeft, Upload, FileText, Link as LinkIcon, Sparkles, Play, Download } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import BatchUpload from '../components/batch/BatchUpload';
import BatchProgress from '../components/batch/BatchProgress';
import BatchResults from '../components/batch/BatchResults';

const Analysis = base44.entities.Analysis;
const BatchAnalysis = base44.entities.BatchAnalysis;

export default function BatchAnalysisPage() {
  const [step, setStep] = useState('mode_select'); // mode_select, upload, processing, results
  const [selectedMode, setSelectedMode] = useState(null);
  const [currentBatch, setCurrentBatch] = useState(null);

  const queryClient = useQueryClient();

  const { data: batches = [] } = useQuery({
    queryKey: ['batches'],
    queryFn: () => BatchAnalysis.list('-created_date', 20)
  });

  const modes = [
    { id: 'real', label: 'Is This Real?', icon: Shield, color: 'slate', desc: 'Detect AI-generated content' },
    { id: 'true', label: 'Is This True?', icon: '✓', color: 'blue', desc: 'Fact-check claims' },
    { id: 'scam', label: 'Is This a Scam?', icon: '⚠', color: 'amber', desc: 'Detect scam patterns' },
    { id: 'safe', label: 'Is This Safe?', icon: '♥', color: 'emerald', desc: 'Safety assessments' }
  ];

  const processBatchMutation = useMutation({
    mutationFn: async ({ batchName, items, mode }) => {
      // Create batch record
      const batch = await BatchAnalysis.create({
        mode,
        name: batchName,
        total_items: items.length,
        status: 'queued',
        analysis_ids: []
      });

      setCurrentBatch(batch);
      setStep('processing');

      // Process each item
      const analysisIds = [];
      let completed = 0;
      let failed = 0;
      const scores = [];

      for (const item of items) {
        try {
          // Call appropriate verification based on mode
          let analysisPrompt = '';
          let schema = {};

          if (mode === 'real') {
            analysisPrompt = `Analyze this ${item.input_type} for signs of AI generation.`;
            schema = {
              type: "object",
              properties: {
                score: { type: "number" },
                score_label: { type: "string" },
                summary: { type: "string" },
                signals: { type: "array", items: { type: "object" } }
              }
            };
          } else if (mode === 'true') {
            analysisPrompt = `Fact-check the claims in this ${item.input_type}.`;
            schema = {
              type: "object",
              properties: {
                score: { type: "number" },
                score_label: { type: "string" },
                summary: { type: "string" },
                signals: { type: "array", items: { type: "object" } },
                sources: { type: "array", items: { type: "object" } }
              }
            };
          } else if (mode === 'scam') {
            analysisPrompt = `Detect scam patterns in this ${item.input_type}.`;
            schema = {
              type: "object",
              properties: {
                score: { type: "number" },
                score_label: { type: "string" },
                summary: { type: "string" },
                signals: { type: "array", items: { type: "object" } }
              }
            };
          } else if (mode === 'safe') {
            analysisPrompt = `Assess the safety of this ${item.input_type}.`;
            schema = {
              type: "object",
              properties: {
                score: { type: "number" },
                score_label: { type: "string" },
                summary: { type: "string" },
                signals: { type: "array", items: { type: "object" } }
              }
            };
          }

          const result = await base44.integrations.Core.InvokeLLM({
            prompt: analysisPrompt,
            file_urls: item.input_type === 'image' || item.input_type === 'video' ? [item.input_value] : undefined,
            add_context_from_internet: item.input_type === 'url' || mode === 'true',
            response_json_schema: schema
          });

          // Save analysis
          const analysis = await Analysis.create({
            mode,
            input_type: item.input_type,
            input_value: item.input_value,
            ...result
          });

          analysisIds.push(analysis.id);
          scores.push(result.score);
          completed++;

          // Update batch progress
          await BatchAnalysis.update(batch.id, {
            completed_items: completed,
            failed_items: failed,
            analysis_ids: analysisIds,
            status: 'processing'
          });

        } catch (error) {
          failed++;
          await BatchAnalysis.update(batch.id, {
            completed_items: completed,
            failed_items: failed,
            status: 'processing'
          });
        }
      }

      // Calculate summary
      const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
      const highRisk = scores.filter(s => s >= 70).length;
      const mediumRisk = scores.filter(s => s >= 40 && s < 70).length;
      const lowRisk = scores.filter(s => s < 40).length;

      // Update batch as completed
      const finalBatch = await BatchAnalysis.update(batch.id, {
        status: 'completed',
        summary: {
          average_score: Math.round(avgScore),
          high_risk_count: highRisk,
          medium_risk_count: mediumRisk,
          low_risk_count: lowRisk
        }
      });

      return finalBatch;
    },
    onSuccess: (batch) => {
      setCurrentBatch(batch);
      setStep('results');
      queryClient.invalidateQueries(['batches']);
      queryClient.invalidateQueries(['analyses']);
      toast.success('Batch analysis completed!');
    },
    onError: () => {
      toast.error('Batch analysis failed');
      setStep('upload');
    }
  });

  const handleStartOver = () => {
    setStep('mode_select');
    setSelectedMode(null);
    setCurrentBatch(null);
  };

  const handleModeSelect = (mode) => {
    setSelectedMode(mode);
    setStep('upload');
  };

  const handleBatchSubmit = (data) => {
    processBatchMutation.mutate({
      batchName: data.batchName,
      items: data.items,
      mode: selectedMode
    });
  };

  const handleSelectBatch = async (batchId) => {
    const batch = batches.find(b => b.id === batchId);
    setCurrentBatch(batch);
    setSelectedMode(batch.mode);
    setStep('results');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <header className="border-b border-slate-100 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link to={createPageUrl('Home')} className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-slate-800 leading-tight">IsThis.io</h1>
                <p className="text-xs text-slate-500">Batch Analysis</p>
              </div>
            </Link>

            <div className="flex items-center gap-3">
              <span className="px-3 py-1 bg-amber-100 text-amber-700 text-xs font-bold rounded-full">
                ENTERPRISE
              </span>
              <button
                onClick={handleStartOver}
                className="text-slate-600 hover:text-slate-900 text-sm font-medium"
              >
                New Batch
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-6 py-12">
        <AnimatePresence mode="wait">
          {step === 'mode_select' && (
            <motion.div
              key="mode_select"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <div className="text-center mb-12">
                <motion.div 
                  initial={{ scale: 0.9 }}
                  animate={{ scale: 1 }}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-100 text-slate-600 text-sm mb-6"
                >
                  <Sparkles className="w-4 h-4" />
                  Analyze up to 1000 items at once
                </motion.div>
                <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4 leading-tight">
                  Batch Analysis
                </h1>
                <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                  Upload multiple files or URLs for simultaneous analysis. Track progress and get consolidated reports.
                </p>
              </div>

              {/* Mode Selection */}
              <div className="grid md:grid-cols-2 gap-4 mb-12">
                {modes.map((mode) => (
                  <button
                    key={mode.id}
                    onClick={() => handleModeSelect(mode.id)}
                    className="p-6 rounded-2xl border-2 border-slate-200 hover:border-slate-400 bg-white transition-all text-left group"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="text-2xl">{typeof mode.icon === 'string' ? mode.icon : '🛡️'}</div>
                      <div className="text-slate-400 group-hover:translate-x-1 transition-transform">→</div>
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-1">{mode.label}</h3>
                    <p className="text-slate-600 text-sm">{mode.desc}</p>
                  </button>
                ))}
              </div>

              {/* Recent Batches */}
              {batches.length > 0 && (
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 mb-6">Recent Batches</h2>
                  <div className="space-y-3">
                    {batches.slice(0, 5).map((batch) => (
                      <button
                        key={batch.id}
                        onClick={() => handleSelectBatch(batch.id)}
                        className="w-full p-4 rounded-xl border border-slate-200 hover:border-slate-400 bg-white transition-all text-left"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-semibold text-slate-900">{batch.name}</h4>
                            <p className="text-sm text-slate-600">
                              {batch.mode} • {batch.completed_items}/{batch.total_items} completed
                            </p>
                          </div>
                          <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                            batch.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                            batch.status === 'processing' ? 'bg-blue-100 text-blue-700' :
                            batch.status === 'failed' ? 'bg-red-100 text-red-700' :
                            'bg-slate-100 text-slate-600'
                          }`}>
                            {batch.status}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {step === 'upload' && (
            <motion.div
              key="upload"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <BatchUpload
                mode={selectedMode}
                onSubmit={handleBatchSubmit}
                onBack={handleStartOver}
              />
            </motion.div>
          )}

          {step === 'processing' && currentBatch && (
            <motion.div
              key="processing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <BatchProgress batch={currentBatch} />
            </motion.div>
          )}

          {step === 'results' && currentBatch && (
            <motion.div
              key="results"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <BatchResults
                batch={currentBatch}
                onStartOver={handleStartOver}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}