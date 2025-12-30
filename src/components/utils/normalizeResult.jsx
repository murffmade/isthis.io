// Normalize assessment results to consistent likelihood range format

const clamp = (value, min = 0, max = 100) => Math.max(min, Math.min(max, value));

export function normalizeResult(rawResult) {
  // If already normalized, return as-is
  if (rawResult.likelihood_min !== undefined && rawResult.likelihood_max !== undefined) {
    return {
      ...rawResult,
      risk_level: rawResult.risk_level || deriveRiskLevel(rawResult.likelihood_min, rawResult.likelihood_max),
      meta_confidence: rawResult.meta_confidence || 'MEDIUM'
    };
  }

  // Derive from single confidence score if available
  let baseScore = rawResult.confidence || rawResult.score || 50;
  let sampleSize = rawResult.signals?.length || 0;
  
  // Calculate band width based on confidence and sample size
  let bandWidth = 15; // Default uncertainty
  let metaConfidence = 'LOW';
  
  if (sampleSize > 10) {
    bandWidth = 10;
    metaConfidence = 'MEDIUM';
  }
  
  if (sampleSize > 20 && rawResult.forensics) {
    bandWidth = 8;
    metaConfidence = 'HIGH';
  }

  // Special handling for "likely_ai" vs "likely_real"
  if (rawResult.result === 'likely_ai') {
    baseScore = Math.max(baseScore, 60); // AI results should be >50%
  } else if (rawResult.result === 'likely_real') {
    baseScore = Math.min(baseScore, 40); // Real results should be <50%
  }

  const likelihood_min = clamp(baseScore - bandWidth);
  const likelihood_max = clamp(baseScore + bandWidth);
  
  return {
    ...rawResult,
    likelihood_min,
    likelihood_max,
    meta_confidence: rawResult.meta_confidence || metaConfidence,
    risk_level: rawResult.risk_level || deriveRiskLevel(likelihood_min, likelihood_max),
    narrative_explanation: rawResult.summary || rawResult.narrative_explanation || 'Assessment complete based on observable signals.',
    signals: normalizeSignals(rawResult.signals || [])
  };
}

export function deriveRiskLevel(min, max) {
  const midpoint = (min + max) / 2;
  
  if (max < 40) return 'LOW';
  if (min > 70) return 'HIGH';
  if (midpoint >= 40 && midpoint <= 70) return 'MEDIUM';
  
  // Edge cases
  if (min < 40 && max > 40) return 'MEDIUM';
  if (max > 70) return 'HIGH';
  
  return 'MEDIUM';
}

function normalizeSignals(signals) {
  return signals.map(signal => ({
    key: signal.signal_type || signal.key || 'unknown',
    label: signal.signal_type || signal.label || 'Signal',
    score: signal.detection_confidence || signal.score || 50,
    direction: signal.severity === 'high' ? 'AI' : signal.severity === 'low' ? 'HUMAN' : 'NEUTRAL',
    explanation: signal.description || signal.explanation || '',
    falsePositiveNote: signal.false_positive_notes || '',
    severity: signal.severity || 'medium'
  }));
}

// Helper to get risk color
export function getRiskColor(riskLevel) {
  switch (riskLevel) {
    case 'LOW':
      return 'text-emerald-600 bg-emerald-50 border-emerald-200';
    case 'MEDIUM':
      return 'text-amber-600 bg-amber-50 border-amber-200';
    case 'HIGH':
      return 'text-red-600 bg-red-50 border-red-200';
    default:
      return 'text-slate-600 bg-slate-50 border-slate-200';
  }
}

// Helper to get confidence color
export function getConfidenceColor(confidence) {
  switch (confidence) {
    case 'HIGH':
      return 'text-emerald-600 bg-emerald-50';
    case 'MEDIUM':
      return 'text-blue-600 bg-blue-50';
    case 'LOW':
      return 'text-amber-600 bg-amber-50';
    default:
      return 'text-slate-600 bg-slate-50';
  }
}