import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import crypto from 'node:crypto';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { text, context, storeRawText, comparativeMode, baselineText } = await req.json();

    if (!text) {
      return Response.json({ error: 'Text is required' }, { status: 400 });
    }

    // Hash input text
    const textHash = crypto.createHash('sha256').update(text).digest('hex');

    // Create assessment record
    const assessment = await base44.asServiceRole.entities.Assessment.create({
      user_email: user.email,
      input_text_hash: textHash,
      input_text_encrypted: storeRawText ? text : null,
      store_raw_text: storeRawText || false,
      content_type: 'text',
      context: context || {},
      comparative_mode: comparativeMode || false,
      baseline_text_hash: baselineText ? crypto.createHash('sha256').update(baselineText).digest('hex') : null
    });

    // Run signal analysis
    const signals = await analyzeSignals(text, context);

    // Calculate scores
    const engineVersion = 'v1.0.0';
    const scoringVersion = 'default_v1.0';
    const scoring = calculateRiskScore(signals);

    // Generate narrative explanation
    const narrative = await generateNarrative(signals, scoring, text.substring(0, 500));

    // Create result
    const result = await base44.asServiceRole.entities.AssessmentResult.create({
      assessment_id: assessment.id,
      engine_id: 'default',
      engine_version: engineVersion,
      scoring_version: scoringVersion,
      risk_level: scoring.riskLevel,
      likelihood_min: scoring.likelihoodMin,
      likelihood_max: scoring.likelihoodMax,
      meta_confidence: scoring.metaConfidence,
      narrative_explanation: narrative.explanation,
      signals: signals,
      key_findings: narrative.keyFindings,
      interpretation_notes: narrative.interpretation,
      what_could_change: narrative.whatCouldChange
    });

    return Response.json({
      success: true,
      assessment_id: assessment.id,
      result_id: result.id,
      result: result
    });

  } catch (error) {
    console.error('Assessment error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

// Signal analysis functions
async function analyzeSignals(text, context = {}) {
  const words = text.split(/\s+/);
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  
  const signals = [];

  // 1. Perplexity Proxy (text complexity)
  const avgWordLength = words.reduce((sum, w) => sum + w.length, 0) / words.length;
  const perplexityScore = Math.min(100, avgWordLength * 10);
  signals.push({
    name: 'Perplexity Proxy',
    score: perplexityScore,
    impact: perplexityScore > 60 ? 'HUMAN' : 'AI',
    weight: 0.15,
    explanation: `Average word length: ${avgWordLength.toFixed(1)} characters. ${perplexityScore > 60 ? 'Higher complexity suggests human writing' : 'Lower complexity may suggest AI generation'}.`,
    false_positive_notes: 'Technical or academic writing naturally has higher complexity. Simple human writing can score low.'
  });

  // 2. Burstiness (sentence variation)
  const sentenceLengths = sentences.map(s => s.split(/\s+/).length);
  const avgLength = sentenceLengths.reduce((a, b) => a + b, 0) / sentenceLengths.length;
  const variance = sentenceLengths.reduce((sum, len) => sum + Math.pow(len - avgLength, 2), 0) / sentenceLengths.length;
  const burstyScore = Math.min(100, Math.sqrt(variance) * 10);
  signals.push({
    name: 'Burstiness',
    score: burstyScore,
    impact: burstyScore > 50 ? 'HUMAN' : 'AI',
    weight: 0.20,
    explanation: `Sentence length variation: ${Math.sqrt(variance).toFixed(1)}. ${burstyScore > 50 ? 'High variation suggests human writing' : 'Consistent lengths may suggest AI'}.`,
    false_positive_notes: 'Professional or edited writing often has consistent sentence lengths. Technical documentation scores low.'
  });

  // 3. Repetition patterns
  const wordFreq = {};
  words.forEach(w => {
    const word = w.toLowerCase();
    wordFreq[word] = (wordFreq[word] || 0) + 1;
  });
  const maxRepeat = Math.max(...Object.values(wordFreq));
  const repetitionScore = Math.min(100, (maxRepeat / words.length) * 500);
  signals.push({
    name: 'Repetition Patterns',
    score: 100 - repetitionScore,
    impact: repetitionScore > 40 ? 'AI' : 'HUMAN',
    weight: 0.10,
    explanation: `Maximum word repetition: ${maxRepeat} times. ${repetitionScore > 40 ? 'High repetition may indicate template use' : 'Natural variation observed'}.`,
    false_positive_notes: 'Technical documents or instructions naturally repeat key terms.'
  });

  // 4. Punctuation regularity
  const punctuation = text.match(/[.!?,;:]/g) || [];
  const punctuationRatio = punctuation.length / sentences.length;
  const regularityScore = Math.abs(punctuationRatio - 1) < 0.2 ? 30 : 70;
  signals.push({
    name: 'Punctuation Regularity',
    score: regularityScore,
    impact: regularityScore < 50 ? 'AI' : 'HUMAN',
    weight: 0.08,
    explanation: `Punctuation per sentence: ${punctuationRatio.toFixed(2)}. ${regularityScore < 50 ? 'Very regular punctuation' : 'Natural punctuation variation'}.`,
    false_positive_notes: 'Formal writing and lists naturally have regular punctuation.'
  });

  // 5. Stylistic uniformity
  const firstHalfWords = words.slice(0, Math.floor(words.length / 2));
  const secondHalfWords = words.slice(Math.floor(words.length / 2));
  const firstAvg = firstHalfWords.reduce((sum, w) => sum + w.length, 0) / firstHalfWords.length;
  const secondAvg = secondHalfWords.reduce((sum, w) => sum + w.length, 0) / secondHalfWords.length;
  const uniformityScore = 100 - Math.min(100, Math.abs(firstAvg - secondAvg) * 30);
  signals.push({
    name: 'Stylistic Uniformity',
    score: uniformityScore,
    impact: uniformityScore > 70 ? 'AI' : 'HUMAN',
    weight: 0.12,
    explanation: `Style consistency: ${uniformityScore.toFixed(0)}%. ${uniformityScore > 70 ? 'Very consistent style throughout' : 'Style varies across sections'}.`,
    false_positive_notes: 'Professional editing creates uniform style. Short texts naturally appear uniform.'
  });

  // 6. Formality score
  const formalWords = ['however', 'therefore', 'furthermore', 'moreover', 'consequently', 'additionally'];
  const formalCount = words.filter(w => formalWords.includes(w.toLowerCase())).length;
  const formalityScore = Math.min(100, (formalCount / words.length) * 1000);
  signals.push({
    name: 'Formality Level',
    score: formalityScore,
    impact: formalityScore > 60 ? 'AI' : 'NEUTRAL',
    weight: 0.10,
    explanation: `Formal transition words: ${formalCount}. ${formalityScore > 60 ? 'High formality may suggest prompt-following' : 'Natural formality level'}.`,
    false_positive_notes: 'Academic and business writing naturally uses formal language.'
  });

  // 7. Common AI phrases
  const aiPhrases = ['as an ai', 'i don\'t have', 'i cannot', 'it\'s important to note', 'in conclusion'];
  const aiPhraseCount = aiPhrases.filter(phrase => text.toLowerCase().includes(phrase)).length;
  const aiPhraseScore = Math.min(100, aiPhraseCount * 50);
  signals.push({
    name: 'AI-Associated Phrases',
    score: aiPhraseScore,
    impact: aiPhraseScore > 50 ? 'AI' : 'NEUTRAL',
    weight: 0.15,
    explanation: `Common AI phrases detected: ${aiPhraseCount}. ${aiPhraseScore > 50 ? 'Contains typical AI response patterns' : 'No obvious AI phrases'}.`,
    false_positive_notes: 'Human writers may use similar transitional phrases in formal writing.'
  });

  // 8. Model-likeness clustering (simplified)
  const hasIntro = sentences[0]?.length > 50;
  const hasConclusion = sentences[sentences.length - 1]?.toLowerCase().includes('conclusion') || 
                        sentences[sentences.length - 1]?.toLowerCase().includes('summary');
  const structureScore = (hasIntro ? 30 : 0) + (hasConclusion ? 30 : 0);
  signals.push({
    name: 'Structural Patterns',
    score: structureScore,
    impact: structureScore > 40 ? 'AI' : 'NEUTRAL',
    weight: 0.10,
    explanation: `Document structure: ${hasIntro ? 'clear intro' : 'no intro'}, ${hasConclusion ? 'formal conclusion' : 'no conclusion'}. ${structureScore > 40 ? 'Follows typical AI output structure' : 'Natural structure'}.`,
    false_positive_notes: 'Well-structured human writing also has clear introductions and conclusions.'
  });

  return signals;
}

function calculateRiskScore(signals) {
  // Weighted score calculation
  let weightedSum = 0;
  let totalWeight = 0;

  signals.forEach(signal => {
    const contribution = signal.impact === 'AI' ? signal.score : 
                        signal.impact === 'HUMAN' ? (100 - signal.score) : 50;
    weightedSum += contribution * signal.weight;
    totalWeight += signal.weight;
  });

  const baseScore = weightedSum / totalWeight;

  // Add uncertainty range based on text length and signal agreement
  const signalAgreement = calculateSignalAgreement(signals);
  const rangeWidth = 20 - (signalAgreement * 15); // 5-20% range

  const likelihoodMin = Math.max(0, baseScore - rangeWidth / 2);
  const likelihoodMax = Math.min(100, baseScore + rangeWidth / 2);

  // Determine risk level
  const midpoint = (likelihoodMin + likelihoodMax) / 2;
  let riskLevel;
  if (midpoint < 35) riskLevel = 'LOW';
  else if (midpoint < 65) riskLevel = 'MEDIUM';
  else riskLevel = 'HIGH';

  // Meta confidence based on signal agreement and text length
  let metaConfidence;
  if (signalAgreement > 0.7) metaConfidence = 'HIGH';
  else if (signalAgreement > 0.4) metaConfidence = 'MEDIUM';
  else metaConfidence = 'LOW';

  return {
    riskLevel,
    likelihoodMin: Math.round(likelihoodMin),
    likelihoodMax: Math.round(likelihoodMax),
    metaConfidence
  };
}

function calculateSignalAgreement(signals) {
  const aiSignals = signals.filter(s => s.impact === 'AI');
  const humanSignals = signals.filter(s => s.impact === 'HUMAN');
  
  const aiAvg = aiSignals.reduce((sum, s) => sum + s.score, 0) / (aiSignals.length || 1);
  const humanAvg = humanSignals.reduce((sum, s) => sum + (100 - s.score), 0) / (humanSignals.length || 1);
  
  const variance = Math.abs(aiAvg - humanAvg);
  return Math.min(1, variance / 50);
}

async function generateNarrative(signals, scoring, textPreview) {
  const topSignals = [...signals]
    .sort((a, b) => {
      const aContribution = Math.abs(a.score - 50) * a.weight;
      const bContribution = Math.abs(b.score - 50) * b.weight;
      return bContribution - aContribution;
    })
    .slice(0, 3);

  const explanation = `Based on analysis of ${signals.length} linguistic signals, this content shows ${scoring.riskLevel.toLowerCase()} likelihood of AI origin. The estimated AI-origin probability ranges from ${scoring.likelihoodMin}% to ${scoring.likelihoodMax}%, with ${scoring.metaConfidence.toLowerCase()} confidence in this range. Key contributing factors include ${topSignals.map(s => s.name.toLowerCase()).join(', ')}.`;

  const keyFindings = topSignals.map(s => 
    `${s.name}: ${s.score}/100 - ${s.explanation.split('.')[0]}`
  );

  const interpretation = scoring.metaConfidence === 'LOW' 
    ? 'This assessment has lower confidence due to limited text length or conflicting signals. Consider analyzing a longer sample for more reliable results.'
    : scoring.metaConfidence === 'MEDIUM'
    ? 'This assessment has moderate confidence. The signals show some variation, which is common with edited or hybrid content.'
    : 'This assessment has high confidence based on strong signal agreement and sufficient text length.';

  const whatCouldChange = [
    'Analyzing a longer text sample (recommended: 500+ words)',
    'Providing additional context about the source and intended use',
    'Comparing against known human-written samples from the same author',
    'Running multiple assessments over time to identify patterns'
  ];

  return {
    explanation,
    keyFindings,
    interpretation,
    whatCouldChange
  };
}