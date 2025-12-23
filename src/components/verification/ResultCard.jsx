import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, AlertTriangle, HelpCircle, ChevronRight, Info, Download, Copy, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import html2canvas from 'html2canvas';
import ShareCard from './ShareCard';

const resultConfig = {
  likely_real: {
    icon: CheckCircle2,
    title: 'Likely Real',
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50',
    borderColor: 'border-emerald-200',
    description: 'This content appears to be authentic based on our analysis.'
  },
  likely_ai: {
    icon: AlertTriangle,
    title: 'Likely AI-Generated',
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200',
    description: 'This content shows signs of being created or modified by AI.'
  },
  uncertain: {
    icon: HelpCircle,
    title: 'Uncertain',
    color: 'text-slate-600',
    bgColor: 'bg-slate-50',
    borderColor: 'border-slate-200',
    description: 'We cannot determine with confidence whether this content is authentic or AI-generated.'
  }
};

const severityColors = {
  low: 'bg-slate-100 text-slate-600',
  medium: 'bg-amber-100 text-amber-700',
  high: 'bg-red-100 text-red-700'
};

// Helper function to add contextual explanations in plain English
function getSignalContext(signalType, description, isAIGenerated) {
  const lowerSignal = (signalType + ' ' + description).toLowerCase();
  
  // AI indicators
  if (lowerSignal.includes('symmetry') || lowerSignal.includes('symmetric')) {
    return 'A.I. often creates faces that are too perfectly symmetrical. Real faces have natural differences between left and right sides.';
  }
  if (lowerSignal.includes('skin') && (lowerSignal.includes('smooth') || lowerSignal.includes('plastic') || lowerSignal.includes('perfect'))) {
    return 'A.I. often smooths skin too much, removing natural pores and tiny imperfections that real skin has.';
  }
  if (lowerSignal.includes('finger') || lowerSignal.includes('hand')) {
    return 'Hands and fingers are very difficult for A.I. to create correctly - they often have extra or missing fingers.';
  }
  if (lowerSignal.includes('background') && (lowerSignal.includes('melt') || lowerSignal.includes('incoher') || lowerSignal.includes('blur'))) {
    return 'A.I. often struggles with background details, creating blurry or strange edges around the subject.';
  }
  if (lowerSignal.includes('lighting') && lowerSignal.includes('inconsistent')) {
    return 'Real photos have light coming from one direction. A.I. sometimes creates impossible lighting from multiple sources.';
  }
  if (lowerSignal.includes('text') || lowerSignal.includes('letter') || lowerSignal.includes('garbled')) {
    return 'A.I. frequently creates nonsensical or scrambled text in images - it can\'t spell properly yet.';
  }
  if (lowerSignal.includes('repetitive') || lowerSignal.includes('pattern')) {
    return 'A.I. sometimes creates unnatural repeating patterns, especially in backgrounds or textures.';
  }
  if (lowerSignal.includes('teeth') && lowerSignal.includes('perfect')) {
    return 'Real teeth have natural variations in color and alignment. A.I. often makes them too uniform and perfect.';
  }
  
  // Real indicators
  if (lowerSignal.includes('exif') || lowerSignal.includes('metadata')) {
    return 'Camera information (called EXIF data) is automatically saved in real photos taken with cameras or phones. A.I. images typically don\'t have this.';
  }
  if (lowerSignal.includes('compression') || lowerSignal.includes('artifact') || lowerSignal.includes('jpeg')) {
    return 'Real photos have natural compression patterns from how cameras save images. A.I. images often lack these technical fingerprints.';
  }
  if (lowerSignal.includes('pore') || lowerSignal.includes('texture') && lowerSignal.includes('natural')) {
    return 'Visible skin pores and natural texture are signs of authentic photography - A.I. often misses these tiny details.';
  }
  if (lowerSignal.includes('asymmetr') && !lowerSignal.includes('lack')) {
    return 'Natural facial asymmetry (one side slightly different from the other) is a strong sign of a real photo.';
  }
  if (lowerSignal.includes('motion blur') || lowerSignal.includes('focus')) {
    return 'Natural camera blur and focus effects come from real camera lenses - A.I. often gets this wrong.';
  }
  if (lowerSignal.includes('wrinkle') || lowerSignal.includes('wear') || lowerSignal.includes('imperfection')) {
    return 'Physical wear and natural imperfections are signs of real objects and people - A.I. tends to make things too perfect.';
  }
  if (lowerSignal.includes('chromatic aberration') || lowerSignal.includes('lens distortion')) {
    return 'Real camera lenses create subtle color fringing and warping at the edges that A.I. typically doesn\'t replicate.';
  }
  
  return null; // No additional context
}

