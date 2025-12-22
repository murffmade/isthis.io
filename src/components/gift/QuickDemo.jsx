import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, Link as LinkIcon, Type, Loader2, Share2, CheckCircle2, AlertTriangle, HelpCircle, ThumbsUp, ThumbsDown, Info, Shield, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

const resultConfig = {
  likely_real: {
    icon: CheckCircle2,
    title: 'Likely Real',
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50',
    borderColor: 'border-emerald-200'
  },
  likely_ai: {
    icon: AlertTriangle,
    title: 'Likely AI-Generated',
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200'
  },
  uncertain: {
    icon: HelpCircle,
    title: 'Uncertain',
    color: 'text-slate-600',
    bgColor: 'bg-slate-50',
    borderColor: 'border-slate-200'
  }
};

const severityColors = {
  low: 'bg-slate-100 text-slate-600',
  medium: 'bg-amber-100 text-amber-700',
  high: 'bg-red-100 text-red-700'
};

export default function QuickDemo() {
  const [mode, setMode] = useState('real'); // real, true, scam, safe
  const [inputValue, setInputValue] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const [uploadedFile, setUploadedFile] = useState(null);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setUploadedFile(file_url);
      toast.success('Image uploaded! Analyzing...');
      
      // Automatically start analysis
      setAnalyzing(true);
      try {
        const analysisResult = await base44.integrations.Core.InvokeLLM({
          prompt: `You are an expert AI content detector. Analyze this image for signs of AI generation. Look for visual artifacts, inconsistencies, and AI fingerprints.

Analyze for these signals:
- Visual artifacts (hands, eyes, teeth, symmetry issues)
- Lighting and shadow inconsistencies  
- Texture anomalies or unnatural smoothing
- Depth and perspective errors
- Known AI generation patterns

Provide a thorough but accessible analysis.`,
          file_urls: [file_url],
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

        setResult({ ...analysisResult, feedback: null });
      } catch (error) {
        toast.error('Analysis failed');
      } finally {
        setAnalyzing(false);
      }
    } catch (error) {
      toast.error('Failed to upload image');
    }
  };

  const handleAnalyze = async () => {
    if (!inputValue && !uploadedFile) {
      toast.error('Please provide input to analyze');
      return;
    }

    setAnalyzing(true);
    try {
      let prompt = '';
      let systemPrompt = '';
      
      if (mode === 'real') {
        prompt = uploadedFile 
          ? `Analyze this image/video for signs of AI generation. Look for visual artifacts, inconsistencies, and AI fingerprints.`
          : `Analyze this content for AI-generated elements.`;
        systemPrompt = `You are an expert AI content detector. ${prompt}

Analyze for these signals:
- Visual artifacts (hands, eyes, teeth, symmetry issues)
- Lighting and shadow inconsistencies  
- Texture anomalies or unnatural smoothing
- Depth and perspective errors
- Known AI generation patterns

Provide a thorough but accessible analysis.`;
      } else if (mode === 'true') {
        prompt = `Fact-check this claim or article: "${inputValue}". Search for reliable sources and determine if this information is true, false, or misleading.`;
        systemPrompt = `You are an expert fact-checker. ${prompt}

Research and analyze:
- Check reliable news sources and fact-checking sites
- Look for scientific studies or official data
- Identify any misleading context or partial truths
- Find credible sources that support or refute the claim

Provide a clear verdict with evidence.`;
      } else if (mode === 'scam') {
        prompt = `Analyze this message for scam indicators: "${inputValue}". Check for common fraud patterns, suspicious language, and red flags.`;
        systemPrompt = `You are an expert fraud detection specialist. ${prompt}

Look for:
- Urgency tactics and pressure language
- Suspicious links or requests for personal information
- Grammar and spelling issues common in scams
- Too-good-to-be-true offers
- Impersonation attempts

Provide a risk assessment.`;
      } else if (mode === 'safe') {
        prompt = `Provide safety guidance for this situation: "${inputValue}". Consider potential risks and offer practical advice.`;
        systemPrompt = `You are a safety advisor. ${prompt}

Consider:
- Immediate safety concerns
- Long-term implications
- Red flags to watch for
- Practical steps to stay safe
- When to seek professional help

Provide caring, practical guidance.`;
      }

      const analysisResult = await base44.integrations.Core.InvokeLLM({
        prompt: systemPrompt,
        file_urls: uploadedFile ? [uploadedFile] : undefined,
        add_context_from_internet: mode === 'true' || mode === 'scam',
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

      setResult({ ...analysisResult, feedback: null });
    } catch (error) {
      toast.error('Analysis failed');
    } finally {
      setAnalyzing(false);
    }
  };

  const shareToSocialMedia = (platform) => {
    const text = encodeURIComponent(`I just verified content with IsThis.io! Result: ${result?.verdict} (${result?.confidence}% confidence). Try it yourself at IsThis.io 🎁`);
    const urls = {
      twitter: `https://twitter.com/intent/tweet?text=${text}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.origin)}&quote=${text}`,
      tiktok: `https://www.tiktok.com/share?url=${encodeURIComponent(window.location.origin)}&text=${text}`,
      instagram: null // Instagram doesn't support direct sharing URLs
    };

    if (platform === 'instagram') {
      toast.info('Copy this result and share it on Instagram Stories!');
    } else {
      window.open(urls[platform], '_blank', 'width=600,height=400');
    }
  };

  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-2xl border-2 border-white/20 p-6">
      {/* Mode Selector */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <button
          onClick={() => setMode('real')}
          className={`py-3 px-4 rounded-xl font-medium transition-all text-left ${
            mode === 'real'
              ? 'bg-white text-slate-900'
              : 'bg-white/10 text-white hover:bg-white/20'
          }`}
        >
          <div className="flex items-center gap-2 mb-1">
            <Shield className="w-4 h-4" />
            <span className="font-bold">Is This Real?</span>
          </div>
          <p className="text-xs opacity-70">Upload an image or video to detect AI-generated content</p>
        </button>
        <button
          onClick={() => setMode('true')}
          className={`py-3 px-4 rounded-xl font-medium transition-all text-left ${
            mode === 'true'
              ? 'bg-white text-slate-900'
              : 'bg-white/10 text-white hover:bg-white/20'
          }`}
        >
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle2 className="w-4 h-4" />
            <span className="font-bold">Is This True?</span>
          </div>
          <p className="text-xs opacity-70">Post a link to a news article and find out how true the information is…</p>
        </button>
        <button
          onClick={() => setMode('scam')}
          className={`py-3 px-4 rounded-xl font-medium transition-all text-left ${
            mode === 'scam'
              ? 'bg-white text-slate-900'
              : 'bg-white/10 text-white hover:bg-white/20'
          }`}
        >
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle className="w-4 h-4" />
            <span className="font-bold">Is This a Scam?</span>
          </div>
          <p className="text-xs opacity-70">Check messages, emails, and listings for potential fraud</p>
        </button>
        <button
          onClick={() => setMode('safe')}
          className={`py-3 px-4 rounded-xl font-medium transition-all text-left ${
            mode === 'safe'
              ? 'bg-white text-slate-900'
              : 'bg-white/10 text-white hover:bg-white/20'
          }`}
        >
          <div className="flex items-center gap-2 mb-1">
            <Heart className="w-4 h-4" />
            <span className="font-bold">Is This Safe?</span>
          </div>
          <p className="text-xs opacity-70">Get safety guidance for decisions and situations</p>
        </button>
      </div>

      <AnimatePresence mode="wait">
        {!result ? (
          <motion.div
            key="input"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {mode === 'real' && (
              <div className="space-y-4">
                <label className="block">
                  <div className="border-2 border-dashed border-white/30 rounded-xl p-8 text-center cursor-pointer hover:border-white/50 transition-colors">
                    <Upload className="w-8 h-8 text-white/70 mx-auto mb-2" />
                    <p className="text-white/70 text-sm">Click to upload an image or video</p>
                    {uploadedFile && <p className="text-emerald-300 text-sm mt-2">✓ File uploaded</p>}
                  </div>
                  <input
                    type="file"
                    accept="image/*,video/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-white/20"></div>
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="bg-transparent px-2 text-white/50">or</span>
                  </div>
                </div>
                <Input
                  placeholder="Paste a URL to an image or video..."
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  className="bg-white/20 border-white/30 text-white placeholder:text-white/50"
                />
              </div>
            )}

            {mode === 'true' && (
              <div className="space-y-4">
                <Input
                  placeholder="Paste a URL to a news article or claim..."
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  className="bg-white/20 border-white/30 text-white placeholder:text-white/50"
                />
              </div>
            )}

            {mode === 'scam' && (
              <div className="space-y-4">
                <Textarea
                  placeholder="Paste a suspicious message, email, or listing..."
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  className="bg-white/20 border-white/30 text-white placeholder:text-white/50 h-24"
                />
              </div>
            )}

            {mode === 'safe' && (
              <div className="space-y-4">
                <Textarea
                  placeholder="Describe a situation or decision you need safety guidance on..."
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  className="bg-white/20 border-white/30 text-white placeholder:text-white/50 h-24"
                />
              </div>
            )}

            <Button
              onClick={handleAnalyze}
              disabled={analyzing || (!inputValue && !uploadedFile)}
              className="w-full mt-4 h-12 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold"
            >
              {analyzing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                'Try It Now - Free!'
              )}
            </Button>
          </motion.div>
        ) : (
          <motion.div
            key="result"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            {(() => {
              const config = resultConfig[result.result] || resultConfig.uncertain;
              const Icon = config.icon;
              
              return (
                <div className="bg-white rounded-xl p-6 border-2 border-slate-200">
                  {/* Result Header */}
                  <div className={`rounded-xl ${config.bgColor} border-2 ${config.borderColor} p-4 mb-4`}>
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center shadow-sm">
                        <Icon className={`w-6 h-6 ${config.color}`} />
                      </div>
                      <div className="flex-1">
                        <h3 className={`text-xl font-bold ${config.color} mb-1`}>
                          {config.title}
                        </h3>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-slate-600">Confidence:</span>
                          <span className={`text-lg font-bold ${config.color}`}>{result.confidence}%</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Signals */}
                  {result.signals && result.signals.length > 0 && (
                    <div className="mb-4">
                      <h4 className="font-semibold text-slate-800 text-sm mb-3">What we found:</h4>
                      <div className="space-y-2">
                        {result.signals.slice(0, 3).map((signal, index) => (
                          <div key={index} className="flex items-start gap-2 p-2 rounded-lg bg-slate-50">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${severityColors[signal.severity]}`}>
                              {signal.severity}
                            </span>
                            <div>
                              <p className="text-xs font-medium text-slate-700">{signal.signal_type}</p>
                              <p className="text-xs text-slate-500">{signal.description}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Summary */}
                  <div className="mb-4 p-3 bg-slate-50 rounded-lg">
                    <p className="text-sm text-slate-700 leading-relaxed">{result.summary}</p>
                  </div>

                  {/* Feedback Section */}
                  <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-xs font-semibold text-blue-900 mb-2">Was this analysis accurate?</p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setResult({ ...result, feedback: 'correct' });
                          toast.success('Thanks for your feedback!');
                        }}
                        className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                          result.feedback === 'correct'
                            ? 'bg-emerald-500 text-white'
                            : 'bg-white text-slate-700 hover:bg-emerald-50'
                        }`}
                      >
                        <ThumbsUp className="w-4 h-4 inline mr-1" />
                        Correct
                      </button>
                      <button
                        onClick={() => {
                          setResult({ ...result, feedback: 'incorrect' });
                          toast.success('Thanks for your feedback! This helps us improve.');
                        }}
                        className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                          result.feedback === 'incorrect'
                            ? 'bg-red-500 text-white'
                            : 'bg-white text-slate-700 hover:bg-red-50'
                        }`}
                      >
                        <ThumbsDown className="w-4 h-4 inline mr-1" />
                        Incorrect
                      </button>
                    </div>
                  </div>

                  {/* Disclaimer */}
                  <div className="flex items-start gap-2 p-2 bg-slate-50 rounded-lg mb-4">
                    <Info className="w-3 h-3 text-slate-400 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-slate-500">
                      AI analysis isn't perfect. Always verify with multiple sources.
                    </p>
                  </div>

                  {/* Share Section */}
                  <div className="border-t pt-4">
                    <p className="text-xs font-semibold text-slate-700 mb-2 flex items-center gap-2">
                      <Share2 className="w-3 h-3" />
                      Share this verification:
                    </p>
                    <div className="grid grid-cols-4 gap-2">
                      <button
                        onClick={() => shareToSocialMedia('twitter')}
                        className="p-2 bg-black hover:bg-gray-800 text-white rounded-lg transition-colors text-xs font-medium"
                      >
                        𝕏
                      </button>
                      <button
                        onClick={() => shareToSocialMedia('facebook')}
                        className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-xs font-medium"
                      >
                        FB
                      </button>
                      <button
                        onClick={() => shareToSocialMedia('tiktok')}
                        className="p-2 bg-black hover:bg-gray-800 text-white rounded-lg transition-colors text-xs font-medium"
                      >
                        TikTok
                      </button>
                      <button
                        onClick={() => shareToSocialMedia('instagram')}
                        className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-lg transition-colors text-xs font-medium"
                      >
                        IG
                      </button>
                    </div>
                  </div>
                </div>
              );
            })()}

            <Button
              onClick={() => {
                setResult(null);
                setInputValue('');
                setUploadedFile(null);
              }}
              variant="outline"
              className="w-full border-white/30 text-white hover:bg-white/10"
            >
              Try Another
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}