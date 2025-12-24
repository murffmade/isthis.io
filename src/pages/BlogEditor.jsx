import React, { useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Save, Eye, Clock, FileText, ChevronRight, ChevronLeft as CollapseIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { createPageUrl } from '@/utils';
import RichTextEditor from '@/components/blog/RichTextEditor';
import AIAssistant from '@/components/blog/AIAssistant';
import SEOScorer from '@/components/blog/SEOScorer';
import OutlineEditor from '@/components/blog/OutlineEditor';
import ArticleMetadata from '@/components/blog/ArticleMetadata';

export default function BlogEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [title, setTitle] = useState('');
  const [outline, setOutline] = useState([]);
  const [body, setBody] = useState('');
  const [metadata, setMetadata] = useState({
    topic: '',
    audience_level: 'intermediate',
    tone: 'educational',
    status: 'draft',
    learning_mode: false
  });
  const [showAI, setShowAI] = useState(true);
  const [activeTab, setActiveTab] = useState('ai'); // 'ai' or 'seo'
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [cursorPosition, setCursorPosition] = useState(null);

  // Load existing article
  const { data: article, isLoading } = useQuery({
    queryKey: ['article', id],
    queryFn: async () => {
      if (id === 'new') return null;
      const articles = await base44.entities.Article.filter({ id });
      return articles[0] || null;
    },
    enabled: !!id
  });

  useEffect(() => {
    if (article) {
      setTitle(article.title || '');
      setOutline(article.outline || []);
      setBody(article.body || '');
      setMetadata({
        topic: article.topic || '',
        audience_level: article.audience_level || 'intermediate',
        tone: article.tone || 'educational',
        status: article.status || 'draft',
        learning_mode: article.learning_mode || false
      });
    }
  }, [article]);

  // Calculate stats
  const wordCount = body.replace(/<[^>]*>/g, ' ').split(/\s+/).filter(w => w.length > 0).length;
  const readingTime = Math.ceil(wordCount / 200);
  const sectionCount = outline.length;

  // Autosave
  const saveMutation = useMutation({
    mutationFn: async (data) => {
      const payload = {
        title: data.title,
        slug: data.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        outline: data.outline,
        body: data.body,
        word_count: wordCount,
        reading_time: readingTime,
        ...data.metadata
      };

      if (id === 'new' || !id) {
        const created = await base44.entities.Article.create(payload);
        navigate(`/blog-editor/${created.id}`, { replace: true });
        return created;
      } else {
        return await base44.entities.Article.update(id, payload);
      }
    },
    onSuccess: () => {
      setLastSaved(new Date());
      queryClient.invalidateQueries(['article', id]);
    }
  });

  // Autosave effect
  useEffect(() => {
    const timer = setTimeout(() => {
      if (title) {
        setSaving(true);
        saveMutation.mutate({ title, outline, body, metadata });
        setTimeout(() => setSaving(false), 500);
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [title, outline, body, metadata]);

  const handleSave = () => {
    setSaving(true);
    saveMutation.mutate({ title, outline, body, metadata });
    toast.success('Article saved');
  };

  const handleTitleGenerated = (generatedTitle) => {
    setTitle(generatedTitle);
  };

  const handleOutlineGenerated = (generatedOutline) => {
    setOutline(generatedOutline);
  };

  const handleBodyGenerated = (generatedBody) => {
    setBody(generatedBody);
  };

  const handleInsertAtCursor = (content) => {
    // This will be handled by the RichTextEditor component
    setBody(prev => prev + content);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-slate-900 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-sm text-slate-600">Loading editor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white">
        <div className="flex items-center justify-between px-6 py-3">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(createPageUrl('Learn'))}
              className="text-slate-600"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Back
            </Button>
            <div className="h-6 w-px bg-slate-200" />
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Untitled Article"
              className="text-xl font-bold text-slate-900 bg-transparent border-none outline-none focus:outline-none"
              style={{ width: Math.max(200, title.length * 12) + 'px' }}
            />
          </div>

          <div className="flex items-center gap-4">
            {/* Stats */}
            <div className="flex items-center gap-4 text-sm text-slate-600">
              <div className="flex items-center gap-1">
                <FileText className="w-4 h-4" />
                <span>{wordCount} words</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                <span>{readingTime} min read</span>
              </div>
              <div className="flex items-center gap-1">
                <span>{sectionCount} sections</span>
              </div>
            </div>

            <div className="h-6 w-px bg-slate-200" />

            {/* Save indicator */}
            <div className="text-sm text-slate-500 flex items-center gap-2">
              {saving ? (
                <>
                  <div className="w-3 h-3 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
                  <span>Saving...</span>
                </>
              ) : lastSaved ? (
                <>
                  <Save className="w-3 h-3 text-emerald-600" />
                  <span>Saved {new Date(lastSaved).toLocaleTimeString()}</span>
                </>
              ) : null}
            </div>

            <Button
              onClick={handleSave}
              size="sm"
              variant="outline"
            >
              <Save className="w-4 h-4 mr-2" />
              Save
            </Button>

            <ArticleMetadata
              metadata={metadata}
              onChange={setMetadata}
            />
          </div>
        </div>
      </header>

      {/* Main Editor Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Editor */}
        <div className={`flex-1 overflow-y-auto transition-all ${showAI ? 'mr-0' : 'mr-0'}`}>
          <div className="max-w-4xl mx-auto px-8 py-8">
            {/* Outline */}
            {outline.length > 0 && (
              <div className="mb-8">
                <OutlineEditor
                  outline={outline}
                  onChange={setOutline}
                />
              </div>
            )}

            {/* Rich Text Editor */}
            <RichTextEditor
              value={body}
              onChange={setBody}
              onCursorChange={setCursorPosition}
              placeholder="Start writing your article..."
            />
          </div>
        </div>

        {/* Right Panel - AI Assistant / SEO */}
        {showAI && (
          <div className="w-96 border-l border-slate-200 flex-shrink-0 flex flex-col bg-slate-50">
            {/* Tabs */}
            <div className="border-b border-slate-200 bg-white flex">
              <button
                onClick={() => setActiveTab('ai')}
                className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                  activeTab === 'ai'
                    ? 'text-indigo-600 border-b-2 border-indigo-600'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                AI Assistant
              </button>
              <button
                onClick={() => setActiveTab('seo')}
                className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                  activeTab === 'seo'
                    ? 'text-emerald-600 border-b-2 border-emerald-600'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                SEO Score
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
              {activeTab === 'ai' ? (
                <AIAssistant
                  title={title}
                  outline={outline}
                  body={body}
                  metadata={metadata}
                  cursorPosition={cursorPosition}
                  onTitleGenerated={handleTitleGenerated}
                  onOutlineGenerated={handleOutlineGenerated}
                  onBodyGenerated={handleBodyGenerated}
                  onInsertAtCursor={handleInsertAtCursor}
                />
              ) : (
                <SEOScorer
                  title={title}
                  body={body}
                  metadata={metadata}
                />
              )}
            </div>
          </div>
        )}

        {/* Toggle AI Panel Button */}
        <button
          onClick={() => setShowAI(!showAI)}
          className="fixed right-0 top-1/2 -translate-y-1/2 bg-slate-900 text-white p-2 rounded-l-lg shadow-lg hover:bg-slate-800 transition-colors z-10"
        >
          {showAI ? <ChevronRight className="w-4 h-4" /> : <CollapseIcon className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}