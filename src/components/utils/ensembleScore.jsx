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
  const avgConfidence = patchVotes.reduce((sum, p) => sum + (p.confidence || 50), 0) / totalVotes;
  
  // Conservative scoring: AI bias if patches disagree
  let score;
  if (aiVotes > realVotes) {
    score = 50 + (aiRatio * 50); // 50-100
  } else if (realVotes > aiVotes) {
    score = (1 - aiRatio) * 50; // 0-50
  } else {
    score = 50; // Tie = uncertain
  }
  
  return { score: Math.round(score), confidence: Math.round(avgConfidence) };
}

export function ensembleDecision({ llm, forensics, provenance }) {
  const weights = {
    llm: 0.5,
    forensics: 0.3,
    provenance: 0.2
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
  
  // Conservative thresholds
  let result;
  let confidence;
  
  if (finalScore >= 65) {
    result = 'likely_ai';
    confidence = Math.min(95, 50 + (finalScore - 65) * 1.3);
  } else if (finalScore <= 35) {
    result = 'likely_real';
    confidence = Math.min(95, 50 + (35 - finalScore) * 1.3);
  } else {
    result = 'uncertain';
    confidence = Math.max(40, 100 - Math.abs(finalScore - 50) * 2);
  }
  
  return {
    result,
    score: finalScore,
    confidence: Math.round(confidence)
  };
}