import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, AlertTriangle, HelpCircle, ChevronRight, Info, Download, Copy, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import html2canvas from 'html2canvas';
import ShareCard from './ShareCard';
import TrainerFeedback from './TrainerFeedback';
import LikelihoodRangeBar from '@/components/assessment/LikelihoodRangeBar';
import DisclaimerBanner from '@/components/assessment/DisclaimerBanner';
import ResultFeedback from '@/components/feedback/ResultFeedback';
import { normalizeResult, getRiskColor, getConfidenceColor } from '@/components/utils/normalizeResult';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';

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
  likely_deepfake: {
    icon: AlertTriangle,
    title: 'Likely Deepfake',
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    description: 'This content shows signs of being a deepfake - manipulated video with face swapping or synthetic generation.'
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

// Helper function to add contextual explanations in plain English
function getSignalContext(signalType, description, isAIGenerated) {
  const lowerSignal = (signalType + ' ' + description).toLowerCase();
  
  // AI indicators - Enhanced with more detail
  if (lowerSignal.includes('symmetry') || lowerSignal.includes('symmetric')) {
    return {
      simple: 'A.I. often creates faces that are too perfectly symmetrical. Real faces have natural differences between left and right sides.',
      detailed: 'Human faces naturally have slight asymmetries - one eye might be slightly higher, or one side of the smile might be different. A.I. generators often create perfectly mirrored faces because they\'re trained on idealized images. When we see perfect left-right symmetry, it\'s a red flag that the image was computer-generated rather than photographed.',
      weight: 'This is a STRONG indicator of A.I. generation when present.'
    };
  }
  if (lowerSignal.includes('skin') && (lowerSignal.includes('smooth') || lowerSignal.includes('plastic') || lowerSignal.includes('perfect'))) {
    return {
      simple: 'A.I. often smooths skin too much, removing natural pores and tiny imperfections that real skin has.',
      detailed: 'Real skin has pores, fine lines, minor blemishes, and texture variations that are visible even in professional photography. A.I. tends to over-smooth skin, making it look like plastic or porcelain. This happens because A.I. models are trained to create "attractive" images, which they interpret as perfectly smooth skin.',
      weight: 'This is a STRONG indicator when combined with other A.I. signs.'
    };
  }
  if (lowerSignal.includes('finger') || lowerSignal.includes('hand')) {
    return {
      simple: 'Hands and fingers are very difficult for A.I. to create correctly - they often have extra or missing fingers.',
      detailed: 'Hands are one of the hardest things for A.I. to generate because they have complex anatomy with many joints, overlapping fingers, and different angles. A.I. often creates hands with the wrong number of fingers, fingers that bend impossibly, or fingers that merge together unnaturally.',
      weight: 'This is a VERY STRONG indicator - hand errors are almost exclusively found in A.I.-generated images.'
    };
  }
  if (lowerSignal.includes('background') && (lowerSignal.includes('melt') || lowerSignal.includes('incoher') || lowerSignal.includes('blur'))) {
    return {
      simple: 'A.I. often struggles with background details, creating blurry or strange edges around the subject.',
      detailed: 'A.I. generators focus most of their processing power on the main subject (like a face), which means backgrounds often become distorted, blurry, or "melted" looking. You might see objects that don\'t make sense, edges that fade unnaturally, or patterns that suddenly change. Real photos maintain consistent detail throughout.',
      weight: 'This is a MODERATE to STRONG indicator depending on severity.'
    };
  }
  if (lowerSignal.includes('lighting') && lowerSignal.includes('inconsistent')) {
    return {
      simple: 'Real photos have light coming from one direction. A.I. sometimes creates impossible lighting from multiple sources.',
      detailed: 'In real photography, light follows physics - shadows fall in one direction, highlights match the light source, and reflections are consistent. A.I. sometimes creates lighting that\'s physically impossible, like shadows pointing different directions or faces lit from multiple angles that don\'t exist in the scene.',
      weight: 'This is a STRONG indicator when clearly impossible lighting is present.'
    };
  }
  if (lowerSignal.includes('text') || lowerSignal.includes('letter') || lowerSignal.includes('garbled')) {
    return {
      simple: 'A.I. frequently creates nonsensical or scrambled text in images - it can\'t spell properly yet.',
      detailed: 'A.I. image generators struggle with text because they don\'t understand language - they only see text as visual patterns. This results in gibberish letters, words that look almost right but aren\'t real, or text that changes mid-word. Real photos capture actual readable text from signs, books, or screens.',
      weight: 'This is a VERY STRONG indicator - garbled text is nearly always A.I.-generated.'
    };
  }
  if (lowerSignal.includes('repetitive') || lowerSignal.includes('pattern')) {
    return {
      simple: 'A.I. sometimes creates unnatural repeating patterns, especially in backgrounds or textures.',
      detailed: 'A.I. can get "stuck" in repetitive patterns, especially in less important areas like backgrounds or textures. You might see the same pattern repeated too perfectly, or elements that look copy-pasted. Real environments have natural randomness and variation.',
      weight: 'This is a MODERATE indicator - can also occur in some real images with wallpaper or tiles.'
    };
  }
  if (lowerSignal.includes('teeth') && lowerSignal.includes('perfect')) {
    return {
      simple: 'Real teeth have natural variations in color and alignment. A.I. often makes them too uniform and perfect.',
      detailed: 'Real teeth have slight color variations, natural imperfections in alignment, and realistic translucency. A.I. often generates teeth that look like perfect white blocks, all exactly the same size and perfectly aligned - like cartoon teeth rather than real human teeth.',
      weight: 'This is a MODERATE to STRONG indicator when very obvious.'
    };
  }
  
  // Real indicators - Enhanced with more detail
  if (lowerSignal.includes('exif') || lowerSignal.includes('metadata')) {
    return {
      simple: 'Camera information is automatically saved in real photos taken with cameras or phones. A.I. images typically don\'t have this.',
      detailed: 'When you take a photo with a camera or smartphone, it automatically saves hidden information (called metadata) about the camera model, settings, date, and sometimes location. A.I.-generated images don\'t have this data because they weren\'t taken by a camera - they were created by software. Finding this metadata is strong evidence of a real photo.',
      weight: 'This is a STRONG indicator of authenticity when present and verified.'
    };
  }
  if (lowerSignal.includes('compression') || lowerSignal.includes('artifact') || lowerSignal.includes('jpeg')) {
    return {
      simple: 'Real photos have natural compression patterns from how cameras save images. A.I. images often lack these technical fingerprints.',
      detailed: 'Cameras compress images in specific ways that leave distinctive patterns at the pixel level. These compression "fingerprints" are consistent across the whole image in real photos. A.I.-generated images often lack these patterns or have inconsistent compression that reveals they weren\'t captured by a camera.',
      weight: 'This is a STRONG technical indicator when properly analyzed.'
    };
  }
  if (lowerSignal.includes('pore') || lowerSignal.includes('texture') && lowerSignal.includes('natural')) {
    return {
      simple: 'Visible skin pores and natural texture are signs of authentic photography - A.I. often misses these tiny details.',
      detailed: 'Real skin has visible pores, fine lines, and texture that\'s consistent across the face. These microscopic details are hard for A.I. to replicate correctly. When you can see natural skin texture with realistic pores, it\'s a good sign the image is authentic.',
      weight: 'This is a MODERATE to STRONG indicator supporting authenticity.'
    };
  }
  if (lowerSignal.includes('asymmetr') && !lowerSignal.includes('lack')) {
    return {
      simple: 'Natural facial asymmetry (one side slightly different from the other) is a strong sign of a real photo.',
      detailed: 'Every real human face is slightly asymmetric - we all have small differences between our left and right sides. These natural asymmetries are captured in real photos. When we detect realistic facial asymmetry with natural-looking imperfections, it strongly suggests the image is authentic.',
      weight: 'This is a STRONG indicator supporting authenticity.'
    };
  }
  
  // Video-specific indicators
  if (lowerSignal.includes('temporal') || lowerSignal.includes('frame') && lowerSignal.includes('inconsisten')) {
    return {
      simple: 'Objects or details that appear, disappear, or change unnaturally between frames suggest A.I. generation or manipulation.',
      detailed: 'In real videos, objects move smoothly and consistently from one frame to the next following the laws of physics. A.I.-generated videos sometimes have objects that suddenly appear, disappear, or change shape between frames because each frame is generated somewhat independently.',
      weight: 'This is a STRONG indicator in video analysis.'
    };
  }
  if (lowerSignal.includes('scene') && lowerSignal.includes('shift')) {
    return {
      simple: 'Sudden changes in visual style or quality within a video can indicate different parts were generated separately.',
      detailed: 'When different parts of a video look like they were made with different tools or styles, it suggests the video was pieced together from multiple A.I. generations. Real videos maintain consistent lighting, color grading, and visual quality throughout unless there\'s an obvious cut or transition.',
      weight: 'This is a MODERATE to STRONG indicator depending on the abruptness of changes.'
    };
  }
  if (lowerSignal.includes('blink') || lowerSignal.includes('eye') && lowerSignal.includes('movement')) {
    return {
      simple: 'Unnatural or absent blinking patterns are a major deepfake indicator - humans naturally blink 15-20 times per minute.',
      detailed: 'Real people blink regularly and naturally, with the blink happening quickly and affecting the whole face slightly. Deepfakes often show too little blinking, too much blinking, or blinking that looks mechanical. Some deepfakes also show eyes that don\'t move naturally or don\'t react to light changes.',
      weight: 'This is a VERY STRONG indicator of deepfake manipulation.'
    };
  }
  
  return null; // No additional context
}

export default function ResultCard({ result, onTakeAction, onStartOver }) {
  const shareCardRef = useRef(null);
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [shareGenerated, setShareGenerated] = useState(false);
  const [user, setUser] = useState(null);
  const [affiliateCode, setAffiliateCode] = useState('');
  const [showAffiliatePrompt, setShowAffiliatePrompt] = useState(false);
  
  // Normalize result to likelihood range format
  const normalizedResult = normalizeResult(result);
  
  const config = resultConfig[result.result] || resultConfig.uncertain;
  const Icon = config.icon;
  const showActionButton = result.result === 'likely_ai' && result.claims_to_be_real;

  React.useEffect(() => {
    // Check if user is a trainer and get affiliate code
    base44.auth.me().then(async currentUser => {
      setUser(currentUser);
      // Check if user has affiliate account
      const affiliates = await base44.entities.AffiliatePartner.filter({ 
        created_by: currentUser.email 
      });
      if (affiliates.length > 0) {
        setAffiliateCode(affiliates[0].affiliate_code);
      }
    }).catch(() => {
      setUser(null);
    });
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="w-full max-w-2xl mx-auto"
    >
      {/* Trainer Feedback */}
      <TrainerFeedback result={result} user={user} />

      {/* Disclaimer Banner - Top */}
      <div className="mb-6">
        <DisclaimerBanner variant="prominent" />
      </div>

      {/* Main Result Card with Likelihood Range */}
      <div className={`rounded-3xl border-2 ${config.borderColor} ${config.bgColor} p-6 sm:p-8 mb-6 shadow-soft`}>
        <div className="flex items-start gap-5 mb-6">
          <div className={`w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white flex items-center justify-center shadow-medium`}>
            <Icon className={`w-8 h-8 sm:w-10 sm:h-10 ${config.color}`} />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className={`text-2xl sm:text-3xl font-extrabold ${config.color} mb-2 tracking-tight`}>
              {config.title}
            </h2>
            <p className="text-slate-600 text-base sm:text-lg leading-relaxed">
              {config.description}
            </p>
          </div>
        </div>

        {/* Likelihood Range Visualization */}
        <div className="space-y-4">
          <LikelihoodRangeBar
            min={normalizedResult.likelihood_min}
            max={normalizedResult.likelihood_max}
            riskLevel={normalizedResult.risk_level}
          />
          
          {/* Confidence & Risk Badges */}
          <div className="flex flex-wrap gap-3">
            <div className={`px-4 py-2 rounded-lg font-semibold text-sm border-2 ${getRiskColor(normalizedResult.risk_level)}`}>
              {normalizedResult.risk_level} Risk
            </div>
            <div className={`px-4 py-2 rounded-lg font-semibold text-sm ${getConfidenceColor(normalizedResult.meta_confidence)}`}>
              {normalizedResult.meta_confidence} Confidence
            </div>
          </div>

          {/* Narrative Explanation */}
          {normalizedResult.narrative_explanation && (
            <div className="pt-4 border-t border-slate-200">
              <p className="text-sm text-slate-700 leading-relaxed">
                {normalizedResult.narrative_explanation}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Analyzed Media */}
      {(result.file_url || result.thumbnail_url) && (
        <div className="mb-6 rounded-2xl overflow-hidden border border-slate-200 bg-white shadow-sm">
          {result.content_type === 'video' ? (
            <video 
              src={result.file_url} 
              controls
              className="w-full h-auto max-h-96 object-contain"
            />
          ) : (
            <img 
              src={result.file_url || result.thumbnail_url} 
              alt="Analyzed content"
              className="w-full h-auto max-h-96 object-contain"
            />
          )}
        </div>
      )}

      {/* AI Model Detection */}
      {result.ai_model_detected && result.ai_model_detected !== 'none' && (
        <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-2xl border-2 border-purple-200 p-6 mb-6">
          <h3 className="font-semibold text-slate-800 mb-4 text-lg flex items-center gap-2">
            🤖 AI Model Fingerprint Detected
          </h3>
          
          <div className="space-y-4">
            <div className="p-4 bg-white rounded-xl border border-purple-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-slate-700">Detected Model:</span>
                <span className="px-3 py-1 bg-purple-100 text-purple-800 font-bold text-sm rounded-full">
                  {result.ai_model_detected.replace(/_/g, ' ').toUpperCase()}
                </span>
              </div>
            </div>

            {result.ai_technique_classification && (
              <div className="p-4 bg-white rounded-xl border border-purple-200">
                <div className="font-semibold text-slate-800 mb-2">Technical Classification:</div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-sm text-slate-600">Primary Technique:</span>
                  <span className="px-2 py-1 bg-indigo-100 text-indigo-800 font-semibold text-xs rounded">
                    {result.ai_technique_classification.primary_technique.toUpperCase()}
                  </span>
                  <span className="text-sm text-slate-600">
                    ({result.ai_technique_classification.confidence}% confidence)
                  </span>
                </div>
                
                {result.ai_technique_classification.technical_fingerprints?.length > 0 && (
                  <div>
                    <div className="text-xs font-semibold text-slate-700 mb-2">Technical Fingerprints:</div>
                    <div className="space-y-1">
                      {result.ai_technique_classification.technical_fingerprints.map((fp, idx) => (
                        <div key={idx} className="text-xs text-slate-600 flex items-start gap-2">
                          <span className="text-purple-600 mt-0.5">•</span>
                          <span>{fp}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {result.content_style_analysis && (
              <div className="p-4 bg-white rounded-xl border border-purple-200">
                <div className="font-semibold text-slate-800 mb-2">Style Analysis:</div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm text-slate-600">Category:</span>
                  <span className="px-2 py-1 bg-pink-100 text-pink-800 font-semibold text-xs rounded">
                    {result.content_style_analysis.style_category.replace(/_/g, ' ').toUpperCase()}
                  </span>
                </div>
                
                {result.content_style_analysis.artistic_indicators?.length > 0 && (
                  <div className="mt-2">
                    <div className="text-xs font-semibold text-slate-700 mb-1">Artistic Indicators:</div>
                    <div className="flex flex-wrap gap-1">
                      {result.content_style_analysis.artistic_indicators.map((ind, idx) => (
                        <span key={idx} className="px-2 py-0.5 bg-slate-100 text-slate-700 text-xs rounded">
                          {ind}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Forensic Analysis */}
      {result.forensic_analysis && (
        <div className="bg-gradient-to-br from-slate-50 to-gray-50 rounded-2xl border-2 border-slate-200 p-6 mb-6">
          <h3 className="font-semibold text-slate-800 mb-4 text-lg flex items-center gap-2">
            🔬 Advanced Forensic Analysis
          </h3>
          
          <div className="space-y-4">
            {result.forensic_analysis.manipulation_likelihood !== undefined && (
              <div className="p-4 bg-white rounded-xl">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-slate-700">Manipulation Likelihood:</span>
                  <span className="text-lg font-bold text-slate-900">
                    {result.forensic_analysis.manipulation_likelihood}%
                  </span>
                </div>
                <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-emerald-500 via-amber-500 to-red-500 rounded-full"
                    style={{ width: `${result.forensic_analysis.manipulation_likelihood}%` }}
                  />
                </div>
              </div>
            )}

            {result.forensic_analysis.subtle_artifacts?.length > 0 && (
              <div className="p-4 bg-white rounded-xl">
                <div className="font-semibold text-slate-800 mb-3">Subtle Artifacts Detected:</div>
                <div className="space-y-2">
                  {result.forensic_analysis.subtle_artifacts.map((artifact, idx) => (
                    <div key={idx} className="flex items-start gap-2 p-2 bg-slate-50 rounded">
                      <span className="px-2 py-0.5 bg-amber-100 text-amber-800 text-xs font-bold rounded">
                        {artifact.confidence}%
                      </span>
                      <div className="flex-1">
                        <div className="font-semibold text-sm text-slate-900">{artifact.artifact_type}</div>
                        <div className="text-xs text-slate-600">{artifact.description}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="grid md:grid-cols-2 gap-4">
              {result.forensic_analysis.frequency_domain_analysis && (
                <div className="p-4 bg-white rounded-xl">
                  <div className="font-semibold text-slate-800 mb-2 text-sm">📊 Frequency Analysis:</div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {result.forensic_analysis.frequency_domain_analysis}
                  </p>
                </div>
              )}

              {result.forensic_analysis.compression_analysis && (
                <div className="p-4 bg-white rounded-xl">
                  <div className="font-semibold text-slate-800 mb-2 text-sm">🗜️ Compression Analysis:</div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {result.forensic_analysis.compression_analysis}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Advanced Detection Results */}
      {result.content_origin_confidence && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-6">
          <h3 className="font-semibold text-slate-800 mb-4 text-lg">🔬 Content Origin Analysis</h3>
          
          <div className="space-y-3 mb-4">
            {Object.entries(result.content_origin_confidence).map(([type, confidence]) => {
              const labels = {
                camera_native: '📷 Camera Native',
                traditionally_edited: '✂️ Traditionally Edited',
                ai_generated: '🤖 AI Generated',
                hybrid: '🔀 Hybrid (Real + AI)'
              };
              
              const colors = {
                camera_native: 'bg-emerald-500',
                traditionally_edited: 'bg-blue-500',
                ai_generated: 'bg-red-500',
                hybrid: 'bg-amber-500'
              };
              
              return (
                <div key={type}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-slate-700">{labels[type]}</span>
                    <span className="text-sm font-bold text-slate-900">{confidence}%</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${colors[type]} transition-all`}
                      style={{ width: `${confidence}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {result.origin_reasoning && (
            <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
              <p className="text-sm text-slate-700 leading-relaxed">{result.origin_reasoning}</p>
            </div>
          )}
        </div>
      )}

      {/* Photoshop Artifacts Detection */}
      {result.photoshop_artifacts && result.photoshop_artifacts.length > 0 && (
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border-2 border-blue-200 p-6 mb-6">
          <h3 className="font-semibold text-slate-800 mb-4 text-lg flex items-center gap-2">
            <span>✂️</span> Traditional Editing Detected
          </h3>
          
          <div className="space-y-3">
            {result.photoshop_artifacts.map((artifact, idx) => (
              <div key={idx} className="p-4 bg-white rounded-xl border border-blue-200">
                <div className="flex items-start gap-3">
                  <div className="flex-1">
                    <div className="font-semibold text-slate-900 mb-1">{artifact.artifact_type}</div>
                    {artifact.location && (
                      <div className="text-xs text-slate-600 mb-2">📍 {artifact.location}</div>
                    )}
                    <p className="text-sm text-slate-700">{artifact.description}</p>
                  </div>
                  <div className="text-sm font-bold text-blue-600">
                    {artifact.confidence}%
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 p-3 bg-blue-100 border border-blue-300 rounded-lg">
            <p className="text-sm text-blue-900">
              <strong>Note:</strong> These artifacts suggest traditional photo editing software (Photoshop, GIMP) 
              was used, not AI generation. Edited photos can still be authentic images that were enhanced or composited.
            </p>
          </div>
        </div>
      )}

      {/* Enhanced Video Forensics Summary */}
      {normalizedResult.videoForensics && (
        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl border-2 border-indigo-200 p-6 mb-6">
          <h3 className="font-semibold text-slate-800 mb-4 text-lg flex items-center gap-2">
            <span>🔬</span> Advanced Video Forensics
          </h3>
          
          <div className="grid md:grid-cols-3 gap-4">
            {/* Deepfake Voice Detection */}
            {normalizedResult.videoForensics.voiceAnalysis && (
              <div className={`p-4 rounded-xl border-2 ${
                normalizedResult.videoForensics.voiceAnalysis.deepfakeVoiceLikelihood > 70 
                  ? 'bg-red-50 border-red-200' 
                  : normalizedResult.videoForensics.voiceAnalysis.deepfakeVoiceLikelihood > 40
                  ? 'bg-amber-50 border-amber-200'
                  : 'bg-emerald-50 border-emerald-200'
              }`}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">🎤</span>
                  <div className="font-bold text-slate-900 text-sm">Voice Analysis</div>
                </div>
                {normalizedResult.videoForensics.voiceAnalysis.hasAudio ? (
                  <>
                    <div className="text-2xl font-extrabold text-slate-900 mb-1">
                      {normalizedResult.videoForensics.voiceAnalysis.deepfakeVoiceLikelihood}%
                    </div>
                    <div className="text-xs text-slate-600 mb-2">Deepfake Voice Likelihood</div>
                    {normalizedResult.videoForensics.voiceAnalysis.voiceSynthesisDetected && (
                      <div className="px-2 py-1 bg-red-100 text-red-800 text-xs font-bold rounded">
                        AI Voice Synthesis
                      </div>
                    )}
                    {normalizedResult.videoForensics.voiceAnalysis.voiceCloningDetected && (
                      <div className="px-2 py-1 bg-orange-100 text-orange-800 text-xs font-bold rounded mt-1">
                        Voice Cloning
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-xs text-red-700 font-semibold">
                    ⚠️ No audio track detected
                  </div>
                )}
              </div>
            )}

            {/* Background Manipulation */}
            {normalizedResult.videoForensics.backgroundAnalysis && (
              <div className={`p-4 rounded-xl border-2 ${
                normalizedResult.videoForensics.backgroundAnalysis.manipulationLikelihood > 70 
                  ? 'bg-red-50 border-red-200' 
                  : normalizedResult.videoForensics.backgroundAnalysis.manipulationLikelihood > 40
                  ? 'bg-amber-50 border-amber-200'
                  : 'bg-emerald-50 border-emerald-200'
              }`}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">🌆</span>
                  <div className="font-bold text-slate-900 text-sm">Background</div>
                </div>
                <div className="text-2xl font-extrabold text-slate-900 mb-1">
                  {normalizedResult.videoForensics.backgroundAnalysis.manipulationLikelihood}%
                </div>
                <div className="text-xs text-slate-600 mb-2">AI Background Likelihood</div>
                {normalizedResult.videoForensics.backgroundAnalysis.aiGeneratedBackground && (
                  <div className="px-2 py-1 bg-red-100 text-red-800 text-xs font-bold rounded">
                    AI-Generated BG
                  </div>
                )}
                {normalizedResult.videoForensics.backgroundAnalysis.morphingObjectsDetected && (
                  <div className="px-2 py-1 bg-orange-100 text-orange-800 text-xs font-bold rounded mt-1">
                    Morphing Objects
                  </div>
                )}
              </div>
            )}

            {/* Compression Artifacts */}
            {normalizedResult.videoForensics.compressionAnalysis && (
              <div className={`p-4 rounded-xl border-2 ${
                normalizedResult.videoForensics.compressionAnalysis.manipulationLikelihood > 70 
                  ? 'bg-red-50 border-red-200' 
                  : normalizedResult.videoForensics.compressionAnalysis.manipulationLikelihood > 40
                  ? 'bg-amber-50 border-amber-200'
                  : 'bg-emerald-50 border-emerald-200'
              }`}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">🗜️</span>
                  <div className="font-bold text-slate-900 text-sm">Compression</div>
                </div>
                <div className="text-2xl font-extrabold text-slate-900 mb-1">
                  {normalizedResult.videoForensics.compressionAnalysis.manipulationLikelihood}%
                </div>
                <div className="text-xs text-slate-600 mb-2">Manipulation Likelihood</div>
                {normalizedResult.videoForensics.compressionAnalysis.reencodingDetected && (
                  <div className="px-2 py-1 bg-amber-100 text-amber-800 text-xs font-bold rounded">
                    Re-encoding Detected
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Video-specific info */}
      {result.content_type === 'video' && result.forensics && (
        <div className="space-y-4 mb-6">
          {/* Video Technical Details */}
          {result.forensics.video_metadata && (
            <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-2xl border-2 border-indigo-200 p-6">
              <h3 className="font-semibold text-slate-800 mb-3 text-lg flex items-center gap-2">
                <span>📹</span> Video Technical Details
              </h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="p-3 bg-white rounded-xl">
                  <div className="text-slate-500 text-xs mb-1">Resolution</div>
                  <div className="font-semibold text-slate-900">
                    {result.forensics.video_metadata.width}x{result.forensics.video_metadata.height}
                  </div>
                </div>
                <div className="p-3 bg-white rounded-xl">
                  <div className="text-slate-500 text-xs mb-1">Duration</div>
                  <div className="font-semibold text-slate-900">
                    {result.forensics.video_metadata.duration.toFixed(1)}s
                  </div>
                </div>
                <div className="p-3 bg-white rounded-xl">
                  <div className="text-slate-500 text-xs mb-1">File Size</div>
                  <div className="font-semibold text-slate-900">
                    {result.forensics.video_metadata.fileSizeMB}MB
                  </div>
                </div>
                <div className="p-3 bg-white rounded-xl">
                  <div className="text-slate-500 text-xs mb-1">Bitrate</div>
                  <div className="font-semibold text-slate-900">
                    {result.forensics.video_metadata.estimatedBitrate} kbps
                  </div>
                </div>
                <div className="p-3 bg-white rounded-xl">
                  <div className="text-slate-500 text-xs mb-1">Aspect Ratio</div>
                  <div className="font-semibold text-slate-900">
                    {result.forensics.video_metadata.aspectRatio}
                  </div>
                </div>
                <div className="p-3 bg-white rounded-xl">
                  <div className="text-slate-500 text-xs mb-1">Audio Track</div>
                  <div className="font-semibold text-slate-900">
                    {result.forensics.video_metadata.hasAudio ? '✓ Present' : '✗ None'}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Basic Video Stats */}
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl border-2 border-purple-200 p-6">
            <h3 className="font-semibold text-slate-800 mb-3 text-lg flex items-center gap-2">
              <span>🎬</span> Analysis Summary
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between items-center p-3 bg-white rounded-xl">
                <span className="text-slate-600">Frames Analyzed:</span>
                <span className="font-semibold text-slate-900">{result.forensics.frames_analyzed}</span>
              </div>
              {result.forensics.ai_influence_percentage !== undefined && (
                <div className="p-3 bg-white rounded-xl">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-slate-600">A.I. Influence:</span>
                    <span className="font-semibold text-slate-900">{result.forensics.ai_influence_percentage}%</span>
                  </div>
                  <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all"
                      style={{ width: `${result.forensics.ai_influence_percentage}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Metadata Analysis */}
          {result.forensics.metadata_analysis && (
            <div className="bg-gradient-to-br from-slate-50 to-gray-50 rounded-2xl border-2 border-slate-200 p-6">
              <h3 className="font-semibold text-slate-800 mb-3 text-lg flex items-center gap-2">
                <span>🔬</span> Technical Analysis
              </h3>
              <div className="space-y-3 text-sm">
                {result.forensics.metadata_analysis.technical_assessment && (
                  <div className="p-3 bg-white rounded-xl">
                    <div className="font-semibold text-slate-700 mb-1">Overall Assessment:</div>
                    <p className="text-slate-600">{result.forensics.metadata_analysis.technical_assessment}</p>
                  </div>
                )}
                {result.forensics.metadata_analysis.bitrate_analysis && (
                  <div className="p-3 bg-white rounded-xl">
                    <div className="font-semibold text-slate-700 mb-1">📊 Bitrate Analysis:</div>
                    <p className="text-slate-600">{result.forensics.metadata_analysis.bitrate_analysis}</p>
                  </div>
                )}
                {result.forensics.metadata_analysis.audio_sync_assessment && (
                  <div className="p-3 bg-white rounded-xl">
                    <div className="font-semibold text-slate-700 mb-1">🎵 Audio Assessment:</div>
                    <p className="text-slate-600">{result.forensics.metadata_analysis.audio_sync_assessment}</p>
                  </div>
                )}
                {result.forensics.metadata_analysis.manipulation_indicators && 
                 result.forensics.metadata_analysis.manipulation_indicators.length > 0 && (
                  <div className="p-3 bg-white rounded-xl">
                    <div className="font-semibold text-slate-700 mb-2">⚠️ Manipulation Indicators:</div>
                    <ul className="space-y-1">
                      {result.forensics.metadata_analysis.manipulation_indicators.map((indicator, idx) => (
                        <li key={idx} className="text-slate-600 text-xs flex items-start gap-2">
                          <span className="text-amber-600 mt-0.5">•</span>
                          <span>{indicator}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Deepfake Analysis */}
          {result.forensics.deepfake_analysis && (
            <div className={`rounded-2xl border-2 p-6 ${
              result.forensics.deepfake_analysis.is_deepfake_suspected
                ? 'bg-gradient-to-br from-red-50 to-orange-50 border-red-200'
                : 'bg-gradient-to-br from-emerald-50 to-green-50 border-emerald-200'
            }`}>
              <h3 className="font-semibold text-slate-800 mb-3 text-lg flex items-center gap-2">
                <span>🎭</span> Deepfake Detection
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between items-center p-3 bg-white rounded-xl">
                  <span className="text-slate-600">Deepfake Suspected:</span>
                  <span className={`font-bold ${
                    result.forensics.deepfake_analysis.is_deepfake_suspected 
                      ? 'text-red-700' 
                      : 'text-emerald-700'
                  }`}>
                    {result.forensics.deepfake_analysis.is_deepfake_suspected ? 'YES' : 'NO'}
                  </span>
                </div>
                {result.forensics.deepfake_analysis.deepfake_confidence !== undefined && (
                  <div className="flex justify-between items-center p-3 bg-white rounded-xl">
                    <span className="text-slate-600">Detection Confidence:</span>
                    <span className="font-semibold text-slate-900">
                      {result.forensics.deepfake_analysis.deepfake_confidence}%
                    </span>
                  </div>
                )}
                {result.forensics.deepfake_analysis.blinking_analysis && (
                  <div className="p-3 bg-white rounded-xl">
                    <div className="font-semibold text-slate-700 mb-1">👁️ Blinking Analysis:</div>
                    <p className="text-slate-600">{result.forensics.deepfake_analysis.blinking_analysis}</p>
                  </div>
                )}
                {result.forensics.deepfake_analysis.face_consistency && (
                  <div className="p-3 bg-white rounded-xl">
                    <div className="font-semibold text-slate-700 mb-1">👤 Face Consistency:</div>
                    <p className="text-slate-600">{result.forensics.deepfake_analysis.face_consistency}</p>
                  </div>
                )}
                {result.forensics.deepfake_analysis.background_distortion && (
                  <div className="p-3 bg-white rounded-xl">
                    <div className="font-semibold text-slate-700 mb-1">🌆 Background Analysis:</div>
                    <p className="text-slate-600">{result.forensics.deepfake_analysis.background_distortion}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Scene Analysis */}
          {result.forensics.scene_analysis && (
            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl border-2 border-blue-200 p-6">
              <h3 className="font-semibold text-slate-800 mb-3 text-lg flex items-center gap-2">
                <span>🎞️</span> Scene Analysis
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between items-center p-3 bg-white rounded-xl">
                  <span className="text-slate-600">Scene Changes:</span>
                  <span className="font-semibold text-slate-900">
                    {result.forensics.scene_analysis.scene_changes_detected || 0}
                  </span>
                </div>
                {result.forensics.scene_analysis.consistency_score !== undefined && (
                  <div className="flex justify-between items-center p-3 bg-white rounded-xl">
                    <span className="text-slate-600">Style Consistency:</span>
                    <span className="font-semibold text-slate-900">
                      {result.forensics.scene_analysis.consistency_score}%
                    </span>
                  </div>
                )}
                {result.forensics.scene_analysis.style_shifts && 
                 result.forensics.scene_analysis.style_shifts.length > 0 && (
                  <div className="p-3 bg-white rounded-xl">
                    <div className="font-semibold text-slate-700 mb-2">⚠️ Style Shifts Detected:</div>
                    <div className="space-y-2">
                      {result.forensics.scene_analysis.style_shifts.map((shift, idx) => (
                        <div key={idx} className="text-slate-600 text-xs p-2 bg-slate-50 rounded">
                          Frames {shift.from_frame}-{shift.to_frame}: {shift.description}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Frame Comparisons */}
          {result.forensics.frame_comparisons && result.forensics.frame_comparisons.length > 0 && (
            <div className="bg-gradient-to-br from-amber-50 to-yellow-50 rounded-2xl border-2 border-amber-200 p-6">
              <h3 className="font-semibold text-slate-800 mb-3 text-lg flex items-center gap-2">
                <span>🔍</span> Frame-by-Frame Anomalies
              </h3>
              <div className="space-y-2">
                {result.forensics.frame_comparisons.slice(0, 5).map((comp, idx) => (
                  <div key={idx} className="p-3 bg-white rounded-xl">
                    <div className="flex items-start gap-2">
                      <span className={`px-2 py-1 rounded text-xs font-bold ${
                        comp.severity === 'high' ? 'bg-red-100 text-red-700' :
                        comp.severity === 'medium' ? 'bg-amber-100 text-amber-700' :
                        'bg-slate-100 text-slate-600'
                      }`}>
                        {comp.severity.toUpperCase()}
                      </span>
                      <div className="flex-1">
                        <div className="font-semibold text-slate-700 text-sm">{comp.frames}</div>
                        <p className="text-slate-600 text-xs mt-1">{comp.anomaly}</p>
                      </div>
                    </div>
                  </div>
                ))}
                {result.forensics.frame_comparisons.length > 5 && (
                  <p className="text-xs text-slate-500 text-center pt-2">
                    + {result.forensics.frame_comparisons.length - 5} more anomalies detected
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      )}



      {/* Camera & EXIF Metadata Section - ALWAYS SHOW FOR PHOTOS */}
      {(() => {
        // Check if this is a photo (not video, not illustration)
        const isPhoto = result.content_type === 'image' && 
                       result.classification !== 'illustration';
        
        // Only show camera section for photos
        if (!isPhoto) return null;

        // Check if we have EXIF data
        if (result.exif_summary) {
          try {
            const exifData = JSON.parse(result.exif_summary);
            const hasCameraInfo = exifData.Make || exifData.Model;
            
            return (
              <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-6">
                <h3 className="font-semibold text-slate-800 mb-3 text-lg">📷 Camera Information</h3>
                <div className="space-y-4">
                  <div className={`p-4 rounded-xl ${hasCameraInfo ? 'bg-emerald-50 border-2 border-emerald-200' : 'bg-amber-50 border-2 border-amber-200'}`}>
                    <div className="flex items-start gap-3">
                      <div className="text-2xl">{hasCameraInfo ? '✓' : '⚠️'}</div>
                      <div className="flex-1">
                        <p className={`font-semibold mb-2 ${hasCameraInfo ? 'text-emerald-900' : 'text-amber-900'}`}>
                          {hasCameraInfo ? 'Camera Data Found' : 'Limited Camera Data'}
                        </p>
                        <p className={`text-sm mb-3 ${hasCameraInfo ? 'text-emerald-800' : 'text-amber-800'}`}>
                          {hasCameraInfo 
                            ? 'This image contains technical information automatically saved by a camera or phone. This is a strong indicator of authenticity because A.I. generators typically don\'t include camera data.'
                            : 'Some metadata exists but no camera model information. This could indicate editing software or A.I. generation.'
                          }
                        </p>
                        {hasCameraInfo && (
                          <div className="space-y-2 text-sm">
                            {exifData.Make && (
                              <div className="flex gap-2">
                                <span className="font-semibold text-emerald-900 min-w-24">Camera Brand:</span>
                                <span className="text-emerald-800">{exifData.Make}</span>
                              </div>
                            )}
                            {exifData.Model && (
                              <div className="flex gap-2">
                                <span className="font-semibold text-emerald-900 min-w-24">Camera Model:</span>
                                <span className="text-emerald-800">{exifData.Model}</span>
                              </div>
                            )}
                            {exifData.DateTime && (
                              <div className="flex gap-2">
                                <span className="font-semibold text-emerald-900 min-w-24">Date Taken:</span>
                                <span className="text-emerald-800">{exifData.DateTime}</span>
                              </div>
                            )}
                            {exifData.ISO && (
                              <div className="flex gap-2">
                                <span className="font-semibold text-emerald-900 min-w-24">ISO:</span>
                                <span className="text-emerald-800">{exifData.ISO}</span>
                              </div>
                            )}
                            {exifData.FNumber && (
                              <div className="flex gap-2">
                                <span className="font-semibold text-emerald-900 min-w-24">Aperture:</span>
                                <span className="text-emerald-800">f/{exifData.FNumber}</span>
                              </div>
                            )}
                            {exifData.ExposureTime && (
                              <div className="flex gap-2">
                                <span className="font-semibold text-emerald-900 min-w-24">Shutter Speed:</span>
                                <span className="text-emerald-800">{exifData.ExposureTime}s</span>
                              </div>
                            )}
                          </div>
                        )}
                        {exifData.Software && (
                          <div className="mt-3 pt-3 border-t border-slate-200">
                            <div className="flex gap-2 text-sm">
                              <span className="font-semibold text-slate-700">Editing Software:</span>
                              <span className="text-slate-600">{exifData.Software}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* EXIF Impact Display */}
                  {result.exif_impact && (
                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                      <div className="text-xs font-semibold text-slate-700 mb-1">
                        Score Impact: {result.exif_impact.score_adjustment > 0 ? '+' : ''}{result.exif_impact.score_adjustment} points
                      </div>
                      <p className="text-xs text-slate-600">{result.exif_impact.reasoning}</p>
                    </div>
                  )}
                </div>
              </div>
            );
          } catch (e) {
            // Failed to parse EXIF, show as missing
          }
        }
        
        // No EXIF data - CRITICAL for photos
        return (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-6">
            <h3 className="font-semibold text-slate-800 mb-3 text-lg">📷 Camera Information</h3>
            <div className="p-4 rounded-xl bg-red-50 border-2 border-red-200">
              <div className="flex items-start gap-3">
                <div className="text-2xl">❌</div>
                <div className="flex-1">
                  <p className="font-semibold text-red-900 mb-2">No Camera Data Found</p>
                  <p className="text-sm text-red-800 mb-2">
                    This image contains <strong>zero camera metadata</strong>. Real photos from cameras and phones <strong>always</strong> embed technical information like camera model, date, and settings.
                  </p>
                  <div className="bg-white p-3 rounded-lg mt-3">
                    <p className="text-sm text-red-900 font-semibold mb-2">⚠️ This is a major red flag:</p>
                    <ul className="space-y-1 text-xs text-red-800">
                      <li>• A.I. generators never produce camera metadata</li>
                      <li>• Authentic photos typically have EXIF unless deliberately stripped</li>
                      <li>• Missing metadata significantly increases A.I. likelihood score</li>
                    </ul>
                  </div>
                  {result.exif_impact && (
                    <div className="mt-3 p-2 bg-red-100 rounded">
                      <div className="text-xs font-semibold text-red-900 mb-1">
                        Score Impact: +{result.exif_impact.score_adjustment} points (toward A.I.)
                      </div>
                      <p className="text-xs text-red-800">{result.exif_impact.reasoning}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Signals Section */}
      {result.signals && result.signals.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-6">
          <h3 className="font-semibold text-slate-800 mb-4 text-lg">🔍 What we found</h3>

          {/* Category tabs for video */}
          {result.content_type === 'video' && (() => {
            const categories = {
              all: result.signals,
              deepfake: result.signals.filter(s => s.category === 'deepfake'),
              temporal: result.signals.filter(s => s.category === 'temporal'),
              scene_change: result.signals.filter(s => s.category === 'scene_change'),
              ai_generation: result.signals.filter(s => s.category === 'ai_generation' || !s.category)
            };

            const [activeTab, setActiveTab] = React.useState('all');
            const displaySignals = categories[activeTab] || result.signals;

            return (
              <>
                <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
                  <button
                    onClick={() => setActiveTab('all')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                      activeTab === 'all' 
                        ? 'bg-slate-900 text-white' 
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    All ({result.signals.length})
                  </button>
                  {categories.deepfake.length > 0 && (
                    <button
                      onClick={() => setActiveTab('deepfake')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                        activeTab === 'deepfake' 
                          ? 'bg-red-600 text-white' 
                          : 'bg-red-50 text-red-600 hover:bg-red-100'
                      }`}
                    >
                      🎭 Deepfake ({categories.deepfake.length})
                    </button>
                  )}
                  {categories.temporal.length > 0 && (
                    <button
                      onClick={() => setActiveTab('temporal')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                        activeTab === 'temporal' 
                          ? 'bg-amber-600 text-white' 
                          : 'bg-amber-50 text-amber-600 hover:bg-amber-100'
                      }`}
                    >
                      ⏱️ Temporal ({categories.temporal.length})
                    </button>
                  )}
                  {categories.scene_change.length > 0 && (
                    <button
                      onClick={() => setActiveTab('scene_change')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                        activeTab === 'scene_change' 
                          ? 'bg-blue-600 text-white' 
                          : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                      }`}
                    >
                      🎞️ Scene ({categories.scene_change.length})
                    </button>
                  )}
                  {categories.ai_generation.length > 0 && (
                    <button
                      onClick={() => setActiveTab('ai_generation')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                        activeTab === 'ai_generation' 
                          ? 'bg-purple-600 text-white' 
                          : 'bg-purple-50 text-purple-600 hover:bg-purple-100'
                      }`}
                    >
                      🤖 AI Gen ({categories.ai_generation.length})
                    </button>
                  )}
                </div>

                <div className="space-y-3">
                  {displaySignals.map((signal, index) => {
                    const context = getSignalContext(signal.signal_type, signal.description, result.result === 'likely_ai');
                    return (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="p-4 rounded-xl bg-slate-50 border border-slate-200"
                      >
                        <div className="flex items-center gap-2 mb-3">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${severityColors[signal.severity]}`}>
                            {signal.severity}
                          </span>
                          <span className="text-base font-bold text-slate-800">{signal.signal_type}</span>
                        </div>
                        <p className="text-base text-slate-700 leading-relaxed mb-3">{signal.description}</p>
                        {context && (
                          <div className="pt-3 border-t border-slate-200 space-y-3">
                            <div>
                              <p className="text-sm text-slate-600 leading-relaxed">
                                <span className="font-semibold text-slate-700">🔍 Quick explanation:</span> {context.simple}
                              </p>
                            </div>
                            {context.detailed && (
                              <div className="bg-white p-3 rounded-lg">
                                <p className="text-sm text-slate-600 leading-relaxed">
                                  <span className="font-semibold text-slate-700">📚 Detailed breakdown:</span> {context.detailed}
                                </p>
                              </div>
                            )}
                            {context.weight && (
                              <div className="flex items-start gap-2 text-xs text-slate-500">
                                <span className="font-semibold">⚖️ Reliability:</span>
                                <span>{context.weight}</span>
                              </div>
                            )}
                          </div>
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              </>
            );
          })()}

          {/* Default for non-video */}
          {result.content_type !== 'video' && (
            <div className="space-y-3">
              {result.signals.map((signal, index) => {
                const context = getSignalContext(signal.signal_type, signal.description, result.result === 'likely_ai');
                
                // Determine icon based on artifact category
                const categoryIcons = {
                  photoshop: '✂️',
                  ai_generation: '🤖',
                  hybrid: '🔀',
                  camera_artifact: '📷',
                  compression: '🗜️'
                };
                const icon = signal.artifact_category ? categoryIcons[signal.artifact_category] : '🔍';
                
                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="p-4 rounded-xl bg-slate-50 border border-slate-200"
                  >
                    <div className="flex items-center gap-2 mb-3 flex-wrap">
                      <span className="text-xl">{icon}</span>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${severityColors[signal.severity]}`}>
                        {signal.severity}
                      </span>
                      <span className="text-base font-bold text-slate-800">{signal.signal_type}</span>
                      {signal.detection_confidence && (
                        <span className="text-xs text-slate-500 ml-auto">
                          {signal.detection_confidence}% confident
                        </span>
                      )}
                    </div>
                    <p className="text-base text-slate-700 leading-relaxed mb-3">{signal.description}</p>
                    {context && (
                      <div className="pt-3 border-t border-slate-200 space-y-3">
                        <div>
                          <p className="text-sm text-slate-600 leading-relaxed">
                            <span className="font-semibold text-slate-700">🔍 Quick explanation:</span> {context.simple}
                          </p>
                        </div>
                        {context.detailed && (
                          <div className="bg-white p-3 rounded-lg">
                            <p className="text-sm text-slate-600 leading-relaxed">
                              <span className="font-semibold text-slate-700">📚 Detailed breakdown:</span> {context.detailed}
                            </p>
                          </div>
                        )}
                        {context.weight && (
                          <div className="flex items-start gap-2 text-xs text-slate-500">
                            <span className="font-semibold">⚖️ Reliability:</span>
                            <span>{context.weight}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Summary & Decision Process */}
      {result.summary && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-6">
          <h3 className="font-semibold text-slate-800 mb-3 text-lg">📝 Analysis Summary</h3>
          <p className="text-slate-600 leading-relaxed mb-4">{result.summary}</p>

          {/* Understanding the Decision */}
          <div className="mt-6 pt-6 border-t border-slate-100">
            <h4 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
              <span>🧠</span> How We Made This Decision
            </h4>
            <div className="space-y-3 text-sm text-slate-600">
              <p className="leading-relaxed">
                Our A.I. detection system analyzes {result.content_type === 'video' ? 'multiple frames and technical video properties' : 'multiple regions of the image and technical properties'} looking for patterns that distinguish real content from A.I.-generated content.
              </p>

              {result.content_type === 'video' ? (
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                  <p className="font-semibold text-slate-700 mb-2">For videos, we look at:</p>
                  <ul className="space-y-1 ml-4">
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600 mt-1">•</span>
                      <span><strong>Frame-by-frame consistency:</strong> Real videos show smooth, natural progression. A.I. videos often have objects that flicker or change unnaturally between frames.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600 mt-1">•</span>
                      <span><strong>Technical metadata:</strong> File size, bitrate, and encoding patterns can reveal if a video was generated rather than recorded.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600 mt-1">•</span>
                      <span><strong>Deepfake indicators:</strong> Unnatural blinking, face boundaries that don't match the background, and facial movements that don't sync properly.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600 mt-1">•</span>
                      <span><strong>Scene consistency:</strong> Style or quality changes within the video can indicate different parts were generated separately.</span>
                    </li>
                  </ul>
                </div>
              ) : (
                <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
                  <p className="font-semibold text-slate-700 mb-2">For images, we examine:</p>
                  <ul className="space-y-1 ml-4">
                    <li className="flex items-start gap-2">
                      <span className="text-purple-600 mt-1">•</span>
                      <span><strong>Camera data:</strong> Real photos contain technical information from the camera. A.I. images typically don't.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-purple-600 mt-1">•</span>
                      <span><strong>Multiple image regions:</strong> We analyze different parts independently. A.I. artifacts often appear in some areas but not others.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-purple-600 mt-1">•</span>
                      <span><strong>Pixel-level patterns:</strong> Compression artifacts, noise patterns, and color distributions differ between real photos and A.I. generations.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-purple-600 mt-1">•</span>
                      <span><strong>Visual artifacts:</strong> Common A.I. tells like impossible anatomy, perfect symmetry, or unnatural textures.</span>
                    </li>
                  </ul>
                </div>
              )}

              <p className="leading-relaxed mt-4">
                <span className="font-semibold text-slate-700">Our confidence in this result:</span> Each piece of evidence we find has different reliability. We weight stronger indicators (like impossible hand anatomy or camera data) more heavily than weaker ones (like slight compression differences). The signals we found led us to classify this as <span className="font-bold">{config.title}</span>.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* How We Scored This */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-6">
        <h3 className="font-semibold text-slate-800 mb-3 text-lg">📊 Understanding the Score</h3>
        <div className="space-y-4 text-sm text-slate-600">
          <div className="bg-slate-50 p-4 rounded-lg">
            <p className="leading-relaxed">
              Our system analyzes {result.content_type === 'video' ? 'each frame and technical metadata' : 'multiple regions and technical data'} to generate a score between 0 and 100. This score represents how much the content resembles typical A.I.-generated patterns versus authentic {result.content_type === 'video' ? 'footage' : 'photography'}.
            </p>
          </div>

          <div className="grid gap-3">
            <div className="flex items-start gap-3 p-3 bg-emerald-50 rounded-lg border border-emerald-100">
              <span className="text-2xl">✓</span>
              <div>
                <div className="font-bold text-emerald-800 mb-1">Likely Real (0-37)</div>
                <p className="text-sm text-emerald-700">Strong evidence of authenticity: camera data present, natural imperfections, realistic physics, consistent compression patterns.</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
              <span className="text-2xl">❓</span>
              <div>
                <div className="font-bold text-slate-700 mb-1">Uncertain (38-42)</div>
                <p className="text-sm text-slate-600">Insufficient evidence to make a confident determination. Requires additional context.</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-orange-50 rounded-lg border border-orange-100">
              <span className="text-2xl">🤔</span>
              <div>
                <div className="font-bold text-orange-800 mb-1">Possibly A.I. (43-57)</div>
                <p className="text-sm text-orange-700">Some A.I. indicators present but not conclusive. Could be heavily edited real content or high-quality A.I. generation.</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-amber-50 rounded-lg border border-amber-100">
              <span className="text-2xl">⚠️</span>
              <div>
                <div className="font-bold text-amber-800 mb-1">Likely A.I. (58-100)</div>
                <p className="text-sm text-amber-700">Multiple A.I. indicators detected: impossible anatomy, perfect symmetry, unnatural smoothness, missing camera data, or physical impossibilities.</p>
              </div>
            </div>
          </div>

          {result.score && (
            <div className="pt-4 border-t border-slate-100">
              <p className="font-semibold text-slate-900 mb-3 text-base">
                This {result.content_type === 'video' ? 'video' : 'image'} scored: {result.score}/100
              </p>

              {/* Visual Score Bar */}
              <div className="relative mb-12">
                <div className="flex justify-between text-xs font-medium mb-2">
                  <span className="text-emerald-600">Real</span>
                  <span className="text-amber-600">A.I.</span>
                </div>
                <div className="h-3 rounded-full overflow-hidden bg-gradient-to-r from-emerald-500 via-slate-300 to-amber-500">
                  {/* Score indicator */}
                  <div 
                    className="absolute top-8 -translate-x-1/2 flex flex-col items-center"
                    style={{ left: `${result.score}%` }}
                  >
                    <div className="w-0.5 h-4 bg-slate-900"></div>
                    <div className="w-8 h-8 rounded-full bg-slate-900 flex items-center justify-center text-white text-xs font-bold shadow-lg">
                      {result.score}
                    </div>
                  </div>
                </div>
                <div className="flex justify-between text-xs text-slate-500 mt-1">
                  <span>0</span>
                  <span>50</span>
                  <span>100</span>
                </div>
              </div>

              <div className="text-slate-600 space-y-4">
                {result.score >= 58 && (
                  <div className="bg-amber-50 p-4 rounded-lg border border-amber-100">
                    <p className="font-semibold text-amber-900 mb-3">⚠️ Why this score suggests A.I. generation:</p>
                    <div className="space-y-2 text-sm">
                      <p>Our analysis found multiple patterns that are characteristic of A.I.-generated content:</p>
                      <ul className="space-y-1 ml-4 mt-2">
                        {result.signals && result.signals.filter(s => s.severity === 'high').length > 0 && (
                          <li className="flex items-start gap-2">
                            <span className="text-amber-600 mt-1">•</span>
                            <span><strong>{result.signals.filter(s => s.severity === 'high').length} high-severity indicators</strong> found (like impossible anatomy or garbled text)</span>
                          </li>
                        )}
                        {!result.exif_summary && result.content_type !== 'video' && (
                          <li className="flex items-start gap-2">
                            <span className="text-amber-600 mt-1">•</span>
                            <span>No camera data found (real photos almost always have this)</span>
                          </li>
                        )}
                        <li className="flex items-start gap-2">
                          <span className="text-amber-600 mt-1">•</span>
                          <span>The higher the score (closer to 100), the more confident we are in A.I. generation</span>
                        </li>
                      </ul>
                      <p className="mt-3 text-amber-800">
                        <strong>What this means:</strong> The evidence strongly suggests this {result.content_type} was created or significantly altered by A.I., not captured by a camera.
                      </p>
                    </div>
                  </div>
                )}
                {result.score <= 37 && (
                  <div className="bg-emerald-50 p-4 rounded-lg border border-emerald-100">
                    <p className="font-semibold text-emerald-900 mb-3">✓ Why this score suggests authenticity:</p>
                    <div className="space-y-2 text-sm">
                      <p>Our analysis found multiple indicators of authentic {result.content_type === 'video' ? 'footage' : 'photography'}:</p>
                      <ul className="space-y-1 ml-4 mt-2">
                        {result.exif_summary && (
                          <li className="flex items-start gap-2">
                            <span className="text-emerald-600 mt-1">•</span>
                            <span><strong>Camera data present</strong> (strong authenticity indicator)</span>
                          </li>
                        )}
                        {result.signals && result.signals.filter(s => s.signal_type.toLowerCase().includes('natural') || s.signal_type.toLowerCase().includes('real')).length > 0 && (
                          <li className="flex items-start gap-2">
                            <span className="text-emerald-600 mt-1">•</span>
                            <span>Natural imperfections and realistic details detected</span>
                          </li>
                        )}
                        <li className="flex items-start gap-2">
                          <span className="text-emerald-600 mt-1">•</span>
                          <span>Few or no typical A.I. generation patterns found</span>
                        </li>
                      </ul>
                      <p className="mt-3 text-emerald-800">
                        <strong>What this means:</strong> The evidence suggests this is authentic {result.content_type === 'video' ? 'video footage' : 'photography'}, not A.I.-generated.
                      </p>
                    </div>
                  </div>
                )}
                {result.score >= 38 && result.score <= 42 && (
                  <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                    <p className="font-semibold text-slate-900 mb-3">❓ Why this score is uncertain:</p>
                    <div className="space-y-2 text-sm">
                      <p>Our analysis found insufficient evidence to make a confident determination in either direction.</p>
                      <div className="bg-white p-3 rounded mt-3">
                        <p className="font-semibold text-slate-700 mb-2">This could indicate:</p>
                        <ul className="space-y-1 ml-4">
                          <li className="flex items-start gap-2">
                            <span className="text-slate-600 mt-1">•</span>
                            <span>Limited analyzable content or low resolution</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-slate-600 mt-1">•</span>
                            <span>Equal mix of authentic and suspicious indicators</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-slate-600 mt-1">•</span>
                            <span>Content that doesn't fit typical patterns</span>
                          </li>
                        </ul>
                      </div>
                      <p className="mt-3 text-slate-700">
                        <strong>What this means:</strong> We cannot make a confident determination. Consider the source and context of this {result.content_type} when evaluating its authenticity.
                      </p>
                    </div>
                  </div>
                )}
                {result.score >= 43 && result.score <= 57 && (
                  <div className="bg-orange-50 p-4 rounded-lg border border-orange-100">
                    <p className="font-semibold text-orange-900 mb-3">🤔 Why this suggests possible A.I. generation:</p>
                    <div className="space-y-2 text-sm">
                      <p>Our analysis found some indicators suggesting A.I. generation, but they're not strong enough for a confident classification.</p>
                      <div className="bg-white p-3 rounded mt-3">
                        <p className="font-semibold text-slate-700 mb-2">This middle-ground score could mean:</p>
                        <ul className="space-y-1 ml-4">
                          <li className="flex items-start gap-2">
                            <span className="text-orange-600 mt-1">•</span>
                            <span>High-quality A.I. generation that closely mimics real content</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-orange-600 mt-1">•</span>
                            <span>Real {result.content_type} with heavy editing or artistic filters applied</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-orange-600 mt-1">•</span>
                            <span>Hybrid content (real {result.content_type} with A.I. enhancements)</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-orange-600 mt-1">•</span>
                            <span>Professional post-processing that creates A.I.-like patterns</span>
                          </li>
                        </ul>
                      </div>
                      <p className="mt-3 text-orange-800">
                        <strong>What this means:</strong> There's a reasonable chance this is A.I.-generated, but we recommend caution. Verify the source and look for additional context before drawing conclusions.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Disclaimer */}
      <div className="flex items-start gap-3 p-4 rounded-xl bg-slate-50 mb-6">
        <Info className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
        <p className="text-xs text-slate-500 leading-relaxed">
          AI analysis isn't perfect and may be wrong. This assessment should not be used as proof. Always check multiple sources when evaluating if content is real.
        </p>
      </div>

      {/* Share Section - Fun Button Approach */}
      {!shareGenerated ? (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl border-2 border-purple-200 p-8 mb-6 text-center"
        >
          <div className="text-5xl mb-4">🎉</div>
          <h3 className="font-bold text-slate-800 mb-2 text-xl">Share Your Results!</h3>
          <p className="text-slate-600 mb-6 max-w-md mx-auto">
            Create a beautiful shareable card to spread awareness about A.I. content
          </p>

          {!affiliateCode && !showAffiliatePrompt && (
            <div className="mb-4 p-4 bg-white rounded-xl border border-purple-200">
              <p className="text-sm text-slate-600 mb-3">
                💰 Want to earn 30% commission when people sign up through your shared content?
              </p>
              <Button
                onClick={() => setShowAffiliatePrompt(true)}
                variant="outline"
                size="sm"
                className="border-purple-300 text-purple-700 hover:bg-purple-50"
              >
                Add My Affiliate Link
              </Button>
            </div>
          )}

          {showAffiliatePrompt && !affiliateCode && (
            <div className="mb-4 p-4 bg-white rounded-xl border border-purple-200 text-left">
              <p className="text-sm text-slate-600 mb-3">
                Enter your affiliate code to earn 30% commission on all referrals from this share:
              </p>
              <div className="flex gap-2">
                <Input
                  placeholder="your-affiliate-code"
                  value={affiliateCode}
                  onChange={(e) => setAffiliateCode(e.target.value)}
                  className="flex-1"
                />
                <Button
                  onClick={() => setShowAffiliatePrompt(false)}
                  variant="outline"
                  size="sm"
                >
                  Cancel
                </Button>
              </div>
              <p className="text-xs text-slate-500 mt-2">
                Don't have one? <a href={createPageUrl('AffiliateMarketing')} className="text-purple-600 hover:underline">Join our affiliate program</a>
              </p>
            </div>
          )}

          {affiliateCode && (
            <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
              <p className="text-sm text-emerald-800">
                ✓ Your affiliate link will be included
              </p>
            </div>
          )}

          <Button
            onClick={() => setShareGenerated(true)}
            className="h-14 px-8 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold text-lg shadow-lg hover:shadow-xl transition-all"
          >
            ✨ Create Share Card
          </Button>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-2xl border border-slate-200 p-6 mb-6"
        >
          <div className="flex items-center gap-2 mb-4">
            <div className="text-2xl">🎨</div>
            <h3 className="font-semibold text-slate-800 text-lg">Your Share Card is Ready!</h3>
          </div>

          {/* Preview */}
          <div className="mb-4 p-4 bg-slate-50 rounded-xl">
            <div className="text-sm text-slate-600 mb-2 text-center">Preview</div>
            <div className="flex justify-center">
              <div style={{ transform: 'scale(0.5)', transformOrigin: 'top center', maxHeight: '300px', overflow: 'hidden' }}>
                <ShareCard result={result} cardRef={shareCardRef} />
              </div>
            </div>
          </div>

          {/* Download & Copy */}
          <div className="mb-4">
            <h4 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
              <span>💾</span> Save Your Card
            </h4>
            <div className="flex gap-3">
              <Button
                onClick={async () => {
                  setGenerating(true);
                  try {
                    const cardElement = shareCardRef.current;
                    const canvas = await html2canvas(cardElement, {
                      backgroundColor: null,
                      scale: 2,
                      logging: false
                    });
                    const url = canvas.toDataURL('image/png');
                    const link = document.createElement('a');
                    link.download = `is-this-real-verification-${Date.now()}.png`;
                    link.href = url;
                    link.click();
                    toast.success('🎉 Image downloaded!');
                  } catch (error) {
                    toast.error('Failed to download image');
                  } finally {
                    setGenerating(false);
                  }
                }}
                disabled={generating}
                className="flex-1 h-11 bg-slate-900 hover:bg-slate-800"
              >
                {generating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </>
                )}
              </Button>
              <Button
                onClick={async () => {
                  setGenerating(true);
                  try {
                    const cardElement = shareCardRef.current;
                    const canvas = await html2canvas(cardElement, {
                      backgroundColor: null,
                      scale: 2,
                      logging: false
                    });
                    const url = canvas.toDataURL('image/png');
                    const blob = await (await fetch(url)).blob();
                    await navigator.clipboard.write([
                      new ClipboardItem({ 'image/png': blob })
                    ]);
                    setCopied(true);
                    toast.success('📋 Copied to clipboard!');
                    setTimeout(() => setCopied(false), 2000);
                  } catch (error) {
                    toast.error('Failed to copy. Try downloading instead.');
                  } finally {
                    setGenerating(false);
                  }
                }}
                disabled={generating}
                variant="outline"
                className="flex-1 h-11"
              >
                {copied ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 mr-2 text-green-600" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 mr-2" />
                    Copy
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Social Sharing */}
          <div>
            <h4 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
              <span>🚀</span> Share to Social Media
            </h4>
            <div className="grid grid-cols-3 gap-3">
              <button
                onClick={() => {
                  const appUrl = window.location.origin;
                  const text = `I verified content using Is This Real? Result: ${config.title}`;
                  window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(appUrl)}`, '_blank', 'width=600,height=400');
                }}
                className="p-3 bg-slate-50 hover:bg-slate-100 active:scale-95 rounded-xl border border-slate-200 transition-all flex flex-col items-center gap-2"
              >
                <div className="w-10 h-10 rounded-full bg-black flex items-center justify-center">
                  <span className="text-white font-bold text-sm">𝕏</span>
                </div>
                <span className="text-xs font-medium text-slate-700">X</span>
              </button>
              <button
                onClick={() => {
                  const appUrl = window.location.origin;
                  const text = `I verified content using Is This Real? Result: ${config.title}`;
                  window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(appUrl)}&quote=${encodeURIComponent(text)}`, '_blank', 'width=600,height=400');
                }}
                className="p-3 bg-slate-50 hover:bg-slate-100 active:scale-95 rounded-xl border border-slate-200 transition-all flex flex-col items-center gap-2"
              >
                <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center">
                  <span className="text-white font-bold text-sm">f</span>
                </div>
                <span className="text-xs font-medium text-slate-700">Facebook</span>
              </button>
              <button
                onClick={() => {
                  const appUrl = window.location.origin;
                  window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(appUrl)}`, '_blank', 'width=600,height=400');
                }}
                className="p-3 bg-slate-50 hover:bg-slate-100 active:scale-95 rounded-xl border border-slate-200 transition-all flex flex-col items-center gap-2"
              >
                <div className="w-10 h-10 rounded-full bg-blue-700 flex items-center justify-center">
                  <span className="text-white font-bold text-sm">in</span>
                </div>
                <span className="text-xs font-medium text-slate-700">LinkedIn</span>
              </button>
            </div>
          </div>

          {/* Note */}
          <div className="text-center text-xs text-slate-500 mt-4 flex items-center justify-center gap-1">
            <span>💡</span>
            Share responsibly - help others spot A.I. content!
          </div>
        </motion.div>
      )}

      {/* Hidden ShareCard for image generation */}
      <div style={{ position: 'absolute', left: '-9999px', top: 0 }}>
        <ShareCard result={result} cardRef={shareCardRef} affiliateCode={affiliateCode} />
      </div>

      {/* Feedback Section */}
      <div className="bg-slate-50 rounded-2xl border border-slate-200 p-6 mb-6">
        <ResultFeedback resultId={result.id} />
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
          onClick={onStartOver}
          variant="outline"
          className="flex-1 h-12 border-slate-200 hover:bg-slate-50"
        >
          Check Another
        </Button>
      </div>
    </motion.div>
  );
}