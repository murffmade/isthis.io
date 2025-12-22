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
  { id: 'christmas', name: 'Christmas', emoji: '🎄', color: 'from-red-500 to-green-500', animated: true },
  { id: 'hanukkah', name: 'Hanukkah', emoji: '🕎', color: 'from-blue-500 to-blue-300', animated: true },
  { id: 'kwanzaa', name: 'Kwanzaa', emoji: '🕯️', color: 'from-red-500 via-green-500 to-black', animated: true },
  { id: 'newyear', name: 'New Year', emoji: '🎉', color: 'from-purple-500 to-pink-500', animated: true },
  { id: 'winter', name: 'Winter', emoji: '❄️', color: 'from-cyan-400 to-blue-600', animated: true },
  { id: 'festive', name: 'Festive', emoji: '✨', color: 'from-amber-400 to-orange-500', animated: true },
  { id: 'elegant', name: 'Elegant', emoji: '💎', color: 'from-slate-800 to-slate-600', animated: false },
  { id: 'general', name: 'Happy Holidays', emoji: '🎁', color: 'from-slate-700 to-slate-900', animated: false }
];

const fontStyles = [
  { id: 'modern', name: 'Modern', family: 'Inter, sans-serif' },
  { id: 'elegant', name: 'Elegant', family: 'Georgia, serif' },
  { id: 'playful', name: 'Playful', family: 'Comic Sans MS, cursive' },
  { id: 'classic', name: 'Classic', family: 'Times New Roman, serif' }
];

const soundEffects = [
  { id: 'none', name: 'No Sound', icon: '🔇' },
  { id: 'jingle', name: 'Jingle Bells', icon: '🔔' },
  { id: 'cheer', name: 'Holiday Cheer', icon: '🎵' },
  { id: 'celebration', name: 'Celebration', icon: '🎊' }
];

