/**
 * Enhanced ensemble scoring with adaptive weighting and sophisticated analysis
 */

export function deriveLlmScoreFromPatchVotes(patchVotes) {
  if (!patchVotes || patchVotes.length === 0) {
    return { score: 50, confidence: 20 };
  }

  const aiVotes = patchVotes.filter(p => p.vote === 'likely_ai').length;
  const realVotes = patchVotes.filter(p => p.vote === 'likely_real').length;
  const uncertainVotes = patchVotes.filter(p => p.vote === 'uncertain').length;
  
  const totalVotes = patchVotes.length;
  const avgConfidence = patchVotes.reduce((sum, p) => sum + (p.confidence || 50), 0) / totalVotes;
  
  // Calculate voting strength
  const aiRatio = aiVotes / totalVotes;
  const realRatio = realVotes / totalVotes;
  const uncertainRatio = uncertainVotes / totalVotes;
  
  // Decisive scoring: reward strong consensus
  let score;
  let confidence;
  
  if (realVotes > aiVotes && realRatio >= 0.6) {
    // Strong real consensus
    score = Math.max(15, 50 - (realRatio * 60));
    confidence = Math.min(90, avgConfidence * (1 + realRatio * 0.5));
  } else if (aiVotes > realVotes && aiRatio >= 0.6) {
    // Strong AI consensus
    score = Math.min(85, 50 + (aiRatio * 60));
    confidence = Math.min(90, avgConfidence * (1 + aiRatio * 0.5));
  } else if (realVotes > aiVotes) {
    // Weak real lean
    score = 50 - (realRatio * 40);
    confidence = avgConfidence * 0.8;
  } else if (aiVotes > realVotes) {
    // Weak AI lean
    score = 50 + (aiRatio * 40);
    confidence = avgConfidence * 0.8;
  } else {
    // True uncertainty - even split
    score = 50;
    confidence = Math.min(35, avgConfidence * 0.5);
  }
  
  // Penalize high uncertainty vote ratios
  if (uncertainRatio > 0.4) {
    confidence *= (1 - uncertainRatio * 0.5);
  }
  
  return { 
    score: Math.round(score), 
    confidence: Math.round(confidence),
    votingStrength: Math.abs(realRatio - aiRatio)
  };
}

export function ensembleDecision({ llm, forensics, provenance }) {
  // Adaptive weighting based on signal availability and strength
  let weights = {
    llm: 0.7,        // Primary signal
    forensics: 0.2,
    provenance: 0.1
  };
  
  // Boost LLM weight if it's the only strong signal
  const hasForensics = forensics && typeof forensics.score === 'number' && forensics.reliability > 0.3;
  const hasProvenance = provenance && typeof provenance.score === 'number';
  
  if (!hasForensics && !hasProvenance) {
    weights.llm = 1.0; // LLM is sole signal
  } else if (hasForensics && !hasProvenance) {
    weights = { llm: 0.75, forensics: 0.25, provenance: 0 };
  } else if (!hasForensics && hasProvenance) {
    weights = { llm: 0.8, forensics: 0, provenance: 0.2 };
  }
  
  let weightedScore = llm.score * weights.llm;
  let totalWeight = weights.llm;
  let confidenceBoost = 1.0;
  
  // Integrate forensics if reliable
  if (hasForensics) {
    const forensicsWeight = weights.forensics * forensics.reliability;
    weightedScore += forensics.score * forensicsWeight;
    totalWeight += forensicsWeight;
    
    // Boost confidence if forensics agrees with LLM
    const forensicsAgrees = Math.abs(forensics.score - llm.score) < 20;
    if (forensicsAgrees) {
      confidenceBoost *= 1.2;
    }
  }
  
  // Integrate provenance (EXIF presence suggests real)
  if (hasProvenance) {
    weightedScore += provenance.score * weights.provenance;
    totalWeight += weights.provenance;
    
    // Slight confidence boost for EXIF presence on real images
    if (llm.score < 50 && provenance.score < 50) {
      confidenceBoost *= 1.1;
    }
  }
  
  const finalScore = Math.round(weightedScore / totalWeight);
  
  // More aggressive thresholds with adaptive confidence
  let result;
  let confidence;
  
  if (finalScore >= 58) {
    // Likely AI
    result = 'likely_ai';
    const baseConfidence = 35 + (finalScore - 58) * 1.8;
    confidence = Math.min(95, baseConfidence * confidenceBoost);
  } else if (finalScore <= 42) {
    // Likely Real
    result = 'likely_real';
    const baseConfidence = 35 + (42 - finalScore) * 1.8;
    confidence = Math.min(95, baseConfidence * confidenceBoost);
  } else {
    // Uncertain (42-58 range = 16 point band)
    result = 'uncertain';
    // Very low confidence for uncertain zone
    confidence = Math.max(15, 35 - Math.abs(finalScore - 50) * 2);
  }
  
  // Factor in LLM voting strength for additional confidence adjustment
  if (llm.votingStrength && llm.votingStrength > 0.5) {
    confidence *= (1 + llm.votingStrength * 0.3);
    confidence = Math.min(95, confidence);
  }
  
  return {
    result,
    score: finalScore,
    confidence: Math.round(confidence),
    debug: {
      llmScore: llm.score,
      llmConfidence: llm.confidence,
      forensicsScore: hasForensics ? forensics.score : null,
      provenanceScore: hasProvenance ? provenance.score : null,
      weights,
      confidenceBoost
    }
  };
}