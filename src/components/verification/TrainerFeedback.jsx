import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ThumbsUp, ThumbsDown, MessageSquare, CheckCircle2, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { useMutation, useQueryClient } from '@tanstack/react-query';

const artifactOptions = {
  image: [
    { id: 'unnatural_smoothing', label: 'Unnatural Skin Smoothing' },
    { id: 'perfect_symmetry', label: 'Perfect Facial Symmetry' },
    { id: 'hand_anatomy', label: 'Incorrect Hand/Finger Anatomy' },
    { id: 'background_melting', label: 'Background Melting/Incoherence' },
    { id: 'lighting_issues', label: 'Inconsistent Lighting' },
    { id: 'garbled_text', label: 'Garbled Text' },
    { id: 'repetitive_patterns', label: 'Unnatural Repetitive Patterns' },
    { id: 'missing_exif', label: 'Missing Camera Metadata' }
  ],
  video: [
    { id: 'temporal_inconsistency', label: 'Temporal Inconsistencies' },
    { id: 'frame_flickering', label: 'Objects Flickering Between Frames' },
    { id: 'unnatural_blinking', label: 'Unnatural/Absent Blinking' },
    { id: 'face_boundary', label: 'Face Boundary Artifacts' },
    { id: 'scene_shifts', label: 'Sudden Scene/Style Shifts' },
    { id: 'audio_sync', label: 'Audio Sync Issues' },
    { id: 'motion_blur', label: 'Unnatural Motion Blur' },
    { id: 'background_distortion', label: 'Background Distortion Around Subject' }
  ],
  url: [
    { id: 'unnatural_smoothing', label: 'Unnatural Skin Smoothing' },
    { id: 'perfect_symmetry', label: 'Perfect Facial Symmetry' },
    { id: 'hand_anatomy', label: 'Incorrect Hand/Finger Anatomy' },
    { id: 'background_melting', label: 'Background Melting/Incoherence' },
    { id: 'lighting_issues', label: 'Inconsistent Lighting' }
  ]
};

