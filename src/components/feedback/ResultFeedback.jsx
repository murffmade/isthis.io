import React, { useState } from 'react';
import { ThumbsUp, ThumbsDown, Check } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { getSessionId } from '@/components/utils/analytics';
import { motion, AnimatePresence } from 'framer-motion';

export default function ResultFeedback({ resultId }) {
  const [feedback, setFeedback] = useState(null);
  const [comment, setComment] = useState('');
  const [showComment, setShowComment] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleFeedback = async (helpful) => {
    setFeedback(helpful);
    if (!helpful) {
      setShowComment(true);
    } else {
      await submitFeedback(helpful, '');
    }
  };

  const submitFeedback = async (helpful, commentText) => {
    try {
      const sessionId = getSessionId();
      let userId = null;
      
      try {
        const user = await base44.auth.me();
        userId = user?.id || null;
      } catch {
        // Anonymous feedback
      }

      await base44.entities.ResultFeedback.create({
        session_id: sessionId,
        user_id: userId,
        result_id: resultId,
        helpful,
        comment: commentText || null,
        page: window.location.pathname
      });

      setSubmitted(true);
    } catch (error) {
      console.error('Failed to submit feedback:', error);
    }
  };

  const handleSubmitComment = async () => {
    await submitFeedback(false, comment);
  };

  if (submitted) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex items-center gap-2 text-emerald-600 text-sm font-medium"
      >
        <Check className="w-4 h-4" />
        Thanks — this helps us improve.
      </motion.div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <p className="text-sm text-slate-600">Was this helpful?</p>
        <div className="flex gap-2">
          <button
            onClick={() => handleFeedback(true)}
            disabled={feedback !== null}
            className={`p-2 rounded-lg border-2 transition-all ${
              feedback === true
                ? 'border-emerald-500 bg-emerald-50 text-emerald-600'
                : 'border-slate-200 hover:border-emerald-300 text-slate-600'
            }`}
          >
            <ThumbsUp className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleFeedback(false)}
            disabled={feedback !== null}
            className={`p-2 rounded-lg border-2 transition-all ${
              feedback === false
                ? 'border-red-500 bg-red-50 text-red-600'
                : 'border-slate-200 hover:border-red-300 text-slate-600'
            }`}
          >
            <ThumbsDown className="w-4 h-4" />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {showComment && !submitted && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-2"
          >
            <textarea
              placeholder="What was missing? (optional)"
              value={comment}
              onChange={(e) => setComment(e.target.value.slice(0, 300))}
              maxLength={300}
              className="w-full p-3 border-2 border-slate-200 rounded-lg text-sm focus:border-blue-400 focus:outline-none resize-none"
              rows={3}
            />
            <div className="flex justify-between items-center">
              <span className="text-xs text-slate-400">{comment.length}/300</span>
              <button
                onClick={handleSubmitComment}
                className="px-4 py-2 bg-slate-900 text-white text-sm font-semibold rounded-lg hover:bg-slate-800 transition-colors"
              >
                Submit
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}