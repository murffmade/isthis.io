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
import { sendNotification } from '@/components/notifications/PushNotifications';
import AppIcon from '@/components/shared/AppIcon';
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
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

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
      setUploading(true);
      setUploadProgress(0);
      setUploadedFileObj(file);
      
      // Simulate progress for better UX (actual upload happens quickly)
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 150);
      
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      setTimeout(() => {
        setUploadedFile(file_url);
        setUploading(false);
        toast.success('File uploaded! Click "Verify Now" to analyze.');
      }, 300);
    } catch (error) {
      setUploading(false);
      setUploadProgress(0);
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
            const { frames, metadata } = await extractFramesFromVideo(uploadedFileObj, 8);

            // Upload frames
            const frameUrls = await Promise.all(
              frames.map(async (frame) => {
                const { file_url } = await base44.integrations.Core.UploadFile({ file: frame.file });
                return { url: file_url, timestamp: frame.timestamp };
              })
            );

            // State-of-the-art multi-model ensemble analysis for video
            const frameAnalysis = await base44.integrations.Core.InvokeLLM({
              prompt: `You are an ADVANCED MULTI-MODEL ENSEMBLE VIDEO DEEPFAKE & AI DETECTION SYSTEM combining state-of-the-art detection techniques.

            ENSEMBLE APPROACH:
            You simulate multiple detection models working together:
            1. Temporal Coherence Model - Analyzes frame-to-frame consistency
            2. Facial Manipulation Detector - Specializes in deepfake facial artifacts
            3. GAN Artifact Detector - Identifies generative AI patterns
            4. Physics-Based Validator - Checks for violations of physical laws
            5. Compression Analysis Model - Examines encoding patterns

            Each model votes with confidence, and you synthesize their collective intelligence.

            VIDEO METADATA:
            - Total Frames Provided: ${frames.length}
            - Video Duration: ${metadata.duration.toFixed(1)}s
            - Resolution: ${metadata.width}x${metadata.height} (${metadata.aspectRatio} aspect ratio)
            - File Size: ${metadata.fileSizeMB}MB
            - Format: ${metadata.mimeType}
            - Estimated Bitrate: ${metadata.estimatedBitrate} kbps
            - Audio Track: ${metadata.hasAudio ? 'Present' : 'None detected'}
            - Frame Timestamps: ${frameUrls.map((f, i) => `Frame ${i+1} at ${f.timestamp.toFixed(2)}s`).join(', ')}

            METADATA ANALYSIS FOR MANIPULATION DETECTION:
            - AI-generated videos often have unusual bitrates (too perfect or inconsistent)
            - Deepfakes may lack proper audio synchronization or audio tracks
            - Check if resolution/bitrate ratios are typical for the claimed source
            - Look for signs of re-encoding or compression artifacts that suggest editing
            - Unusual file sizes for the duration/quality may indicate synthetic generation

        ANALYSIS FRAMEWORK:

        1. FRAME-BY-FRAME COMPARISON:
        - Compare consecutive frames for consistency
        - Detect morphing artifacts (faces/objects changing shape between frames)
        - Identify unnatural transitions or jumps
        - Look for flickering in lighting, textures, or facial features
        - Check for temporal coherence in motion and physics

        2. DEEPFAKE-SPECIFIC DETECTION (High Priority):

        A) Face Swap & Synthesis Detection:
        - Identity Inconsistencies: Face identity changes subtly between frames
        - Blend Line Detection: Visible seams where face meets head/neck
        - Facial Hair Anomalies: Beard/mustache that doesn't match lighting or perspective
        - Ear Morphology: Ears that don't match face age/ethnicity
        - Face-to-Body Proportion: Head size inconsistent with body

        B) Expression & Movement Analysis:
        - Micro-Expression Timing: Emotions that lag behind context (delayed smile)
        - Blink Analysis: Frequency, duration, and bilateral symmetry of blinks
        - Eye Gaze Coherence: Eyes looking at wrong focus point for scene
        - Lip-Sync Precision: Mouth shapes that don't match phonemes
        - Facial Action Units: Muscle movements that violate FACS (Facial Action Coding System)

        C) Boundary & Integration Detection:
        - Face Edge Artifacts: Unnatural softness or sharpness at face boundaries
        - Color Space Mismatches: Face and neck in different color spaces
        - Occlusion Handling: Hair/glasses that don't properly occlude face
        - Perspective Violations: Face angle doesn't match head angle

        D) Physiological Signals:
        - Pulse Detection: Real faces show subtle color changes from pulse (photoplethysmography)
        - Respiration Markers: Chest movement inconsistent with speech
        - Sweat/Shine Patterns: Skin reflectance that's too uniform
        - Vascular Visibility: Lack of natural blood vessel patterns

        E) Generative AI Signatures:
        - GAN Fingerprints: Checkerboard artifacts, spectral anomalies
        - Diffusion Model Tells: Over-smoothed regions, boundary halos
        - Neural Rendering Patterns: Inconsistent level of detail across face regions

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

        ADVANCED ANALYSIS INSTRUCTIONS:
        - Apply ALL 5 ensemble models to EACH frame
        - For consecutive frames, use temporal coherence model to detect inconsistencies
        - Assign detection confidence (0-100) per signal based on model agreement
        - Classify using weighted voting: "likely_real", "likely_deepfake", "likely_ai", or "uncertain"
        - Calculate separate scores: AI Generation % and Deepfake Likelihood %
        - Provide detailed explanation of WHY each signal was detected, not just WHAT

        EXPLANATION DEPTH REQUIREMENTS:
        For each detected signal, explain:
        1. What specific visual/temporal evidence was found
        2. Why this evidence indicates manipulation (mechanism explanation)
        3. Which detection model(s) flagged it
        4. Confidence level and reasoning
        5. How this compares to authentic content patterns

        Return comprehensive multi-model ensemble analysis with detailed explanatory reasoning.`,
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
                  metadata_analysis: {
                    type: "object",
                    properties: {
                      manipulation_indicators: {
                        type: "array",
                        items: { type: "string" }
                      },
                      technical_assessment: { type: "string" },
                      bitrate_analysis: { type: "string" },
                      audio_sync_assessment: { type: "string" }
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
                video_duration: metadata.duration,
                frames_analyzed: frames.length,
                ai_influence_percentage: frameAnalysis.ai_influence_percentage,
                deepfake_analysis: frameAnalysis.deepfake_analysis,
                scene_analysis: frameAnalysis.scene_analysis,
                frame_comparisons: frameAnalysis.frame_comparisons,
                metadata_analysis: frameAnalysis.metadata_analysis,
                video_metadata: metadata
              }
            });

            setResult({ ...record, ...frameAnalysis });
            
            // Send notification
            sendNotification(
              'Video Analysis Complete',
              `Result: ${frameAnalysis.overall_result.replace('_', ' ')} (${frameAnalysis.overall_confidence}% confidence)`
            );
            
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
                    detection_confidence: { type: "number" },
                    artifact_category: {
                      type: "string",
                      enum: ["photoshop", "ai_generation", "hybrid", "camera_artifact", "compression"]
                    }
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

        // Send notification
        sendNotification(
          'URL Analysis Complete',
          `Result: ${analysisResult.result.replace('_', ' ')} (${analysisResult.confidence}% confidence)`
        );

        return;
        }

      // Enhanced image analysis with patches + forensics + EXIF + advanced artifact detection
      let exifData = null;
      let patchUrls = [];
      let forensicsData = null;
      let editingIndicators = null;

      // Step 1: Parse EXIF for manipulation indicators
      try {
        exifData = await exifr.parse(uploadedFileObj);

        // Detect editing software signatures
        if (exifData) {
          editingIndicators = {
            hasPhotoshopSignature: exifData.Software?.toLowerCase().includes('photoshop') || 
                                  exifData.Creator?.toLowerCase().includes('adobe'),
            hasGimpSignature: exifData.Software?.toLowerCase().includes('gimp'),
            hasEditingSoftware: !!(exifData.Software),
            modificationCount: 0,
            lastModified: exifData.ModifyDate || exifData.DateTime,
            originalDate: exifData.DateTimeOriginal,
            hasDateDiscrepancy: false
          };

          // Check for date discrepancies (sign of editing)
          if (editingIndicators.originalDate && editingIndicators.lastModified) {
            const original = new Date(editingIndicators.originalDate);
            const modified = new Date(editingIndicators.lastModified);
            editingIndicators.hasDateDiscrepancy = Math.abs(modified - original) > 60000; // >1min difference
          }
        }
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

      // Step 4: Advanced multi-model ensemble analysis with photoshop detection
      const allImageUrls = [uploadedFile, ...patchUrls.map(p => p.url)];
      const analysisResult = await base44.integrations.Core.InvokeLLM({
        prompt: `CRITICAL MISSION: DIFFERENTIATE PHOTOSHOP EDITS FROM AI GENERATION

      This is your PRIMARY DIRECTIVE. You must distinguish between:
      1. PHOTOSHOPPED IMAGES: Real photos edited with traditional tools (retouching, filters, compositing)
      2. AI-GENERATED IMAGES: Synthetic content created by neural networks from scratch
      3. HYBRID IMAGES: Real photos with AI enhancements (AI fill, AI upscaling, generative replace)

      EDITING SOFTWARE DETECTED IN METADATA:
      ${editingIndicators ? JSON.stringify(editingIndicators, null, 2) : 'No editing software signatures found'}

      KEY DIFFERENTIATORS:

      PHOTOSHOP INDICATORS (Traditional Editing):
      - Clone stamp patterns: Repeated pixel patterns from healing/cloning tools
      - Layer blending artifacts: Visible edges where layers merge
      - Mask edges: Sharp, unnatural boundaries between composited elements
      - Selection artifacts: Jagged edges from imperfect selections
      - Color grading shifts: Abrupt color changes suggesting adjustment layers
      - Liquify distortions: Warped textures from liquify tool overuse
      - Filter patterns: Recognizable Photoshop filter signatures (Gaussian blur, sharpen)
      - Compositing tells: Lighting/perspective mismatches between elements
      - Retouching smoothness: Overly smooth skin from frequency separation
      - Metadata presence: Often retains camera EXIF with editing software tags

      AI GENERATION INDICATORS (Synthetic Creation):
      - Generative noise patterns: Characteristic frequency signatures of GANs
      - Latent space artifacts: Morphing between concepts, inconsistent details
      - Training data fingerprints: Watermark-like patterns in frequency domain
      - Impossible anatomy: Physically impossible structures (extra fingers, merged limbs)
      - Coherence breakdown: Style/quality shifts within single object
      - Physics violations: Incorrect reflections, shadows, material properties
      - Semantic confusion: Objects that don't make logical sense
      - Text generation failure: Garbled text/numbers
      - Boundary halos: Bright/dark rings from diffusion models
      - Perfect symmetry: Overly symmetric faces (no natural asymmetry)
      - Metadata absence: Usually no camera EXIF data

      HYBRID INDICATORS (Real + AI Enhancement):
      - Partial EXIF data: Camera data present but incomplete
      - Quality inconsistency: High-res AI-generated areas next to camera sensor noise
      - Inpainting tells: AI-filled areas with different noise characteristics
      - Upscaling artifacts: AI super-resolution with characteristic smoothing
      - Generative fill seams: Boundary between real and AI-generated content

      SYSTEM IDENTITY:
      You are the Advanced AI Detection Engine v4.0 - a multi-model ensemble system combining state-of-the-art detection techniques.

      ENSEMBLE ARCHITECTURE:
      You simulate 6 specialized detection models working in parallel:
      1. GAN Fingerprint Detector - Identifies generative adversarial network artifacts
      2. Diffusion Model Analyzer - Detects stable diffusion and DALL-E patterns  
      3. Neural Rendering Detector - Finds NeRF and 3D reconstruction artifacts
      4. Deepfake Face Detector - Specializes in face swap and synthesis
      5. Provenance Validator - Analyzes metadata and compression history
      6. Physics Validator - Checks lighting, shadows, and material properties

      Each model provides independent assessment with confidence score.
      Final verdict uses weighted majority voting with uncertainty quantification.

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
Your PRIMARY OBJECTIVE is ACCURATE classification through ensemble voting with DETAILED explanations.

ENSEMBLE METHODOLOGY:
1. Each of the 6 models analyzes the content independently
2. Models vote with confidence scores (0-100)
3. Signals are weighted by model agreement and historical accuracy
4. Final classification requires 60%+ weighted consensus
5. Uncertainty only when models strongly disagree or evidence is contradictory

EXPLANATION REQUIREMENTS:
For EVERY signal you detect, provide:
- Specific visual evidence (not generic descriptions)
- Technical explanation of WHY this indicates AI/manipulation
- Which detection model(s) flagged it and why
- Comparison to how authentic content would appear
- Confidence score with reasoning

Example: Don't say "unnatural smoothing detected" 
Say: "Skin shows uniform Gaussian blur (σ≈8px) across pore-scale details. GAN Fingerprint Detector (conf: 87%) and Neural Rendering Detector (conf: 82%) both flag this because real skin has non-uniform micro-texture from pores, fine lines, and subsurface scattering. Authentic photos show detail variation even in professional retouching."

ADVANCED DETECTION FRAMEWORK:

STEP 0: DETERMINE IMAGE ORIGIN (MOST CRITICAL)
   For EACH patch, classify as one of:
   - "camera_native": Taken directly by camera, minimal/no editing (confidence: 0-100)
   - "traditionally_edited": Real photo edited with Photoshop/GIMP (confidence: 0-100)
   - "ai_generated": Fully synthetic from AI model (confidence: 0-100)
   - "hybrid": Real photo with AI enhancements (confidence: 0-100)

   Provide reasoning for each classification based on specific artifacts observed.

STEP 1. IMAGE TYPE CLASSIFICATION (crucial context):
   - Personal/Phone Photo: Look for natural wear, realistic interactions, authentic moments
   - Professional/Editorial: Assess lighting physics, material realism, compositional authenticity
   - Product/Commercial: Check for physical consistency, material properties, realistic shadows
   - Wildlife/Nature: Evaluate animal anatomy, natural behavior, environmental coherence
   - Portrait/Studio: Analyze skin texture, hair detail, clothing physics, eye authenticity

STEP 2. PHOTOSHOP-SPECIFIC DETECTION:
   A) Clone Stamp & Healing Brush Detection:
   - Look for repeated pixel patterns that indicate cloning
   - Identical texture patches in different locations
   - Unnatural repetition in "random" areas (clouds, grass, skin texture)

   B) Layer Compositing Analysis:
   - Lighting direction consistency across elements
   - Shadow coherence (do all shadows point same direction?)
   - Perspective alignment (do all elements share vanishing points?)
   - Color temperature consistency (warm/cool lighting matches?)
   - Edge quality (are boundaries too sharp or have visible halos?)

   C) Selection & Mask Artifacts:
   - Jagged or pixelated edges on subjects
   - Unnatural hardness of boundaries
   - Background elements that appear "cut out"
   - Fringing or chromatic aberration only on edges

   D) Retouching Detection:
   - Overly smooth skin with unnatural texture loss
   - Frequency separation artifacts (separate detail/color layers)
   - Patch tool repetitions
   - Symmetrical blur patterns

   E) Filter Identification:
   - Recognizable Photoshop filter patterns
   - Consistent blur radius across unrelated areas
   - Artificial sharpening halos
   - Noise reduction that's too uniform

STEP 3. PRIMARY AUTHENTICITY MARKERS (for CAMERA-NATIVE images):
   - EXIF metadata presence and consistency (usually 90-95% confidence if present)
   - Natural image compression artifacts (JPEG blocking, sensor noise) (80-90% confidence)
   - Realistic lens distortion and chromatic aberration (85-92% confidence)
   - Authentic motion blur or focus patterns (80-88% confidence)
   - Physical wear on objects (scuffs, wrinkles, asymmetry) (85-93% confidence)
   - Genuine human microexpressions and imperfect symmetry (88-95% confidence)
   - Environmental consistency (light source, shadows, reflections) (75-90% confidence)
   - Material entropy (fabric texture, surface irregularities) (82-91% confidence)
   - Natural color grading and tone mapping (70-85% confidence)

STEP 4. ADVANCED AI GENERATION INDICATORS (vs Traditional Editing):

   A) GAN Artifacts (Fingerprint Detector):
   - Checkerboard patterns in frequency domain (90-98% confidence)
   - Spectral anomalies at specific frequencies (85-93% confidence)
   - Mode collapse indicators (repeated facial features) (88-95% confidence)
   - Training data memorization (exact replication of known images) (95-99% confidence)

   B) Diffusion Model Signatures (Diffusion Analyzer):
   - Boundary halos (bright/dark rings around objects) (87-94% confidence)
   - Over-smoothed micro-details with sharp macro-details (82-91% confidence)
   - Latent space interpolation artifacts (morphing between concepts) (78-88% confidence)
   - Prompt bleeding (mixed unrelated elements) (85-92% confidence)

   C) Neural Rendering Tells (Neural Rendering Detector):
   - View-dependent effects that violate perspective (80-90% confidence)
   - Inconsistent level-of-detail across object (83-91% confidence)
   - Volumetric rendering artifacts (75-85% confidence)
   - Normal map inconsistencies (texture vs. geometry mismatch) (79-87% confidence)

   D) Deepfake Face Indicators (Deepfake Detector):
   - Face-boundary color space mismatch (88-96% confidence)
   - Identity leakage (source face features bleeding through) (82-93% confidence)
   - Temporal identity drift in videos (85-94% confidence)
   - Expression-identity coupling violations (mouth moves, eyes don't match) (80-89% confidence)

   E) Physical Impossibilities (Physics Validator):
   - Lighting direction inconsistent with shadows (85-93% confidence)
   - Impossible reflections in eyes/glasses (82-91% confidence)
   - Gravity-defying hair/clothing (78-88% confidence)
   - Material properties violations (matte surface with specular highlight) (80-87% confidence)

STEP 5. HYBRID CONTENT DETECTION:
   - Identify areas that appear camera-native vs AI-generated
   - Look for seams between real and synthetic content
   - Detect AI inpainting (filling in areas with generated content)
   - Check for AI upscaling (neural network super-resolution)
   - Analyze noise patterns: camera sensor noise vs AI noise

STEP 6. MULTI-REGION PATCH ANALYSIS:
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

STEP 7. METADATA FORENSICS:
   EXIF Data: ${exifData ? JSON.stringify(exifData, null, 2) : 'None (WARNING: absence suggests screenshot/AI, but not conclusive)'}
   Forensics Data: ${forensicsData ? JSON.stringify(forensicsData, null, 2) : 'Not available'}

DECISION GUIDELINES:
- If 60%+ patches vote the same way with high confidence → COMMIT to that classification
- If EXIF metadata present + patches show realism → STRONGLY favor "likely_real"
- If no EXIF + multiple AI artifacts → STRONGLY favor "likely_ai"
- Reserve "uncertain" for TRULY ambiguous cases (contradictory evidence, minimal visible content)
- Weight signals by their individual detection_confidence values

OUTPUT REQUIREMENTS:
1. For EACH patch: all 6 models vote independently with reasoning
2. Per-signal explanations must be technically detailed and specific
3. Include which models agreed/disagreed and why
4. Provide weighted ensemble confidence score
5. Explain final classification with model voting breakdown
6. For uncertain cases, explain the source of disagreement between models

Remember: Generic descriptions are unacceptable. Every signal needs specific technical detail and multi-model analysis.`,
        file_urls: allImageUrls,
        response_json_schema: {
          type: "object",
          properties: {
            classification: { 
              type: "string",
              enum: ["camera_native", "traditionally_edited", "ai_generated", "hybrid"]
            },
            content_origin_confidence: {
              type: "object",
              properties: {
                camera_native: { type: "number" },
                traditionally_edited: { type: "number" },
                ai_generated: { type: "number" },
                hybrid: { type: "number" }
              }
            },
            origin_reasoning: { type: "string" },
            photoshop_artifacts: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  artifact_type: { type: "string" },
                  location: { type: "string" },
                  description: { type: "string" },
                  confidence: { type: "number" }
                }
              }
            },
            patch_votes: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  patch_id: { type: "string" },
                  origin_classification: { 
                    type: "string",
                    enum: ["camera_native", "traditionally_edited", "ai_generated", "hybrid"]
                  },
                  vote: { type: "string", enum: ["likely_real", "likely_ai", "uncertain"] },
                  confidence: { type: "number" },
                  reasoning: { type: "string" },
                  detected_editing_type: { type: "string" },
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

      // Step 5: Enhanced ensemble scoring with provenance and editing detection
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
        provenance: provenanceScore,
        editingIndicators: editingIndicators
      });

      // Override with ensemble decision and include all advanced analysis
      const finalResult = {
        ...analysisResult,
        result: ensemble.result,
        confidence: ensemble.confidence,
        score: ensemble.score,
        patch_votes: analysisResult.patch_votes,
        content_origin_confidence: analysisResult.content_origin_confidence,
        origin_reasoning: analysisResult.origin_reasoning,
        photoshop_artifacts: analysisResult.photoshop_artifacts || [],
        editing_indicators: editingIndicators
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

      // Send notification
      sendNotification(
        'Image Analysis Complete',
        `Result: ${finalResult.result.replace('_', ' ')} (${finalResult.confidence}% confidence)`
      );
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
              <AppIcon size="md" />
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
                      disabled={uploading}
                    />
                    <label 
                      htmlFor="file-upload"
                      className={`block border-2 border-dashed border-slate-300 rounded-xl p-8 sm:p-12 text-center transition-all bg-slate-50 ${
                        uploading ? 'cursor-wait opacity-75' : 'cursor-pointer active:scale-[0.98] hover:border-slate-400'
                      }`}
                    >
                      {uploading ? (
                        <>
                          <div className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3 sm:mb-4 relative">
                            <div className="absolute inset-0 border-4 border-slate-200 rounded-full"></div>
                            <div 
                              className="absolute inset-0 border-4 border-slate-900 rounded-full border-t-transparent animate-spin"
                            ></div>
                          </div>
                          <p className="text-sm sm:text-base text-slate-700 font-medium mb-1 sm:mb-2">
                            Uploading... {uploadProgress}%
                          </p>
                          <div className="max-w-xs mx-auto mt-3">
                            <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${uploadProgress}%` }}
                                transition={{ duration: 0.3 }}
                                className="h-full bg-slate-900 rounded-full"
                              />
                            </div>
                          </div>
                        </>
                      ) : (
                        <>
                          <Upload className="w-10 h-10 sm:w-12 sm:h-12 text-slate-400 mx-auto mb-3 sm:mb-4" />
                          <p className="text-sm sm:text-base text-slate-700 font-medium mb-1 sm:mb-2">
                            {uploadedFile ? '✓ File uploaded!' : 'Tap to upload an image or video'}
                          </p>
                          <p className="text-xs sm:text-sm text-slate-500">or drag and drop here</p>
                        </>
                      )}
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