export default function TrainerFeedback({ result, user }) {
  const [showForm, setShowForm] = useState(false);
  const [selectedLabel, setSelectedLabel] = useState(null);
  const [notes, setNotes] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [selectedArtifacts, setSelectedArtifacts] = useState([]);
  const [artifactNotes, setArtifactNotes] = useState('');

  const queryClient = useQueryClient();
  
  const availableArtifacts = artifactOptions[result.content_type] || artifactOptions.image;

  const toggleArtifact = (artifactId) => {
    setSelectedArtifacts(prev => 
      prev.includes(artifactId) 
        ? prev.filter(id => id !== artifactId)
        : [...prev, artifactId]
    );
  };

  const submitFeedback = useMutation({
    mutationFn: async (feedbackData) => {
      return await base44.entities.TrainingFeedback.create(feedbackData);
    },
    onSuccess: async () => {
      // Update trainer's contribution count
      const currentUser = await base44.auth.me();
      await base44.auth.updateMe({
        training_contributions: (currentUser.training_contributions || 0) + 1
      });
      
      setSubmitted(true);
      toast.success('Training feedback submitted! Thank you for improving our AI.');
      queryClient.invalidateQueries(['trainingFeedback']);
    },
    onError: () => {
      toast.error('Failed to submit feedback');
    }
  });

  const handleSubmit = () => {
    if (!selectedLabel) {
      toast.error('Please select a label');
      return;
    }

    const confidenceMatch = 
      (selectedLabel === 'real' && result.result === 'likely_real') ||
      (selectedLabel === 'ai_generated' && (result.result === 'likely_ai' || result.result === 'likely_deepfake'));

    submitFeedback.mutate({
      analysis_id: result.id,
      actual_label: selectedLabel,
      ai_prediction: result.result,
      confidence_match: confidenceMatch,
      notes: notes.trim() || null,
      content_type: result.content_type,
      file_url: result.file_url,
      observed_artifacts: selectedArtifacts.length > 0 ? selectedArtifacts : null,
      artifact_notes: artifactNotes.trim() || null
    });
  };

  if (!user?.is_trainer) {
    return null;
  }

  if (submitted) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-2xl border-2 border-emerald-200 p-6 mb-6"
      >
        <div className="flex items-center gap-3">
          <CheckCircle2 className="w-8 h-8 text-emerald-600" />
          <div>
            <h3 className="font-bold text-emerald-900">Training Feedback Submitted!</h3>
            <p className="text-sm text-emerald-700">Your label has been recorded and will help improve our detection accuracy.</p>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border-2 border-blue-200 p-6 mb-6"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🎓</span>
          <div>
            <h3 className="font-bold text-slate-900">Trainer Mode</h3>
            <p className="text-sm text-slate-600">Help improve our AI by labeling this content</p>
          </div>
        </div>
        <span className="px-3 py-1 bg-blue-600 text-white text-xs font-bold rounded-full">
          TRAINER
        </span>
      </div>

      <AnimatePresence mode="wait">
        {!showForm ? (
          <motion.div
            key="button"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <Button
              onClick={() => setShowForm(true)}
              className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-semibold"
            >
              Provide Training Label
            </Button>
          </motion.div>
        ) : (
          <motion.div
            key="form"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            <div>
              <label className="text-sm font-semibold text-slate-700 mb-2 block">
                What is this content actually?
              </label>
              <div className="grid grid-cols-3 gap-3">
                <button
                  onClick={() => setSelectedLabel('real')}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    selectedLabel === 'real'
                      ? 'border-emerald-500 bg-emerald-50'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <ThumbsUp className={`w-6 h-6 mx-auto mb-2 ${
                    selectedLabel === 'real' ? 'text-emerald-600' : 'text-slate-400'
                  }`} />
                  <div className="text-sm font-semibold text-slate-900">Real</div>
                </button>
                
                <button
                  onClick={() => setSelectedLabel('ai_generated')}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    selectedLabel === 'ai_generated'
                      ? 'border-amber-500 bg-amber-50'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <ThumbsDown className={`w-6 h-6 mx-auto mb-2 ${
                    selectedLabel === 'ai_generated' ? 'text-amber-600' : 'text-slate-400'
                  }`} />
                  <div className="text-sm font-semibold text-slate-900">A.I.</div>
                </button>

                <button
                  onClick={() => setSelectedLabel('uncertain')}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    selectedLabel === 'uncertain'
                      ? 'border-slate-500 bg-slate-50'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <MessageSquare className={`w-6 h-6 mx-auto mb-2 ${
                    selectedLabel === 'uncertain' ? 'text-slate-600' : 'text-slate-400'
                  }`} />
                  <div className="text-sm font-semibold text-slate-900">Unsure</div>
                </button>
              </div>
            </div>

            <div>
              <label className="text-sm font-semibold text-slate-700 mb-2 block">
                Notes (optional)
              </label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Why did you make this choice? Any specific details you noticed?"
                className="resize-none h-24"
              />
            </div>

            {/* Advanced Section */}
            <div className="border-t border-blue-200 pt-4">
              <button
                type="button"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="flex items-center justify-between w-full text-sm font-semibold text-slate-700 hover:text-slate-900 transition-colors"
              >
                <span className="flex items-center gap-2">
                  🔬 Advanced Feedback
                  {selectedArtifacts.length > 0 && (
                    <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs">
                      {selectedArtifacts.length} selected
                    </span>
                  )}
                </span>
                {showAdvanced ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </button>

              <AnimatePresence>
                {showAdvanced && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="mt-4 space-y-4">
                      <div>
                        <label className="text-sm font-semibold text-slate-700 mb-3 block">
                          Observed Artifacts:
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-60 overflow-y-auto p-3 bg-white rounded-lg border border-blue-100">
                          {availableArtifacts.map((artifact) => (
                            <div
                              key={artifact.id}
                              className="flex items-center gap-2 p-2 rounded-lg hover:bg-slate-50 transition-colors"
                            >
                              <Checkbox
                                id={artifact.id}
                                checked={selectedArtifacts.includes(artifact.id)}
                                onCheckedChange={() => toggleArtifact(artifact.id)}
                              />
                              <label
                                htmlFor={artifact.id}
                                className="text-sm text-slate-700 cursor-pointer flex-1"
                              >
                                {artifact.label}
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="text-sm font-semibold text-slate-700 mb-2 block">
                          Artifact Details:
                        </label>
                        <Textarea
                          placeholder="Describe the specific artifacts you observed in detail..."
                          value={artifactNotes}
                          onChange={(e) => setArtifactNotes(e.target.value)}
                          className="resize-none h-24"
                        />
                        <p className="text-xs text-slate-500 mt-1">
                          💡 Be specific: "Left hand has 6 fingers" or "Face symmetry is unnaturally perfect"
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={() => {
                  setShowForm(false);
                  setSelectedLabel(null);
                  setNotes('');
                  setShowAdvanced(false);
                  setSelectedArtifacts([]);
                  setArtifactNotes('');
                }}
                variant="outline"
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={!selectedLabel || submitFeedback.isPending}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                {submitFeedback.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  'Submit Label'
                )}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}