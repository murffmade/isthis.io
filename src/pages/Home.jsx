import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Sparkles, Upload, Link as LinkIcon, CheckCircle2, AlertTriangle, HelpCircle, ArrowRight, Zap, LogIn } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
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
import { moderateImage, moderateVideo } from '@/components/utils/contentModeration';
import OnboardingTour from '@/components/onboarding/OnboardingTour';
import HelpButton from '@/components/onboarding/HelpButton';
import SEO from '@/components/shared/SEO';

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
  const [classifying, setClassifying] = useState(false);
  const [imageClassification, setImageClassification] = useState(null);
  const [userConfirmedType, setUserConfirmedType] = useState(false);

  // Fetch current user
  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me().catch(() => null)
  });

  const isAdmin = currentUser?.role === 'admin';
  const isTrainer = currentUser?.role === 'trainer';

  // Fetch user's subscription
  const { data: userSubscription } = useQuery({
    queryKey: ['userSubscription'],
    queryFn: async () => {
      if (!currentUser) return null;
      const subs = await base44.entities.Subscription.filter({ created_by: currentUser.email });
      return subs[0] || null;
    },
    enabled: !!currentUser
  });

  // Fetch usage count for current month
  const { data: usageCount = 0 } = useQuery({
    queryKey: ['usageCount'],
    queryFn: async () => {
      if (!currentUser) return 0;
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);
      
      const analyses = await base44.entities.AnalysisRecord.filter({
        created_by: currentUser.email
      });
      
      const thisMonth = analyses.filter(a => new Date(a.created_date) >= startOfMonth);
      return thisMonth.length;
    },
    enabled: !!currentUser
  });

  // Determine user tier and limits
  const getUserTier = () => {
    if (!userSubscription || userSubscription.plan === 'free') {
      return { name: 'Free', limit: 5, period: 'month' };
    }
    if (userSubscription.plan === 'annual' && userSubscription.status === 'active') {
      return { name: 'Premium', limit: null, period: 'year' };
    }
    if (userSubscription.plan === 'lifetime' && userSubscription.status === 'active') {
      return { name: 'Lifetime', limit: null, period: null };
    }
    return { name: 'Free', limit: 5, period: 'month' };
  };

  const tier = getUserTier();

  // Fetch lifetime offer settings
  const { data: lifetimeSettings } = useQuery({
    queryKey: ['lifetimeSettings'],
    queryFn: async () => {
      const settings = await base44.entities.AppSettings.list();
      if (settings.length > 0) {
        return {
          enabled: settings[0].lifetime_offer_enabled ?? true,
          sold_count: settings[0].lifetime_sold_count ?? 0,
          max_count: settings[0].lifetime_max_count ?? 500,
          expiry_date: settings[0].lifetime_expiry_date ?? '2026-01-03',
          show_countdown: settings[0].lifetime_show_countdown ?? true
        };
      }
      return {
        enabled: true,
        sold_count: 0,
        max_count: 500,
        expiry_date: '2026-01-03',
        show_countdown: true
      };
    }
  });

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

      // Run content moderation in background
      if (file.type.startsWith('image/')) {
        moderateImage(file_url).catch(console.error);
      } else if (file.type.startsWith('video/')) {
        moderateVideo(file_url).catch(console.error);
      }

      setTimeout(async () => {
        setUploadedFile(file_url);
        setUploading(false);

        // Pre-classify image type - ALWAYS analyze visually
        if (file.type.startsWith('image/')) {
          setClassifying(true);
          try {
            // Check for EXIF data
            let hasExif = false;
            try {
              const exifrModule = await import('exifr');
              const exifData = await exifrModule.default.parse(file);
              hasExif = !!(exifData && Object.keys(exifData).length > 0);
            } catch (err) {
              console.warn('EXIF check failed:', err);
            }

            // ALWAYS do visual analysis regardless of EXIF
            const classification = await base44.integrations.Core.InvokeLLM({
              prompt: `Analyze this image and determine if it is:
        1. PHOTO: A photograph taken with a camera of a real-world scene (not a screen)
        2. SCREENSHOT: A screen capture showing UI elements, apps, websites, or digital content
        3. DIGITAL_ART: Computer-generated art, 3D renders, vector graphics, or digitally created artwork
        4. ILLUSTRATION: Hand-drawn art, paintings, sketches (traditional or digital drawing/painting)

        CRITICAL ANALYSIS REQUIREMENTS:
        - EXIF Status: ${hasExif ? 'PRESENT (suggests camera, but verify visually)' : 'MISSING (rules out direct camera capture)'}
        - SCREENSHOT indicators: UI elements, buttons, menus, status bars, browser chrome, app interfaces, text on digital backgrounds, pixel-perfect alignment, system fonts, window borders
        - PHOTO indicators: Real-world scenes captured by camera, natural lighting, organic textures, camera perspective, physical objects/environments
        - DIGITAL_ART indicators: 3D renders, vector graphics, computer-generated imagery, perfect gradients, no brush strokes
        - ILLUSTRATION indicators: Artistic hand-drawn style, visible brush strokes, painting techniques, sketch lines, traditional art aesthetics

        IMPORTANT: Even if EXIF is present, if the image shows a screen with UI elements, it's a SCREENSHOT, not a PHOTO.

        Respond with "photo", "screenshot", "digital_art", or "illustration".`,
              file_urls: [file_url],
              response_json_schema: {
                type: "object",
                properties: {
                  type: { type: "string", enum: ["photo", "screenshot", "digital_art", "illustration"] },
                  confidence: { type: "number" },
                  reasoning: { type: "string" }
                }
              }
            });

            setImageClassification(classification);
            setUserConfirmedType(false);
          } catch (error) {
            console.error('Classification failed:', error);
            setImageClassification({ type: 'photo', confidence: 50, reasoning: 'Could not classify' });
          }
          setClassifying(false);
        } else {
          toast.success('File uploaded! Click "Verify Now" to analyze.');
        }
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

      // Check usage limits for free tier
      if (tier.limit && usageCount >= tier.limit) {
        toast.error(`You've reached your ${tier.limit} verifications for this ${tier.period}. Upgrade to continue.`);
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

      // Step 4: Use pre-classification or re-classify
      const classificationResult = imageClassification || await base44.integrations.Core.InvokeLLM({
        prompt: `You are an image classifier. Determine if this image is:
      1. PHOTO: A photograph taken with a camera of a real-world scene
      2. SCREENSHOT: A screen capture showing UI elements, apps, or digital content
      3. DIGITAL_ART: Computer-generated art, 3D renders, vector graphics
      4. ILLUSTRATION: Hand-drawn art, paintings, sketches

      Consider:
      - EXIF metadata: ${exifData ? 'EXIF present (suggests camera, verify visually)' : 'NO EXIF'}
      - SCREENSHOT indicators: UI elements, menus, status bars, browser chrome
      - Visual style: photorealistic vs digital UI vs CG vs hand-drawn

      Return "photo", "screenshot", "digital_art", or "illustration"`,
        file_urls: [uploadedFile],
        response_json_schema: {
          type: "object",
          properties: {
            image_type: { type: "string", enum: ["photo", "screenshot", "digital_art", "illustration"] },
            confidence: { type: "number" },
            reasoning: { type: "string" }
          },
          required: ["image_type", "confidence", "reasoning"]
        }
      });

      const isPhoto = classificationResult.type === "photo" || classificationResult.image_type === "photo";

      // Step 5: Apply specialized analysis model based on image type
      const allImageUrls = [uploadedFile, ...patchUrls.map(p => p.url)];

      const screenshotAnalysisPrompt = `SPECIALIZED SCREENSHOT ANALYSIS - DIGITAL CONTENT DETECTION

      You are analyzing a SCREENSHOT (screen capture of digital content). Your focus is detecting:
      1. AI-generated UI mockups or digital content
      2. Screenshots of AI-generated images/art displayed on screen
      3. Fake/manipulated screenshots (edited chat messages, fake tweets, etc.)
      4. Authentic screenshots of real apps/websites

      CRITICAL: SCREENSHOT METADATA EVALUATION

      EXIF STATUS: ${exifData ? 'PRESENT (UNUSUAL for screenshots)' : 'MISSING (EXPECTED for screenshots)'}
      ${exifData ? `⚠️ EXIF DATA FOUND - This is suspicious for a screenshot. Real screenshots don't have camera EXIF.` : `✓ NO EXIF DATA - Normal for screenshots.`}

      SCREENSHOT-SPECIFIC DETECTION:

      A) AUTHENTIC SCREENSHOT MARKERS:
      - Real UI elements: Genuine OS chrome, status bars, actual app interfaces
      - Screen artifacts: Pixel-perfect alignment, system fonts, anti-aliasing patterns
      - Authentic context: Real timestamps, believable content layout
      - Natural inconsistencies: Minor UI glitches, realistic app behavior

      B) AI-GENERATED SCREENSHOT DETECTION:
      - Fake UI elements: Made-up buttons, impossible layouts, nonsense text
      - AI artifacts visible in the displayed content
      - Perfect UI that doesn't match any real OS or app
      - Suspicious content shown in the screenshot (AI-generated images within the screenshot)

      C) MANIPULATED SCREENSHOT DETECTION:
      - Edited text: Photoshopped messages, fake tweets
      - Composited elements: Pasted content that doesn't match lighting/perspective
      - Clone patterns: Repeated UI elements
      - Inconsistent rendering: Mixed quality levels

      IMPORTANT: Screenshots of AI-generated content should be flagged if the CONTENT shown is AI-generated, even if the screenshot itself is real.

      Analyze all patches and provide detailed assessment of both the screenshot authenticity AND the content shown within it.`;

      const photoAnalysisPrompt = `SPECIALIZED PHOTO ANALYSIS - CAMERA-NATIVE DETECTION

      You are analyzing a PHOTOGRAPH (camera-captured image). Your focus is detecting:
      1. AI-generated photorealistic images (GANs, Diffusion models in photo mode)
      2. Deepfakes and face swaps
      3. AI enhancements on real photos (inpainting, upscaling, generative fill)
      4. Traditional Photoshop editing

      CRITICAL: CAMERA METADATA EVALUATION (MANDATORY FOR PHOTOS)

      EXIF STATUS: ${exifData ? 'PRESENT' : 'MISSING - CRITICAL RED FLAG'}
      ${exifData ? `
      Camera: ${exifData.Make || 'Unknown'} ${exifData.Model || 'Unknown'}
      Lens: ${exifData.LensModel || 'Unknown'}
      Settings: ISO ${exifData.ISO || 'N/A'}, f/${exifData.FNumber || 'N/A'}, ${exifData.ExposureTime || 'N/A'}s
      Date: ${exifData.DateTime || 'Unknown'}
      GPS: ${exifData.GPSLatitude ? 'Present' : 'None'}
      Software: ${exifData.Software || 'None'}
      ` : `
      ⚠️ NO EXIF DATA DETECTED
      For authentic camera photos, this is EXTREMELY SUSPICIOUS.
      - Real cameras ALWAYS embed EXIF (even smartphones)
      - AI generators NEVER produce EXIF data
      - MISSING EXIF + Photo Style = 70-85% baseline likelihood of AI generation

      You MUST find STRONG visual evidence of camera authenticity to override this.
      Required evidence: sensor noise, lens artifacts, motion blur, real-world imperfections.
      `}

      PHOTO-SPECIFIC DETECTION:

      A) CAMERA AUTHENTICITY MARKERS (Critical for Photos):
      - Lens artifacts: chromatic aberration, vignetting, distortion
      - Sensor noise patterns (especially shadows/highlights)
      - Natural motion blur from shutter speed
      - Depth of field with real aperture bokeh
      - Real-world imperfections: dust, scratches, sensor spots
      - Compression artifacts from JPEG encoding

      B) AI PHOTO GENERATION DETECTION (High Priority):
      - GAN artifacts: Checkerboard patterns in FFT analysis, spectral anomalies
      - Diffusion tells: Boundary halos, over-smoothed micro-details, latent space artifacts
      - Synthetic textures: Skin too smooth, lacking pore variation
      - Impossible anatomy: Extra fingers, merged limbs, wrong proportions
      - Lighting violations: Shadows don't match light sources
      - Material physics errors: Incorrect reflections, wrong surface properties

      C) DEEPFAKE DETECTION:
      - Face boundary mismatches: Color/texture discontinuity at edges
      - Identity leakage: Mixed facial features
      - Unnatural blinking patterns or lack thereof
      - Lip-sync issues in video frames
      - Eye gaze inconsistencies with scene context

      D) PHOTOSHOP EDITING:
      - Clone stamp repetitions: Identical pixel patterns
      - Layer compositing: Lighting/perspective mismatches between elements
      - Selection artifacts: Jagged edges, unnatural boundaries
      - Frequency separation: Overly smooth skin

      FORENSICS: ${forensicsData ? JSON.stringify(forensicsData) : 'N/A'}

      SCORING RULES FOR PHOTOS:
      - NO EXIF = Automatically add 25-30 points to AI likelihood score
      - EXIF Present but suspicious (editing software, no camera info) = Add 10-15 points
      - EXIF Present with full camera data = Subtract 10-15 points from AI likelihood

      Your analysis MUST include an "exif_impact" field explaining how EXIF presence/absence affected the score.

      Analyze all patches and provide detailed technical assessment with mandatory EXIF evaluation.`;

      const illustrationAnalysisPrompt = `SPECIALIZED ILLUSTRATION/ART ANALYSIS - AI ART DETECTION

      You are analyzing DIGITAL ART/ILLUSTRATION. Your focus is detecting:
      1. AI-generated art (DALL-E, Midjourney, Stable Diffusion, etc.)
      2. Traditional digital art (Photoshop, Procreate, hand-drawn)
      3. Hybrid AI-assisted art

      ART-SPECIFIC DETECTION:

      A) AI ART GENERATION SIGNATURES:

      DALL-E 3 Detection:
      - Vector-like edges in raster images
      - "Rendered" CGI-like smoothness
      - Perfect bilateral symmetry (no natural asymmetry)
      - Backgrounds fade to uniform gradients
      - Text rendering with subtle character distortions
      - Mathematically perfect lighting without randomness
      - NO authentic medium artifacts (canvas, paper grain, brush pressure)

      Midjourney Detection:
      - Hyper-detailed textures with algorithmic consistency
      - "Cinematic" lighting violating physics
      - Uncanny valley perfection in faces
      - Dreamy bokeh with unnatural chromatic separation
      - Golden ratio composition optimization
      - Recognizable aesthetic clusters

      Stable Diffusion Detection:
      - 8x8 or 16x16 grid patterns in detail areas
      - VAE compression artifacts: color banding, posterization
      - Fine detail blur vs sharp macro details
      - Background incoherence: perspective/scale errors
      - Repetitive textures from latent space

      B) HUMAN ART INDICATORS (Hand-Drawn/Traditional):

      TRADITIONAL MEDIA MARKERS (Strong authenticity):
      - Canvas weave texture: Visible fabric pattern from real canvas
      - Paper grain: Authentic paper texture (rough, smooth, watercolor)
      - Brush stroke irregularities: Inconsistent pressure, thickness variation
      - Paint texture: Visible impasto (3D paint buildup), brush hair marks
      - Pencil/charcoal grain: Material interaction with paper surface
      - Watercolor bleeding: Natural water diffusion at edges
      - Pen ink flow variation: Inconsistent ink density, pooling
      - Eraser marks: Visible smudging or paper damage from erasing

      DIGITAL ART (Human-Created) MARKERS:
      - Layer construction artifacts if unflattened
      - Brush pressure variation: Tablet pen pressure sensitivity (lighter/heavier strokes)
      - Undo/redo patterns: Visible correction attempts, overlapping lines
      - Selection boundaries: Imperfect masking edges
      - Human timing errors: Rushed areas vs detailed areas
      - Tool-specific patterns: Recognizable Procreate, Photoshop, Clip Studio brushes
      - Authentic mistakes: Lines that go outside intended areas, accidental marks

      HUMAN IMPERFECTION INDICATORS (Critical):
      - Asymmetric line weights: Lines vary naturally, not algorithmically
      - Inconsistent detail level: Artist fatigue = less detail over time
      - Correction marks: Visible attempts to fix mistakes
      - Natural tremor: Hand shake in long lines (not smooth bezier curves)
      - Proportion errors: Slightly wrong perspective or anatomy (human error)
      - Color outside lines: Accidental strokes beyond boundaries
      - Sketch/construction lines: Visible planning marks not erased
      - Speed variation: Fast loose strokes vs slow careful strokes
      - Authentic artist signatures: Hand-written, not perfect font-like text

      C) CRITICAL AI ART TELLS (vs Hand-Drawn):
      - NO metadata (AI never generates EXIF, hand-drawn scans may have scanner info)
      - PERFECT consistency: Every stroke has identical quality/style
      - NO human errors: Zero mistakes, corrections, or accidental marks
      - Mathematical gradients: Too smooth, no natural color variation
      - Perfect symmetry: Bilateral symmetry that's pixel-perfect (humans can't do this)
      - Uniform brush strokes: Every stroke looks algorithmically identical
      - No medium interaction: Missing canvas texture, paper grain, or paint buildup
      - Impossible style fusion: Mixing art styles that don't naturally blend
      - "AI coherence": Everything fits together too perfectly, no happy accidents
      - No construction artifacts: Missing sketch lines, planning marks, or guidelines
      - Perfect line quality: Smooth vector-like curves without natural tremor
      - Backgrounds less detailed: AI focuses on subject, hand artists vary more naturally
      - No correction layers: AI generates final image, humans have visible fixes
      - Repetitive patterns: Same pattern/texture repeated identically (copy-paste effect)

      D) HYBRID DETECTION (Hand-Drawn Base + AI Enhancement):
      - Quality inconsistency: Hand-drawn base with AI-enhanced sections
      - Noise pattern shifts: Hand-drawn texture vs AI smoothness in different areas
      - Style breaks: Sudden change from natural imperfections to AI perfection
      - Detail mismatch: Hand-drawn loose areas next to AI-detailed areas
      - Edge quality variation: Natural hand edges vs AI-perfect boundaries
      - Color consistency breaks: Hand-mixed colors vs AI-generated gradients

      METADATA: ${exifData ? 'Present (unusual for art)' : 'NONE (expected for AI art, hand-drawn scans may have scanner data)'}

      CRITICAL SCORING FOR HAND-DRAWN vs AI ART:
      - Hand-drawn evidence (texture, errors, corrections) = SUBTRACT 30-40 points from AI score
      - Perfect consistency + No human errors = ADD 35-45 points to AI score  
      - NO EXIF + Art Style + Perfect Consistency = 85%+ likely AI
      - Scanner metadata + Canvas/paper texture = 70-80% likely hand-drawn scan

      Your analysis MUST distinguish between:
      1. Traditional hand-drawn/painted art (physical media scanned)
      2. Digital art created by humans (Procreate, Photoshop with tablet)
      3. AI-generated art (Midjourney, DALL-E, Stable Diffusion)

      Analyze all patches for human imperfection markers vs AI perfection patterns.`;

      const isScreenshot = classificationResult.type === "screenshot" || classificationResult.image_type === "screenshot";
      const selectedPrompt = isPhoto ? photoAnalysisPrompt : isScreenshot ? screenshotAnalysisPrompt : illustrationAnalysisPrompt;

      const analysisResult = await base44.integrations.Core.InvokeLLM({
        prompt: selectedPrompt + `

      STATE-OF-THE-ART AI DETECTION WITH FINE-GRAINED MODEL CLASSIFICATION

      You are an advanced ensemble AI detection system combining multiple state-of-the-art techniques:
      - Deep forensic analysis for subtle manipulation artifacts
      - Fine-grained AI model fingerprinting (GANs, Diffusion, NeRF, VAE)
      - Artistic style classification across photorealism and illustrations
      - Zero-metadata analysis capabilities

      PRIMARY CLASSIFICATION TASK:
      1. CAMERA-NATIVE PHOTOS: Captured by cameras/phones (may have traditional editing)
      2. AI-GENERATED ILLUSTRATIONS: Artistic/stylized AI creations (DALL-E, Midjourney, SD)
      3. AI-GENERATED PHOTOREALISTIC: Synthetic realistic images (GANs, photo-mode diffusion)
      4. TRADITIONAL DIGITAL ART: Human-created with Photoshop/Procreate/hand tools
      5. HYBRID CONTENT: Real photos + AI enhancements (inpainting, upscaling, generative fill)
      6. AI-ASSISTED ART: Human-guided AI creation with manual refinement

      METADATA & FORENSIC CONTEXT:
      ${editingIndicators ? JSON.stringify(editingIndicators, null, 2) : 'No editing software metadata'}
      ${exifData ? 'Camera EXIF present - analyze authenticity' : 'NO EXIF - Critical for AI vs Real distinction'}
      ${forensicsData ? 'Advanced forensics available - integrate findings' : 'Forensics not available'}

      SECTION 1: FINE-GRAINED AI MODEL FINGERPRINTING

      Your PRIMARY TASK is to identify the SPECIFIC AI technique used if content is AI-generated:

      A) GAN-BASED GENERATION (StyleGAN, ProGAN, BigGAN):
      TECHNICAL FINGERPRINTS:
      - Spectral artifacts: Checkerboard patterns in frequency domain (FFT analysis)
      - Mode collapse indicators: Repetitive features across unrelated regions
      - Training set memorization: Exact replication of known dataset images
      - Latent space interpolation: Unnatural morphing between concepts
      - Discriminator artifacts: High-frequency noise patterns in smooth areas
      - Resolution-dependent artifacts: Quality drops at specific scales
      DETECTION CONFIDENCE: 90-98% when present

      B) DIFFUSION MODELS (DALL-E 2/3, Stable Diffusion, Midjourney):
      TECHNICAL FINGERPRINTS:
      - Denoising artifacts: Progressive blur-to-detail inconsistencies
      - Guidance scale tells: Over-saturated colors from high CFG
      - Latent space halos: Bright/dark rings around subject boundaries
      - Prompt bleeding: Mixed unrelated concepts in single generation
      - Step count indicators: Under-denoised or over-smoothed regions
      - VAE compression signatures: Specific color space artifacts
      - Cross-attention leakage: Text tokens influencing wrong image regions
      DETECTION CONFIDENCE: 85-95% when present

      C) NeRF/3D NEURAL RENDERING:
      TECHNICAL FINGERPRINTS:
      - View-dependent inconsistencies: Details change with implied perspective
      - Volumetric rendering artifacts: Transparent/translucent regions where shouldn't be
      - Multi-view synthesis errors: Left/right eye discrepancies in stereo
      - Normal map mismatches: Lighting doesn't match geometry
      - Radiance field leakage: Glow/bloom around object edges
      DETECTION CONFIDENCE: 80-92% when present

      D) HYBRID AI TECHNIQUES:
      - AI Upscaling: ESRGAN, Real-ESRGAN signatures (super-resolution artifacts)
      - AI Inpainting: Generative fill seams, context mismatch
      - Style Transfer: Neural style artifacts, texture grafting tells
      - AI Outpainting: Boundary discontinuities, prompt context loss

      SECTION 2: AI ARTISTIC STYLE DETECTION

      Modern AI art generators (DALL-E 3, Midjourney v6, Stable Diffusion XL):
      - Have ZERO camera metadata (no EXIF, no camera model, no lens data)
      - Show "too perfect" artistic consistency across the entire image
      - Have uniform style/technique that never varies (real artists have micro-inconsistencies)
      - Display diffusion model "smoothness" - subtle gradients that are too mathematically perfect
      - Contain impossible lighting/shadow combinations that "look right" but violate physics
      - Show brush strokes or textures that are repetitive/algorithmic rather than organic
      - Have backgrounds that are less detailed than subjects (common in AI art)
      - Display "AI coherence" - everything fits together TOO well without happy accidents
      - May mimic famous art styles (Van Gogh, Vermeer, etc.) but lack authentic imperfections
      - Show telltale "diffusion noise" in flat areas when zoomed in
      - Have perfectly balanced compositions (AI optimizes for aesthetics)

      MODEL-SPECIFIC SIGNATURES (Fine-grained classification):

      DALL-E 3 (OpenAI CLIP + Diffusion):
      VISUAL TELLS:
      - Extremely clean vector-like edges in raster images
      - "Rendered" quality - CGI-like smoothness in organic subjects
      - Perfect bilateral symmetry (no natural asymmetry)
      - Backgrounds fade to uniform gradients or solid colors
      - Text rendering: Almost correct but subtle character distortions
      - Lighting: Mathematically perfect, lacks natural randomness
      - NO authentic medium artifacts (canvas weave, paper grain, brush pressure)
      TECHNICAL MARKERS:
      - CLIP embedding artifacts: Semantic over-coherence
      - Dalle-3 upsampler signature: Specific sharpening pattern
      CONFIDENCE: 88-94%

      Midjourney v5/v6 (Proprietary Diffusion):
      VISUAL TELLS:
      - Hyper-detailed textures with algorithmic consistency
      - "Cinematic" lighting violating inverse-square law
      - Faces: Uncanny valley perfection, pore-scale but too uniform
      - Backgrounds: Dreamy bokeh with unnatural chromatic separation
      - Color grading: Film-like LUTs that don't match scene lighting
      - Composition: Golden ratio optimization, no happy accidents
      TECHNICAL MARKERS:
      - Midjourney upscaler signature: Specific frequency amplification
      - Style parameter fingerprints: Recognizable aesthetic clusters
      CONFIDENCE: 85-93%

      Stable Diffusion XL/2.1 (Open Source Diffusion):
      VISUAL TELLS:
      - Latent space artifacts: 8x8 or 16x16 grid patterns in detail areas
      - VAE compression artifacts: Color banding, posterization in gradients
      - Fine detail blur: Under-resolved elements (text, hair strands, pores)
      - Background incoherence: Perspective/scale errors in non-focal areas
      - Repetitive textures: Pattern tiling from latent space
      TECHNICAL MARKERS:
      - SD VAE signature: Specific color space transformation artifacts
      - Sampler tells: DPM++, Euler, DDIM each leave unique patterns
      - ControlNet artifacts: Edge/depth map leakage if used
      CONFIDENCE: 82-91%

      StyleGAN2/3 (GAN-based photorealism):
      VISUAL TELLS:
      - Spectral anomalies: Checkerboard patterns in FFT domain
      - Face generation tells: Eyes too symmetric, teeth too uniform
      - Background melting: Coherence breakdown outside focal region
      - Impossible geometry: Anatomical violations, merged structures
      TECHNICAL MARKERS:
      - Convolutional upsampling artifacts: Specific aliasing patterns
      - Progressive growing residuals: Resolution-dependent quality shifts
      CONFIDENCE: 90-96%

      REAL PHOTO INDICATORS:
      - Camera EXIF metadata present (strong signal but not conclusive)
      - Lens artifacts: chromatic aberration, vignetting, distortion
      - Motion blur from shutter speed (not AI motion blur)
      - Natural depth of field with bokeh circles from aperture blades
      - Sensor noise patterns (especially in shadows/highlights)
      - Real-world imperfections: dust, scratches, sensor spots
      - Compression artifacts from actual JPEG encoding
      - Natural lighting with full spectral information
      - Environmental reflections and ambient occlusion

      TRADITIONAL DIGITAL ART (HUMAN-CREATED):
      - Visible layer construction if unflattened
      - Brush pressure variation (Wacom tablet artifacts)
      - Human error: crooked lines, color outside lines
      - Style inconsistency across the piece (artist fatigue)
      - Sketch layers or construction lines visible
      - Canvas texture or paper grain from scanned traditional media
      - Authentic artist signatures or watermarks

      PHOTOSHOP EDITING (TRADITIONAL TOOLS):
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

      ENHANCED AI PHOTO DETECTION (Photorealistic):
      - GAN fingerprints: Checkerboard patterns in frequency domain
      - Face swap artifacts: Identity bleeding, blend lines at face boundaries
      - Synthetic skin: Too smooth, lacks pore variation and blood vessel networks
      - Hair rendering: Individual strands lack natural randomness
      - Eye reflections: Catchlights don't match scene lighting
      - Teeth uniformity: Too white, too straight, no natural variation
      - Background coherence: Melted or morphing background elements
      - Shadow inconsistencies: Shadows don't align with light sources
      - Material properties: Surfaces reflect light incorrectly
      - Anatomical impossibilities: Extra fingers, merged limbs, wrong joint angles

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

