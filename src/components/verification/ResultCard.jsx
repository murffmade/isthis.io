import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, AlertTriangle, HelpCircle, ChevronRight, Info, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ShareModal from './ShareModal';

const resultConfig = {
  likely_real: {
    icon: CheckCircle2,
    title: 'Likely Real',
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50',
    borderColor: 'border-emerald-200',
    description: 'This content appears to be authentic based on our analysis.'
  },
  likely_ai: {
    icon: AlertTriangle,
    title: 'Likely AI-Generated',
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200',
    description: 'This content shows signs of being created or modified by AI.'
  },
  uncertain: {
    icon: HelpCircle,
    title: 'Uncertain',
    color: 'text-slate-600',
    bgColor: 'bg-slate-50',
    borderColor: 'border-slate-200',
    description: 'We cannot determine with confidence whether this content is authentic or AI-generated.'
  }
};

const severityColors = {
  low: 'bg-slate-100 text-slate-600',
  medium: 'bg-amber-100 text-amber-700',
  high: 'bg-red-100 text-red-700'
};

export default function ResultCard({ result, onTakeAction, onStartOver }) {
  const [showShareModal, setShowShareModal] = useState(false);
  const config = resultConfig[result.result] || resultConfig.uncertain;
  const Icon = config.icon;
  const showActionButton = result.result === 'likely_ai' && result.claims_to_be_real;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="w-full max-w-2xl mx-auto"
    >
      {/* Main Result Card */}
      <div className={`rounded-2xl border-2 ${config.borderColor} ${config.bgColor} p-8 mb-6`}>
        <div className="flex items-start gap-5">
          <div className={`w-16 h-16 rounded-2xl bg-white flex items-center justify-center shadow-sm`}>
            <Icon className={`w-8 h-8 ${config.color}`} />
          </div>
          <div className="flex-1">
            <h2 className={`text-2xl font-bold ${config.color} mb-1`}>
              {config.title}
            </h2>
            <p className="text-slate-600">
              {config.description}
            </p>
          </div>
        </div>

        {/* Confidence Score */}
        <div className="mt-6 pt-6 border-t border-white/50">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-slate-700">Confidence Estimate</span>
            <span className={`text-lg font-bold ${config.color}`}>{result.confidence}%</span>
          </div>
          <div className="h-2 bg-white rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${result.confidence}%` }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className={`h-full rounded-full ${
                result.result === 'likely_real' ? 'bg-emerald-500' :
                result.result === 'likely_ai' ? 'bg-amber-500' : 'bg-orange-500'
              }`}
            />
          </div>
        </div>
      </div>

      {/* Signals Section */}
      {result.signals && result.signals.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-6">
          <h3 className="font-semibold text-slate-800 mb-4">What we found</h3>
          <div className="space-y-3">
            {result.signals.map((signal, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-start gap-3 p-3 rounded-xl bg-slate-50"
              >
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${severityColors[signal.severity]}`}>
                  {signal.severity}
                </span>
                <div>
                  <p className="text-sm font-medium text-slate-700">{signal.signal_type}</p>
                  <p className="text-sm text-slate-500">{signal.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Summary */}
      {result.summary && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-6">
          <h3 className="font-semibold text-slate-800 mb-3">Summary</h3>
          <p className="text-slate-600 leading-relaxed">{result.summary}</p>
        </div>
      )}

      {/* Disclaimer */}
      <div className="flex items-start gap-3 p-4 rounded-xl bg-slate-50 mb-6">
        <Info className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
        <p className="text-xs text-slate-500 leading-relaxed">
          AI analysis isn't perfect and may be wrong. This assessment should not be used as proof. Always check multiple sources when evaluating if content is real.
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3">
        {showActionButton && (
          <Button 
            onClick={onTakeAction}
            className="flex-1 h-12 bg-slate-900 hover:bg-slate-800 text-white"
          >
            Report Options
            <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        )}
        <Button 
          onClick={() => setShowShareModal(true)}
          variant="outline"
          className="flex-1 h-12 border-slate-200 hover:bg-slate-50"
        >
          <Share2 className="w-4 h-4 mr-2" />
          Share Result
        </Button>
        <Button 
          onClick={onStartOver}
          variant="outline"
          className="flex-1 h-12 border-slate-200 hover:bg-slate-50"
        >
          Check Another
        </Button>
      </div>

      {/* Share Modal */}
      {showShareModal && (
        <ShareModal 
          result={result}
          onClose={() => setShowShareModal(false)}
        />
      )}
    </motion.div>
  );
}