import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function BatchProgress({ batch }) {
  const [currentBatch, setCurrentBatch] = useState(batch);

  useEffect(() => {
    // Poll for updates every 2 seconds
    const interval = setInterval(async () => {
      try {
        const updated = await base44.entities.BatchAnalysis.filter({ id: batch.id });
        if (updated && updated.length > 0) {
          setCurrentBatch(updated[0]);
          
          // Stop polling if completed or failed
          if (updated[0].status === 'completed' || updated[0].status === 'failed') {
            clearInterval(interval);
          }
        }
      } catch (error) {
        console.error('Failed to fetch batch status:', error);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [batch.id]);

  const progress = currentBatch.total_items > 0 
    ? ((currentBatch.completed_items + currentBatch.failed_items) / currentBatch.total_items) * 100 
    : 0;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-2xl border-2 border-slate-200 p-8 text-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-slate-100 mb-6"
        >
          <Loader2 className="w-10 h-10 text-slate-600" />
        </motion.div>

        <h2 className="text-2xl font-bold text-slate-900 mb-2">
          Analyzing Batch: {currentBatch.name}
        </h2>
        <p className="text-slate-600 mb-8">
          Processing {currentBatch.total_items} items...
        </p>

        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex items-center justify-between text-sm text-slate-600 mb-2">
            <span>Progress</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5 }}
              className="h-full bg-gradient-to-r from-slate-600 to-slate-900"
            />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="p-4 bg-slate-50 rounded-lg">
            <div className="text-2xl font-bold text-slate-900">
              {currentBatch.total_items}
            </div>
            <div className="text-xs text-slate-600">Total</div>
          </div>
          <div className="p-4 bg-emerald-50 rounded-lg">
            <div className="flex items-center justify-center gap-1 text-2xl font-bold text-emerald-600">
              <CheckCircle className="w-5 h-5" />
              {currentBatch.completed_items}
            </div>
            <div className="text-xs text-emerald-700">Completed</div>
          </div>
          <div className="p-4 bg-red-50 rounded-lg">
            <div className="flex items-center justify-center gap-1 text-2xl font-bold text-red-600">
              <XCircle className="w-5 h-5" />
              {currentBatch.failed_items}
            </div>
            <div className="text-xs text-red-700">Failed</div>
          </div>
        </div>

        <p className="text-sm text-slate-500 mt-6">
          This may take a few minutes depending on batch size
        </p>
      </div>
    </div>
  );
}