export default function ResultCard({ result, onTakeAction, onStartOver }) {
  const shareCardRef = useRef(null);
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const config = resultConfig[result.result] || resultConfig.uncertain;
  const Icon = config.icon;
  const showActionButton = result.result === 'likely_ai' && result.claims_to_be_real;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="w-full max-w-2xl mx-auto"
    >
      {/* Analyzed Image */}
      {(result.file_url || result.thumbnail_url) && (
        <div className="mb-6 rounded-2xl overflow-hidden border border-slate-200 bg-white shadow-sm">
          <img 
            src={result.file_url || result.thumbnail_url} 
            alt="Analyzed content"
            className="w-full h-auto max-h-96 object-contain"
          />
        </div>
      )}

      {/* Main Result Card */}
      <div className={`rounded-2xl border-2 ${config.borderColor} ${config.bgColor} p-8 mb-6`}>
        <div className="flex items-start gap-5">
          <div className={`w-16 h-16 rounded-2xl bg-white flex items-center justify-center shadow-sm`}>
            <Icon className={`w-8 h-8 ${config.color}`} />
          </div>
          <div className="flex-1">
            <h2 className={`text-2xl font-bold ${config.color} mb-1`}>
              {config.title}
            </h2>
            <p className="text-slate-600">
              {config.description}
            </p>
          </div>
        </div>

        {/* Confidence Score */}
        <div className="mt-6 pt-6 border-t border-white/50">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-slate-700">Confidence Estimate</span>
            <span className={`text-lg font-bold ${config.color}`}>{result.confidence}%</span>
          </div>
          <div className="h-2 bg-white rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${result.confidence}%` }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className={`h-full rounded-full ${
                result.result === 'likely_real' ? 'bg-emerald-500' :
                result.result === 'likely_ai' ? 'bg-amber-500' : 'bg-orange-500'
              }`}
            />
          </div>
        </div>
      </div>

      {/* Signals Section */}
      {result.signals && result.signals.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-6">
          <h3 className="font-semibold text-slate-800 mb-4">What we found</h3>
          <div className="space-y-3">
            {result.signals.map((signal, index) => {
              const context = getSignalContext(signal.signal_type, signal.description, result.result === 'likely_ai');
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-start gap-3 p-3 rounded-xl bg-slate-50"
                >
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${severityColors[signal.severity]}`}>
                    {signal.severity}
                  </span>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-700">{signal.signal_type}</p>
                    <p className="text-sm text-slate-500">{signal.description}</p>
                    {context && (
                      <p className="text-xs text-slate-400 mt-1 italic">💡 {context}</p>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* Summary */}
      {result.summary && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-6">
          <h3 className="font-semibold text-slate-800 mb-3">Summary</h3>
          <p className="text-slate-600 leading-relaxed">{result.summary}</p>
        </div>
      )}

      {/* How We Scored This */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-6">
        <h3 className="font-semibold text-slate-800 mb-3">How We Scored This</h3>
        <div className="space-y-3 text-sm text-slate-600">
          <p>
            Our system gives each image a score between 0 and 100:
          </p>
          <ul className="space-y-2 ml-4">
            <li className="flex items-start gap-2">
              <span className="text-emerald-600 font-bold">•</span>
              <span><strong>Likely Real (0-42):</strong> Shows strong signs of being authentic, like camera information, natural imperfections, and realistic lighting.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-amber-600 font-bold">•</span>
              <span><strong>Likely A.I. (58-100):</strong> Shows typical computer-generated patterns, like overly perfect symmetry, unnatural smoothness, or impossible details.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-slate-600 font-bold">•</span>
              <span><strong>Uncertain (43-57):</strong> Mixed signals or not enough clear evidence to make a confident determination.</span>
            </li>
          </ul>
          {result.score && (
            <div className="pt-4 border-t border-slate-100">
              <p className="font-semibold text-slate-900 mb-3">
                This image scored: {result.score}/100
              </p>

              {/* Visual Score Bar */}
              <div className="relative">
                <div className="flex justify-between text-xs font-medium mb-2">
                  <span className="text-emerald-600">Real</span>
                  <span className="text-amber-600">A.I.</span>
                </div>
                <div className="h-3 rounded-full overflow-hidden bg-gradient-to-r from-emerald-500 via-slate-300 to-amber-500">
                  {/* Score indicator */}
                  <div 
                    className="absolute top-8 -translate-x-1/2 flex flex-col items-center"
                    style={{ left: `${result.score}%` }}
                  >
                    <div className="w-0.5 h-4 bg-slate-900"></div>
                    <div className="w-8 h-8 rounded-full bg-slate-900 flex items-center justify-center text-white text-xs font-bold shadow-lg">
                      {result.score}
                    </div>
                  </div>
                </div>
                <div className="flex justify-between text-xs text-slate-500 mt-1">
                  <span>0</span>
                  <span>50</span>
                  <span>100</span>
                </div>
              </div>

              <p className="text-slate-600 mt-6">
                {result.score >= 58 && '⚠️ This score indicates the image was likely created by artificial intelligence.'}
                {result.score <= 42 && '✓ This score indicates the image appears to be authentic.'}
                {result.score > 42 && result.score < 58 && '❓ This score falls in the uncertain range - we found conflicting evidence.'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Disclaimer */}
      <div className="flex items-start gap-3 p-4 rounded-xl bg-slate-50 mb-6">
        <Info className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
        <p className="text-xs text-slate-500 leading-relaxed">
          AI analysis isn't perfect and may be wrong. This assessment should not be used as proof. Always check multiple sources when evaluating if content is real.
        </p>
      </div>

      {/* Share Section */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-6">
        <h3 className="font-semibold text-slate-800 mb-4">Share This Verification</h3>

        {/* Download & Copy */}
        <div className="mb-4">
          <h4 className="text-sm font-medium text-slate-600 mb-3">Save or Copy</h4>
          <div className="flex gap-3">
            <Button
              onClick={async () => {
                setGenerating(true);
                try {
                  const cardElement = shareCardRef.current;
                  const canvas = await html2canvas(cardElement, {
                    backgroundColor: null,
                    scale: 2,
                    logging: false
                  });
                  const url = canvas.toDataURL('image/png');
                  const link = document.createElement('a');
                  link.download = `is-this-real-verification-${Date.now()}.png`;
                  link.href = url;
                  link.click();
                  toast.success('Image downloaded');
                } catch (error) {
                  toast.error('Failed to download image');
                } finally {
                  setGenerating(false);
                }
              }}
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
              onClick={async () => {
                setGenerating(true);
                try {
                  const cardElement = shareCardRef.current;
                  const canvas = await html2canvas(cardElement, {
                    backgroundColor: null,
                    scale: 2,
                    logging: false
                  });
                  const url = canvas.toDataURL('image/png');
                  const blob = await (await fetch(url)).blob();
                  await navigator.clipboard.write([
                    new ClipboardItem({ 'image/png': blob })
                  ]);
                  setCopied(true);
                  toast.success('Image copied to clipboard');
                  setTimeout(() => setCopied(false), 2000);
                } catch (error) {
                  toast.error('Failed to copy image. Try downloading instead.');
                } finally {
                  setGenerating(false);
                }
              }}
              disabled={generating}
              variant="outline"
              className="flex-1 h-11"
            >
              {copied ? (
                <>
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 mr-2" />
                  Copy Image
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Social Sharing */}
        <div>
          <h4 className="text-sm font-medium text-slate-600 mb-3">Share to Social Media</h4>
          <div className="grid grid-cols-3 gap-3">
            <button
              onClick={() => {
                const appUrl = window.location.origin;
                const text = `I verified content using Is This Real? Result: ${config.title} (${result.confidence}% confidence)`;
                window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(appUrl)}`, '_blank', 'width=600,height=400');
              }}
              className="p-3 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 transition-colors flex flex-col items-center gap-2"
            >
              <div className="w-8 h-8 rounded-full bg-black flex items-center justify-center">
                <span className="text-white font-bold text-xs">𝕏</span>
              </div>
              <span className="text-xs font-medium text-slate-700">X (Twitter)</span>
            </button>
            <button
              onClick={() => {
                const appUrl = window.location.origin;
                const text = `I verified content using Is This Real? Result: ${config.title} (${result.confidence}% confidence)`;
                window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(appUrl)}&quote=${encodeURIComponent(text)}`, '_blank', 'width=600,height=400');
              }}
              className="p-3 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 transition-colors flex flex-col items-center gap-2"
            >
              <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center">
                <span className="text-white font-bold text-xs">f</span>
              </div>
              <span className="text-xs font-medium text-slate-700">Facebook</span>
            </button>
            <button
              onClick={() => {
                const appUrl = window.location.origin;
                window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(appUrl)}`, '_blank', 'width=600,height=400');
              }}
              className="p-3 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 transition-colors flex flex-col items-center gap-2"
            >
              <div className="w-8 h-8 rounded-full bg-blue-700 flex items-center justify-center">
                <span className="text-white font-bold text-xs">in</span>
              </div>
              <span className="text-xs font-medium text-slate-700">LinkedIn</span>
            </button>
          </div>
        </div>

        {/* Note */}
        <div className="text-center text-xs text-slate-500 mt-4">
          Share responsibly. This card provides context, not definitive proof.
        </div>
      </div>

      {/* Hidden ShareCard for image generation */}
      <div style={{ position: 'absolute', left: '-9999px', top: 0 }}>
        <ShareCard result={result} cardRef={shareCardRef} />
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3">
        {showActionButton && (
          <Button 
            onClick={onTakeAction}
            className="flex-1 h-12 bg-slate-900 hover:bg-slate-800 text-white"
          >
            Report Options
            <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        )}
        <Button 
          onClick={onStartOver}
          variant="outline"
          className="flex-1 h-12 border-slate-200 hover:bg-slate-50"
        >
          Check Another
        </Button>
      </div>
    </motion.div>
  );
}