import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Download, CheckCircle, AlertTriangle, XCircle, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';

export default function BatchResults({ batch, onStartOver }) {
  const [expandedId, setExpandedId] = useState(null);

  // Fetch all analyses in this batch
  const { data: analyses = [], isLoading } = useQuery({
    queryKey: ['batch-analyses', batch.id],
    queryFn: async () => {
      if (!batch.analysis_ids || batch.analysis_ids.length === 0) return [];
      
      const promises = batch.analysis_ids.map(id => 
        base44.entities.Analysis.filter({ id })
      );
      const results = await Promise.all(promises);
      return results.flat();
    },
    enabled: !!batch.analysis_ids?.length
  });

  const handleExportCSV = () => {
    const headers = ['Input', 'Type', 'Score', 'Label', 'Summary'];
    const rows = analyses.map(a => [
      a.input_value?.substring(0, 100) || '',
      a.input_type,
      a.score,
      a.score_label,
      a.summary?.replace(/"/g, '""') || ''
    ]);

    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${batch.name.replace(/[^a-z0-9]/gi, '_')}_results.csv`;
    a.click();
    toast.success('Report exported');
  };

  const getSeverityColor = (score) => {
    if (score >= 70) return 'text-red-600 bg-red-50';
    if (score >= 40) return 'text-amber-600 bg-amber-50';
    return 'text-emerald-600 bg-emerald-50';
  };

  const getSeverityIcon = (score) => {
    if (score >= 70) return <XCircle className="w-5 h-5" />;
    if (score >= 40) return <AlertTriangle className="w-5 h-5" />;
    return <CheckCircle className="w-5 h-5" />;
  };

  return (
    <div className="max-w-5xl mx-auto">
      {/* Summary Header */}
      <div className="bg-white rounded-2xl border-2 border-slate-200 p-8 mb-6">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-3xl font-bold text-slate-900 mb-2">{batch.name}</h2>
            <p className="text-slate-600">Batch analysis completed</p>
          </div>
          <Button onClick={handleExportCSV} variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>

        {/* Summary Stats */}
        {batch.summary && (
          <div className="grid grid-cols-4 gap-4">
            <div className="p-4 bg-slate-50 rounded-xl text-center">
              <div className="text-3xl font-bold text-slate-900">{batch.total_items}</div>
              <div className="text-sm text-slate-600">Total Items</div>
            </div>
            <div className="p-4 bg-blue-50 rounded-xl text-center">
              <div className="text-3xl font-bold text-blue-600">{batch.summary.average_score}</div>
              <div className="text-sm text-blue-700">Avg Score</div>
            </div>
            <div className="p-4 bg-red-50 rounded-xl text-center">
              <div className="text-3xl font-bold text-red-600">{batch.summary.high_risk_count}</div>
              <div className="text-sm text-red-700">High Risk</div>
            </div>
            <div className="p-4 bg-amber-50 rounded-xl text-center">
              <div className="text-3xl font-bold text-amber-600">{batch.summary.medium_risk_count}</div>
              <div className="text-sm text-amber-700">Medium Risk</div>
            </div>
          </div>
        )}
      </div>

      {/* Individual Results */}
      <div className="bg-white rounded-2xl border-2 border-slate-200 p-6">
        <h3 className="text-xl font-bold text-slate-900 mb-4">Individual Results</h3>
        
        {isLoading ? (
          <div className="text-center py-8 text-slate-500">Loading results...</div>
        ) : analyses.length === 0 ? (
          <div className="text-center py-8 text-slate-500">No results found</div>
        ) : (
          <div className="space-y-3">
            {analyses.map((analysis, index) => (
              <div
                key={analysis.id}
                className="border border-slate-200 rounded-lg overflow-hidden"
              >
                <button
                  onClick={() => setExpandedId(expandedId === analysis.id ? null : analysis.id)}
                  className="w-full p-4 hover:bg-slate-50 transition-colors text-left"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className={`flex items-center justify-center w-10 h-10 rounded-lg ${getSeverityColor(analysis.score)}`}>
                        {getSeverityIcon(analysis.score)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-slate-900 truncate">
                          {analysis.input_type === 'text' 
                            ? analysis.input_value?.substring(0, 60) + '...'
                            : analysis.input_value?.split('/').pop()?.substring(0, 40) || `Item ${index + 1}`
                          }
                        </div>
                        <div className="text-xs text-slate-500">
                          Score: {analysis.score} • {analysis.score_label}
                        </div>
                      </div>
                    </div>
                    <div className="text-slate-400">
                      {expandedId === analysis.id ? '−' : '+'}
                    </div>
                  </div>
                </button>

                {expandedId === analysis.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="border-t border-slate-200 p-4 bg-slate-50"
                  >
                    <div className="space-y-3">
                      <div>
                        <h4 className="text-sm font-semibold text-slate-700 mb-1">Summary</h4>
                        <p className="text-sm text-slate-600">{analysis.summary}</p>
                      </div>

                      {analysis.signals && analysis.signals.length > 0 && (
                        <div>
                          <h4 className="text-sm font-semibold text-slate-700 mb-2">Key Signals</h4>
                          <div className="space-y-2">
                            {analysis.signals.slice(0, 3).map((signal, i) => (
                              <div key={i} className="text-sm">
                                <span className="font-medium text-slate-700">{signal.title}</span>
                                <p className="text-slate-600">{signal.description}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {analysis.input_type === 'url' && (
                        <a
                          href={analysis.input_value}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
                        >
                          View Original <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </motion.div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="mt-6 flex justify-center">
        <Button onClick={onStartOver} className="bg-slate-900 hover:bg-slate-800">
          Start New Batch
        </Button>
      </div>
    </div>
  );
}