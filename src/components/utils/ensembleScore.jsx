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
  
  // Enhanced: Weight confidence by per-signal detection_confidence if available
  const avgConfidence = patchVotes.reduce((sum, p) => {
    let patchConfidence = p.confidence || 50;
    
    // If this patch has signals with detection_confidence, use weighted average
    if (p.signals && p.signals.length > 0) {
      const signalsWithDetectionConf = p.signals.filter(s => s.detection_confidence);
      if (signalsWithDetectionConf.length > 0) {
        const avgSignalConf = signalsWithDetectionConf.reduce((s, sig) => s + sig.detection_confidence, 0) / signalsWithDetectionConf.length;
        // Blend patch confidence with signal-level confidence
        patchConfidence = (patchConfidence * 0.6) + (avgSignalConf * 0.4);
      }
    }
    
    return sum + patchConfidence;
  }, 0) / totalVotes;
  
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

export function ensembleDecision({ llm, forensics, provenance, editingIndicators }) {
  // Enhanced adaptive weighting - LLM is now primary detector
  let weights = {
    llm: 0.75,       // Increased: LLM is most sophisticated
    forensics: 0.15,
    provenance: 0.05, // Reduced: absence is suspicious but presence doesn't guarantee real
    editing: 0.05
  };
  
  // Boost LLM weight if it's the only strong signal
  const hasForensics = forensics && typeof forensics.score === 'number' && forensics.reliability > 0.3;
  const hasProvenance = provenance && typeof provenance.score === 'number';
  const hasEditing = editingIndicators && (editingIndicators.hasPhotoshopSignature || editingIndicators.hasGimpSignature || editingIndicators.hasEditingSoftware);
  
  if (!hasForensics && !hasProvenance && !hasEditing) {
    weights.llm = 1.0; // LLM is sole signal
  } else if (hasForensics && !hasProvenance && !hasEditing) {
    weights = { llm: 0.75, forensics: 0.25, provenance: 0, editing: 0 };
  } else if (!hasForensics && hasProvenance && !hasEditing) {
    weights = { llm: 0.8, forensics: 0, provenance: 0.2, editing: 0 };
  } else if (!hasForensics && !hasProvenance && hasEditing) {
    weights = { llm: 0.8, forensics: 0, provenance: 0, editing: 0.2 };
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
  
  // Integrate provenance (CRITICAL: No EXIF is highly suspicious)
  if (hasProvenance) {
    // EXIF present - slightly boosts "real" signal
    weightedScore += provenance.score * weights.provenance;
    totalWeight += weights.provenance;

    if (llm.score < 50 && provenance.score < 50) {
      confidenceBoost *= 1.05;
    }
  } else {
    // NO EXIF - this is a MAJOR red flag for AI, boost AI score
    const noExifPenalty = 15; // Add 15 points toward AI (increases score)
    weightedScore += noExifPenalty * weights.provenance;
    totalWeight += weights.provenance;

    // If LLM also suspects AI, boost confidence significantly
    if (llm.score > 50) {
      confidenceBoost *= 1.25;
    }
  }
  
  // NEW: Integrate editing software detection
  if (hasEditing) {
    let editingScore = 35; // Default: suggests traditional editing (lower = more real)
    
    if (editingIndicators.hasPhotoshopSignature || editingIndicators.hasGimpSignature) {
      // Strong signal of traditional editing software
      editingScore = 25; // Lower score = suggests edited real photo, not AI
      confidenceBoost *= 1.15; // Boost confidence - we have metadata proof
    }
    
    if (editingIndicators.hasDateDiscrepancy) {
      // Date mismatch suggests editing but doesn't distinguish AI from Photoshop
      editingScore += 5;
    }
    
    weightedScore += editingScore * weights.editing;
    totalWeight += weights.editing;
  }
  
  const finalScore = Math.round(weightedScore / totalWeight);

  // Stricter thresholds - be more decisive
  let result;
  let confidence;

  if (finalScore >= 58) {
    // Likely AI
    result = 'likely_ai';
    const baseConfidence = 40 + (finalScore - 58) * 2.0;
    confidence = Math.min(95, baseConfidence * confidenceBoost);
  } else if (finalScore <= 37) {
    // Likely Real
    result = 'likely_real';
    const baseConfidence = 40 + (37 - finalScore) * 2.0;
    confidence = Math.min(95, baseConfidence * confidenceBoost);
  } else if (finalScore >= 38 && finalScore <= 42) {
    // Uncertain (38-42 range = 5 point band)
    result = 'uncertain';
    confidence = Math.max(20, 35 - Math.abs(finalScore - 40) * 3);
  } else {
    // Possibly AI (43-57 range = 15 point band)
    result = 'likely_ai';
    const baseConfidence = 30 + (finalScore - 43) * 1.5;
    confidence = Math.min(75, baseConfidence * confidenceBoost);
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
      editingDetected: hasEditing,
      weights,
      confidenceBoost
    }
  };
}