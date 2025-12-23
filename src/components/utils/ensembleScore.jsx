/**
 * Ensemble scoring combining LLM patch votes, forensics, and provenance
 */

export function deriveLlmScoreFromPatchVotes(patchVotes) {
  if (!patchVotes || patchVotes.length === 0) {
    return { score: 50, confidence: 0 };
  }

  const aiVotes = patchVotes.filter(p => p.vote === 'likely_ai').length;
  const realVotes = patchVotes.filter(p => p.vote === 'likely_real').length;
  const uncertainVotes = patchVotes.filter(p => p.vote === 'uncertain').length;
  
  const totalVotes = patchVotes.length;
  const aiRatio = aiVotes / totalVotes;
  const realRatio = realVotes / totalVotes;
  const avgConfidence = patchVotes.reduce((sum, p) => sum + (p.confidence || 50), 0) / totalVotes;
  
  // More decisive scoring
  let score;
  if (aiVotes > realVotes) {
    // More AI votes: scale more aggressively toward AI
    score = 50 + (aiRatio * 50);
  } else if (realVotes > aiVotes) {
    // More real votes: scale more aggressively toward Real
    score = 50 - (realRatio * 50);
  } else {
    // Tie = uncertain
    score = 50;
  }
  
  return { score: Math.round(score), confidence: Math.round(avgConfidence) };
}

export function ensembleDecision({ llm, forensics, provenance }) {
  const weights = {
    llm: 0.6,        // Increased LLM weight when it's the primary signal
    forensics: 0.25,
    provenance: 0.15
  };
  
  let weightedScore = llm.score * weights.llm;
  let totalWeight = weights.llm;
  
  if (forensics && typeof forensics.score === 'number' && forensics.reliability > 0.3) {
    weightedScore += forensics.score * weights.forensics * forensics.reliability;
    totalWeight += weights.forensics * forensics.reliability;
  }
  
  if (provenance && typeof provenance.score === 'number') {
    weightedScore += provenance.score * weights.provenance;
    totalWeight += weights.provenance;
  }
  
  const finalScore = Math.round(weightedScore / totalWeight);
  
  // Wider, more decisive thresholds
  let result;
  let confidence;
  
  if (finalScore >= 60) {
    // Likely AI
    result = 'likely_ai';
    confidence = Math.min(95, 40 + (finalScore - 60) * 1.5);
  } else if (finalScore <= 40) {
    // Likely Real
    result = 'likely_real';
    confidence = Math.min(95, 40 + (40 - finalScore) * 1.5);
  } else {
    // Uncertain - narrower band (40-60)
    result = 'uncertain';
    // Low confidence for uncertain results
    confidence = Math.max(20, 40 - Math.abs(finalScore - 50) * 2);
  }
  
  return {
    result,
    score: finalScore,
    confidence: Math.round(confidence)
  };
}