import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { BookOpen, Plus, Edit2, Trash2, Search, Video, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

export default function LearningManagement() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingContent, setEditingContent] = useState(null);
  const queryClient = useQueryClient();

  // Using Article entity with learning_mode flag for learning content
  const { data: learningContent = [], isLoading } = useQuery({
    queryKey: ['learningContent'],
    queryFn: async () => {
      const all = await base44.entities.Article.list('-created_date', 100);
      return all.filter(item => item.learning_mode === true);
    }
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Article.create({ ...data, learning_mode: true }),
    onSuccess: () => {
      queryClient.invalidateQueries(['learningContent']);
      setShowCreateDialog(false);
      toast.success('Learning content created');
    },
    onError: () => toast.error('Failed to create content')
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Article.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['learningContent']);
      setEditingContent(null);
      toast.success('Content updated');
    },
    onError: () => toast.error('Failed to update content')
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Article.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['learningContent']);
      toast.success('Content deleted');
    },
    onError: () => toast.error('Failed to delete content')
  });

  const filteredContent = learningContent.filter(item => {
    const matchesSearch = !searchTerm || 
      item.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.topic?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const ContentForm = ({ content, onSubmit, onCancel }) => {
    const [formData, setFormData] = useState(content || {
      title: '',
      topic: '',
      audience_level: 'beginner',
      tone: 'educational',
      body: ''
    });

    return (
      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium text-slate-700 mb-2 block">Title</label>
          <Input
            value={formData.title || ''}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="Learning content title"
          />
        </div>

        <div>
          <label className="text-sm font-medium text-slate-700 mb-2 block">Topic</label>
          <Input
            value={formData.topic || ''}
            onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
            placeholder="What is AI Detection?, How Deepfakes Work, etc."
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-slate-700 mb-2 block">Audience Level</label>
            <Select 
              value={formData.audience_level || 'beginner'} 
              onValueChange={(value) => setFormData({ ...formData, audience_level: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="beginner">Beginner</SelectItem>
                <SelectItem value="intermediate">Intermediate</SelectItem>
                <SelectItem value="advanced">Advanced</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700 mb-2 block">Tone</label>
            <Select 
              value={formData.tone || 'educational'} 
              onValueChange={(value) => setFormData({ ...formData, tone: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="neutral">Neutral</SelectItem>
                <SelectItem value="educational">Educational</SelectItem>
                <SelectItem value="conversational">Conversational</SelectItem>
                <SelectItem value="technical">Technical</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-slate-700 mb-2 block">Content</label>
          <Textarea
            value={formData.body || ''}
            onChange={(e) => setFormData({ ...formData, body: e.target.value })}
            placeholder="Write your learning content here..."
            rows={8}
          />
        </div>

        <div className="flex gap-2 pt-4">
          <Button onClick={() => onSubmit(formData)} className="flex-1">
            {content ? 'Update' : 'Create'}
          </Button>
          <Button onClick={onCancel} variant="outline" className="flex-1">
            Cancel
          </Button>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#3498DB]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Learning Management</h2>
          <p className="text-slate-600">Create and manage educational content</p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button className="bg-[#3498DB] hover:bg-[#2980b9]">
              <Plus className="w-4 h-4 mr-2" />
              New Content
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Learning Content</DialogTitle>
            </DialogHeader>
            <ContentForm
              onSubmit={(data) => createMutation.mutate(data)}
              onCancel={() => setShowCreateDialog(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search learning content..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Stats */}
      <div className="grid md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="text-sm text-slate-600 mb-1">Total Content</div>
          <div className="text-2xl font-bold text-slate-900">{learningContent.length}</div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="text-sm text-slate-600 mb-1">Beginner</div>
          <div className="text-2xl font-bold text-emerald-600">
            {learningContent.filter(c => c.audience_level === 'beginner').length}
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="text-sm text-slate-600 mb-1">Advanced</div>
          <div className="text-2xl font-bold text-blue-600">
            {learningContent.filter(c => c.audience_level === 'advanced').length}
          </div>
        </div>
      </div>

      {/* Content List */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {filteredContent.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            <BookOpen className="w-12 h-12 mx-auto mb-3 text-slate-300" />
            <p>No learning content found</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredContent.map((item, idx) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.02 }}
                className="p-4 hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <FileText className="w-5 h-5 text-[#3498DB]" />
                      <h3 className="font-semibold text-slate-900">{item.title || 'Untitled'}</h3>
                      <span className="px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700">
                        {item.audience_level}
                      </span>
                    </div>
                    <div className="text-sm text-slate-600">
                      {item.topic && <span>Topic: {item.topic}</span>}
                      {item.word_count && <span className="ml-4">{item.word_count} words</span>}
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                      Created {new Date(item.created_date).toLocaleDateString()}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setEditingContent(item)}
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>Edit Learning Content</DialogTitle>
                        </DialogHeader>
                        <ContentForm
                          content={item}
                          onSubmit={(data) => updateMutation.mutate({ id: item.id, data })}
                          onCancel={() => setEditingContent(null)}
                        />
                      </DialogContent>
                    </Dialog>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (confirm('Delete this content?')) {
                          deleteMutation.mutate(item.id);
                        }
                      }}
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}