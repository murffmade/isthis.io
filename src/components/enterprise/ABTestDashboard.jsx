import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Play, Pause, Eye, TrendingUp, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export default function ABTestDashboard() {
  const [showCreate, setShowCreate] = useState(false);
  const queryClient = useQueryClient();

  const { data: tests = [], isLoading } = useQuery({
    queryKey: ['abTests'],
    queryFn: () => base44.entities.ABTest.list('-created_date', 50)
  });

  const { data: models = [] } = useQuery({
    queryKey: ['customModels'],
    queryFn: () => base44.entities.CustomAIModel.list()
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }) => base44.entities.ABTest.update(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries(['abTests']);
      toast.success('Test status updated');
    }
  });

  const getStatusBadge = (status) => {
    const colors = {
      draft: 'bg-slate-100 text-slate-700',
      running: 'bg-emerald-100 text-emerald-700',
      paused: 'bg-amber-100 text-amber-700',
      completed: 'bg-blue-100 text-blue-700'
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${colors[status]}`}>
        {status}
      </span>
    );
  };

  const getWinnerBadge = (winner) => {
    if (!winner) return null;
    return (
      <div className="flex items-center gap-1 text-emerald-700 font-semibold">
        <TrendingUp className="w-4 h-4" />
        Winner: Variant {winner}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">A/B Testing</h2>
          <p className="text-slate-600">Compare model performance and optimize accuracy</p>
        </div>
        <Button onClick={() => setShowCreate(true)} className="bg-indigo-600 hover:bg-indigo-700">
          <Plus className="w-4 h-4 mr-2" />
          New Test
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full mx-auto" />
        </div>
      ) : tests.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
          <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-600">No A/B tests yet</p>
          <p className="text-sm text-slate-500 mt-2">Create a test to compare model performance</p>
        </div>
      ) : (
        <div className="space-y-4">
          {tests.map(test => (
            <motion.div
              key={test.id}
              className="bg-white rounded-xl border border-slate-200 p-6"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold text-slate-900">{test.test_name}</h3>
                    {getStatusBadge(test.status)}
                  </div>
                  <p className="text-sm text-slate-600">{test.description}</p>
                </div>
                <div className="flex gap-2">
                  {test.status === 'running' ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateStatusMutation.mutate({ id: test.id, status: 'paused' })}
                    >
                      <Pause className="w-4 h-4" />
                    </Button>
                  ) : test.status === 'draft' || test.status === 'paused' ? (
                    <Button
                      size="sm"
                      className="bg-emerald-600 hover:bg-emerald-700"
                      onClick={() => updateStatusMutation.mutate({ id: test.id, status: 'running' })}
                    >
                      <Play className="w-4 h-4" />
                    </Button>
                  ) : null}
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6 mb-4">
                {/* Variant A */}
                <div className="bg-slate-50 rounded-lg p-4">
                  <div className="font-medium text-slate-900 mb-3">
                    Variant A (Control): {test.variant_a.name}
                  </div>
                  {test.results && (
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-600">Samples:</span>
                        <span className="font-medium">{test.results.variant_a_samples || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Avg Confidence:</span>
                        <span className="font-medium">
                          {test.results.variant_a_avg_confidence ? 
                            `${(test.results.variant_a_avg_confidence * 100).toFixed(1)}%` : 
                            'N/A'}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Variant B */}
                <div className="bg-indigo-50 rounded-lg p-4">
                  <div className="font-medium text-slate-900 mb-3">
                    Variant B (Test): {test.variant_b.name}
                  </div>
                  {test.results && (
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-600">Samples:</span>
                        <span className="font-medium">{test.results.variant_b_samples || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Avg Confidence:</span>
                        <span className="font-medium">
                          {test.results.variant_b_avg_confidence ? 
                            `${(test.results.variant_b_avg_confidence * 100).toFixed(1)}%` : 
                            'N/A'}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {test.results?.winner && (
                <div className="flex items-center justify-between py-3 px-4 bg-emerald-50 rounded-lg border border-emerald-200">
                  {getWinnerBadge(test.results.winner)}
                  <div className="text-sm text-emerald-700">
                    Significance: {test.results.statistical_significance?.toFixed(1)}%
                  </div>
                </div>
              )}

              {!test.results?.winner && test.status === 'running' && (
                <div className="flex items-center gap-2 text-sm text-slate-600 py-2">
                  <AlertCircle className="w-4 h-4" />
                  Collecting more samples for statistical significance...
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}