STEP 1. IMAGE CATEGORY CLASSIFICATION:
   - Illustration/Art Style: Painted, drawn, artistic (check if AI-generated or human-created)
   - Photorealistic: Looks like a photograph (check if real camera or AI-rendered)
   - Mixed Media: Combination of photo and art elements

   For ILLUSTRATIONS/ART:
   - AI Art Red Flags: No metadata, perfect consistency, diffusion smoothness, impossible style fusion
   - Human Art Indicators: Imperfections, layer artifacts, pressure variation, authentic medium texture

   For PHOTOREALISTIC:
   - Real Photo: Camera metadata, lens artifacts, sensor noise, natural lighting
   - AI Photo: No metadata, synthetic perfection, GAN artifacts, physics violations

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

SECTION 3: ZERO-METADATA FORENSIC ANALYSIS

When NO EXIF data present, perform DEEP forensic analysis:

   NO EXIF DATA = EXTREMELY SUSPICIOUS (85%+ likelihood of AI)
   - Modern cameras ALWAYS embed EXIF (even smartphones)
   - Legitimate photos only lose EXIF through specific stripping or editing
   - AI generators NEVER produce EXIF data
   - Screenshots lose EXIF but have screen-specific artifacts

   If NO EXIF present, you MUST find strong evidence of authenticity to classify as real:
   - Visible camera sensor noise patterns
   - Lens-specific distortion or vignetting
   - Motion blur with camera shake characteristics
   - Natural lighting with full spectral range
   - Physical imperfections in scene/subjects

   If NO EXIF + Art Style + Perfect Consistency = 95%+ likely AI art

