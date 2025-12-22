import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Sparkles, Upload, Link as LinkIcon, CheckCircle2, AlertTriangle, HelpCircle, ArrowRight, Zap } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

import ResultCard from '@/components/verification/ResultCard';
import ProfileDropdown from '@/components/shared/ProfileDropdown';
import PreferencesModal from '@/components/shared/PreferencesModal';
import StripeCheckout from '@/components/payment/StripeCheckout';

export default function Home() {
  const [uploadedFile, setUploadedFile] = useState(null);
  const [urlInput, setUrlInput] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const [showPreferences, setShowPreferences] = useState(false);

  const queryClient = useQueryClient();

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setUploadedFile(file_url);
      toast.success('File uploaded! Click "Verify Now" to analyze.');
    } catch (error) {
      toast.error('Failed to upload file');
    }
  };

  const handleAnalyze = async () => {
    if (!uploadedFile && !urlInput) {
      toast.error('Please upload an image or paste a URL');
      return;
    }

    setAnalyzing(true);
    try {
      const prompt = uploadedFile
        ? `Analyze this image for signs of AI generation. Look for visual artifacts, inconsistencies, and AI fingerprints.`
        : `Analyze this URL for signs of AI-generated content: ${urlInput}. Evaluate if the content is AI-generated vs authentic.`;

      const analysisResult = await base44.integrations.Core.InvokeLLM({
        prompt: `You are an expert AI content detector. ${prompt}

Analyze for these signals:
- Visual artifacts (hands, eyes, teeth, symmetry issues)
- Lighting and shadow inconsistencies  
- Texture anomalies or unnatural smoothing
- Depth and perspective errors
- Known AI generation patterns

Provide a thorough but accessible analysis.`,
        file_urls: uploadedFile ? [uploadedFile] : undefined,
        add_context_from_internet: !!urlInput,
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
      const record = await base44.entities.AnalysisRecord.create({
        content_type: uploadedFile ? 'image' : 'url',
        source_url: urlInput || null,
        platform: 'direct_upload',
        file_url: uploadedFile || null,
        thumbnail_url: uploadedFile || null,
        ...analysisResult
      });

      setResult({ ...record, ...analysisResult });
    } catch (error) {
      toast.error('Analysis failed. Please try again.');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleStartOver = () => {
    setResult(null);
    setUploadedFile(null);
    setUrlInput('');
  };

  const handlePaymentSuccess = () => {
    toast.success('Payment successful! Premium features activated.');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <header className="border-b border-slate-100 bg-white/95 backdrop-blur-sm sticky top-0 z-50 safe-top">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <button 
              onClick={handleStartOver}
              className="flex items-center gap-2 sm:gap-3 active:scale-95 transition-transform"
            >
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center">
                <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <div>
                <h1 className="text-base sm:text-lg font-bold text-slate-800 leading-tight">IsThis.io</h1>
                <p className="text-xs text-slate-500 hidden sm:block">Is This Real?</p>
              </div>
            </button>

            <div className="flex items-center gap-2">
              <ProfileDropdown onOpenSettings={() => setShowPreferences(true)} />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-16 pb-safe">
        <AnimatePresence mode="wait">
          {!result ? (
            <motion.div
              key="input"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              {/* Hero */}
              <div className="text-center mb-8 sm:mb-16">
                <motion.div 
                  initial={{ scale: 0.9 }}
                  animate={{ scale: 1 }}
                  className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-slate-100 text-slate-600 text-xs sm:text-sm mb-4 sm:mb-6"
                >
                  <Sparkles className="w-3 h-3 sm:w-4 sm:h-4" />
                  Free AI Detection Tool
                </motion.div>
                <h1 className="text-3xl sm:text-5xl md:text-6xl font-bold text-slate-900 mb-4 sm:mb-6 leading-tight px-4">
                  Is This Real?
                </h1>
                <p className="text-base sm:text-xl text-slate-600 max-w-2xl mx-auto mb-6 sm:mb-8 px-4">
                  Upload any image or video to instantly verify if it's real or AI-generated.
                </p>
              </div>

              {/* Upload Section */}
              <div className="max-w-2xl mx-auto mb-8 sm:mb-16">
                <div className="bg-white rounded-xl sm:rounded-2xl border-2 border-slate-200 p-4 sm:p-8 shadow-sm">
                  <div className="mb-4 sm:mb-6">
                    <input
                      type="file"
                      id="file-upload"
                      accept="image/*,video/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <label 
                      htmlFor="file-upload"
                      className="block border-2 border-dashed border-slate-300 rounded-xl p-8 sm:p-12 text-center cursor-pointer active:scale-[0.98] hover:border-slate-400 transition-all bg-slate-50"
                    >
                      <Upload className="w-10 h-10 sm:w-12 sm:h-12 text-slate-400 mx-auto mb-3 sm:mb-4" />
                      <p className="text-sm sm:text-base text-slate-700 font-medium mb-1 sm:mb-2">
                        {uploadedFile ? '✓ Image uploaded!' : 'Tap to upload an image or video'}
                      </p>
                      <p className="text-xs sm:text-sm text-slate-500">or drag and drop here</p>
                    </label>
                  </div>

                  <div className="relative mb-4 sm:mb-6">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-slate-200"></div>
                    </div>
                    <div className="relative flex justify-center text-xs sm:text-sm">
                      <span className="bg-white px-3 text-slate-500">or paste a URL</span>
                    </div>
                  </div>

                  <div className="relative mb-4 sm:mb-6">
                    <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="https://example.com/image.jpg"
                      value={urlInput}
                      onChange={(e) => setUrlInput(e.target.value)}
                      className="w-full pl-10 sm:pl-11 pr-4 py-3 sm:py-3.5 border-2 border-slate-200 rounded-xl focus:border-slate-900 focus:outline-none transition-colors text-sm sm:text-base"
                    />
                  </div>

                  <button
                    onClick={handleAnalyze}
                    disabled={analyzing || (!uploadedFile && !urlInput)}
                    className="w-full py-4 sm:py-4 bg-slate-900 hover:bg-slate-800 active:scale-[0.98] text-white font-semibold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-base sm:text-lg touch-manipulation"
                  >
                    {analyzing ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <Zap className="w-5 h-5" />
                        Verify Now - Free
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* How It Works */}
              <div className="max-w-4xl mx-auto mb-8 sm:mb-16">
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 text-center mb-6 sm:mb-8">How It Works</h2>
                <div className="grid grid-cols-3 sm:grid-cols-3 gap-4 sm:gap-6">
                  {[
                    { icon: Upload, title: 'Upload', desc: 'Upload an image, video, or paste a URL from anywhere' },
                    { icon: Zap, title: 'Analyze', desc: 'Our AI analyzes visual artifacts, patterns, and inconsistencies' },
                    { icon: CheckCircle2, title: 'Get Results', desc: 'Receive a clear verdict with confidence score and detailed explanation' }
                  ].map((step, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="text-center p-3 sm:p-6"
                    >
                      <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-slate-900 flex items-center justify-center mx-auto mb-2 sm:mb-4">
                        <step.icon className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                      </div>
                      <h3 className="font-semibold text-slate-900 mb-1 sm:mb-2 text-sm sm:text-base">{step.title}</h3>
                      <p className="text-xs sm:text-sm text-slate-600 hidden sm:block">{step.desc}</p>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Social Proof */}
              <div className="text-center mb-12 sm:mb-16">
                <div className="inline-flex items-center gap-4 sm:gap-6 text-xs sm:text-sm text-slate-600">
                  <div>
                    <div className="text-xl sm:text-2xl font-bold text-slate-900">95%+</div>
                    <div>Accuracy</div>
                  </div>
                  <div className="h-6 sm:h-8 w-px bg-slate-300"></div>
                  <div>
                    <div className="text-xl sm:text-2xl font-bold text-slate-900">10K+</div>
                    <div>Verifications</div>
                  </div>
                  <div className="h-6 sm:h-8 w-px bg-slate-300"></div>
                  <div>
                    <div className="text-xl sm:text-2xl font-bold text-slate-900">Free</div>
                    <div>Forever</div>
                  </div>
                </div>
              </div>

              {/* Pricing */}
              <section className="py-8 sm:py-16 border-t border-slate-200">
                <div className="text-center mb-8 sm:mb-12 px-4">
                  <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-3 sm:mb-4">Upgrade for More Power</h2>
                  <p className="text-base sm:text-lg text-slate-600">Get unlimited verifications and advanced features</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 max-w-4xl mx-auto">
                  {/* Free */}
                  <div className="bg-white rounded-xl sm:rounded-2xl border-2 border-slate-200 p-5 sm:p-6">
                    <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-2">Free</h3>
                    <div className="text-2xl sm:text-3xl font-bold text-slate-900 mb-4">$0</div>
                    <ul className="space-y-2 sm:space-y-3 mb-6">
                      <li className="flex items-start gap-2 text-xs sm:text-sm text-slate-600">
                        <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                        <span>5 verifications per day</span>
                      </li>
                      <li className="flex items-start gap-2 text-xs sm:text-sm text-slate-600">
                        <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                        <span>Basic AI detection</span>
                      </li>
                      <li className="flex items-start gap-2 text-xs sm:text-sm text-slate-600">
                        <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                        <span>Image & video support</span>
                      </li>
                    </ul>
                    <button className="w-full py-2.5 sm:py-3 border border-slate-300 rounded-xl text-slate-700 font-medium text-sm sm:text-base touch-manipulation">
                      Current Plan
                    </button>
                  </div>

                  {/* Annual */}
                  <div className="bg-white rounded-xl sm:rounded-2xl border-2 border-slate-200 p-5 sm:p-6">
                    <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-2">Premium</h3>
                    <div className="text-2xl sm:text-3xl font-bold text-slate-900 mb-1">$29</div>
                    <div className="text-xs sm:text-sm text-slate-500 mb-4">per year</div>
                    <ul className="space-y-2 sm:space-y-3 mb-6">
                      <li className="flex items-start gap-2 text-xs sm:text-sm text-slate-600">
                        <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                        <span>Unlimited verifications</span>
                      </li>
                      <li className="flex items-start gap-2 text-xs sm:text-sm text-slate-600">
                        <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                        <span>Priority analysis speed</span>
                      </li>
                      <li className="flex items-start gap-2 text-xs sm:text-sm text-slate-600">
                        <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                        <span>Advanced detection</span>
                      </li>
                      <li className="flex items-start gap-2 text-xs sm:text-sm text-slate-600">
                        <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                        <span>Export reports</span>
                      </li>
                    </ul>
                    <StripeCheckout
                      plan={{ name: '1 Year Premium', price: 29, buttonText: 'Get Premium' }}
                      onSuccess={handlePaymentSuccess}
                    />
                  </div>

                  {/* Lifetime */}
                  <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl sm:rounded-2xl border-2 border-slate-900 p-5 sm:p-6 text-white relative">
                    <div className="absolute -top-2.5 sm:-top-3 left-1/2 -translate-x-1/2 px-2.5 sm:px-3 py-1 bg-emerald-500 rounded-full text-xs font-bold text-white">
                      BEST VALUE
                    </div>
                    <h3 className="text-lg sm:text-xl font-bold mb-2">Lifetime</h3>
                    <div className="text-2xl sm:text-3xl font-bold mb-1">$99</div>
                    <div className="text-xs sm:text-sm text-slate-400 mb-4">one-time payment</div>
                    <ul className="space-y-2 sm:space-y-3 mb-6">
                      <li className="flex items-start gap-2 text-xs sm:text-sm">
                        <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                        <span>Everything in Premium</span>
                      </li>
                      <li className="flex items-start gap-2 text-xs sm:text-sm">
                        <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                        <span>Lifetime access forever</span>
                      </li>
                      <li className="flex items-start gap-2 text-xs sm:text-sm">
                        <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                        <span>Early feature access</span>
                      </li>
                      <li className="flex items-start gap-2 text-xs sm:text-sm">
                        <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                        <span>Premium support</span>
                      </li>
                    </ul>
                    <StripeCheckout
                      plan={{ name: 'Lifetime Premium', price: 99, buttonText: 'Get Lifetime Access' }}
                      onSuccess={handlePaymentSuccess}
                    />
                  </div>
                </div>
              </section>
            </motion.div>
          ) : (
            <motion.div
              key="result"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <ResultCard 
                result={result}
                onStartOver={handleStartOver}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Preferences Modal */}
      <PreferencesModal
        isOpen={showPreferences}
        onClose={() => setShowPreferences(false)}
        onSave={(prefs) => {
          toast.success('Preferences saved');
          setShowPreferences(false);
        }}
      />
    </div>
  );
}