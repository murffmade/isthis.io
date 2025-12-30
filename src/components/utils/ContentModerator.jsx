import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, AlertTriangle, XCircle, CheckCircle, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';

export default function ContentModerator({ file_url, content_type, onComplete, onCancel }) {
  const [moderating, setModerating] = useState(true);
  const [result, setResult] = useState(null);

  React.useEffect(() => {
    moderateContent();
  }, []);

  const moderateContent = async () => {
    try {
      const { data } = await base44.functions.invoke('moderateContent', {
        file_url,
        content_type
      });

      if (data.success) {
        setResult(data.moderation);
        
        // Auto-complete if approved
        if (data.moderation.action === 'approve') {
          setTimeout(() => {
            onComplete({ approved: true, result: data.moderation });
          }, 1500);
        }
      }
    } catch (error) {
      setResult({
        safe: false,
        action: 'reject',
        overall_risk: 'high',
        violations: [],
        reasons: ['Failed to moderate content. Please try again.']
      });
    } finally {
      setModerating(false);
    }
  };

  const getRiskColor = (risk) => {
    switch (risk) {
      case 'none': return 'text-emerald-600 bg-emerald-50 border-emerald-200';
      case 'low': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'medium': return 'text-amber-600 bg-amber-50 border-amber-200';
      case 'high': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'critical': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-slate-600 bg-slate-50 border-slate-200';
    }
  };

  const getSeverityIcon = (action) => {
    switch (action) {
      case 'approve': return <CheckCircle className="w-12 h-12 text-emerald-500" />;
      case 'flag': return <AlertTriangle className="w-12 h-12 text-amber-500" />;
      case 'reject': return <XCircle className="w-12 h-12 text-red-500" />;
      default: return <Shield className="w-12 h-12 text-slate-400" />;
    }
  };

  if (moderating) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-6"
      >
        <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-2">
            Moderating Content
          </h3>
          <p className="text-slate-600">
            Checking content against community guidelines...
          </p>
          <div className="flex items-center justify-center gap-1 mt-6">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        </div>
      </motion.div>
    );
  }

  if (!result) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-6"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
      >
        <div className="text-center mb-6">
          <div className="mb-4">{getSeverityIcon(result.action)}</div>
          
          <h3 className="text-2xl font-bold text-slate-900 mb-2">
            {result.action === 'approve' && 'Content Approved'}
            {result.action === 'flag' && 'Content Flagged for Review'}
            {result.action === 'reject' && 'Content Rejected'}
          </h3>
          
          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold border-2 ${getRiskColor(result.overall_risk)}`}>
            {result.overall_risk.toUpperCase()} RISK
          </div>
        </div>

        {result.action === 'approve' && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 mb-4">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
              <div>
                <div className="font-semibold text-emerald-900 mb-1">
                  No violations detected
                </div>
                <div className="text-sm text-emerald-700">
                  Your content complies with our community guidelines and is ready to be processed.
                </div>
              </div>
            </div>
          </div>
        )}

        {result.violations?.length > 0 && (
          <div className="space-y-4 mb-6">
            <div className="font-semibold text-slate-900 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
              Detected Violations
            </div>
            
            {result.violations.map((violation, i) => (
              <div key={i} className={`rounded-xl p-4 border-2 ${getRiskColor(violation.severity)}`}>
                <div className="flex items-start justify-between mb-2">
                  <div className="font-semibold">{violation.category}</div>
                  <div className="text-sm font-bold uppercase">
                    {violation.severity} ({Math.round(violation.confidence * 100)}%)
                  </div>
                </div>
                <p className="text-sm mb-2">{violation.description}</p>
                {violation.specific_elements?.length > 0 && (
                  <div className="space-y-1 mt-2">
                    {violation.specific_elements.map((element, j) => (
                      <div key={j} className="text-xs opacity-90 flex items-start gap-2">
                        <span>•</span>
                        <span>{element}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {result.reasons?.length > 0 && (
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-6">
            <div className="font-semibold text-slate-900 mb-2 flex items-center gap-2">
              <Info className="w-4 h-4" />
              Reasons
            </div>
            <ul className="space-y-1">
              {result.reasons.map((reason, i) => (
                <li key={i} className="text-sm text-slate-700">• {reason}</li>
              ))}
            </ul>
          </div>
        )}

        {result.recommendations?.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
            <div className="font-semibold text-blue-900 mb-2">Recommendations</div>
            <ul className="space-y-1">
              {result.recommendations.map((rec, i) => (
                <li key={i} className="text-sm text-blue-700">• {rec}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="flex gap-3">
          {result.action === 'reject' && (
            <>
              <Button
                onClick={() => onCancel()}
                variant="outline"
                className="flex-1"
              >
                Cancel Upload
              </Button>
            </>
          )}
          
          {result.action === 'flag' && (
            <>
              <Button
                onClick={() => onCancel()}
                variant="outline"
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={() => onComplete({ approved: false, flagged: true, result })}
                className="flex-1 bg-amber-600 hover:bg-amber-700"
              >
                Continue with Flag
              </Button>
            </>
          )}

          {result.action === 'approve' && (
            <Button
              onClick={() => onComplete({ approved: true, result })}
              className="w-full bg-emerald-600 hover:bg-emerald-700"
            >
              Continue
            </Button>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}