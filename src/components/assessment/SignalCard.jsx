import React, { useState } from 'react';
import { ChevronDown, ChevronUp, AlertCircle, TrendingUp, TrendingDown } from 'lucide-react';

export default function SignalCard({ signal }) {
  const [expanded, setExpanded] = useState(false);

  const getImpactConfig = () => {
    switch (signal.impact) {
      case 'AI':
        return { color: 'text-red-600', bg: 'bg-red-50', icon: TrendingUp, label: 'Suggests AI' };
      case 'HUMAN':
        return { color: 'text-emerald-600', bg: 'bg-emerald-50', icon: TrendingDown, label: 'Suggests Human' };
      default:
        return { color: 'text-slate-600', bg: 'bg-slate-50', icon: AlertCircle, label: 'Neutral' };
    }
  };

  const impact = getImpactConfig();
  const ImpactIcon = impact.icon;

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden hover:border-slate-300 transition-colors">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-4 flex items-center justify-between hover:bg-slate-50 transition-colors"
      >
        <div className="flex items-center gap-4 flex-1">
          <div className="flex flex-col items-center">
            <div className="text-2xl font-bold text-slate-900">{signal.score}</div>
            <div className="text-xs text-slate-500">/100</div>
          </div>
          <div className="flex-1">
            <h4 className="font-semibold text-slate-900 text-left">{signal.name}</h4>
            <div className={`inline-flex items-center gap-1 mt-1 text-xs font-medium ${impact.color}`}>
              <ImpactIcon className="w-3 h-3" />
              {impact.label}
            </div>
          </div>
        </div>
        {expanded ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
      </button>

      {expanded && (
        <div className="p-4 pt-0 space-y-3 border-t border-slate-100">
          <div>
            <h5 className="text-xs font-semibold text-slate-700 mb-1">Explanation</h5>
            <p className="text-sm text-slate-600">{signal.explanation}</p>
          </div>

          {signal.false_positive_notes && (
            <div className={`p-3 rounded-lg ${impact.bg}`}>
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h5 className="text-xs font-semibold text-slate-700 mb-1">Potential False Positives</h5>
                  <p className="text-xs text-slate-600">{signal.false_positive_notes}</p>
                </div>
              </div>
            </div>
          )}

          {signal.weight !== undefined && (
            <div className="text-xs text-slate-500">
              Weight in overall score: {(signal.weight * 100).toFixed(1)}%
            </div>
          )}
        </div>
      )}
    </div>
  );
}