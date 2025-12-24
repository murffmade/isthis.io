import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, XCircle, UserPlus, Filter, AlertTriangle, Clock, CheckCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

export default function FeedbackQueue() {
  const [user, setUser] = useState(null);
  const [selectedFeedback, setSelectedFeedback] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [reviewNotes, setReviewNotes] = useState('');
  const [assignTo, setAssignTo] = useState('');

  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => setUser(null));
  }, []);

  const { data: allFeedback, isLoading } = useQuery({
    queryKey: ['allTrainingFeedback'],
    queryFn: () => base44.entities.TrainingFeedback.list('-created_date', 500),
    initialData: []
  });

  const { data: trainers } = useQuery({
    queryKey: ['trainers'],
    queryFn: async () => {
      const users = await base44.entities.User.list();
      return users.filter(u => u.is_trainer);
    },
    initialData: []
  });

  const reviewMutation = useMutation({
    mutationFn: async ({ feedbackId, status, notes }) => {
      const feedback = await base44.entities.TrainingFeedback.update(feedbackId, {
        status,
        reviewed_by: user.email,
        review_notes: notes,
        reviewed_date: new Date().toISOString()
      });

      // Send notification
      const notificationMap = {
        approved: { type: 'feedback_approved', title: 'Feedback Approved ✓', message: 'Your training feedback has been approved and will be used for model improvement.' },
        rejected: { type: 'feedback_rejected', title: 'Feedback Needs Revision', message: `Your feedback was reviewed: ${notes || 'Please review and update.'}` },
        utilized: { type: 'feedback_utilized', title: 'Feedback Utilized 🎉', message: 'Your feedback has been incorporated into model training!' }
      };

      const notif = notificationMap[status];
      if (notif) {
        await base44.entities.FeedbackNotification.create({
          recipient_email: feedback.created_by,
          notification_type: notif.type,
          feedback_id: feedbackId,
          title: notif.title,
          message: notif.message
        });
      }

      return feedback;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['allTrainingFeedback']);
      toast.success('Feedback reviewed successfully');
      setSelectedFeedback(null);
      setReviewNotes('');
    }
  });

  const assignMutation = useMutation({
    mutationFn: async ({ feedbackId, trainerEmail }) => {
      const feedback = await base44.entities.TrainingFeedback.update(feedbackId, {
        assigned_to: trainerEmail,
        status: 'under_review'
      });

      await base44.entities.FeedbackNotification.create({
        recipient_email: trainerEmail,
        notification_type: 'feedback_assigned',
        feedback_id: feedbackId,
        title: 'New Feedback Assigned',
        message: 'You have been assigned to review and validate new training feedback.'
      });

      return feedback;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['allTrainingFeedback']);
      toast.success('Feedback assigned successfully');
      setAssignTo('');
    }
  });

  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl border-2 border-slate-200 p-8 text-center max-w-md">
          <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-900 mb-2">Admin Access Required</h2>
          <p className="text-slate-600">Only admins can access the feedback queue.</p>
        </div>
      </div>
    );
  }

  const filteredFeedback = statusFilter === 'all' 
    ? allFeedback 
    : allFeedback.filter(f => f.status === statusFilter);

  const statusCounts = {
    pending: allFeedback.filter(f => f.status === 'pending').length,
    under_review: allFeedback.filter(f => f.status === 'under_review').length,
    approved: allFeedback.filter(f => f.status === 'approved').length,
    utilized: allFeedback.filter(f => f.status === 'utilized').length
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Training Feedback Queue</h1>
          <p className="text-slate-600">Review, assign, and manage trainer contributions</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl border-2 border-slate-200 p-4">
            <div className="flex items-center gap-2 text-amber-600 mb-2">
              <Clock className="w-5 h-5" />
              <span className="font-semibold">Pending</span>
            </div>
            <div className="text-2xl font-bold text-slate-900">{statusCounts.pending}</div>
          </div>
          <div className="bg-white rounded-xl border-2 border-slate-200 p-4">
            <div className="flex items-center gap-2 text-blue-600 mb-2">
              <Filter className="w-5 h-5" />
              <span className="font-semibold">Under Review</span>
            </div>
            <div className="text-2xl font-bold text-slate-900">{statusCounts.under_review}</div>
          </div>
          <div className="bg-white rounded-xl border-2 border-slate-200 p-4">
            <div className="flex items-center gap-2 text-emerald-600 mb-2">
              <CheckCircle2 className="w-5 h-5" />
              <span className="font-semibold">Approved</span>
            </div>
            <div className="text-2xl font-bold text-slate-900">{statusCounts.approved}</div>
          </div>
          <div className="bg-white rounded-xl border-2 border-slate-200 p-4">
            <div className="flex items-center gap-2 text-indigo-600 mb-2">
              <CheckCheck className="w-5 h-5" />
              <span className="font-semibold">Utilized</span>
            </div>
            <div className="text-2xl font-bold text-slate-900">{statusCounts.utilized}</div>
          </div>
        </div>

        {/* Filter */}
        <div className="bg-white rounded-xl border-2 border-slate-200 p-4 mb-6">
          <div className="flex items-center gap-4">
            <Filter className="w-5 h-5 text-slate-400" />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Feedback</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="under_review">Under Review</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="utilized">Utilized</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Feedback List */}
        <div className="space-y-4">
          {filteredFeedback.map((feedback) => (
            <div key={feedback.id} className="bg-white rounded-xl border-2 border-slate-200 p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      feedback.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                      feedback.status === 'under_review' ? 'bg-blue-100 text-blue-700' :
                      feedback.status === 'approved' ? 'bg-emerald-100 text-emerald-700' :
                      feedback.status === 'rejected' ? 'bg-red-100 text-red-700' :
                      'bg-indigo-100 text-indigo-700'
                    }`}>
                      {feedback.status.replace('_', ' ').toUpperCase()}
                    </span>
                    <span className="text-sm text-slate-600">by {feedback.created_by}</span>
                    <span className="text-sm text-slate-400">
                      {new Date(feedback.created_date).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-sm mb-3">
                    <span className="font-semibold">Actual: <span className="text-emerald-600">{feedback.actual_label}</span></span>
                    <span className="font-semibold">AI Predicted: <span className="text-blue-600">{feedback.ai_prediction}</span></span>
                    <span className={feedback.confidence_match ? 'text-emerald-600' : 'text-amber-600'}>
                      {feedback.confidence_match ? '✓ Match' : '✗ Mismatch'}
                    </span>
                  </div>
                  {feedback.notes && (
                    <p className="text-sm text-slate-700 mb-2">📝 {feedback.notes}</p>
                  )}
                  {feedback.observed_artifacts && feedback.observed_artifacts.length > 0 && (
                    <div className="text-sm text-slate-600 mb-2">
                      Artifacts: {feedback.observed_artifacts.map(a => a.replace(/_/g, ' ')).join(', ')}
                    </div>
                  )}
                  {feedback.assigned_to && (
                    <div className="text-sm text-slate-600">
                      Assigned to: {feedback.assigned_to}
                    </div>
                  )}
                </div>
                {feedback.file_url && (
                  <div className="ml-4">
                    {feedback.content_type === 'video' ? (
                      <video src={feedback.file_url} className="w-32 h-32 object-cover rounded-lg" />
                    ) : (
                      <img src={feedback.file_url} alt="Content" className="w-32 h-32 object-cover rounded-lg" />
                    )}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3 pt-4 border-t border-slate-200">
                {feedback.status === 'pending' && (
                  <>
                    <Select value={assignTo} onValueChange={setAssignTo}>
                      <SelectTrigger className="w-48">
                        <SelectValue placeholder="Assign to trainer" />
                      </SelectTrigger>
                      <SelectContent>
                        {trainers.map(trainer => (
                          <SelectItem key={trainer.id} value={trainer.email}>
                            {trainer.full_name || trainer.email}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {assignTo && (
                      <Button
                        onClick={() => assignMutation.mutate({ feedbackId: feedback.id, trainerEmail: assignTo })}
                        disabled={assignMutation.isPending}
                        size="sm"
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        <UserPlus className="w-4 h-4 mr-2" />
                        Assign
                      </Button>
                    )}
                  </>
                )}
                
                {(feedback.status === 'pending' || feedback.status === 'under_review') && (
                  <>
                    <Button
                      onClick={() => setSelectedFeedback(feedback)}
                      size="sm"
                      variant="outline"
                    >
                      Review
                    </Button>
                    <Button
                      onClick={() => reviewMutation.mutate({ feedbackId: feedback.id, status: 'approved', notes: 'Approved for training' })}
                      disabled={reviewMutation.isPending}
                      size="sm"
                      className="bg-emerald-600 hover:bg-emerald-700"
                    >
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Approve
                    </Button>
                  </>
                )}

                {feedback.status === 'approved' && (
                  <Button
                    onClick={() => reviewMutation.mutate({ feedbackId: feedback.id, status: 'utilized', notes: 'Incorporated into training data' })}
                    disabled={reviewMutation.isPending}
                    size="sm"
                    className="bg-indigo-600 hover:bg-indigo-700"
                  >
                    <CheckCheck className="w-4 h-4 mr-2" />
                    Mark as Utilized
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Review Modal */}
        {selectedFeedback && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-6">
            <div className="bg-white rounded-2xl p-6 max-w-2xl w-full">
              <h3 className="text-xl font-bold text-slate-900 mb-4">Review Feedback</h3>
              <div className="mb-4">
                <p className="text-sm text-slate-600 mb-2">Trainer: {selectedFeedback.created_by}</p>
                <p className="text-sm text-slate-700">{selectedFeedback.notes}</p>
              </div>
              <Textarea
                placeholder="Review notes (optional)"
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                className="mb-4"
              />
              <div className="flex gap-3">
                <Button
                  onClick={() => {
                    reviewMutation.mutate({ feedbackId: selectedFeedback.id, status: 'approved', notes: reviewNotes });
                  }}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                >
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Approve
                </Button>
                <Button
                  onClick={() => {
                    reviewMutation.mutate({ feedbackId: selectedFeedback.id, status: 'rejected', notes: reviewNotes });
                  }}
                  className="flex-1 bg-red-600 hover:bg-red-700"
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Reject
                </Button>
                <Button
                  onClick={() => {
                    setSelectedFeedback(null);
                    setReviewNotes('');
                  }}
                  variant="outline"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}