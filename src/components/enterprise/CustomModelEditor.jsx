import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Save, Trash2, Brain, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export default function CustomModelEditor() {
  const [editing, setEditing] = useState(null);
  const [formData, setFormData] = useState({
    model_name: '',
    custom_instructions: '',
    industry_focus: 'general',
    detection_priorities: { bias_weight: 1, sentiment_weight: 1, moderation_weight: 1 }
  });
  const queryClient = useQueryClient();

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const { data: models = [], isLoading } = useQuery({
    queryKey: ['customModels'],
    queryFn: () => base44.entities.CustomAIModel.list('-created_date', 50)
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.CustomAIModel.create({
      ...data,
      organization_id: currentUser.email
    }),
    onSuccess: () => {
      queryClient.invalidateQueries(['customModels']);
      toast.success('Model created successfully');
      setEditing(null);
      resetForm();
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.CustomAIModel.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['customModels']);
      toast.success('Model updated successfully');
      setEditing(null);
      resetForm();
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.CustomAIModel.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['customModels']);
      toast.success('Model deleted');
    }
  });

  const resetForm = () => {
    setFormData({
      model_name: '',
      custom_instructions: '',
      industry_focus: 'general',
      detection_priorities: { bias_weight: 1, sentiment_weight: 1, moderation_weight: 1 }
    });
  };

  const handleSave = () => {
    if (editing === 'new') {
      createMutation.mutate(formData);
    } else {
      updateMutation.mutate({ id: editing, data: formData });
    }
  };

  const handleEdit = (model) => {
    setEditing(model.id);
    setFormData({
      model_name: model.model_name,
      custom_instructions: model.custom_instructions || '',
      industry_focus: model.industry_focus || 'general',
      detection_priorities: model.detection_priorities || { bias_weight: 1, sentiment_weight: 1, moderation_weight: 1 }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Custom AI Models</h2>
          <p className="text-slate-600">Fine-tune AI behavior for your specific needs</p>
        </div>
        <Button onClick={() => setEditing('new')} className="bg-indigo-600 hover:bg-indigo-700">
          <Plus className="w-4 h-4 mr-2" />
          New Model
        </Button>
      </div>

      {/* Model List */}
      {isLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full mx-auto" />
        </div>
      ) : models.length === 0 && !editing ? (
        <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
          <Brain className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-600">No custom models yet</p>
          <p className="text-sm text-slate-500 mt-2">Create your first model to get started</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {models.map(model => (
            <motion.div
              key={model.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-xl border border-slate-200 p-6 hover:border-slate-300 transition-colors"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center">
                    <Brain className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900">{model.model_name}</h3>
                    <p className="text-xs text-slate-500 capitalize">{model.industry_focus}</p>
                  </div>
                </div>
                <div className={`w-2 h-2 rounded-full ${model.active ? 'bg-emerald-500' : 'bg-slate-300'}`} />
              </div>

              {model.performance_metrics?.total_analyses > 0 && (
                <div className="flex items-center gap-2 text-sm text-slate-600 mb-4">
                  <TrendingUp className="w-4 h-4" />
                  <span>{model.performance_metrics.total_analyses} analyses</span>
                </div>
              )}

              <div className="flex gap-2">
                <Button onClick={() => handleEdit(model)} variant="outline" size="sm" className="flex-1">
                  Edit
                </Button>
                <Button 
                  onClick={() => deleteMutation.mutate(model.id)} 
                  variant="outline" 
                  size="sm"
                  className="text-red-600 hover:text-red-700"
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
              className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="p-6 border-b border-slate-200">
                <h3 className="text-xl font-bold text-slate-900">
                  {editing === 'new' ? 'Create' : 'Edit'} Custom Model
                </h3>
              </div>

              <div className="p-6 space-y-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Model Name</label>
                  <Input
                    value={formData.model_name}
                    onChange={(e) => setFormData({ ...formData, model_name: e.target.value })}
                    placeholder="e.g., Healthcare Content Analyzer"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Industry Focus</label>
                  <select
                    value={formData.industry_focus}
                    onChange={(e) => setFormData({ ...formData, industry_focus: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border border-slate-200"
                  >
                    <option value="general">General</option>
                    <option value="healthcare">Healthcare</option>
                    <option value="finance">Finance</option>
                    <option value="education">Education</option>
                    <option value="legal">Legal</option>
                    <option value="media">Media</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Custom Instructions</label>
                  <Textarea
                    value={formData.custom_instructions}
                    onChange={(e) => setFormData({ ...formData, custom_instructions: e.target.value })}
                    placeholder="Provide specific guidelines for how the AI should analyze content..."
                    rows={6}
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    These instructions will be prepended to every analysis
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-4">Detection Priority Weights</label>
                  <div className="space-y-4">
                    {['bias', 'sentiment', 'moderation'].map(type => (
                      <div key={type}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-slate-700 capitalize">{type}</span>
                          <span className="text-sm font-medium text-slate-900">
                            {formData.detection_priorities[`${type}_weight`].toFixed(1)}x
                          </span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="2"
                          step="0.1"
                          value={formData.detection_priorities[`${type}_weight`]}
                          onChange={(e) => setFormData({
                            ...formData,
                            detection_priorities: {
                              ...formData.detection_priorities,
                              [`${type}_weight`]: parseFloat(e.target.value)
                            }
                          })}
                          className="w-full"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-slate-200 flex justify-end gap-3">
                <Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
                <Button onClick={handleSave} className="bg-indigo-600 hover:bg-indigo-700">
                  <Save className="w-4 h-4 mr-2" />
                  Save Model
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}