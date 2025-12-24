import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, AlertTriangle, CheckCircle2, XCircle, Eye, Image, Video, FileText, MessageSquare } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export default function ContentModeration() {
  const [selectedContent, setSelectedContent] = useState(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [filterStatus, setFilterStatus] = useState('pending');
  const queryClient = useQueryClient();

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const { data: flaggedContent = [] } = useQuery({
    queryKey: ['flaggedContent', filterStatus],
    queryFn: async () => {
      if (filterStatus === 'all') {
        return await base44.entities.FlaggedContent.list('-created_date');
      }
      return await base44.entities.FlaggedContent.filter({ status: filterStatus }, '-created_date');
    }
  });

  const reviewContentMutation = useMutation({
    mutationFn: async ({ contentId, status, notes }) => {
      await base44.entities.FlaggedContent.update(contentId, {
        status,
        reviewed_by: currentUser?.email,
        reviewed_at: new Date().toISOString(),
        admin_notes: notes
      });

      // Send email notification to content creator
      const content = flaggedContent.find(c => c.id === contentId);
      if (content?.created_by) {
        await base44.integrations.Core.SendEmail({
          to: content.created_by,
          subject: `Content Review Update - IsThis.io`,
          body: `Your ${content.content_type} has been reviewed. Status: ${status}. ${notes ? `Notes: ${notes}` : ''}`
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['flaggedContent']);
      toast.success('Content reviewed');
      setSelectedContent(null);
      setAdminNotes('');
    }
  });

  const contentTypeIcons = {
    image: Image,
    video: Video,
    blog_post: FileText,
    comment: MessageSquare,
    analysis: Shield
  };

  const flagReasonColors = {
    nudity: 'text-red-600 bg-red-50',
    violence: 'text-red-600 bg-red-50',
    hate_speech: 'text-red-600 bg-red-50',
    spam: 'text-amber-600 bg-amber-50',
    inappropriate: 'text-orange-600 bg-orange-50',
    other: 'text-slate-600 bg-slate-50'
  };

  const getConfidenceColor = (score) => {
    if (score >= 80) return 'text-red-600 bg-red-50';
    if (score >= 60) return 'text-amber-600 bg-amber-50';
    return 'text-blue-600 bg-blue-50';
  };

  const stats = {
    pending: flaggedContent.filter(c => c.status === 'pending').length,
    approved: flaggedContent.filter(c => c.status === 'approved').length,
    rejected: flaggedContent.filter(c => c.status === 'rejected').length,
    highConfidence: flaggedContent.filter(c => c.confidence_score >= 80).length
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-3 mb-2">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
            <div className="text-sm text-slate-600">Pending Review</div>
          </div>
          <div className="text-2xl font-bold text-slate-900">{stats.pending}</div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-3 mb-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <div className="text-sm text-slate-600">Approved</div>
          </div>
          <div className="text-2xl font-bold text-slate-900">{stats.approved}</div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-3 mb-2">
            <XCircle className="w-5 h-5 text-red-600" />
            <div className="text-sm text-slate-600">Rejected</div>
          </div>
          <div className="text-2xl font-bold text-slate-900">{stats.rejected}</div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-3 mb-2">
            <Shield className="w-5 h-5 text-red-600" />
            <div className="text-sm text-slate-600">High Confidence</div>
          </div>
          <div className="text-2xl font-bold text-slate-900">{stats.highConfidence}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <div className="flex gap-2">
          {[
            { value: 'pending', label: 'Pending' },
            { value: 'approved', label: 'Approved' },
            { value: 'rejected', label: 'Rejected' },
            { value: 'all', label: 'All' }
          ].map((filter) => (
            <button
              key={filter.value}
              onClick={() => setFilterStatus(filter.value)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filterStatus === filter.value
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {/* Flagged Content List */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h3 className="text-lg font-bold text-slate-900 mb-4">Flagged Content</h3>
        <div className="space-y-3">
          {flaggedContent.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <Shield className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="font-medium">No flagged content</p>
              <p className="text-sm">All content is clear for this filter</p>
            </div>
          ) : (
            flaggedContent.map((content) => {
              const Icon = contentTypeIcons[content.content_type];
              const confidenceColor = getConfidenceColor(content.confidence_score);
              const reasonColor = flagReasonColors[content.flag_reason];

              return (
                <motion.div
                  key={content.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 rounded-lg border-2 border-slate-200 hover:border-indigo-300 transition-colors"
                >
                  <div className="flex items-start gap-4">
                    {/* Content Preview */}
                    <div className="flex-shrink-0">
                      {content.content_url && (content.content_type === 'image' || content.content_type === 'video') ? (
                        <img
                          src={content.content_url}
                          alt="Flagged content"
                          className="w-24 h-24 object-cover rounded-lg"
                        />
                      ) : (
                        <div className="w-24 h-24 bg-slate-100 rounded-lg flex items-center justify-center">
                          <Icon className="w-8 h-8 text-slate-400" />
                        </div>
                      )}
                    </div>

                    {/* Content Info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-semibold text-slate-900 capitalize">
                          {content.content_type.replace('_', ' ')}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${reasonColor}`}>
                          {content.flag_reason.replace('_', ' ')}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${confidenceColor}`}>
                          {content.confidence_score}% confidence
                        </span>
                        {content.status !== 'pending' && (
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            content.status === 'approved' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                          }`}>
                            {content.status}
                          </span>
                        )}
                      </div>

                      {content.content_preview && (
                        <p className="text-sm text-slate-600 mb-2 line-clamp-2">{content.content_preview}</p>
                      )}

                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <span>Created: {new Date(content.created_date).toLocaleString()}</span>
                        {content.reviewed_by && (
                          <span>• Reviewed by: {content.reviewed_by}</span>
                        )}
                      </div>

                      {content.status === 'pending' && (
                        <div className="flex gap-2 mt-3">
                          <Button
                            size="sm"
                            onClick={() => setSelectedContent(content)}
                            variant="outline"
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            Review
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => reviewContentMutation.mutate({ contentId: content.id, status: 'approved', notes: '' })}
                            className="bg-emerald-600 hover:bg-emerald-700"
                          >
                            <CheckCircle2 className="w-4 h-4 mr-1" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => reviewContentMutation.mutate({ contentId: content.id, status: 'rejected', notes: '' })}
                            variant="destructive"
                          >
                            <XCircle className="w-4 h-4 mr-1" />
                            Reject
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
      </div>

      {/* Review Dialog */}
      <Dialog open={!!selectedContent} onOpenChange={() => setSelectedContent(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Review Flagged Content</DialogTitle>
          </DialogHeader>
          {selectedContent && (
            <div className="space-y-4">
              {/* Content Display */}
              {selectedContent.content_url && (
                <div className="rounded-lg overflow-hidden border border-slate-200">
                  {selectedContent.content_type === 'image' ? (
                    <img src={selectedContent.content_url} alt="Content" className="w-full" />
                  ) : selectedContent.content_type === 'video' ? (
                    <video src={selectedContent.content_url} controls className="w-full" />
                  ) : null}
                </div>
              )}

              {/* AI Analysis */}
              <div className="p-4 bg-slate-50 rounded-lg">
                <div className="font-semibold text-slate-900 mb-2">AI Analysis</div>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600">Confidence Score:</span>
                    <span className="font-bold text-slate-900">{selectedContent.confidence_score}%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600">Flag Reason:</span>
                    <span className="font-bold text-slate-900 capitalize">{selectedContent.flag_reason.replace('_', ' ')}</span>
                  </div>
                  {selectedContent.ai_analysis && (
                    <div className="mt-2 pt-2 border-t border-slate-200">
                      <pre className="text-xs text-slate-600 whitespace-pre-wrap">
                        {JSON.stringify(selectedContent.ai_analysis, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              </div>

              {/* Admin Notes */}
              <div>
                <label className="text-sm font-medium text-slate-700 mb-2 block">
                  Admin Notes (optional)
                </label>
                <Textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Add notes about your decision..."
                  rows={3}
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <Button
                  onClick={() => reviewContentMutation.mutate({ 
                    contentId: selectedContent.id, 
                    status: 'approved', 
                    notes: adminNotes 
                  })}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                >
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Approve Content
                </Button>
                <Button
                  onClick={() => reviewContentMutation.mutate({ 
                    contentId: selectedContent.id, 
                    status: 'rejected', 
                    notes: adminNotes 
                  })}
                  className="flex-1"
                  variant="destructive"
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Reject Content
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}