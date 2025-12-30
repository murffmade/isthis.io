import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, CheckCircle, XCircle, AlertTriangle, Eye, FileText, Image, Video, ExternalLink, Filter, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export default function ModerationReview() {
  const [selectedItem, setSelectedItem] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [aiFeedback, setAiFeedback] = useState(null);
  const queryClient = useQueryClient();

  const { data: flaggedContent = [], isLoading } = useQuery({
    queryKey: ['flaggedContent'],
    queryFn: () => base44.entities.FlaggedContent.list('-created_date', 200)
  });

  const updateDecisionMutation = useMutation({
    mutationFn: async ({ decision }) => {
      return await base44.functions.invoke('updateModerationDecision', {
        flagged_content_id: selectedItem.id,
        decision,
        admin_notes: adminNotes,
        ai_feedback: aiFeedback
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['flaggedContent']);
      toast.success('Decision saved successfully');
      setSelectedItem(null);
      setAdminNotes('');
      setAiFeedback(null);
    },
    onError: () => {
      toast.error('Failed to save decision');
    }
  });

  const filteredContent = flaggedContent.filter(item => {
    const matchesStatus = filterStatus === 'all' || item.status === filterStatus;
    const matchesSearch = searchTerm === '' || 
      item.flagged_reason?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.user_email?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const getStatusBadge = (status) => {
    const colors = {
      flagged: 'bg-amber-100 text-amber-700 border-amber-200',
      blocked: 'bg-red-100 text-red-700 border-red-200',
      approved: 'bg-emerald-100 text-emerald-700 border-emerald-200',
      rejected: 'bg-red-100 text-red-700 border-red-200',
      under_review: 'bg-blue-100 text-blue-700 border-blue-200'
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-semibold border ${colors[status] || 'bg-slate-100 text-slate-700 border-slate-200'}`}>
        {status.replace('_', ' ')}
      </span>
    );
  };

  const getRiskColor = (risk) => {
    switch (risk) {
      case 'critical': return 'text-red-700 bg-red-100';
      case 'high': return 'text-orange-700 bg-orange-100';
      case 'medium': return 'text-amber-700 bg-amber-100';
      case 'low': return 'text-blue-700 bg-blue-100';
      default: return 'text-slate-700 bg-slate-100';
    }
  };

  const handleDecision = (decision) => {
    updateDecisionMutation.mutate({ decision });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Content Moderation Review</h2>
          <p className="text-slate-600">Review AI-flagged content and make final decisions</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-600">{filteredContent.length} items</span>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <div className="grid md:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search by reason or user..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 rounded-lg border border-slate-200 bg-white text-sm"
          >
            <option value="all">All Status</option>
            <option value="flagged">Flagged</option>
            <option value="blocked">Blocked</option>
            <option value="under_review">Under Review</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* Content Grid */}
      {filteredContent.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
          <Shield className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-600">No flagged content to review</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredContent.map((item) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-xl border border-slate-200 overflow-hidden hover:border-slate-300 transition-all cursor-pointer"
              onClick={() => setSelectedItem(item)}
            >
              {item.file_url && (
                <div className="aspect-video bg-slate-100 relative">
                  {item.content_type === 'image' ? (
                    <img src={item.file_url} alt="Flagged content" className="w-full h-full object-cover" />
                  ) : item.content_type === 'video' ? (
                    <video src={item.file_url} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <FileText className="w-12 h-12 text-slate-400" />
                    </div>
                  )}
                  <div className="absolute top-2 right-2">
                    {getStatusBadge(item.status)}
                  </div>
                </div>
              )}
              
              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="text-sm font-semibold text-slate-900 capitalize">{item.content_type}</div>
                  {item.moderation_result?.overall_risk && (
                    <span className={`px-2 py-0.5 rounded text-xs font-bold ${getRiskColor(item.moderation_result.overall_risk)}`}>
                      {item.moderation_result.overall_risk}
                    </span>
                  )}
                </div>
                
                <p className="text-sm text-slate-600 mb-2 line-clamp-2">
                  {item.flagged_reason}
                </p>
                
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>{item.user_email}</span>
                  <span>{new Date(item.created_date).toLocaleDateString()}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Review Modal */}
      <AnimatePresence>
        {selectedItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-6"
            onClick={() => setSelectedItem(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="p-6 border-b border-slate-200">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 mb-1">Review Flagged Content</h3>
                    <p className="text-sm text-slate-600">
                      Flagged by AI on {new Date(selectedItem.created_date).toLocaleString()}
                    </p>
                  </div>
                  {getStatusBadge(selectedItem.status)}
                </div>
              </div>

              <div className="p-6 space-y-6">
                {/* Content Preview */}
                {selectedItem.file_url && (
                  <div>
                    <div className="font-semibold text-slate-900 mb-2 flex items-center gap-2">
                      {selectedItem.content_type === 'image' ? <Image className="w-4 h-4" /> : <Video className="w-4 h-4" />}
                      Content Preview
                    </div>
                    <div className="rounded-xl border border-slate-200 overflow-hidden">
                      {selectedItem.content_type === 'image' ? (
                        <img src={selectedItem.file_url} alt="Content" className="w-full max-h-96 object-contain bg-slate-50" />
                      ) : (
                        <video src={selectedItem.file_url} controls className="w-full max-h-96 bg-slate-900" />
                      )}
                    </div>
                    <a 
                      href={selectedItem.file_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1 mt-2"
                    >
                      Open in new tab <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}

                {/* User Info */}
                <div className="bg-slate-50 rounded-xl p-4">
                  <div className="font-semibold text-slate-900 mb-2">Submitted By</div>
                  <div className="text-sm text-slate-700">{selectedItem.user_email}</div>
                </div>

                {/* AI Moderation Report */}
                {selectedItem.moderation_result && (
                  <div className="space-y-4">
                    <div className="font-semibold text-slate-900 flex items-center gap-2">
                      <Shield className="w-4 h-4" />
                      AI Moderation Report
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4">
                      <div className={`rounded-lg p-3 ${getRiskColor(selectedItem.moderation_result.overall_risk)}`}>
                        <div className="text-xs font-medium mb-1">Risk Level</div>
                        <div className="font-bold capitalize">{selectedItem.moderation_result.overall_risk}</div>
                      </div>
                      <div className={`rounded-lg p-3 ${selectedItem.moderation_result.action === 'approve' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                        <div className="text-xs font-medium mb-1">AI Decision</div>
                        <div className="font-bold capitalize">{selectedItem.moderation_result.action}</div>
                      </div>
                      <div className="rounded-lg p-3 bg-blue-100 text-blue-700">
                        <div className="text-xs font-medium mb-1">Safe Content</div>
                        <div className="font-bold">{selectedItem.moderation_result.safe ? 'Yes' : 'No'}</div>
                      </div>
                    </div>

                    {selectedItem.moderation_result.violations?.length > 0 && (
                      <div>
                        <div className="font-medium text-slate-900 mb-2">Violations Detected:</div>
                        <div className="space-y-2">
                          {selectedItem.moderation_result.violations.map((violation, i) => (
                            <div key={i} className={`rounded-lg p-3 border-2 ${getRiskColor(violation.severity)}`}>
                              <div className="flex items-start justify-between mb-1">
                                <div className="font-semibold">{violation.category}</div>
                                <span className="text-xs font-bold">
                                  {violation.severity} ({Math.round(violation.confidence * 100)}%)
                                </span>
                              </div>
                              <p className="text-sm">{violation.description}</p>
                              {violation.specific_elements?.length > 0 && (
                                <ul className="mt-2 space-y-1">
                                  {violation.specific_elements.map((el, j) => (
                                    <li key={j} className="text-xs">• {el}</li>
                                  ))}
                                </ul>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {selectedItem.moderation_result.reasons?.length > 0 && (
                      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                        <div className="font-medium text-amber-900 mb-2">Flagging Reasons:</div>
                        <ul className="space-y-1">
                          {selectedItem.moderation_result.reasons.map((reason, i) => (
                            <li key={i} className="text-sm text-amber-700">• {reason}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                {/* Admin Review Section */}
                <div className="border-t border-slate-200 pt-6 space-y-4">
                  <div className="font-semibold text-slate-900">Your Decision</div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Admin Notes (Optional)
                    </label>
                    <Textarea
                      value={adminNotes}
                      onChange={(e) => setAdminNotes(e.target.value)}
                      placeholder="Add notes about your decision..."
                      rows={3}
                    />
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-start gap-2 mb-2">
                      <input
                        type="checkbox"
                        id="aiCorrect"
                        checked={aiFeedback?.correct || false}
                        onChange={(e) => setAiFeedback(prev => ({ 
                          ...prev, 
                          correct: e.target.checked,
                          ai_decision: selectedItem.moderation_result?.action,
                          violations: selectedItem.moderation_result?.violations
                        }))}
                        className="mt-1"
                      />
                      <label htmlFor="aiCorrect" className="text-sm text-blue-900">
                        <span className="font-medium">Provide AI Feedback:</span> Was the AI's decision correct? This helps improve future moderation.
                      </label>
                    </div>
                    {aiFeedback && (
                      <Textarea
                        value={aiFeedback.notes || ''}
                        onChange={(e) => setAiFeedback(prev => ({ ...prev, notes: e.target.value }))}
                        placeholder="Explain what the AI got right or wrong..."
                        rows={2}
                        className="mt-2"
                      />
                    )}
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-slate-200 flex justify-between gap-3">
                <Button
                  variant="outline"
                  onClick={() => setSelectedItem(null)}
                >
                  Cancel
                </Button>
                <div className="flex gap-3">
                  <Button
                    onClick={() => handleDecision('reject')}
                    disabled={updateDecisionMutation.isPending}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Reject
                  </Button>
                  <Button
                    onClick={() => handleDecision('approve')}
                    disabled={updateDecisionMutation.isPending}
                    className="bg-emerald-600 hover:bg-emerald-700"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Approve
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}