export default function GiftCardModal({ plan, onClose }) {
  const cardRef = useRef(null);
  const [step, setStep] = useState('customize'); // customize, preview, share
  const [theme, setTheme] = useState('general');
  const [recipientName, setRecipientName] = useState('');
  const [message, setMessage] = useState('');
  const [fontStyle, setFontStyle] = useState('modern');
  const [nameFontSize, setNameFontSize] = useState(18);
  const [messageFontSize, setMessageFontSize] = useState(14);
  const [soundEffect, setSoundEffect] = useState('none');
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

  const generateUniqueLink = () => {
    const giftId = `gift_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    return `${window.location.origin}/?gift=${giftId}&plan=${plan.id}`;
  };

  const handleCopyLink = async () => {
    const giftUrl = generateUniqueLink();
    await navigator.clipboard.writeText(giftUrl);
    setCopied(true);
    toast.success('Unique gift link copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleEmailShare = () => {
    const subject = encodeURIComponent('A Gift for You - Is This Real? Premium');
    const body = encodeURIComponent(
      `${recipientName ? `Hi ${recipientName},\n\n` : ''}I got you a gift! 🎁\n\n${message}\n\nYou now have ${plan.duration} of Is This Real? Premium access. Visit the link to activate your gift and start verifying content with AI-powered tools.\n\nHappy Holidays!`
    );
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  const shareToSocialMedia = (platform) => {
    const giftUrl = generateUniqueLink();
    const text = encodeURIComponent(`🎁 I'm gifting ${plan.duration} of IsThis.io Premium! Help verify what's real online. ${message ? message : ''}`);
    
    const urls = {
      twitter: `https://twitter.com/intent/tweet?text=${text}&url=${encodeURIComponent(giftUrl)}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(giftUrl)}&quote=${text}`,
      whatsapp: `https://wa.me/?text=${text}%20${encodeURIComponent(giftUrl)}`,
      telegram: `https://t.me/share/url?url=${encodeURIComponent(giftUrl)}&text=${text}`,
      tiktok: `https://www.tiktok.com/share?url=${encodeURIComponent(giftUrl)}&text=${text}`,
      instagram: null
    };

    if (platform === 'instagram') {
      toast.info('Download the gift card and share it on Instagram Stories!');
    } else {
      window.open(urls[platform], '_blank', 'width=600,height=400');
    }
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
                <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-2">
                  <div>
                    <Label className="text-slate-700 mb-2">Choose Holiday Theme</Label>
                    <div className="grid grid-cols-2 gap-3 mt-2">
                      {themes.map((t) => (
                        <button
                          key={t.id}
                          onClick={() => setTheme(t.id)}
                          className={`p-4 rounded-xl border-2 transition-all relative ${
                            theme === t.id
                              ? 'border-slate-900 bg-slate-50'
                              : 'border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          {t.animated && (
                            <span className="absolute top-2 right-2 text-xs bg-purple-500 text-white px-2 py-0.5 rounded-full">
                              ✨
                            </span>
                          )}
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

                  <div>
                    <Label className="text-slate-700 mb-2">Font Style</Label>
                    <div className="grid grid-cols-2 gap-3 mt-2">
                      {fontStyles.map((font) => (
                        <button
                          key={font.id}
                          onClick={() => setFontStyle(font.id)}
                          className={`p-3 rounded-xl border-2 transition-all ${
                            fontStyle === font.id
                              ? 'border-slate-900 bg-slate-50'
                              : 'border-slate-200 hover:border-slate-300'
                          }`}
                          style={{ fontFamily: font.family }}
                        >
                          <div className="font-medium text-sm text-slate-700">{font.name}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="nameFontSize" className="text-slate-700">
                        Name Size: {nameFontSize}px
                      </Label>
                      <input
                        id="nameFontSize"
                        type="range"
                        min="14"
                        max="28"
                        value={nameFontSize}
                        onChange={(e) => setNameFontSize(Number(e.target.value))}
                        className="w-full mt-2"
                      />
                    </div>
                    <div>
                      <Label htmlFor="messageFontSize" className="text-slate-700">
                        Message Size: {messageFontSize}px
                      </Label>
                      <input
                        id="messageFontSize"
                        type="range"
                        min="12"
                        max="20"
                        value={messageFontSize}
                        onChange={(e) => setMessageFontSize(Number(e.target.value))}
                        className="w-full mt-2"
                      />
                    </div>
                  </div>

                  <div>
                    <Label className="text-slate-700 mb-2">Background Sound</Label>
                    <div className="grid grid-cols-2 gap-3 mt-2">
                      {soundEffects.map((sound) => (
                        <button
                          key={sound.id}
                          onClick={() => setSoundEffect(sound.id)}
                          className={`p-3 rounded-xl border-2 transition-all ${
                            soundEffect === sound.id
                              ? 'border-slate-900 bg-slate-50'
                              : 'border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <div className="text-xl mb-1">{sound.icon}</div>
                          <div className="font-medium text-xs text-slate-700">{sound.name}</div>
                        </button>
                      ))}
                    </div>
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
                      fontStyle={fontStyle}
                      nameFontSize={nameFontSize}
                      messageFontSize={messageFontSize}
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
                      fontStyle={fontStyle}
                      nameFontSize={nameFontSize}
                      messageFontSize={messageFontSize}
                      cardRef={cardRef}
                    />
                  </div>
                </div>

                {soundEffect !== 'none' && (
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-center">
                    <p className="text-sm text-blue-700">
                      🎵 <strong>{soundEffects.find(s => s.id === soundEffect)?.name}</strong> will play when the recipient opens this card
                    </p>
                  </div>
                )}

                {/* Sharing Options */}
                <div className="bg-slate-50 rounded-xl p-6">
                  <h4 className="font-semibold text-slate-800 mb-4">Share Your Gift</h4>
                  <div className="grid sm:grid-cols-3 gap-3 mb-4">
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

                  <div className="border-t pt-4">
                    <p className="text-sm font-medium text-slate-600 mb-3">Share on social media:</p>
                    <div className="grid grid-cols-6 gap-2">
                      <button
                        onClick={() => shareToSocialMedia('twitter')}
                        className="aspect-square flex items-center justify-center bg-black hover:bg-gray-800 text-white rounded-lg transition-colors font-bold text-lg"
                        title="Share on X"
                      >
                        𝕏
                      </button>
                      <button
                        onClick={() => shareToSocialMedia('facebook')}
                        className="aspect-square flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-xs font-semibold"
                        title="Share on Facebook"
                      >
                        Facebook
                      </button>
                      <button
                        onClick={() => shareToSocialMedia('tiktok')}
                        className="aspect-square flex items-center justify-center bg-black hover:bg-gray-800 text-white rounded-lg transition-colors text-xs font-semibold"
                        title="Share on TikTok"
                      >
                        TikTok
                      </button>
                      <button
                        onClick={() => shareToSocialMedia('instagram')}
                        className="aspect-square flex items-center justify-center bg-gradient-to-br from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-lg transition-colors text-xs font-semibold"
                        title="Share on Instagram"
                      >
                        IG
                      </button>
                      <button
                        onClick={() => shareToSocialMedia('whatsapp')}
                        className="aspect-square flex items-center justify-center bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors text-xs font-semibold"
                        title="Share on WhatsApp"
                      >
                        WA
                      </button>
                      <button
                        onClick={() => shareToSocialMedia('telegram')}
                        className="aspect-square flex items-center justify-center bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors text-xs font-semibold"
                        title="Share on Telegram"
                      >
                        TG
                      </button>
                    </div>
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