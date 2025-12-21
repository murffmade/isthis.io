import React, { useState } from 'react';
import { Upload, X, FileText, Image as ImageIcon, Video, Link as LinkIcon, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

const MAX_BATCH_SIZE = 1000;

export default function BatchUpload({ mode, onSubmit, onBack }) {
  const [batchName, setBatchName] = useState('');
  const [items, setItems] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [textInput, setTextInput] = useState('');
  const [error, setError] = useState('');

  const handleFileUpload = async (files) => {
    if (items.length + files.length > MAX_BATCH_SIZE) {
      setError(`Cannot exceed ${MAX_BATCH_SIZE} items per batch`);
      toast.error(`Maximum ${MAX_BATCH_SIZE} items allowed`);
      return;
    }
    
    setError('');
    setUploading(true);
    const newItems = [];

    for (const file of Array.from(files)) {
      try {
        const { file_url } = await base44.integrations.Core.UploadFile({ file });
        newItems.push({
          input_type: file.type.startsWith('image/') ? 'image' : 'video',
          input_value: file_url,
          name: file.name
        });
      } catch (error) {
        toast.error(`Failed to upload ${file.name}`);
      }
    }

    setItems([...items, ...newItems]);
    setUploading(false);
  };

  const handleAddUrl = () => {
    if (!urlInput.trim()) return;
    
    const urls = urlInput.split('\n').filter(u => u.trim());
    
    if (items.length + urls.length > MAX_BATCH_SIZE) {
      setError(`Cannot exceed ${MAX_BATCH_SIZE} items per batch`);
      toast.error(`Maximum ${MAX_BATCH_SIZE} items allowed`);
      return;
    }
    
    setError('');
    const newItems = urls.map(url => ({
      input_type: 'url',
      input_value: url.trim(),
      name: url.trim().substring(0, 50)
    }));

    setItems([...items, ...newItems]);
    setUrlInput('');
  };

  const handleAddText = () => {
    if (!textInput.trim()) return;
    
    const texts = textInput.split('\n\n').filter(t => t.trim());
    
    if (items.length + texts.length > MAX_BATCH_SIZE) {
      setError(`Cannot exceed ${MAX_BATCH_SIZE} items per batch`);
      toast.error(`Maximum ${MAX_BATCH_SIZE} items allowed`);
      return;
    }
    
    setError('');
    const newItems = texts.map((text, i) => ({
      input_type: 'text',
      input_value: text.trim(),
      name: `Text ${items.length + i + 1}`
    }));

    setItems([...items, ...newItems]);
    setTextInput('');
  };

  const handleRemoveItem = (index) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    if (!batchName.trim()) {
      toast.error('Please enter a batch name');
      return;
    }
    if (items.length === 0) {
      toast.error('Please add at least one item');
      return;
    }

    onSubmit({ batchName, items });
  };

  const getIcon = (type) => {
    switch (type) {
      case 'image': return <ImageIcon className="w-4 h-4" />;
      case 'video': return <Video className="w-4 h-4" />;
      case 'url': return <LinkIcon className="w-4 h-4" />;
      case 'text': return <FileText className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <button
        onClick={onBack}
        className="text-slate-600 hover:text-slate-900 mb-6 text-sm"
      >
        ← Back to mode selection
      </button>

      <div className="bg-white rounded-2xl border-2 border-slate-200 p-8 mb-6">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Setup Batch Analysis</h2>
            <p className="text-sm text-slate-500 mt-1">Maximum {MAX_BATCH_SIZE} items per batch</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-slate-900">{items.length}</div>
            <div className="text-xs text-slate-500">/ {MAX_BATCH_SIZE}</div>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Batch Name */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Batch Name
          </label>
          <Input
            placeholder="e.g., Product Images - Week 12"
            value={batchName}
            onChange={(e) => setBatchName(e.target.value)}
          />
        </div>

        {/* Upload Methods */}
        <div className="grid md:grid-cols-3 gap-4 mb-6">
          {/* File Upload */}
          {(mode === 'real' || mode === 'true') && (
            <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center">
              <Upload className="w-8 h-8 text-slate-400 mx-auto mb-3" />
              <p className="text-sm font-medium text-slate-700 mb-2">Upload Files</p>
              <input
                type="file"
                multiple
                accept="image/*,video/*"
                onChange={(e) => handleFileUpload(e.target.files)}
                className="hidden"
                id="file-upload"
                disabled={uploading}
              />
              <label
                htmlFor="file-upload"
                className="inline-block px-4 py-2 bg-slate-900 text-white text-sm rounded-lg cursor-pointer hover:bg-slate-800"
              >
                {uploading ? 'Uploading...' : 'Choose Files'}
              </label>
            </div>
          )}

          {/* URL Input */}
          <div className="border-2 border-dashed border-slate-300 rounded-xl p-6">
            <LinkIcon className="w-8 h-8 text-slate-400 mx-auto mb-3" />
            <p className="text-sm font-medium text-slate-700 mb-2">Add URLs</p>
            <Textarea
              placeholder="Paste URLs (one per line)"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              rows={3}
              className="mb-2 text-sm"
            />
            <Button onClick={handleAddUrl} size="sm" className="w-full">
              <Plus className="w-4 h-4 mr-1" />
              Add URLs
            </Button>
          </div>

          {/* Text Input */}
          <div className="border-2 border-dashed border-slate-300 rounded-xl p-6">
            <FileText className="w-8 h-8 text-slate-400 mx-auto mb-3" />
            <p className="text-sm font-medium text-slate-700 mb-2">Add Text</p>
            <Textarea
              placeholder="Paste text (separate with blank lines)"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              rows={3}
              className="mb-2 text-sm"
            />
            <Button onClick={handleAddText} size="sm" className="w-full">
              <Plus className="w-4 h-4 mr-1" />
              Add Text
            </Button>
          </div>
        </div>

        {/* Items List */}
        {items.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-slate-900">
                Items to Analyze ({items.length})
              </h3>
              <button
                onClick={() => setItems([])}
                className="text-sm text-red-600 hover:text-red-700"
              >
                Clear All
              </button>
            </div>
            <div className="max-h-60 overflow-y-auto space-y-2 border border-slate-200 rounded-lg p-3">
              {items.map((item, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-2 bg-slate-50 rounded-lg"
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    {getIcon(item.input_type)}
                    <span className="text-sm text-slate-700 truncate">
                      {item.name}
                    </span>
                    <span className="text-xs text-slate-500 px-2 py-0.5 bg-white rounded">
                      {item.input_type}
                    </span>
                  </div>
                  <button
                    onClick={() => handleRemoveItem(index)}
                    className="text-slate-400 hover:text-red-600 ml-2"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Submit */}
        <div className="flex gap-3">
          <Button
            onClick={onBack}
            variant="outline"
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={items.length === 0 || !batchName.trim()}
            className="flex-1 bg-slate-900 hover:bg-slate-800"
          >
            Start Batch Analysis
          </Button>
        </div>
      </div>
    </div>
  );
}