import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Sparkles, Upload, Link as LinkIcon, CheckCircle2, AlertTriangle, HelpCircle, ArrowRight, Zap } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import exifr from 'exifr';

import ResultCard from '@/components/verification/ResultCard';
import ProfileDropdown from '@/components/shared/ProfileDropdown';
import PreferencesModal from '@/components/shared/PreferencesModal';
import StripeCheckout from '@/components/payment/StripeCheckout';
import BottomNav from '@/components/mobile/BottomNav';
import SplashScreen from '@/components/mobile/SplashScreen';
import AnalysisChecklist from '@/components/verification/AnalysisChecklist';
import { generatePatchesFromFile } from '@/components/utils/imagePatches';
import { analyzeForensics } from '@/components/utils/forensicsApi';
import { deriveLlmScoreFromPatchVotes, ensembleDecision } from '@/components/utils/ensembleScore';
import { extractFramesFromVideo } from '@/components/utils/videoFrames';

export default function Home() {
  const [uploadedFile, setUploadedFile] = useState(null);
  const [uploadedFileObj, setUploadedFileObj] = useState(null);
  const [urlInput, setUrlInput] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const [showPreferences, setShowPreferences] = useState(false);
  const [showSplash, setShowSplash] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  React.useEffect(() => {
    // Detect mobile device
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const queryClient = useQueryClient();

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setUploadedFileObj(file);
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setUploadedFile(file_url);
      toast.success('File uploaded! Click "Verify Now" to analyze.');
    } catch (error) {
      toast.error('Failed to upload file');
    }
  };

  const handleAnalyze = async () => {
      if (!uploadedFile && !urlInput) {
        toast.error('Please upload an image or video or paste a URL');
        return;
      }

      setAnalyzing(true);
      try {
        // Check if uploaded file is a video
        const isVideo = uploadedFileObj && uploadedFileObj.type.startsWith('video/');

        // Video analysis flow
        if (isVideo) {
          try {
            // Extract frames from video (increased for better temporal analysis)
            const { frames, duration } = await extractFramesFromVideo(uploadedFileObj, 8);

            // Upload frames
            const frameUrls = await Promise.all(
              frames.map(async (frame) => {
                const { file_url } = await base44.integrations.Core.UploadFile({ file: frame.file });
                return { url: file_url, timestamp: frame.timestamp };
              })
            );

            // Enhanced frame-by-frame and deepfake analysis
            const frameAnalysis = await base44.integrations.Core.InvokeLLM({
              prompt: `You are an ADVANCED VIDEO DEEPFAKE & AI DETECTION SYSTEM analyzing a video for AI-generated content and deepfakes.

        VIDEO METADATA:
        - Total Frames Provided: ${frames.length}
        - Video Duration: ${duration.toFixed(1)}s
        - Frame Timestamps: ${frameUrls.map((f, i) => `Frame ${i+1} at ${f.timestamp.toFixed(2)}s`).join(', ')}

        ANALYSIS FRAMEWORK:

        1. FRAME-BY-FRAME COMPARISON:
        - Compare consecutive frames for consistency
        - Detect morphing artifacts (faces/objects changing shape between frames)
        - Identify unnatural transitions or jumps
        - Look for flickering in lighting, textures, or facial features
        - Check for temporal coherence in motion and physics

        2. DEEPFAKE-SPECIFIC DETECTION:
        Face & Head Analysis:
        - Unnatural or absent blinking patterns (real humans blink 15-20 times/min)
        - Facial feature misalignment between frames
        - Head movements that don't match speech or body language
        - Jaw movements inconsistent with audio/speech
        - Skin tone shifts between frames
        - Hair that appears "glued" or lacks natural movement

        Background & Boundary Analysis:
        - Distorted or warped backgrounds around the head/face
        - Unnatural edge blending where face meets background
        - Background elements that shift unnaturally when head moves
        - Color bleeding or artifacts around face boundaries

        Lighting & Shadows:
        - Face lighting that doesn't match scene lighting
        - Shadows that don't align with light sources
        - Inconsistent lighting direction on face vs. environment

        Facial Expression & Movement:
        - Micro-expressions that appear unnatural or delayed
        - Facial features that don't move cohesively
        - Eye gaze that doesn't track properly
        - Teeth/mouth interior that looks artificial

        3. SCENE-BASED ANALYSIS:
        - Detect scene changes or cuts
        - Identify shifts in generation style or quality between scenes
        - Look for consistency in AI artifacts across different scenes
        - Flag if different parts use different generation techniques

        4. TEMPORAL CONSISTENCY:
        - Object persistence (objects appearing/disappearing)
        - Style consistency throughout video
        - Quality shifts that suggest spliced content
        - Motion blur patterns (real vs. AI-generated blur)

        5. AI GENERATION PATTERNS:
        - Overly smooth or plastic-like skin textures
        - Perfect symmetry in faces or objects
        - Impossible physics or anatomy
        - Unnatural color grading shifts
        - Compression artifacts typical of AI synthesis

        INSTRUCTIONS:
        - Analyze EACH frame with the above framework
        - For consecutive frames, explicitly compare and note any anomalies
        - Provide confidence scores for each finding
        - Classify as: "likely_real", "likely_deepfake", "likely_ai", or "uncertain"
        - Calculate AI influence percentage and deepfake likelihood percentage separately

        Return comprehensive frame-by-frame analysis with deepfake assessment.`,
              file_urls: frameUrls.map(f => f.url),
              response_json_schema: {
                type: "object",
                properties: {
                  frame_analyses: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        frame_index: { type: "number" },
                        timestamp: { type: "number" },
                        assessment: { type: "string", enum: ["likely_real", "likely_ai", "likely_deepfake", "uncertain"] },
                        confidence: { type: "number" },
                        signals: {
                          type: "array",
                          items: {
                            type: "object",
                            properties: {
                              signal_type: { type: "string" },
                              description: { type: "string" },
                              severity: { type: "string", enum: ["low", "medium", "high"] },
                              category: { type: "string", enum: ["deepfake", "ai_generation", "temporal", "scene_change"] }
                            }
                          }
                        },
                        deepfake_indicators: {
                          type: "array",
                          items: { type: "string" }
                        }
                      }
                    }
                  },
                  frame_comparisons: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        frames: { type: "string" },
                        anomaly: { type: "string" },
                        severity: { type: "string", enum: ["low", "medium", "high"] }
                      }
                    }
                  },
                  deepfake_analysis: {
                    type: "object",
                    properties: {
                      is_deepfake_suspected: { type: "boolean" },
                      deepfake_confidence: { type: "number" },
                      key_deepfake_indicators: {
                        type: "array",
                        items: { type: "string" }
                      },
                      blinking_analysis: { type: "string" },
                      face_consistency: { type: "string" },
                      background_distortion: { type: "string" }
                    }
                  },
                  scene_analysis: {
                    type: "object",
                    properties: {
                      scene_changes_detected: { type: "number" },
                      style_shifts: {
                        type: "array",
                        items: {
                          type: "object",
                          properties: {
                            from_frame: { type: "number" },
                            to_frame: { type: "number" },
                            description: { type: "string" }
                          }
                        }
                      },
                      consistency_score: { type: "number" }
                    }
                  },
                  temporal_inconsistencies: {
                    type: "array",
                    items: { type: "string" }
                  },
                  overall_result: { type: "string", enum: ["likely_real", "likely_ai", "likely_deepfake", "uncertain"] },
                  overall_confidence: { type: "number" },
                  summary: { type: "string" },
                  ai_influence_percentage: { type: "number" }
                }
              }
            });

            // Aggregate signals from all frames and frame comparisons
            const allSignals = [];

            // Frame-specific signals
            frameAnalysis.frame_analyses.forEach((frame, idx) => {
              if (frame.signals) {
                frame.signals.forEach(signal => {
                  allSignals.push({
                    ...signal,
                    signal_type: `Frame ${idx + 1} (${frame.timestamp.toFixed(1)}s): ${signal.signal_type}`
                  });
                });
              }
            });

            // Frame comparison anomalies
            if (frameAnalysis.frame_comparisons && frameAnalysis.frame_comparisons.length > 0) {
              frameAnalysis.frame_comparisons.forEach(comparison => {
                allSignals.push({
                  signal_type: `Frame Comparison (${comparison.frames})`,
                  description: comparison.anomaly,
                  severity: comparison.severity,
                  category: "temporal"
                });
              });
            }

            // Temporal inconsistencies
            if (frameAnalysis.temporal_inconsistencies && frameAnalysis.temporal_inconsistencies.length > 0) {
              frameAnalysis.temporal_inconsistencies.forEach(inconsistency => {
                allSignals.push({
                  signal_type: "Temporal Inconsistency",
                  description: inconsistency,
                  severity: "high",
                  category: "temporal"
                });
              });
            }

            // Deepfake-specific signals
            if (frameAnalysis.deepfake_analysis?.key_deepfake_indicators) {
              frameAnalysis.deepfake_analysis.key_deepfake_indicators.forEach(indicator => {
                allSignals.push({
                  signal_type: "Deepfake Indicator",
                  description: indicator,
                  severity: "high",
                  category: "deepfake"
                });
              });
            }

            // Scene analysis signals
            if (frameAnalysis.scene_analysis?.style_shifts) {
              frameAnalysis.scene_analysis.style_shifts.forEach(shift => {
                allSignals.push({
                  signal_type: "Style Shift Detected",
                  description: `${shift.description} (frames ${shift.from_frame} to ${shift.to_frame})`,
                  severity: "medium",
                  category: "scene_change"
                });
              });
            }

            const record = await base44.entities.AnalysisRecord.create({
              content_type: 'video',
              file_url: uploadedFile,
              thumbnail_url: frameUrls[0]?.url,
              result: frameAnalysis.overall_result,
              confidence: frameAnalysis.overall_confidence,
              signals: allSignals,
              summary: frameAnalysis.summary,
              patch_urls: frameUrls.map(f => f.url),
              forensics: { 
                video_duration: duration,
                frames_analyzed: frames.length,
                ai_influence_percentage: frameAnalysis.ai_influence_percentage,
                deepfake_analysis: frameAnalysis.deepfake_analysis,
                scene_analysis: frameAnalysis.scene_analysis,
                frame_comparisons: frameAnalysis.frame_comparisons
              }
            });

            setResult({ ...record, ...frameAnalysis });
            return;
          } catch (error) {
            console.error('Video analysis error:', error);
            toast.error('Video analysis failed. Please try again.');
            setAnalyzing(false);
            return;
          }
        }

        // URL-only analysis (existing flow)
        if (!uploadedFileObj && urlInput) {
        const analysisResult = await base44.integrations.Core.InvokeLLM({
          prompt: `You are an expert AI content detector. Analyze this URL for signs of AI-generated content: ${urlInput}. Evaluate if the content is AI-generated vs authentic.

Analyze for these signals:
- Visual artifacts (hands, eyes, teeth, symmetry issues)
- Lighting and shadow inconsistencies  
- Texture anomalies or unnatural smoothing
- Depth and perspective errors
- Known AI generation patterns

Provide a thorough but accessible analysis.`,
          add_context_from_internet: true,
          response_json_schema: {
            type: "object",
            properties: {
              result: { type: "string", enum: ["likely_real", "likely_ai", "uncertain"] },
              confidence: { type: "number" },
              signals: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    signal_type: { type: "string" },
                    description: { type: "string" },
                    severity: { type: "string", enum: ["low", "medium", "high"] },
                    detection_confidence: { type: "number" }
                  }
                }
              },
              summary: { type: "string" }
            },
            required: ["result", "confidence", "signals", "summary"]
          }
        });

        const record = await base44.entities.AnalysisRecord.create({
          content_type: 'url',
          source_url: urlInput,
          platform: 'direct_upload',
          ...analysisResult
        });

        setResult({ ...record, ...analysisResult });
        return;
      }

      // Enhanced image analysis with patches + forensics + EXIF
      let exifData = null;
      let patchUrls = [];
      let forensicsData = null;

      // Step 1: Parse EXIF
      try {
        exifData = await exifr.parse(uploadedFileObj);
      } catch (err) {
        console.warn('EXIF parsing failed:', err);
      }

      // Step 2: Generate and upload patches
      try {
        const patches = await generatePatchesFromFile(uploadedFileObj, 8);
        const uploadPromises = patches.map(async (patch) => {
          const { file_url } = await base44.integrations.Core.UploadFile({ file: patch.file });
          return { id: patch.id, url: file_url };
        });
        patchUrls = await Promise.all(uploadPromises);
      } catch (err) {
        console.warn('Patch generation failed:', err);
      }

      // Step 3: Call forensics API
      try {
        forensicsData = await analyzeForensics({ imageUrl: uploadedFile });
      } catch (err) {
        console.warn('Forensics API failed:', err);
      }

      // Step 4: Enhanced LLM analysis with few-shot learning examples
      const allImageUrls = [uploadedFile, ...patchUrls.map(p => p.url)];
      const analysisResult = await base44.integrations.Core.InvokeLLM({
        prompt: `SYSTEM IDENTITY:
You are the Advanced AI Detection Engine v3.0 for "Is This Real" - a critical infrastructure tool for identifying AI-generated imagery.

FEW-SHOT LEARNING EXAMPLES:

EXAMPLE 1 - REAL PHOTO:
Image: Outdoor portrait of a woman at a beach
Signals Found:
- Natural skin texture with visible pores and fine lines (detection_confidence: 92%)
- Asymmetric facial features - left eye slightly lower than right (detection_confidence: 88%)
- Wind-blown hair with individual strands showing motion blur (detection_confidence: 85%)
- Fabric wrinkles on clothing with realistic shadow gradients (detection_confidence: 90%)
- Background bokeh with natural chromatic aberration at edges (detection_confidence: 87%)
- EXIF metadata present: Canon EOS R5, f/2.8, ISO 400 (detection_confidence: 95%)
Classification: likely_real, Confidence: 89%

EXAMPLE 2 - AI-GENERATED IMAGE:
Image: Portrait of a professional woman in office setting
Signals Found:
- Overly perfect facial symmetry - both eyes exactly aligned (detection_confidence: 91%)
- Plastic-like skin texture with no visible pores (detection_confidence: 94%)
- Hair lacks individual strand definition, appears "painted" (detection_confidence: 88%)
- Background elements have soft, melted edges around the subject (detection_confidence: 86%)
- Lighting source is ambiguous - no clear shadow directionality (detection_confidence: 83%)
- Teeth too white and perfectly uniform (detection_confidence: 89%)
- No EXIF metadata present (detection_confidence: 70%)
Classification: likely_ai, Confidence: 87%

EXAMPLE 3 - REAL PHOTO WITH SOME CONFUSION:
Image: Professional product photography
Signals Found:
- Sharp focus with natural depth of field gradient (detection_confidence: 82%)
- Surface imperfections on product visible (scratches, dust) (detection_confidence: 85%)
- Natural reflection on glossy surface following physics (detection_confidence: 88%)
- Studio lighting setup with multiple controlled light sources (detection_confidence: 75%)
- Clean background BUT this is expected for product shots (detection_confidence: 60%)
- EXIF metadata present: Sony A7III (detection_confidence: 93%)
Classification: likely_real, Confidence: 84%

EXAMPLE 4 - AI-GENERATED WITH SUBTLE ARTIFACTS:
Image: Landscape with mountains and lake
Signals Found:
- Overall composition looks natural BUT trees have repetitive patterns (detection_confidence: 79%)
- Water reflection doesn't precisely match mountain shapes (detection_confidence: 82%)
- Sky gradient is too smooth, lacks natural cloud texture variation (detection_confidence: 76%)
- Rock formations have impossible geometry in background (detection_confidence: 85%)
- Foreground vegetation has "copy-paste" appearance (detection_confidence: 81%)
- No EXIF data, no compression artifacts typical of cameras (detection_confidence: 88%)
Classification: likely_ai, Confidence: 81%

CRITICAL DIRECTIVE:
Your PRIMARY OBJECTIVE is to make DECISIVE classifications. Learn from the examples above - each signal should have its own detection_confidence based on how clear that specific indicator is. Uncertainty should ONLY be used when evidence is genuinely contradictory or absent.

KEY PHILOSOPHY:
- Real photos have natural imperfections, wear, entropy, and camera artifacts
- AI images tend toward perfection, uniformity, and lack of physical realism
- Be CONFIDENT in your assessments when evidence supports them
- EACH SIGNAL has varying reliability - assign detection_confidence accordingly

ANALYSIS FRAMEWORK:

1. IMAGE TYPE CLASSIFICATION (crucial context):
   - Personal/Phone Photo: Look for natural wear, realistic interactions, authentic moments
   - Professional/Editorial: Assess lighting physics, material realism, compositional authenticity
   - Product/Commercial: Check for physical consistency, material properties, realistic shadows
   - Wildlife/Nature: Evaluate animal anatomy, natural behavior, environmental coherence
   - Portrait/Studio: Analyze skin texture, hair detail, clothing physics, eye authenticity

2. PRIMARY AUTHENTICITY MARKERS (for REAL images):
   - EXIF metadata presence and consistency (usually 90-95% confidence if present)
   - Natural image compression artifacts (JPEG blocking, sensor noise) (80-90% confidence)
   - Realistic lens distortion and chromatic aberration (85-92% confidence)
   - Authentic motion blur or focus patterns (80-88% confidence)
   - Physical wear on objects (scuffs, wrinkles, asymmetry) (85-93% confidence)
   - Genuine human microexpressions and imperfect symmetry (88-95% confidence)
   - Environmental consistency (light source, shadows, reflections) (75-90% confidence)
   - Material entropy (fabric texture, surface irregularities) (82-91% confidence)
   - Natural color grading and tone mapping (70-85% confidence)

3. PRIMARY AI INDICATORS (for AI-GENERATED images):
   - Overly perfect symmetry (especially faces) (85-95% confidence)
   - Unnatural smoothness or plastic-like skin (88-94% confidence)
   - Anatomical impossibilities (extra fingers, merged limbs) (95-99% confidence)
   - Background incoherence or "melted" elements (82-92% confidence)
   - Lighting that defies physics (multiple shadows, inconsistent) (80-91% confidence)
   - Repetitive patterns or textures (78-88% confidence)
   - Uncanny valley facial expressions (75-85% confidence)
   - Impossible reflections or refractions (83-93% confidence)
   - Text/signage with garbled letters (90-98% confidence)
   - Floating or disconnected objects (85-94% confidence)

4. MULTI-REGION PATCH ANALYSIS:
   The first image is the FULL image.
   The remaining ${patchUrls.length} images are PATCHES from different regions.
   
   VOTING INSTRUCTIONS:
   - Analyze EACH PATCH independently and decisively like the examples above
   - Vote "likely_real" if the patch shows authentic characteristics
   - Vote "likely_ai" if the patch shows AI generation artifacts
   - Vote "uncertain" ONLY if the patch genuinely lacks distinguishing features
   - Provide high confidence (70-95%) when evidence is clear
   - Provide medium confidence (50-69%) when evidence is suggestive but not definitive
   - Provide low confidence (<50%) only when genuinely ambiguous
   - ASSIGN detection_confidence to EACH signal found in the patch

5. METADATA CONTEXT:
   EXIF Data: ${exifData ? JSON.stringify(exifData, null, 2) : 'None (WARNING: absence suggests screenshot/AI, but not conclusive)'}
   Forensics Data: ${forensicsData ? JSON.stringify(forensicsData, null, 2) : 'Not available'}

DECISION GUIDELINES:
- If 60%+ patches vote the same way with high confidence → COMMIT to that classification
- If EXIF metadata present + patches show realism → STRONGLY favor "likely_real"
- If no EXIF + multiple AI artifacts → STRONGLY favor "likely_ai"
- Reserve "uncertain" for TRULY ambiguous cases (contradictory evidence, minimal visible content)
- Weight signals by their individual detection_confidence values

OUTPUT REQUIREMENTS:
Provide comprehensive patch voting with decisive classifications, justified confidence scores, and per-signal detection_confidence values.`,
        file_urls: allImageUrls,
        response_json_schema: {
          type: "object",
          properties: {
            classification: { type: "string" },
            patch_votes: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  patch_id: { type: "string" },
                  vote: { type: "string", enum: ["likely_real", "likely_ai", "uncertain"] },
                  confidence: { type: "number" },
                  reasoning: { type: "string" },
                  signals: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        signal_type: { type: "string" },
                        description: { type: "string" },
                        severity: { type: "string", enum: ["low", "medium", "high"] },
                        detection_confidence: { type: "number" }
                      }
                    }
                  }
                }
              }
            },
            overall_assessment: { type: "string" },
            key_findings: {
              type: "array",
              items: { type: "string" }
            },
            result: { type: "string", enum: ["likely_real", "likely_ai", "uncertain"] },
            confidence: { type: "number" },
            signals: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  signal_type: { type: "string" },
                  description: { type: "string" },
                  severity: { type: "string", enum: ["low", "medium", "high"] }
                }
              }
            },
            summary: { type: "string" }
          },
          required: ["patch_votes", "result", "confidence", "signals", "summary"]
        }
      });

      // Step 5: Enhanced ensemble scoring with provenance
      const llmScore = deriveLlmScoreFromPatchVotes(analysisResult.patch_votes);
      
      // Enhanced provenance scoring
      let provenanceScore = null;
      if (exifData) {
        // More sophisticated EXIF evaluation
        const hasCameraInfo = exifData.Make || exifData.Model;
        const hasGPS = exifData.GPSLatitude || exifData.GPSLongitude;
        const hasTimestamp = exifData.DateTime || exifData.DateTimeOriginal;
        
        let score = 25; // Base score for EXIF presence
        if (hasCameraInfo) score -= 10; // Camera info suggests real
        if (hasGPS) score -= 5;
        if (hasTimestamp) score -= 5;
        
        provenanceScore = { score: Math.max(5, score) }; // 5-25 range (lower = more real)
      }
      
      const ensemble = ensembleDecision({
        llm: llmScore,
        forensics: forensicsData,
        provenance: provenanceScore
      });

      // Override with ensemble decision
      const finalResult = {
        ...analysisResult,
        result: ensemble.result,
        confidence: ensemble.confidence,
        score: ensemble.score,
        patch_votes: analysisResult.patch_votes
      };

      // Step 6: Save to database
      const record = await base44.entities.AnalysisRecord.create({
        content_type: 'image',
        source_url: urlInput || null,
        platform: 'direct_upload',
        file_url: uploadedFile,
        thumbnail_url: uploadedFile,
        exif_summary: exifData ? JSON.stringify(exifData) : null,
        patch_urls: patchUrls.map(p => p.url),
        forensics: forensicsData,
        ensemble: ensemble,
        ...finalResult
      });

      setResult({ ...record, ...finalResult });
    } catch (error) {
      console.error('Analysis error:', error);
      toast.error('Analysis failed. Please try again.');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleStartOver = () => {
    setResult(null);
    setUploadedFile(null);
    setUploadedFileObj(null);
    setUrlInput('');
  };

  const handlePaymentSuccess = () => {
    toast.success('Payment successful! Premium features activated.');
  };

  return (
    <>
      {isMobile && showSplash && <SplashScreen onComplete={() => setShowSplash(false)} />}
      
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white pb-20 md:pb-0">
      {/* Header */}
      <header className="border-b border-slate-100 bg-white/95 backdrop-blur-sm sticky top-0 z-50 safe-top">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <button 
              onClick={handleStartOver}
              className="flex items-center gap-2 sm:gap-3 active:scale-95 transition-transform"
            >
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center">
                <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <div>
                <h1 className="text-base sm:text-lg font-bold text-slate-800 leading-tight">IsThis.io</h1>
                <p className="text-xs text-slate-500 hidden sm:block">Is This Real?</p>
              </div>
            </button>

            <div className="flex items-center gap-2">
              <div className="hidden md:block">
                <ProfileDropdown onOpenSettings={() => setShowPreferences(true)} />
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-16 pb-safe">
        <AnimatePresence mode="wait">
          {analyzing ? (
            <motion.div
              key="analyzing"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <AnalysisChecklist />
            </motion.div>
          ) : !result ? (
            <motion.div
              key="input"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              {/* Hero */}
              <div className="text-center mb-8 sm:mb-16">
                <motion.div 
                  initial={{ scale: 0.9 }}
                  animate={{ scale: 1 }}
                  className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-slate-100 text-slate-600 text-xs sm:text-sm mb-4 sm:mb-6"
                >
                  <Sparkles className="w-3 h-3 sm:w-4 sm:h-4" />
                  Free AI Detection Tool
                </motion.div>
                <h1 className="text-3xl sm:text-5xl md:text-6xl font-bold text-slate-900 mb-4 sm:mb-6 leading-tight px-4">
                  Is This Real?
                </h1>
                <p className="text-base sm:text-xl text-slate-600 max-w-2xl mx-auto mb-6 sm:mb-8 px-4">
                  Upload any image or video to instantly verify if it's real or AI-generated.
                </p>
              </div>

              {/* Upload Section */}
              <div className="max-w-2xl mx-auto mb-8 sm:mb-16">
                <div className="bg-white rounded-xl sm:rounded-2xl border-2 border-slate-200 p-4 sm:p-8 shadow-sm">
                  <div className="mb-4 sm:mb-6">
                    <input
                      type="file"
                      id="file-upload"
                      accept="image/*,video/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <label 
                      htmlFor="file-upload"
                      className="block border-2 border-dashed border-slate-300 rounded-xl p-8 sm:p-12 text-center cursor-pointer active:scale-[0.98] hover:border-slate-400 transition-all bg-slate-50"
                    >
                      <Upload className="w-10 h-10 sm:w-12 sm:h-12 text-slate-400 mx-auto mb-3 sm:mb-4" />
                      <p className="text-sm sm:text-base text-slate-700 font-medium mb-1 sm:mb-2">
                        {uploadedFile ? '✓ Image uploaded!' : 'Tap to upload an image or video'}
                      </p>
                      <p className="text-xs sm:text-sm text-slate-500">or drag and drop here</p>
                    </label>
                  </div>

                  <div className="relative mb-4 sm:mb-6">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-slate-200"></div>
                    </div>
                    <div className="relative flex justify-center text-xs sm:text-sm">
                      <span className="bg-white px-3 text-slate-500">or paste a URL</span>
                    </div>
                  </div>

                  <div className="relative mb-4 sm:mb-6">
                    <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="https://example.com/image.jpg"
                      value={urlInput}
                      onChange={(e) => setUrlInput(e.target.value)}
                      className="w-full pl-10 sm:pl-11 pr-4 py-3 sm:py-3.5 border-2 border-slate-200 rounded-xl focus:border-slate-900 focus:outline-none transition-colors text-sm sm:text-base"
                    />
                  </div>

                  <button
                    onClick={handleAnalyze}
                    disabled={analyzing || (!uploadedFile && !urlInput)}
                    className="w-full py-4 sm:py-4 bg-slate-900 hover:bg-slate-800 active:scale-[0.98] text-white font-semibold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-base sm:text-lg touch-manipulation"
                  >
                    {analyzing ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <Zap className="w-5 h-5" />
                        Verify Now - Free
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* How It Works */}
              <div className="max-w-4xl mx-auto mb-8 sm:mb-16">
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 text-center mb-6 sm:mb-8">How It Works</h2>
                <div className="grid grid-cols-3 sm:grid-cols-3 gap-4 sm:gap-6">
                  {[
                    { icon: Upload, title: 'Upload', desc: 'Upload an image, video, or paste a URL from anywhere' },
                    { icon: Zap, title: 'Analyze', desc: 'Our AI analyzes visual artifacts, patterns, and inconsistencies' },
                    { icon: CheckCircle2, title: 'Get Results', desc: 'Receive a clear verdict with confidence score and detailed explanation' }
                  ].map((step, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="text-center p-3 sm:p-6"
                    >
                      <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-slate-900 flex items-center justify-center mx-auto mb-2 sm:mb-4">
                        <step.icon className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                      </div>
                      <h3 className="font-semibold text-slate-900 mb-1 sm:mb-2 text-sm sm:text-base">{step.title}</h3>
                      <p className="text-xs sm:text-sm text-slate-600 hidden sm:block">{step.desc}</p>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Social Proof */}
              <div className="text-center mb-12 sm:mb-16">
                <div className="inline-flex items-center gap-4 sm:gap-6 text-xs sm:text-sm text-slate-600">
                  <div>
                    <div className="text-xl sm:text-2xl font-bold text-slate-900">95%+</div>
                    <div>Accuracy</div>
                  </div>
                  <div className="h-6 sm:h-8 w-px bg-slate-300"></div>
                  <div>
                    <div className="text-xl sm:text-2xl font-bold text-slate-900">10K+</div>
                    <div>Verifications</div>
                  </div>
                  <div className="h-6 sm:h-8 w-px bg-slate-300"></div>
                  <div>
                    <div className="text-xl sm:text-2xl font-bold text-slate-900">Free</div>
                    <div>Forever</div>
                  </div>
                </div>
              </div>

              {/* Pricing */}
              <section className="py-8 sm:py-16 border-t border-slate-200">
                <div className="text-center mb-8 sm:mb-12 px-4">
                  <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-3 sm:mb-4">Upgrade for More Power</h2>
                  <p className="text-base sm:text-lg text-slate-600">Get unlimited verifications and advanced features</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 max-w-4xl mx-auto">
                  {/* Free */}
                  <div className="bg-white rounded-xl sm:rounded-2xl border-2 border-slate-200 p-5 sm:p-6">
                    <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-2">Free</h3>
                    <div className="text-2xl sm:text-3xl font-bold text-slate-900 mb-4">$0</div>
                    <ul className="space-y-2 sm:space-y-3 mb-6">
                      <li className="flex items-start gap-2 text-xs sm:text-sm text-slate-600">
                        <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                        <span>5 verifications per day</span>
                      </li>
                      <li className="flex items-start gap-2 text-xs sm:text-sm text-slate-600">
                        <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                        <span>Basic AI detection</span>
                      </li>
                      <li className="flex items-start gap-2 text-xs sm:text-sm text-slate-600">
                        <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                        <span>Image & video support</span>
                      </li>
                    </ul>
                    <button className="w-full py-2.5 sm:py-3 border border-slate-300 rounded-xl text-slate-700 font-medium text-sm sm:text-base touch-manipulation">
                      Current Plan
                    </button>
                  </div>

                  {/* Annual */}
                  <div className="bg-white rounded-xl sm:rounded-2xl border-2 border-slate-200 p-5 sm:p-6">
                    <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-2">Premium</h3>
                    <div className="text-2xl sm:text-3xl font-bold text-slate-900 mb-1">$29</div>
                    <div className="text-xs sm:text-sm text-slate-500 mb-4">per year</div>
                    <ul className="space-y-2 sm:space-y-3 mb-6">
                      <li className="flex items-start gap-2 text-xs sm:text-sm text-slate-600">
                        <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                        <span>Unlimited verifications</span>
                      </li>
                      <li className="flex items-start gap-2 text-xs sm:text-sm text-slate-600">
                        <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                        <span>Priority analysis speed</span>
                      </li>
                      <li className="flex items-start gap-2 text-xs sm:text-sm text-slate-600">
                        <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                        <span>Advanced detection</span>
                      </li>
                      <li className="flex items-start gap-2 text-xs sm:text-sm text-slate-600">
                        <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                        <span>Export reports</span>
                      </li>
                    </ul>
                    <StripeCheckout
                      plan={{ name: '1 Year Premium', price: 29, buttonText: 'Get Premium' }}
                      onSuccess={handlePaymentSuccess}
                    />
                  </div>

                  {/* Lifetime */}
                  <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl sm:rounded-2xl border-2 border-slate-900 p-5 sm:p-6 text-white relative">
                    <div className="absolute -top-2.5 sm:-top-3 left-1/2 -translate-x-1/2 px-2.5 sm:px-3 py-1 bg-emerald-500 rounded-full text-xs font-bold text-white">
                      BEST VALUE
                    </div>
                    <h3 className="text-lg sm:text-xl font-bold mb-2">Lifetime</h3>
                    <div className="text-2xl sm:text-3xl font-bold mb-1">$99</div>
                    <div className="text-xs sm:text-sm text-slate-400 mb-4">one-time payment</div>
                    <ul className="space-y-2 sm:space-y-3 mb-6">
                      <li className="flex items-start gap-2 text-xs sm:text-sm">
                        <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                        <span>Everything in Premium</span>
                      </li>
                      <li className="flex items-start gap-2 text-xs sm:text-sm">
                        <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                        <span>Lifetime access forever</span>
                      </li>
                      <li className="flex items-start gap-2 text-xs sm:text-sm">
                        <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                        <span>Early feature access</span>
                      </li>
                      <li className="flex items-start gap-2 text-xs sm:text-sm">
                        <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                        <span>Premium support</span>
                      </li>
                    </ul>
                    <StripeCheckout
                      plan={{ name: 'Lifetime Premium', price: 99, buttonText: 'Get Lifetime Access' }}
                      onSuccess={handlePaymentSuccess}
                    />
                  </div>
                </div>
              </section>
            </motion.div>
          ) : (
            <motion.div
              key="result"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <ResultCard 
                result={result}
                onStartOver={handleStartOver}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

        {/* Preferences Modal */}
        <PreferencesModal
          isOpen={showPreferences}
          onClose={() => setShowPreferences(false)}
          onSave={(prefs) => {
            toast.success('Preferences saved');
            setShowPreferences(false);
          }}
        />

        {/* Mobile Bottom Nav */}
        <BottomNav currentPage="home" />
      </div>
    </>
  );
}