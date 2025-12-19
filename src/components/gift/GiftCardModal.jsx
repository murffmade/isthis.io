import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, Mail, Copy, Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import html2canvas from 'html2canvas';
import GiftCard from './GiftCard';

const themes = [
  { id: 'christmas', name: 'Christmas', emoji: '🎄', color: 'from-red-500 to-green-500' },
  { id: 'hanukkah', name: 'Hanukkah', emoji: '🕎', color: 'from-blue-500 to-blue-300' },
  { id: 'kwanzaa', name: 'Kwanzaa', emoji: '🕯️', color: 'from-red-500 via-green-500 to-black' },
  { id: 'general', name: 'Happy Holidays', emoji: '🎁', color: 'from-slate-700 to-slate-900' }
];

export default function GiftCardModal({ plan, onClose }) {
  const cardRef = useRef(null);
  const [step, setStep] = useState('customize'); // customize, preview, share
  const [theme, setTheme] = useState('general');
  const [recipientName, setRecipientName] = useState('');
  const [message, setMessage] = useState('');
  const [generating, setGenerating] = useState(false);
  const [imageUrl, setImageUrl] = useState(null);
  const [copied, setCopied] = useState(false);

  const generateImage = async () => {
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
      toast.error('Failed to generate card');
      return null;
    } finally {
      setGenerating(false);
    }
  };

  const handlePreview = () => {
    setStep('preview');
  };

  const handleDownload = async () => {
    const url = imageUrl || await generateImage();
    if (!url) return;

    const link = document.createElement('a');
    link.download = `is-this-real-gift-${Date.now()}.png`;
    link.href = url;
    link.click();
    toast.success('Gift card downloaded!');
  };

  const handleCopyLink = async () => {
    const giftUrl = `${window.location.origin}/?gift=${plan.id}`;
    await navigator.clipboard.writeText(giftUrl);
    setCopied(true);
    toast.success('Link copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleEmailShare = () => {
    const subject = encodeURIComponent('A Gift for You - Is This Real? Premium');
    const body = encodeURIComponent(
      `${recipientName ? `Hi ${recipientName},\n\n` : ''}I got you a gift! 🎁\n\n${message}\n\nYou now have ${plan.duration} of Is This Real? Premium access. Visit the link to activate your gift and start verifying content with AI-powered tools.\n\nHappy Holidays!`
    );
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-6"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white rounded-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
            <div>
              <h3 className="font-semibold text-slate-800">
                {step === 'customize' ? 'Customize Your Gift Card' : 'Your Gift Card'}
              </h3>
              <p className="text-sm text-slate-500">{plan.name}</p>
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
            {step === 'customize' && (
              <div className="grid md:grid-cols-2 gap-8">
                {/* Customization Form */}
                <div className="space-y-6">
                  <div>
                    <Label className="text-slate-700 mb-2">Choose Holiday Theme</Label>
                    <div className="grid grid-cols-2 gap-3 mt-2">
                      {themes.map((t) => (
                        <button
                          key={t.id}
                          onClick={() => setTheme(t.id)}
                          className={`p-4 rounded-xl border-2 transition-all ${
                            theme === t.id
                              ? 'border-slate-900 bg-slate-50'
                              : 'border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <div className="text-2xl mb-2">{t.emoji}</div>
                          <div className="font-medium text-sm text-slate-700">{t.name}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="recipientName" className="text-slate-700">
                      Recipient Name (Optional)
                    </Label>
                    <Input
                      id="recipientName"
                      placeholder="e.g., Sarah"
                      value={recipientName}
                      onChange={(e) => setRecipientName(e.target.value)}
                      className="mt-2"
                    />
                  </div>

                  <div>
                    <Label htmlFor="message" className="text-slate-700">
                      Personal Message (Optional)
                    </Label>
                    <Textarea
                      id="message"
                      placeholder="Write a personal message for your gift recipient..."
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      className="mt-2 h-24"
                    />
                  </div>

                  <Button
                    onClick={handlePreview}
                    className="w-full h-12 bg-slate-900 hover:bg-slate-800"
                  >
                    Preview Gift Card
                  </Button>
                </div>

                {/* Live Preview */}
                <div className="flex items-center justify-center bg-slate-50 rounded-xl p-6">
                  <div style={{ transform: 'scale(0.55)', transformOrigin: 'center' }}>
                    <GiftCard
                      theme={theme}
                      plan={plan}
                      recipientName={recipientName}
                      message={message}
                      cardRef={cardRef}
                    />
                  </div>
                </div>
              </div>
            )}

            {step === 'preview' && (
              <div className="space-y-6">
                {/* Full Preview */}
                <div className="flex justify-center bg-slate-50 rounded-xl p-8">
                  <div style={{ transform: 'scale(0.7)', transformOrigin: 'top center' }}>
                    <GiftCard
                      theme={theme}
                      plan={plan}
                      recipientName={recipientName}
                      message={message}
                      cardRef={cardRef}
                    />
                  </div>
                </div>

                {/* Sharing Options */}
                <div className="bg-slate-50 rounded-xl p-6">
                  <h4 className="font-semibold text-slate-800 mb-4">Share Your Gift</h4>
                  <div className="grid sm:grid-cols-3 gap-3">
                    <Button
                      onClick={handleDownload}
                      disabled={generating}
                      className="h-11 bg-slate-900 hover:bg-slate-800"
                    >
                      {generating ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Download className="w-4 h-4 mr-2" />
                      )}
                      Download
                    </Button>
                    <Button
                      onClick={handleEmailShare}
                      variant="outline"
                      className="h-11"
                    >
                      <Mail className="w-4 h-4 mr-2" />
                      Email
                    </Button>
                    <Button
                      onClick={handleCopyLink}
                      variant="outline"
                      className="h-11"
                    >
                      {copied ? (
                        <>
                          <Check className="w-4 h-4 mr-2" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4 mr-2" />
                          Copy Link
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button
                    onClick={() => setStep('customize')}
                    variant="outline"
                    className="flex-1 h-11"
                  >
                    Edit Card
                  </Button>
                  <Button
                    onClick={onClose}
                    className="flex-1 h-11 bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    Done
                  </Button>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}