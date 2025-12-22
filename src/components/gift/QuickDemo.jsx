import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, Link as LinkIcon, Type, Loader2, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function QuickDemo() {
  const [mode, setMode] = useState('url'); // url, image, text
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
      toast.success('Image uploaded!');
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
      const prompt = mode === 'url' 
        ? `Analyze this URL for AI-generated content or misinformation: ${inputValue}`
        : mode === 'text'
        ? `Analyze this text for misinformation or suspicious claims: ${inputValue}`
        : `Analyze this image for signs of AI generation or manipulation.`;

      const analysis = await base44.integrations.Core.InvokeLLM({
        prompt: prompt,
        file_urls: uploadedFile ? [uploadedFile] : undefined,
        add_context_from_internet: mode === 'url',
        response_json_schema: {
          type: "object",
          properties: {
            verdict: { type: "string", description: "Quick verdict" },
            confidence: { type: "number", description: "0-100" },
            summary: { type: "string", description: "Brief summary" }
          },
          required: ["verdict", "confidence", "summary"]
        }
      });

      setResult(analysis);
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
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setMode('url')}
          className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all ${
            mode === 'url'
              ? 'bg-white text-slate-900'
              : 'bg-white/10 text-white hover:bg-white/20'
          }`}
        >
          <LinkIcon className="w-4 h-4 inline mr-2" />
          URL
        </button>
        <button
          onClick={() => setMode('image')}
          className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all ${
            mode === 'image'
              ? 'bg-white text-slate-900'
              : 'bg-white/10 text-white hover:bg-white/20'
          }`}
        >
          <Upload className="w-4 h-4 inline mr-2" />
          Image
        </button>
        <button
          onClick={() => setMode('text')}
          className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all ${
            mode === 'text'
              ? 'bg-white text-slate-900'
              : 'bg-white/10 text-white hover:bg-white/20'
          }`}
        >
          <Type className="w-4 h-4 inline mr-2" />
          Text
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
            {mode === 'url' && (
              <div className="space-y-4">
                <Input
                  placeholder="Paste a URL to verify..."
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  className="bg-white/20 border-white/30 text-white placeholder:text-white/50"
                />
              </div>
            )}

            {mode === 'image' && (
              <div className="space-y-4">
                <label className="block">
                  <div className="border-2 border-dashed border-white/30 rounded-xl p-8 text-center cursor-pointer hover:border-white/50 transition-colors">
                    <Upload className="w-8 h-8 text-white/70 mx-auto mb-2" />
                    <p className="text-white/70 text-sm">Click to upload an image</p>
                    {uploadedFile && <p className="text-emerald-300 text-sm mt-2">✓ Image uploaded</p>}
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>
            )}

            {mode === 'text' && (
              <div className="space-y-4">
                <Textarea
                  placeholder="Enter text to verify..."
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
            <div className="bg-white rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-xl font-bold text-slate-900">Verification Result</h4>
                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                  result.confidence > 70 
                    ? 'bg-emerald-100 text-emerald-700' 
                    : result.confidence > 40
                    ? 'bg-amber-100 text-amber-700'
                    : 'bg-red-100 text-red-700'
                }`}>
                  {result.confidence}% Confidence
                </span>
              </div>
              
              <div className="mb-4">
                <p className="text-2xl font-bold text-slate-900 mb-2">{result.verdict}</p>
                <p className="text-slate-600">{result.summary}</p>
              </div>

              <div className="border-t pt-4">
                <p className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                  <Share2 className="w-4 h-4" />
                  Share this verification:
                </p>
                <div className="grid grid-cols-4 gap-2">
                  <button
                    onClick={() => shareToSocialMedia('twitter')}
                    className="p-3 bg-black hover:bg-gray-800 text-white rounded-lg transition-colors text-sm font-medium"
                  >
                    𝕏
                  </button>
                  <button
                    onClick={() => shareToSocialMedia('facebook')}
                    className="p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium"
                  >
                    Facebook
                  </button>
                  <button
                    onClick={() => shareToSocialMedia('tiktok')}
                    className="p-3 bg-black hover:bg-gray-800 text-white rounded-lg transition-colors text-sm font-medium"
                  >
                    TikTok
                  </button>
                  <button
                    onClick={() => shareToSocialMedia('instagram')}
                    className="p-3 bg-gradient-to-br from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-lg transition-colors text-sm font-medium"
                  >
                    Instagram
                  </button>
                </div>
              </div>
            </div>

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