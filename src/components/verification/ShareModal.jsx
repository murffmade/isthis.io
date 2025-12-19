import React, { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, Link2, Share2, Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import html2canvas from 'html2canvas';
import ShareCard from './ShareCard';

export default function ShareModal({ result, onClose }) {
  const cardRef = useRef(null);
  const [generating, setGenerating] = useState(false);
  const [imageUrl, setImageUrl] = useState(null);
  const [copied, setCopied] = useState(false);

  const generateImage = async () => {
    if (imageUrl) return imageUrl;
    
    setGenerating(true);
    try {
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: null,
        scale: 2,
        logging: false
      });
      const url = canvas.toDataURL('image/png');
      setImageUrl(url);
      return url;
    } catch (error) {
      toast.error('Failed to generate image');
      return null;
    } finally {
      setGenerating(false);
    }
  };

  const downloadImage = async () => {
    const url = await generateImage();
    if (!url) return;

    const link = document.createElement('a');
    link.download = `is-this-real-verification-${Date.now()}.png`;
    link.href = url;
    link.click();
    toast.success('Image downloaded');
  };

  const copyImage = async () => {
    const url = await generateImage();
    if (!url) return;

    try {
      const blob = await (await fetch(url)).blob();
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob })
      ]);
      setCopied(true);
      toast.success('Image copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('Failed to copy image. Try downloading instead.');
    }
  };

  const shareToSocial = async (platform) => {
    const appUrl = window.location.origin;
    const text = `I verified content using Is This Real? Result: ${result.result === 'likely_ai' ? 'Likely AI-Generated' : result.result === 'likely_real' ? 'Likely Real' : 'Uncertain'} (${result.confidence}% confidence)`;
    
    const urls = {
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(appUrl)}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(appUrl)}&quote=${encodeURIComponent(text)}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(appUrl)}`
    };

    window.open(urls[platform], '_blank', 'width=600,height=400');
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-6"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between rounded-t-2xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
                <Share2 className="w-5 h-5 text-slate-600" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-800">Share Verification</h3>
                <p className="text-sm text-slate-500">Download or share your analysis</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center transition-colors"
            >
              <X className="w-5 h-5 text-slate-400" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            {/* Card Preview */}
            <div className="flex justify-center mb-6 bg-slate-50 rounded-xl p-8">
              <div style={{ transform: 'scale(0.7)', transformOrigin: 'top center' }}>
                <ShareCard result={result} cardRef={cardRef} />
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-4">
              {/* Download & Copy */}
              <div className="bg-slate-50 rounded-xl p-4">
                <h4 className="font-medium text-slate-700 mb-3 text-sm">Save or Copy</h4>
                <div className="flex gap-3">
                  <Button
                    onClick={downloadImage}
                    disabled={generating}
                    className="flex-1 h-11 bg-slate-900 hover:bg-slate-800"
                  >
                    {generating ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4 mr-2" />
                        Download Image
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={copyImage}
                    disabled={generating}
                    variant="outline"
                    className="flex-1 h-11"
                  >
                    {copied ? (
                      <>
                        <Check className="w-4 h-4 mr-2" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Link2 className="w-4 h-4 mr-2" />
                        Copy Image
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* Social Sharing */}
              <div className="bg-slate-50 rounded-xl p-4">
                <h4 className="font-medium text-slate-700 mb-3 text-sm">Share to Social Media</h4>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    onClick={() => shareToSocial('twitter')}
                    className="p-4 bg-white hover:bg-slate-50 rounded-xl border border-slate-200 transition-colors flex flex-col items-center gap-2"
                  >
                    <div className="w-10 h-10 rounded-full bg-black flex items-center justify-center">
                      <span className="text-white font-bold text-sm">𝕏</span>
                    </div>
                    <span className="text-xs font-medium text-slate-700">X (Twitter)</span>
                  </button>
                  <button
                    onClick={() => shareToSocial('facebook')}
                    className="p-4 bg-white hover:bg-slate-50 rounded-xl border border-slate-200 transition-colors flex flex-col items-center gap-2"
                  >
                    <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center">
                      <span className="text-white font-bold text-sm">f</span>
                    </div>
                    <span className="text-xs font-medium text-slate-700">Facebook</span>
                  </button>
                  <button
                    onClick={() => shareToSocial('linkedin')}
                    className="p-4 bg-white hover:bg-slate-50 rounded-xl border border-slate-200 transition-colors flex flex-col items-center gap-2"
                  >
                    <div className="w-10 h-10 rounded-full bg-blue-700 flex items-center justify-center">
                      <span className="text-white font-bold text-sm">in</span>
                    </div>
                    <span className="text-xs font-medium text-slate-700">LinkedIn</span>
                  </button>
                </div>
              </div>

              {/* Note */}
              <div className="text-center text-xs text-slate-500 pt-2">
                Share responsibly. This card provides context, not definitive proof.
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}