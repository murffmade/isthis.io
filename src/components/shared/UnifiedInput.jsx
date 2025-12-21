import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, Link as LinkIcon, FileText, Loader2, Image as ImageIcon, Video, AlertCircle } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

const tabs = [
  { id: 'upload', label: 'Upload', icon: Upload },
  { id: 'url', label: 'Link', icon: LinkIcon },
  { id: 'text', label: 'Text', icon: FileText }
];

export default function UnifiedInput({ mode, onSubmit, acceptTypes = ['image', 'video', 'url', 'text'] }) {
  const [activeTab, setActiveTab] = useState('upload');
  const [url, setUrl] = useState('');
  const [text, setText] = useState('');
  const [context, setContext] = useState('');
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const handleFileUpload = async (file) => {
    if (!file) return;

    // Check file type
    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');

    if (!isImage && !isVideo) {
      toast.error('Please upload an image or video file');
      return;
    }

    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      
      onSubmit({
        mode,
        input_type: isImage ? 'image' : 'video',
        input_value: file_url,
        context: context || null,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      toast.error('Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    
    const file = e.dataTransfer.files[0];
    if (file) handleFileUpload(file);
  };

  const handleSubmitUrl = () => {
    if (!url.trim()) {
      toast.error('Please enter a URL');
      return;
    }

    // Basic URL validation
    const urlPattern = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;
    if (!urlPattern.test(url.trim()) && !url.includes('://')) {
      toast.error('Please enter a valid URL (e.g., https://example.com)');
      return;
    }

    onSubmit({
      mode,
      input_type: 'url',
      input_value: url.trim(),
      context: context || null,
      timestamp: new Date().toISOString()
    });
  };

  const handleSubmitText = () => {
    if (!text.trim()) {
      toast.error('Please enter some text');
      return;
    }

    // Character limit validation
    if (text.length > 5000) {
      toast.error('Text is too long. Please limit to 5000 characters.');
      return;
    }

    if (text.trim().length < 10) {
      toast.error('Please enter at least 10 characters for meaningful analysis.');
      return;
    }

    onSubmit({
      mode,
      input_type: 'text',
      input_value: text.trim(),
      context: context || null,
      timestamp: new Date().toISOString()
    });
  };

  return (
    <div className="bg-white rounded-2xl border-2 border-slate-200 overflow-hidden">
      {/* Tabs */}
      <div className="flex border-b border-slate-200">
        {tabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2 px-6 py-4 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-slate-50 text-slate-900 border-b-2 border-slate-900'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div className="p-8">
        <AnimatePresence mode="wait">
          {activeTab === 'upload' && (
            <motion.div
              key="upload"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div
                onDragEnter={() => setDragActive(true)}
                onDragLeave={() => setDragActive(false)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-xl p-12 text-center transition-colors ${
                  dragActive
                    ? 'border-slate-400 bg-slate-50'
                    : 'border-slate-300 hover:border-slate-400'
                }`}
              >
                {uploading ? (
                  <div className="flex flex-col items-center gap-3">
                    <Loader2 className="w-10 h-10 text-slate-400 animate-spin" />
                    <p className="text-slate-600">Uploading...</p>
                  </div>
                ) : (
                  <>
                    <div className="flex justify-center gap-3 mb-4">
                      <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center">
                        <ImageIcon className="w-6 h-6 text-slate-600" />
                      </div>
                      <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center">
                        <Video className="w-6 h-6 text-slate-600" />
                      </div>
                    </div>
                    <p className="text-slate-900 font-medium mb-2">
                      Drop files here or click to upload
                    </p>
                    <p className="text-sm text-slate-500 mb-4">
                      Supports JPG, PNG, WebP, MP4, MOV
                    </p>
                    <input
                      type="file"
                      accept="image/*,video/*"
                      onChange={(e) => handleFileUpload(e.target.files[0])}
                      className="hidden"
                      id="file-upload"
                    />
                    <label
                      htmlFor="file-upload"
                      className="inline-block px-6 py-2 bg-slate-900 text-white rounded-xl font-medium cursor-pointer hover:bg-slate-800 transition-colors"
                    >
                      Choose File
                    </label>
                  </>
                )}
              </div>

              {mode !== 'real' && (
                <div className="mt-4">
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Context (optional)
                  </label>
                  <input
                    type="text"
                    value={context}
                    onChange={(e) => setContext(e.target.value)}
                    placeholder="Where did you find this? Any additional info..."
                    className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'url' && (
            <motion.div
              key="url"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Paste URL
                  </label>
                  <input
                    type="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://example.com/image.jpg"
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900"
                    onKeyPress={(e) => e.key === 'Enter' && handleSubmitUrl()}
                  />
                </div>

                {mode !== 'real' && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Context (optional)
                    </label>
                    <input
                      type="text"
                      value={context}
                      onChange={(e) => setContext(e.target.value)}
                      placeholder="Where did you find this? Any additional info..."
                      className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900"
                    />
                  </div>
                )}

                <button
                  onClick={handleSubmitUrl}
                  disabled={!url.trim()}
                  className="w-full py-3 bg-slate-900 text-white rounded-xl font-medium hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Analyze URL
                </button>
              </div>
            </motion.div>
          )}

          {activeTab === 'text' && (
            <motion.div
              key="text"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    {mode === 'true' ? 'Enter claim or text to verify' : 
                     mode === 'scam' ? 'Paste message or listing text' : 
                     'Describe your situation'}
                  </label>
                  <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder={
                      mode === 'true' ? 'e.g., "Scientists discovered a cure for the common cold"' :
                      mode === 'scam' ? 'Paste the full message, email, or listing text here' :
                      'Describe what you want to check for safety'
                    }
                    maxLength={5000}
                    rows={6}
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 resize-none"
                  />
                  <p className="text-xs text-slate-500 mt-1">{text.length}/5000 characters</p>
                </div>

                {mode !== 'real' && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Context (optional)
                    </label>
                    <input
                      type="text"
                      value={context}
                      onChange={(e) => setContext(e.target.value)}
                      placeholder="Who sent this? When? Platform? Any other details..."
                      className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900"
                    />
                  </div>
                )}

                <button
                  onClick={handleSubmitText}
                  disabled={!text.trim()}
                  className="w-full py-3 bg-slate-900 text-white rounded-xl font-medium hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Analyze Text
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}