SECTION 4: ADVANCED FORENSIC TECHNIQUES (Subtle Manipulation Detection):

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

STEP 6. CRITICAL DECISION FRAMEWORK:

   FOR ARTISTIC/ILLUSTRATED IMAGES:
   - If NO EXIF + Artistic style + Uniform quality = VOTE "likely_ai" with 80-95% confidence
   - If NO EXIF + Illustration + Perfect consistency = VOTE "likely_ai" with 85-95% confidence
   - If NO EXIF + Mimics famous art style = VOTE "likely_ai" with 90-95% confidence
   - Only vote "likely_real" for art if you see authentic human creation markers

   FOR PHOTOREALISTIC IMAGES:
   - If EXIF present + Real artifacts = VOTE "likely_real" with 80-95% confidence
   - If NO EXIF + Synthetic indicators = VOTE "likely_ai" with 75-90% confidence
   - If NO EXIF + Perfect lighting = VOTE "likely_ai" with 70-85% confidence

   PATCH ANALYSIS (${patchUrls.length} patches):
   - Analyze each patch for AI consistency vs natural variation
   - AI patches show uniform quality across all regions
   - Real photos have quality variation (sharp areas vs motion blur, etc.)
   - Check if artistic style is TOO consistent across patches

STEP 7. FINAL VERDICT RULES:

   HIGH CONFIDENCE AI (85-95%):
   - NO EXIF + Artistic style + Perfect consistency
   - NO EXIF + Illustration + Uniform brush strokes
   - NO EXIF + Mimics famous artist + No authentic imperfections
   - NO EXIF + Photorealistic + Synthetic skin/hair
   - Diffusion model artifacts detected

   MEDIUM CONFIDENCE AI (65-84%):
   - NO EXIF + Some consistency issues but not conclusive
   - NO EXIF + Digital art but lacks clear AI signatures
   - Suspicious patterns but could be heavily edited photo

   LEAN TOWARD REAL (Only if strong evidence):
   - EXIF present with camera info
   - Clear lens/sensor artifacts
   - Authentic medium texture (canvas, paper grain)
   - Natural imperfections throughout

   Metadata: ${exifData ? 'EXIF PRESENT - Camera data found' : 'NO EXIF DATA - Major red flag for AI'}
   Forensics: ${forensicsData ? JSON.stringify(forensicsData, null, 2) : 'Not available'}

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
           exif_impact: {
             type: "object",
             properties: {
               exif_present: { type: "boolean" },
               score_adjustment: { type: "number" },
               reasoning: { type: "string" }
             },
             description: "How EXIF metadata affected the analysis score"
           },
           classification: { 
             type: "string",
             enum: ["camera_native", "traditionally_edited", "ai_generated", "hybrid", "ai_assisted_art"]
           },
           ai_model_detected: {
             type: "string",
             enum: ["none", "dalle_3", "midjourney", "stable_diffusion", "stylegan", "nerf", "hybrid_models", "unknown_ai"],
             description: "Specific AI model fingerprint detected"
           },
           ai_technique_classification: {
             type: "object",
             properties: {
               primary_technique: { 
                 type: "string", 
                 enum: ["gan", "diffusion", "nerf", "vae", "hybrid", "none"]
               },
               confidence: { type: "number" },
               technical_fingerprints: {
                 type: "array",
                 items: { type: "string" }
               }
             }
           },
           content_style_analysis: {
             type: "object",
             properties: {
               style_category: {
                 type: "string",
                 enum: ["photorealistic", "illustration", "artistic", "mixed_media", "3d_render"]
               },
               artistic_indicators: {
                 type: "array",
                 items: { type: "string" }
               }
             }
           },
           forensic_analysis: {
             type: "object",
             properties: {
               manipulation_likelihood: { type: "number" },
               subtle_artifacts: {
                 type: "array",
                 items: {
                   type: "object",
                   properties: {
                     artifact_type: { type: "string" },
                     description: { type: "string" },
                     confidence: { type: "number" }
                   }
                 }
               },
               frequency_domain_analysis: { type: "string" },
               compression_analysis: { type: "string" }
             }
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

      // Enhanced provenance scoring - ONLY FOR PHOTOS, NOT ILLUSTRATIONS
      let provenanceScore = null;
      if (isPhoto && exifData) {
        // More sophisticated EXIF evaluation (only relevant for photos)
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
        provenance: isPhoto ? provenanceScore : null, // Only use provenance for photos
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

      // Step 6: Save to database with classification info
      const record = await base44.entities.AnalysisRecord.create({
        classification: classificationResult.image_type || classificationResult.type,
        classification_confidence: classificationResult.confidence,
        classification_reasoning: classificationResult.reasoning,
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

      // Save training feedback if user corrected the classification
      if (imageClassification?.userCorrected) {
        try {
          await base44.entities.TrainingFeedback.create({
            analysis_id: record.id,
            actual_label: imageClassification.type, // User's correction
            ai_prediction: imageClassification.originalPrediction, // AI's original guess
            confidence_match: false,
            notes: `User corrected image type classification from ${imageClassification.originalPrediction} to ${imageClassification.type}`,
            content_type: 'image',
            file_url: uploadedFile,
            status: 'pending'
          });
        } catch (error) {
          console.error('Failed to save classification feedback:', error);
        }
      }

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
    setImageClassification(null);
    setUserConfirmedType(false);
  };

  const handlePaymentSuccess = () => {
    toast.success('Payment successful! Premium features activated.');
  };

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": "IsThis.io",
    "description": "Free AI Content Verification - Instantly detect if images and videos are real or AI-generated",
    "url": "https://isthis.io",
    "applicationCategory": "SecurityApplication",
    "operatingSystem": "Web",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD",
      "availability": "https://schema.org/InStock"
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.8",
      "ratingCount": "1250",
      "bestRating": "5",
      "worstRating": "1"
    },
    "featureList": [
      "AI-generated image detection",
      "Deepfake video detection",
      "Free unlimited basic analysis",
      "Advanced forensic analysis",
      "Confidence scoring"
    ]
  };

  return (
    <>
      <SEO
        title="IsThis.io - Free AI Detection Tool | Verify Images & Videos"
        description="Instantly verify if images and videos are real or AI-generated. Free AI detection tool with advanced forensic analysis, deepfake detection, and confidence scoring."
        keywords="AI detection, deepfake detection, image verification, video verification, AI-generated content, fake image detector, deepfake checker, content authenticity, synthetic media detection, free AI tool"
        url="https://isthis.io"
        image="https://isthis.io/og-home.jpg"
        structuredData={structuredData}
      />
      {isMobile && showSplash && <SplashScreen onComplete={() => setShowSplash(false)} />}
      <OnboardingTour />
      
      <div className="min-h-screen gradient-mesh pb-20 md:pb-0">
      {/* Header */}
      <header className="sticky top-0 z-50 safe-top backdrop-blur-xl bg-gradient-to-r from-slate-50 via-slate-100 to-slate-50 border-b border-slate-300/50 shadow-lg shadow-slate-900/10">
        <div className="absolute inset-0 bg-gradient-to-r from-[#2C3E50]/5 via-[#7F8C8D]/5 to-[#BDC3C7]/5"></div>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 relative">
          <div className="flex items-center justify-between">
            <button 
              onClick={handleStartOver}
              className="group flex items-center gap-3 py-2 px-3 -mx-3 rounded-xl hover:bg-white/60 active:scale-[0.98] transition-all duration-300"
            >
              <div className="relative">
                <div className="absolute inset-0 bg-[#3498DB] rounded-xl blur-md opacity-30 group-hover:opacity-50 transition-opacity duration-300" />
                <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-[#3498DB] to-[#2C3E50] flex items-center justify-center shadow-lg">
                  <Shield className="w-6 h-6 text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-extrabold bg-gradient-to-r from-[#2C3E50] via-[#3498DB] to-[#2C3E50] bg-clip-text text-transparent tracking-tight leading-tight">
                  IsThis.io
                </h1>
                <p className="text-xs text-slate-700 hidden sm:block font-semibold">AI Content Verification</p>
              </div>
            </button>

            <div className="flex items-center gap-3">
              {/* Usage Counter */}
              {currentUser && (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-white/80 rounded-lg border border-slate-200 shadow-sm">
                  {tier.limit ? (
                    <>
                      <span className={`text-sm font-bold ${usageCount >= tier.limit ? 'text-red-600' : 'text-slate-900'}`}>
                        {usageCount}/{tier.limit}
                      </span>
                      <span className="text-xs text-slate-500">this {tier.period}</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4 text-emerald-600" />
                      <span className="text-sm font-bold text-emerald-600">Unlimited</span>
                    </>
                  )}
                </div>
              )}

              <div className="p-1.5 rounded-lg hover:bg-white/60 transition-colors">
                <HelpButton />
              </div>
              <div className="hidden md:block ml-1">
                {currentUser ? (
                  <ProfileDropdown onOpenSettings={() => setShowPreferences(true)} />
                ) : (
                  <button
                    onClick={() => {
                      const { base44Auth } = require('@/components/api/base44ClientAuth');
                      base44Auth.auth.redirectToLogin(window.location.pathname);
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg font-semibold hover:bg-slate-800 transition-colors"
                  >
                    <LogIn className="w-4 h-4" />
                    Sign In
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-16 pb-safe">
        {/* Admin/Trainer Quick Access - At Top */}
        {(isAdmin || isTrainer) && !result && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <div className="bg-gradient-to-br from-amber-50 to-yellow-50 rounded-xl border border-amber-200 p-3">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-600 to-yellow-600 flex items-center justify-center">
                  <Shield className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">
                    {isAdmin ? 'Admin Dashboard' : 'Trainer Dashboard'}
                  </h3>
                </div>
              </div>
              <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
                {isAdmin && (
                  <>
                    <Link
                      to={createPageUrl('Admin')}
                      className="p-2 bg-white rounded-lg border border-amber-200 hover:border-amber-400 hover:shadow transition-all group text-center"
                    >
                      <div className="font-semibold text-slate-900 text-xs group-hover:text-amber-600 transition-colors">
                        Admin
                      </div>
                    </Link>
                    <Link
                      to={createPageUrl('TrainerDashboard')}
                      className="p-2 bg-white rounded-lg border border-amber-200 hover:border-amber-400 hover:shadow transition-all group text-center"
                    >
                      <div className="font-semibold text-slate-900 text-xs group-hover:text-amber-600 transition-colors">
                        Training
                      </div>
                    </Link>
                    <Link
                      to={createPageUrl('FeedbackQueue')}
                      className="p-2 bg-white rounded-lg border border-amber-200 hover:border-amber-400 hover:shadow transition-all group text-center"
                    >
                      <div className="font-semibold text-slate-900 text-xs group-hover:text-amber-600 transition-colors">
                        Feedback
                      </div>
                    </Link>
                  </>
                )}
                {isTrainer && !isAdmin && (
                  <>
                    <Link
                      to={createPageUrl('TrainerDashboard')}
                      className="p-2 bg-white rounded-lg border border-amber-200 hover:border-amber-400 hover:shadow transition-all group text-center"
                    >
                      <div className="font-semibold text-slate-900 text-xs group-hover:text-amber-600 transition-colors">
                        Training
                      </div>
                    </Link>
                    <Link
                      to={createPageUrl('FeedbackQueue')}
                      className="p-2 bg-white rounded-lg border border-amber-200 hover:border-amber-400 hover:shadow transition-all group text-center"
                    >
                      <div className="font-semibold text-slate-900 text-xs group-hover:text-amber-600 transition-colors">
                        Assignments
                      </div>
                    </Link>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}

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
              <div className="text-center mb-12 sm:mb-20">
                <motion.div 
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-100 border border-slate-300 text-[#2C3E50] text-xs sm:text-sm mb-6 shadow-soft font-medium"
                >
                  <Sparkles className="w-4 h-4 text-[#3498DB]" />
                  Free AI Detection Tool
                </motion.div>
                <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold text-slate-900 mb-6 leading-[1.1] px-4 tracking-tight">
                  Is This Real?
                </h1>
                <p className="text-lg sm:text-2xl text-slate-600 max-w-3xl mx-auto mb-8 px-4 font-light leading-relaxed">
                  Instantly verify if images and videos are real or AI-generated with advanced detection technology
                </p>
              </div>

              {/* Upload Section */}
              <div className="max-w-3xl mx-auto mb-12 sm:mb-20" data-tour="upload-zone">
                <div className="glass-effect rounded-2xl sm:rounded-3xl p-6 sm:p-10 shadow-medium">
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
                      className={`block border-2 border-dashed border-[#BDC3C7] rounded-2xl p-10 sm:p-14 text-center transition-all bg-slate-50 ${
                        uploading ? 'cursor-wait opacity-75' : 'cursor-pointer active:scale-[0.99] hover:border-[#3498DB] hover:bg-slate-100'
                      }`}
                    >
                      {uploading ? (
                        <>
                          <div className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3 sm:mb-4 relative">
                            <div className="absolute inset-0 border-4 border-slate-200 rounded-full"></div>
                            <div 
                              className="absolute inset-0 border-4 border-[#3498DB] rounded-full border-t-transparent animate-spin"
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
                                className="h-full bg-[#3498DB] rounded-full"
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
                      className="w-full pl-10 sm:pl-11 pr-4 py-3 sm:py-3.5 border-2 border-slate-200 rounded-xl focus:border-[#3498DB] focus:outline-none transition-colors text-sm sm:text-base"
                    />
                  </div>

                  {/* Image Type Classification UI */}
                  {imageClassification && !userConfirmedType && (
                    <div className="mb-4 p-5 bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl">
                      <div className="mb-4">
                        <div className="flex items-center gap-2 mb-2">
                          <p className="font-bold text-slate-900">AI Classification</p>
                        </div>
                        <p className="text-sm text-slate-600 mb-1">{imageClassification.reasoning}</p>
                        <p className="text-xs text-slate-500">Confidence: {imageClassification.confidence}%</p>
                      </div>

                      <div className="space-y-2 mb-4">
                        <p className="text-sm font-semibold text-slate-700">Select the correct type:</p>
                        <div className="grid grid-cols-2 gap-2">
                          {[
                            { value: 'photo', label: 'Photo' },
                            { value: 'screenshot', label: 'Screenshot' },
                            { value: 'digital_art', label: 'Digital Art' },
                            { value: 'illustration', label: 'Illustration' }
                          ].map((option) => {
                            const aiPrediction = imageClassification.originalPrediction || imageClassification.type;
                            const isAiPick = option.value === aiPrediction;
                            const isSelected = imageClassification.type === option.value;

                            return (
                              <button
                                key={option.value}
                                onClick={() => {
                                  setImageClassification({
                                    ...imageClassification,
                                    type: option.value,
                                    userCorrected: option.value !== aiPrediction,
                                    originalPrediction: aiPrediction
                                  });
                                }}
                                className={`p-3 rounded-lg border-2 transition-all text-sm font-semibold relative ${
                                  isSelected
                                    ? 'border-blue-600 bg-blue-600 text-white shadow-md'
                                    : 'border-slate-300 bg-white text-slate-700 hover:border-blue-300'
                                }`}
                              >
                                {isAiPick && (
                                  <span className={`absolute -top-2 -right-2 px-2 py-0.5 rounded-full text-xs font-bold ${
                                    isSelected ? 'bg-emerald-500 text-white' : 'bg-blue-600 text-white'
                                  }`}>
                                    AI
                                  </span>
                                )}
                                {option.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <button
                        onClick={() => setUserConfirmedType(true)}
                        className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg transition-colors"
                      >
                        ✓ Confirm & Continue
                      </button>
                    </div>
                  )}

                  {classifying && (
                    <div className="mb-4 p-4 bg-slate-50 border border-slate-200 rounded-xl text-center">
                      <div className="w-6 h-6 border-2 border-slate-300 border-t-blue-600 rounded-full animate-spin mx-auto mb-2" />
                      <p className="text-sm text-slate-600">Detecting image type...</p>
                    </div>
                  )}

                  <button
                    onClick={handleAnalyze}
                    disabled={analyzing || (!uploadedFile && !urlInput) || (imageClassification && !userConfirmedType)}
                    className="w-full py-4 sm:py-5 bg-[#3498DB] hover:bg-[#2980b9] active:scale-[0.98] text-white font-bold rounded-2xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 text-base sm:text-lg touch-manipulation shadow-lg shadow-[#3498DB]/30 button-shine"
                    data-tour="verify-button"
                  >
                    {analyzing ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <Zap className="w-5 h-5" />
                        {imageClassification && !userConfirmedType ? 'Confirm Type First' : 'Verify Now - Free'}
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* How It Works */}
              <div className="max-w-5xl mx-auto mb-12 sm:mb-20" data-tour="how-it-works">
                <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 text-center mb-10 sm:mb-12 tracking-tight">How It Works</h2>
                <div className="grid grid-cols-3 gap-6 sm:gap-10">
                  {[
                    { icon: Upload, title: 'Upload', desc: 'Upload an image, video, or paste a URL from anywhere', color: 'from-[#7F8C8D] to-[#2C3E50]' },
                    { icon: Zap, title: 'Analyze', desc: 'Our AI analyzes visual artifacts, patterns, and inconsistencies', color: 'from-[#3498DB] to-[#2980b9]' },
                    { icon: CheckCircle2, title: 'Get Results', desc: 'Receive a clear verdict with confidence score and detailed explanation', color: 'from-[#3498DB] to-[#2C3E50]' }
                  ].map((step, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="text-center group"
                    >
                      <div className={`w-16 h-16 sm:w-20 sm:h-20 rounded-2xl sm:rounded-3xl bg-gradient-to-br ${step.color} flex items-center justify-center mx-auto mb-4 sm:mb-5 shadow-lg transform group-hover:scale-110 transition-transform duration-300`}>
                        <step.icon className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
                      </div>
                      <h3 className="font-bold text-slate-900 mb-2 text-base sm:text-lg">{step.title}</h3>
                      <p className="text-xs sm:text-sm text-slate-600 leading-relaxed hidden sm:block px-2">{step.desc}</p>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Pricing */}
              <section className="py-12 sm:py-20">
                <div className="text-center mb-10 sm:mb-16 px-4">
                  <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4 tracking-tight">Choose Your Plan</h2>
                  <p className="text-lg sm:text-xl text-slate-600 font-light">Get unlimited verifications and advanced features</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-6 max-w-6xl mx-auto">
                  {/* Free */}
                  <div className="glass-effect rounded-2xl sm:rounded-3xl p-6 sm:p-8 shadow-soft hover:shadow-medium transition-shadow duration-300">
                    <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mb-2">Free</h3>
                    <div className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-5 tracking-tight">$0</div>
                    <ul className="space-y-2 sm:space-y-3 mb-6">
                      <li className="flex items-start gap-2 text-xs sm:text-sm text-slate-600">
                        <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                        <span>5 verifications/month</span>
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

                  {/* Basic */}
                  <div className="glass-effect rounded-2xl sm:rounded-3xl p-6 sm:p-8 shadow-soft hover:shadow-medium transition-shadow duration-300">
                    <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mb-2">Basic</h3>
                    <div className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-1 tracking-tight">$9.99</div>
                    <div className="text-sm text-slate-500 mb-5 font-medium">per month</div>
                    <ul className="space-y-2 sm:space-y-3 mb-6">
                      <li className="flex items-start gap-2 text-xs sm:text-sm text-slate-600">
                        <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                        <span>25 verifications/month</span>
                      </li>
                      <li className="flex items-start gap-2 text-xs sm:text-sm text-slate-600">
                        <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                        <span>Advanced AI detection</span>
                      </li>
                      <li className="flex items-start gap-2 text-xs sm:text-sm text-slate-600">
                        <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                        <span>Priority support</span>
                      </li>
                      <li className="flex items-start gap-2 text-xs sm:text-sm text-slate-600">
                        <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                        <span>Cancel anytime</span>
                      </li>
                    </ul>
                    <StripeCheckout
                      plan={{ key: 'monthly', name: 'Basic Monthly', price: 9.99, buttonText: 'Get Basic' }}
                      onSuccess={handlePaymentSuccess}
                    />
                  </div>

                  {/* Premium */}
                  <div className="glass-effect rounded-2xl sm:rounded-3xl p-6 sm:p-8 shadow-soft hover:shadow-medium transition-shadow duration-300 border-2 border-[#3498DB]">
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-[#3498DB] rounded-full text-xs font-bold text-white shadow-md">
                      POPULAR
                    </div>
                    <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mb-2">Premium</h3>
                    <div className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-1 tracking-tight">$29</div>
                    <div className="text-sm text-slate-500 mb-5 font-medium">per year</div>
                    <ul className="space-y-2 sm:space-y-3 mb-6">
                      <li className="flex items-start gap-2 text-xs sm:text-sm text-slate-600">
                        <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                        <span><strong>Unlimited</strong> verifications</span>
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
                      plan={{ key: 'annual', name: 'Premium Annual', price: 29, buttonText: 'Get Premium' }}
                      onSuccess={handlePaymentSuccess}
                    />
                  </div>

                  {/* Lifetime */}
                  {lifetimeSettings?.enabled && (
                    <div className="bg-gradient-to-br from-[#2C3E50] via-[#3498DB] to-[#2C3E50] rounded-2xl sm:rounded-3xl p-6 sm:p-8 text-white relative shadow-2xl shadow-[#3498DB]/30 hover:shadow-[#3498DB]/40 transition-shadow duration-300 transform hover:scale-105 transition-all">
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-white rounded-full text-xs font-bold text-[#3498DB] shadow-lg">
                        LIMITED OFFER
                      </div>
                      <h3 className="text-xl sm:text-2xl font-bold mb-2">Lifetime</h3>
                      <div className="text-3xl sm:text-4xl font-extrabold mb-1 tracking-tight">$99</div>
                      <div className="text-sm text-slate-200 mb-3 font-medium">one-time payment</div>

                      {lifetimeSettings?.show_countdown && lifetimeSettings?.expiry_date && (
                        <div className="mb-4 p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                          <div className="text-xs font-semibold mb-1">Offer ends in:</div>
                          <div className="text-lg font-bold">
                            {(() => {
                              const now = new Date();
                              const expiry = new Date(lifetimeSettings.expiry_date);
                              const diff = expiry - now;
                              const days = Math.floor(diff / (1000 * 60 * 60 * 24));
                              const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                              return `${days}d ${hours}h`;
                            })()}
                          </div>
                        </div>
                      )}

                      <ul className="space-y-2 sm:space-y-3 mb-4">
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

                      <div className="mb-4 mx-auto max-w-xs">
                        <div className="text-center bg-gradient-to-br from-yellow-400/40 to-orange-400/40 rounded-2xl p-5 backdrop-blur-md border-2 border-yellow-300/60 shadow-lg">
                          <div className="text-4xl mb-2 animate-pulse">⚡</div>
                          <div className="font-extrabold text-lg text-white drop-shadow-lg">Limited to 500 Users</div>
                        </div>
                      </div>

                      <StripeCheckout
                        plan={{ key: 'lifetime', name: 'Lifetime Premium', price: 99, buttonText: 'Get Lifetime Access' }}
                        onSuccess={handlePaymentSuccess}
                      />
                    </div>
                  )}
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