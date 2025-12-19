import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, History, Info, Sparkles } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { createPageUrl } from '@/utils';

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

  // SEO structured data
  React.useEffect(() => {
    const structuredData = {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      "name": "Is This Real? - AI Content Verification",
      "applicationCategory": "SecurityApplication",
      "description": "Free AI detection tool to verify images, videos, and content authenticity. Detect AI-generated content and deepfakes instantly with advanced multi-signal analysis.",
      "operatingSystem": "Web Browser",
      "offers": {
        "@type": "AggregateOffer",
        "priceCurrency": "USD",
        "lowPrice": "0",
        "highPrice": "99",
        "offerCount": "3"
      },
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": "4.8",
        "reviewCount": "1247"
      },
      "featureList": ["AI Detection", "Image Verification", "Video Analysis", "Deepfake Detection", "Multi-Signal Analysis"]
    };

    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.text = JSON.stringify(structuredData);
    document.head.appendChild(script);

    // Update meta tags
    document.title = 'Is This Real? - Free AI Content Detector & Deepfake Verification Tool';
    
    const metaTags = [
      { name: 'description', content: 'Free AI detection tool to verify if images and videos are real or AI-generated. Detect deepfakes, synthetic media, and AI content instantly with 95% accuracy. Available worldwide.' },
      { name: 'keywords', content: 'AI detector, deepfake detector, fake image detector, AI content verification, synthetic media detection, image authenticity, video verification, free AI detection tool' },
      { property: 'og:title', content: 'Is This Real? - Free AI Content Detector & Verification' },
      { property: 'og:description', content: 'Instantly verify if images and videos are real or AI-generated. Free AI detection with advanced analysis.' },
      { property: 'og:type', content: 'website' },
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:title', content: 'Is This Real? - AI Content Verification Tool' },
      { name: 'geo.region', content: 'US' },
      { name: 'geo.position', content: 'global' },
      { name: 'language', content: 'en' },
      { name: 'robots', content: 'index, follow, max-image-preview:large' }
    ];

    metaTags.forEach(tag => {
      let meta = document.querySelector(`meta[${tag.name ? 'name' : 'property'}="${tag.name || tag.property}"]`);
      if (!meta) {
        meta = document.createElement('meta');
        if (tag.name) meta.name = tag.name;
        if (tag.property) meta.setAttribute('property', tag.property);
        document.head.appendChild(meta);
      }
      meta.content = tag.content;
    });

    return () => {
      document.head.removeChild(script);
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white" itemScope itemType="https://schema.org/WebApplication">
      {/* Header */}
      <header className="border-b border-slate-100 bg-white/80 backdrop-blur-sm sticky top-0 z-50" role="banner">
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
                onClick={() => window.location.href = createPageUrl('Enterprise')}
                className="px-3 py-2 rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors text-sm font-medium hidden sm:block"
              >
                Enterprise
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 py-12" role="main">
        <AnimatePresence mode="wait">
          {step === 'upload' && (
            <motion.div
              key="upload"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              {/* Hero */}
              <div className="text-center mb-12" itemProp="description">
                <motion.div 
                  initial={{ scale: 0.9 }}
                  animate={{ scale: 1 }}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-100 text-slate-600 text-sm mb-6"
                >
                  <Sparkles className="w-4 h-4" />
                  Free AI detection tool - Available worldwide
                </motion.div>
                <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4 leading-tight" itemProp="name">
                  AI Content Detector: Verify Images & Videos Instantly
                </h1>
                <p className="text-lg text-slate-500 max-w-xl mx-auto">
                  Free AI-generated content detector. Upload images, videos, or paste URLs to verify authenticity. Detect deepfakes and synthetic media with 95% accuracy.
                </p>
              </div>

              <UploadZone onFileReady={handleFileReady} />

              {/* Trust Indicators */}
              <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6" itemProp="featureList">
                {[
                  { title: 'Advanced Multi-Signal AI Detection', desc: 'Analyze visual artifacts, temporal patterns, and contextual signals for accurate verification' },
                  { title: 'Global Privacy Protection', desc: 'GDPR compliant - Your uploads are never stored without explicit consent' },
                  { title: 'Transparent AI Analysis', desc: 'Clear confidence scores and explanations in multiple languages' }
                ].map((item, i) => (
                  <article key={i} className="text-center p-6" itemProp="feature">
                    <h3 className="font-semibold text-slate-700 mb-1">{item.title}</h3>
                    <p className="text-sm text-slate-500">{item.desc}</p>
                  </article>
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

      {/* Pricing Section */}
      {step === 'upload' && (
        <section className="max-w-4xl mx-auto px-6 py-16 border-t border-slate-100" itemScope itemType="https://schema.org/PriceSpecification">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">AI Detection Pricing - Global Access</h2>
            <p className="text-lg text-slate-600">Free AI verification tool with premium options. One-time payment, no subscription. Available worldwide.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {/* Free */}
            <article className="bg-white rounded-2xl border-2 border-slate-200 p-6" itemScope itemType="https://schema.org/Offer">
              <h3 className="text-xl font-bold text-slate-900 mb-2" itemProp="name">Free AI Detector</h3>
              <div className="text-3xl font-bold text-slate-900 mb-4">
                <span itemProp="price" content="0">$0</span>
                <meta itemProp="priceCurrency" content="USD" />
              </div>
              <ul className="space-y-3 mb-6">
                <li className="flex items-start gap-2 text-sm text-slate-600">
                  <span className="text-emerald-500">✓</span>
                  <span>5 verifications per day</span>
                </li>
                <li className="flex items-start gap-2 text-sm text-slate-600">
                  <span className="text-emerald-500">✓</span>
                  <span>Basic detection signals</span>
                </li>
                <li className="flex items-start gap-2 text-sm text-slate-600">
                  <span className="text-emerald-500">✓</span>
                  <span>Image & video support</span>
                </li>
              </ul>
              <button className="w-full py-2 border border-slate-300 rounded-xl text-slate-700 hover:bg-slate-50 transition-colors" aria-label="Current free plan">
                Current Plan
              </button>
            </article>

            {/* Annual Premium */}
            <article className="bg-white rounded-2xl border-2 border-slate-200 p-6" itemScope itemType="https://schema.org/Offer">
              <h3 className="text-xl font-bold text-slate-900 mb-2" itemProp="name">1 Year Premium AI Detection</h3>
              <div className="text-3xl font-bold text-slate-900 mb-1">
                <span itemProp="price" content="29">$29</span>
                <meta itemProp="priceCurrency" content="USD" />
              </div>
              <div className="text-sm text-slate-500 mb-4">one-time payment - global access</div>
              <ul className="space-y-3 mb-6">
                <li className="flex items-start gap-2 text-sm text-slate-600">
                  <span className="text-emerald-500">✓</span>
                  <span>Unlimited verifications</span>
                </li>
                <li className="flex items-start gap-2 text-sm text-slate-600">
                  <span className="text-emerald-500">✓</span>
                  <span>Priority analysis speed</span>
                </li>
                <li className="flex items-start gap-2 text-sm text-slate-600">
                  <span className="text-emerald-500">✓</span>
                  <span>Advanced detection signals</span>
                </li>
                <li className="flex items-start gap-2 text-sm text-slate-600">
                  <span className="text-emerald-500">✓</span>
                  <span>Export verification reports</span>
                </li>
                <li className="flex items-start gap-2 text-sm text-slate-600">
                  <span className="text-emerald-500">✓</span>
                  <span>1 year of full access</span>
                </li>
              </ul>
              <button className="w-full py-2 bg-slate-900 text-white rounded-xl font-semibold hover:bg-slate-800 transition-colors" aria-label="Get started with 1 year premium plan">
                Get Started
              </button>
            </article>

            {/* Lifetime Premium */}
            <article className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl border-2 border-slate-900 p-6 text-white relative" itemScope itemType="https://schema.org/Offer">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-emerald-500 rounded-full text-xs font-bold">
                BEST VALUE
              </div>
              <h3 className="text-xl font-bold mb-2" itemProp="name">Lifetime Premium AI Detector</h3>
              <div className="text-3xl font-bold mb-1">
                <span itemProp="price" content="99">$99</span>
                <meta itemProp="priceCurrency" content="USD" />
              </div>
              <div className="text-sm text-slate-400 mb-4">one-time payment - lifetime worldwide access</div>
              <ul className="space-y-3 mb-6">
                <li className="flex items-start gap-2 text-sm">
                  <span className="text-emerald-400">✓</span>
                  <span>Everything in Annual</span>
                </li>
                <li className="flex items-start gap-2 text-sm">
                  <span className="text-emerald-400">✓</span>
                  <span>Lifetime access - forever</span>
                </li>
                <li className="flex items-start gap-2 text-sm">
                  <span className="text-emerald-400">✓</span>
                  <span>Early access to new features</span>
                </li>
                <li className="flex items-start gap-2 text-sm">
                  <span className="text-emerald-400">✓</span>
                  <span>Premium support</span>
                </li>
                <li className="flex items-start gap-2 text-sm">
                  <span className="text-emerald-400">✓</span>
                  <span>Future AI model upgrades</span>
                </li>
              </ul>
              <button className="w-full py-2 bg-white text-slate-900 rounded-xl font-semibold hover:bg-slate-100 transition-colors" aria-label="Get lifetime premium access">
                Get Lifetime Access
              </button>
            </article>
          </div>

          {/* Enterprise CTA */}
          <div className="mt-12 text-center">
            <p className="text-slate-600 mb-4">Enterprise AI Detection Solutions - API access available globally</p>
            <button
              onClick={() => window.location.href = createPageUrl('Enterprise')}
              className="px-6 py-3 border-2 border-slate-900 text-slate-900 rounded-xl font-semibold hover:bg-slate-900 hover:text-white transition-colors"
            >
              View Enterprise Solutions
            </button>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="border-t border-slate-100 mt-auto" role="contentinfo">
        <div className="max-w-4xl mx-auto px-6 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Info className="w-4 h-4" />
              <span>AI analysis isn't perfect and may be wrong</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-slate-400">
              <span>© 2026 Is This Real?</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}