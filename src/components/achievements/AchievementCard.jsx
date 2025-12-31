import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Share2, CheckCircle2, Lock, Download, Linkedin, Twitter, Facebook } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import html2canvas from 'html2canvas';

const BADGE_DESIGNS = {
  'spot-the-deepfake': {
    gradient: 'from-purple-500 via-pink-500 to-red-500',
    icon: '🔍',
    title: 'Deepfake Detective',
    color: 'purple'
  },
  'how-ai-works': {
    gradient: 'from-blue-500 via-cyan-500 to-teal-500',
    icon: '🧠',
    title: 'AI Expert',
    color: 'blue'
  },
  'detection-signals': {
    gradient: 'from-emerald-500 via-green-500 to-lime-500',
    icon: '🎯',
    title: 'Signal Master',
    color: 'green'
  }
};

export default function AchievementCard({ achievement, unlocked = false, size = 'md' }) {
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const design = BADGE_DESIGNS[achievement.module_slug] || {
    gradient: 'from-slate-500 to-slate-700',
    icon: '🏆',
    title: 'Achievement',
    color: 'slate'
  };

  const sizes = {
    sm: 'w-20 h-20 text-2xl',
    md: 'w-32 h-32 text-4xl',
    lg: 'w-40 h-40 text-5xl'
  };

  const handleDownloadBadge = async () => {
    setDownloading(true);
    try {
      const element = document.getElementById(`badge-${achievement.id}`);
      if (!element) return;

      const canvas = await html2canvas(element, {
        backgroundColor: null,
        scale: 3
      });

      const link = document.createElement('a');
      link.download = `${achievement.name.replace(/\s+/g, '-')}-badge.png`;
      link.href = canvas.toDataURL();
      link.click();

      toast.success('Badge downloaded!');
    } catch (error) {
      toast.error('Failed to download badge');
    } finally {
      setDownloading(false);
    }
  };

  const handleShare = (platform) => {
    const text = `I just earned the "${achievement.name}" badge on IsThis.io! 🏆`;
    const url = 'https://isthis.io/learn';

    const shareUrls = {
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}&summary=${encodeURIComponent(text)}`,
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(text)}`
    };

    window.open(shareUrls[platform], '_blank', 'width=600,height=400');
    setShowShareMenu(false);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText('https://isthis.io/learn');
    toast.success('Link copied to clipboard!');
    setShowShareMenu(false);
  };

  return (
    <div className="relative">
      <motion.div
        id={`badge-${achievement.id}`}
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className={`relative ${unlocked ? '' : 'opacity-50'}`}
      >
        <div className={`${sizes[size]} rounded-full bg-gradient-to-br ${design.gradient} flex items-center justify-center shadow-xl border-4 border-white relative overflow-hidden`}>
          {!unlocked && (
            <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center">
              <Lock className="w-8 h-8 text-white" />
            </div>
          )}
          <span className={unlocked ? '' : 'blur-sm'}>{design.icon}</span>
        </div>

        {unlocked && achievement.earned_at && (
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-3 py-1 bg-white rounded-full shadow-md border-2 border-slate-200">
            <p className="text-xs font-bold text-slate-700 whitespace-nowrap">
              {new Date(achievement.earned_at).toLocaleDateString()}
            </p>
          </div>
        )}
      </motion.div>

      {unlocked && (
        <div className="mt-4 space-y-2">
          <div className="relative">
            <Button
              onClick={() => setShowShareMenu(!showShareMenu)}
              variant="outline"
              size="sm"
              className="w-full"
            >
              <Share2 className="w-4 h-4 mr-2" />
              Share Achievement
            </Button>

            {showShareMenu && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute bottom-full left-0 right-0 mb-2 bg-white rounded-xl shadow-xl border-2 border-slate-200 p-3 z-10"
              >
                <div className="space-y-2">
                  <button
                    onClick={() => handleShare('linkedin')}
                    className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-blue-50 transition-colors"
                  >
                    <Linkedin className="w-5 h-5 text-blue-700" />
                    <span className="text-sm font-medium text-slate-700">LinkedIn</span>
                  </button>
                  <button
                    onClick={() => handleShare('twitter')}
                    className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-sky-50 transition-colors"
                  >
                    <Twitter className="w-5 h-5 text-sky-600" />
                    <span className="text-sm font-medium text-slate-700">Twitter</span>
                  </button>
                  <button
                    onClick={() => handleShare('facebook')}
                    className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-blue-50 transition-colors"
                  >
                    <Facebook className="w-5 h-5 text-blue-600" />
                    <span className="text-sm font-medium text-slate-700">Facebook</span>
                  </button>
                  <button
                    onClick={handleDownloadBadge}
                    disabled={downloading}
                    className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    <Download className="w-5 h-5 text-slate-600" />
                    <span className="text-sm font-medium text-slate-700">
                      {downloading ? 'Downloading...' : 'Download Badge'}
                    </span>
                  </button>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}