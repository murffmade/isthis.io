import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Save, Shield, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export default function PolicyEditor() {
  const [editing, setEditing] = useState(null);
  const [formData, setFormData] = useState({
    policy_name: '',
    description: '',
    auto_action: false,
    thresholds: {
      nudity: { approve_below: 0.3, flag_above: 0.3, reject_above: 0.7 },
      violence: { approve_below: 0.4, flag_above: 0.4, reject_above: 0.8 },
      hate_speech: { approve_below: 0.2, flag_above: 0.2, reject_above: 0.6 },
      profanity: { approve_below: 0.5, flag_above: 0.5, reject_above: 0.8 }
    }
  });
  const queryClient = useQueryClient();

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const { data: policies = [], isLoading } = useQuery({
    queryKey: ['moderationPolicies'],
    queryFn: () => base44.entities.ModerationPolicy.list('-created_date', 50)
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.ModerationPolicy.create({
      ...data,
      organization_id: currentUser.email
    }),
    onSuccess: () => {
      queryClient.invalidateQueries(['moderationPolicies']);
      toast.success('Policy created successfully');
      setEditing(null);
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.ModerationPolicy.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['moderationPolicies']);
      toast.success('Policy updated');
      setEditing(null);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.ModerationPolicy.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['moderationPolicies']);
      toast.success('Policy deleted');
    }
  });

  const handleSave = () => {
    if (editing === 'new') {
      createMutation.mutate(formData);
    } else {
      updateMutation.mutate({ id: editing, data: formData });
    }
  };

  const handleEdit = (policy) => {
    setEditing(policy.id);
    setFormData({
      policy_name: policy.policy_name,
      description: policy.description || '',
      auto_action: policy.auto_action || false,
      thresholds: policy.thresholds
    });
  };

  const updateThreshold = (category, field, value) => {
    setFormData({
      ...formData,
      thresholds: {
        ...formData.thresholds,
        [category]: {
          ...formData.thresholds[category],
          [field]: parseFloat(value)
        }
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Moderation Policies</h2>
          <p className="text-slate-600">Define custom thresholds for content moderation</p>
        </div>
        <Button onClick={() => setEditing('new')} className="bg-indigo-600 hover:bg-indigo-700">
          <Plus className="w-4 h-4 mr-2" />
          New Policy
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full mx-auto" />
        </div>
      ) : policies.length === 0 && !editing ? (
        <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
          <Shield className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-600">No moderation policies yet</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {policies.map(policy => (
            <motion.div
              key={policy.id}
              className="bg-white rounded-xl border border-slate-200 p-6"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-slate-900">{policy.policy_name}</h3>
                  <p className="text-sm text-slate-600 mt-1">{policy.description}</p>
                </div>
                <div className={`w-2 h-2 rounded-full ${policy.active ? 'bg-emerald-500' : 'bg-slate-300'}`} />
              </div>

              <div className="text-sm text-slate-600 mb-4">
                Auto-action: {policy.auto_action ? 'Enabled' : 'Disabled'}
              </div>

              <div className="flex gap-2">
                <Button onClick={() => handleEdit(policy)} variant="outline" size="sm" className="flex-1">
                  Edit
                </Button>
                <Button 
                  onClick={() => deleteMutation.mutate(policy.id)} 
                  variant="outline" 
                  size="sm"
                  className="text-red-600"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Editor Modal */}
      <AnimatePresence>
        {editing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-6"
            onClick={() => setEditing(null)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="p-6 border-b border-slate-200">
                <h3 className="text-xl font-bold text-slate-900">
                  {editing === 'new' ? 'Create' : 'Edit'} Moderation Policy
                </h3>
              </div>

              <div className="p-6 space-y-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Policy Name</label>
                  <Input
                    value={formData.policy_name}
                    onChange={(e) => setFormData({ ...formData, policy_name: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Description</label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={2}
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="autoAction"
                    checked={formData.auto_action}
                    onChange={(e) => setFormData({ ...formData, auto_action: e.target.checked })}
                  />
                  <label htmlFor="autoAction" className="text-sm text-slate-700">
                    Automatically take action (approve/reject) without manual review
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-4">Category Thresholds</label>
                  <div className="space-y-6">
                    {Object.entries(formData.thresholds).map(([category, values]) => (
                      <div key={category} className="bg-slate-50 rounded-lg p-4">
                        <h4 className="font-medium text-slate-900 mb-4 capitalize">{category.replace('_', ' ')}</h4>
                        <div className="space-y-3">
                          {Object.entries(values).map(([field, value]) => (
                            <div key={field}>
                              <div className="flex justify-between mb-1">
                                <span className="text-sm text-slate-600 capitalize">{field.replace('_', ' ')}</span>
                                <span className="text-sm font-medium">{(value * 100).toFixed(0)}%</span>
                              </div>
                              <input
                                type="range"
                                min="0"
                                max="1"
                                step="0.05"
                                value={value}
                                onChange={(e) => updateThreshold(category, field, e.target.value)}
                                className="w-full"
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-slate-200 flex justify-end gap-3">
                <Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
                <Button onClick={handleSave} className="bg-indigo-600 hover:bg-indigo-700">
                  <Save className="w-4 h-4 mr-2" />
                  Save Policy
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}