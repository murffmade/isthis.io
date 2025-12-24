import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit, Trash2, Eye, Clock, FileText, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { createPageUrl } from '@/utils';

export default function BlogDashboard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('all');

  const { data: articles, isLoading } = useQuery({
    queryKey: ['articles'],
    queryFn: () => base44.entities.Article.list('-updated_date', 100),
    initialData: []
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Article.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['articles']);
      toast.success('Article deleted');
    }
  });

  const filteredArticles = statusFilter === 'all' 
    ? articles 
    : articles.filter(a => a.status === statusFilter);

  const stats = {
    total: articles.length,
    draft: articles.filter(a => a.status === 'draft').length,
    published: articles.filter(a => a.status === 'published').length,
    in_review: articles.filter(a => a.status === 'in_review').length
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Blog Dashboard</h1>
            <p className="text-slate-600">Manage your articles and content</p>
          </div>
          <Button
            onClick={() => navigate('/blog-editor/new')}
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Article
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl border-2 border-slate-200 p-6">
            <div className="text-sm text-slate-600 mb-1">Total Articles</div>
            <div className="text-3xl font-bold text-slate-900">{stats.total}</div>
          </div>
          <div className="bg-white rounded-xl border-2 border-slate-200 p-6">
            <div className="text-sm text-slate-600 mb-1">Published</div>
            <div className="text-3xl font-bold text-emerald-600">{stats.published}</div>
          </div>
          <div className="bg-white rounded-xl border-2 border-slate-200 p-6">
            <div className="text-sm text-slate-600 mb-1">In Review</div>
            <div className="text-3xl font-bold text-amber-600">{stats.in_review}</div>
          </div>
          <div className="bg-white rounded-xl border-2 border-slate-200 p-6">
            <div className="text-sm text-slate-600 mb-1">Drafts</div>
            <div className="text-3xl font-bold text-slate-600">{stats.draft}</div>
          </div>
        </div>

        {/* Filter */}
        <div className="bg-white rounded-xl border-2 border-slate-200 p-4 mb-6 flex items-center gap-4">
          <Filter className="w-5 h-5 text-slate-400" />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Articles</SelectItem>
              <SelectItem value="draft">Drafts</SelectItem>
              <SelectItem value="in_review">In Review</SelectItem>
              <SelectItem value="published">Published</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Articles List */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="w-8 h-8 border-4 border-slate-900 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            <p className="text-slate-600">Loading articles...</p>
          </div>
        ) : filteredArticles.length === 0 ? (
          <div className="bg-white rounded-xl border-2 border-slate-200 p-12 text-center">
            <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">No articles yet</h3>
            <p className="text-slate-600 mb-6">Create your first article to get started</p>
            <Button
              onClick={() => navigate('/blog-editor/new')}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Article
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredArticles.map((article) => (
              <div key={article.id} className="bg-white rounded-xl border-2 border-slate-200 p-6 hover:border-slate-300 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-bold text-slate-900">{article.title}</h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        article.status === 'published' ? 'bg-emerald-100 text-emerald-700' :
                        article.status === 'in_review' ? 'bg-amber-100 text-amber-700' :
                        'bg-slate-100 text-slate-700'
                      }`}>
                        {article.status.replace('_', ' ').toUpperCase()}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-6 text-sm text-slate-600 mb-3">
                      {article.topic && (
                        <span className="flex items-center gap-1">
                          📁 {article.topic}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <FileText className="w-4 h-4" />
                        {article.word_count || 0} words
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {article.reading_time || 0} min read
                      </span>
                      <span className="text-slate-400">
                        Updated {new Date(article.updated_date).toLocaleDateString()}
                      </span>
                    </div>

                    {article.outline && article.outline.length > 0 && (
                      <div className="text-sm text-slate-500">
                        {article.outline.length} sections
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      onClick={() => navigate(`/blog-editor/${article.id}`)}
                      size="sm"
                      variant="outline"
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Edit
                    </Button>
                    <Button
                      onClick={() => {
                        if (confirm('Delete this article?')) {
                          deleteMutation.mutate(article.id);
                        }
                      }}
                      size="sm"
                      variant="outline"
                      className="text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}