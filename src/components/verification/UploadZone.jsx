import React, { useState, useCallback } from 'react';
import { Upload, Image, Video, Link2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import ContentModerator from '@/components/utils/ContentModerator';

export default function UploadZone({ onAnalysisStart, onFileReady }) {
  const [isDragging, setIsDragging] = useState(false);
  const [mode, setMode] = useState('upload'); // 'upload' or 'url'
  const [url, setUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');
  const [moderatingFile, setModeratingFile] = useState(null);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(async (e) => {
    e.preventDefault();
    setIsDragging(false);
    setError('');
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      await handleFile(files[0]);
    }
  }, []);

  const handleFileSelect = async (e) => {
    setError('');
    if (e.target.files && e.target.files[0]) {
      await handleFile(e.target.files[0]);
    }
  };

  const handleFile = async (file) => {
    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');
    
    if (!isImage && !isVideo) {
      setError('Please upload an image or video file');
      return;
    }

    // File size limits (25MB for images, 100MB for videos)
    const maxSize = isImage ? 25 * 1024 * 1024 : 100 * 1024 * 1024;
    if (file.size > maxSize) {
      setError(`File is too large. Maximum size: ${isImage ? '25MB' : '100MB'}`);
      return;
    }

    setIsUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      
      // Trigger moderation before proceeding
      setModeratingFile({
        file_url,
        content_type: isImage ? 'image' : 'video',
        type: isImage ? 'image' : 'video',
        source: 'upload'
      });
    } catch (err) {
      setError('Failed to upload file. Please try again.');
      setIsUploading(false);
    }
  };

  const handleUrlSubmit = () => {
    setError('');
    if (!url.trim()) {
      setError('Please enter a URL');
      return;
    }

    // Detect platform from URL
    let platform = 'unknown';
    const urlLower = url.toLowerCase();
    if (urlLower.includes('twitter.com') || urlLower.includes('x.com')) platform = 'twitter';
    else if (urlLower.includes('instagram.com')) platform = 'instagram';
    else if (urlLower.includes('facebook.com') || urlLower.includes('fb.com')) platform = 'facebook';
    else if (urlLower.includes('tiktok.com')) platform = 'tiktok';
    else if (urlLower.includes('youtube.com') || urlLower.includes('youtu.be')) platform = 'youtube';

    onFileReady({
      type: 'url',
      source_url: url,
      platform,
      source: 'url'
    });
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Mode Toggle */}
      <div className="flex justify-center mb-8">
        <div className="inline-flex bg-slate-100 rounded-full p-1">
          <button
            onClick={() => setMode('upload')}
            className={`px-6 py-2.5 rounded-full text-sm font-medium transition-all ${
              mode === 'upload' 
                ? 'bg-white text-slate-900 shadow-sm' 
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Upload File
          </button>
          <button
            onClick={() => setMode('url')}
            className={`px-6 py-2.5 rounded-full text-sm font-medium transition-all ${
              mode === 'url' 
                ? 'bg-white text-slate-900 shadow-sm' 
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Paste URL
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {mode === 'upload' ? (
          <motion.div
            key="upload"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`relative border-2 border-dashed rounded-2xl p-12 text-center transition-all cursor-pointer ${
                isDragging 
                  ? 'border-blue-400 bg-blue-50' 
                  : 'border-slate-200 hover:border-slate-300 bg-white'
              }`}
            >
              <input
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp,video/mp4,video/quicktime"
                onChange={handleFileSelect}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                disabled={isUploading}
              />
              
              {isUploading ? (
                <div className="flex flex-col items-center">
                  <Loader2 className="w-12 h-12 text-blue-500 animate-spin mb-4" />
                  <p className="text-slate-600 font-medium">Uploading...</p>
                </div>
              ) : (
                <>
                  <div className="flex justify-center gap-4 mb-6">
                    <div className="w-14 h-14 rounded-xl bg-slate-100 flex items-center justify-center">
                      <Image className="w-7 h-7 text-slate-400" />
                    </div>
                    <div className="w-14 h-14 rounded-xl bg-slate-100 flex items-center justify-center">
                      <Video className="w-7 h-7 text-slate-400" />
                    </div>
                  </div>
                  <p className="text-lg font-medium text-slate-800 mb-2">
                    Drop your image or video here
                  </p>
                  <p className="text-slate-500 mb-4">
                    or click to browse
                  </p>
                  <p className="text-xs text-slate-400">
                    Supports JPG, PNG, GIF, WebP, MP4, MOV (max 25MB images, 100MB videos)
                  </p>
                </>
              )}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="url"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="bg-white rounded-2xl p-8 border border-slate-200"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
                <Link2 className="w-5 h-5 text-slate-400" />
              </div>
              <div>
                <p className="font-medium text-slate-800">Paste a URL</p>
                <p className="text-sm text-slate-500">Direct link or social media post</p>
              </div>
            </div>
            
            <div className="flex gap-3">
              <Input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://..."
                className="flex-1 h-12 text-base border-slate-200 focus:border-blue-400 focus:ring-blue-100"
                onKeyDown={(e) => e.key === 'Enter' && handleUrlSubmit()}
              />
              <Button 
                onClick={handleUrlSubmit}
                className="h-12 px-6 bg-slate-900 hover:bg-slate-800"
              >
                Analyze
              </Button>
            </div>
            
            <div className="mt-4 flex flex-wrap gap-2">
              {['X/Twitter', 'Instagram', 'TikTok', 'YouTube', 'Facebook'].map((platform) => (
                <span 
                  key={platform}
                  className="px-3 py-1 bg-slate-50 text-slate-500 text-xs rounded-full"
                >
                  {platform}
                </span>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {error && (
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center text-red-500 text-sm mt-4"
        >
          {error}
        </motion.p>
      )}

      {/* Content Moderation Modal */}
      {moderatingFile && (
        <ContentModerator
          file_url={moderatingFile.file_url}
          content_type={moderatingFile.content_type}
          onComplete={(moderationResult) => {
            setIsUploading(false);
            setModeratingFile(null);
            
            if (moderationResult.approved || moderationResult.flagged) {
              onFileReady({
                ...moderatingFile,
                moderation: moderationResult.result
              });
            }
          }}
          onCancel={() => {
            setIsUploading(false);
            setModeratingFile(null);
            setError('Upload cancelled due to content policy violation');
          }}
        />
      )}
    </div>
  );
}