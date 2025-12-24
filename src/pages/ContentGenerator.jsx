import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation } from '@tanstack/react-query';
import { Sparkles, Image as ImageIcon, Video, FileText, Loader2, Download, AlertTriangle, Zap, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function ContentGenerator() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [contentType, setContentType] = useState('image');
  const [prompt, setPrompt] = useState('');
  const [artifactType, setArtifactType] = useState('hands');
  const [difficulty, setDifficulty] = useState('medium');
  const [generatedContent, setGeneratedContent] = useState(null);

  useEffect(() => {
    base44.auth.me().then(currentUser => {
      setUser(currentUser);
      setLoading(false);
    }).catch(() => {
      setLoading(false);
    });
  }, []);

  const generateMutation = useMutation({
    mutationFn: async ({ type, userPrompt, artifact, difficultyLevel }) => {
      if (type === 'image') {
        // Generate enhanced prompt with specific artifact instructions
        const { enhanced_prompt } = await base44.integrations.Core.InvokeLLM({
          prompt: `You are an AI image generation prompt engineer specializing in creating test images for AI detection training.

User wants: ${userPrompt}
Target artifact: ${artifact}
Difficulty: ${difficultyLevel}

Create a detailed image generation prompt that will produce an image with INTENTIONAL AI artifacts for detection training.

Artifact Guidelines:
- hands: Include hands with ${difficultyLevel === 'easy' ? 'obvious extra fingers or missing fingers' : difficultyLevel === 'medium' ? 'subtle finger fusion or unnatural positioning' : 'barely noticeable anatomical inconsistencies'}
- faces: Include faces with ${difficultyLevel === 'easy' ? 'obvious perfect symmetry and plastic skin' : difficultyLevel === 'medium' ? 'subtle asymmetry issues and over-smoothed skin' : 'minimal but detectable symmetry patterns'}
- background: Create ${difficultyLevel === 'easy' ? 'obvious melting or incoherent background elements' : difficultyLevel === 'medium' ? 'subtle background inconsistencies' : 'barely visible background artifacts'}
- text: Include text that is ${difficultyLevel === 'easy' ? 'completely garbled and nonsensical' : difficultyLevel === 'medium' ? 'mostly readable but with subtle errors' : 'nearly perfect with minor glitches'}
- lighting: Create ${difficultyLevel === 'easy' ? 'impossible lighting from multiple conflicting sources' : difficultyLevel === 'medium' ? 'slightly inconsistent shadows and highlights' : 'subtle lighting physics violations'}

Return a single detailed prompt (100-150 words) optimized for AI image generation that will create the requested artifacts.`,
          response_json_schema: {
            type: "object",
            properties: {
              enhanced_prompt: { type: "string" }
            }
          }
        });

        const { url } = await base44.integrations.Core.GenerateImage({
          prompt: enhanced_prompt
        });

        return { url, type: 'image', metadata: { artifact, difficulty: difficultyLevel, original_prompt: userPrompt } };
      } else if (type === 'video_concept') {
        // Generate video concept with deepfake characteristics
        const concept = await base44.integrations.Core.InvokeLLM({
          prompt: `You are creating a detailed concept for a deepfake/AI-generated video for detection training purposes.

User request: ${userPrompt}
Target characteristics: ${artifact}
Difficulty: ${difficultyLevel}

Create a detailed technical description of how this video would be generated and what detection signals it should contain.

Include:
1. Scene description
2. Key deepfake indicators (blinking patterns, face boundaries, temporal inconsistencies)
3. Specific artifacts based on difficulty level
4. Technical generation notes

Difficulty level interpretation:
- easy: Obvious artifacts (unnatural blinking, visible face boundaries, temporal glitches)
- medium: Moderate artifacts (subtle face-body mismatches, occasional inconsistencies)
- hard: Subtle artifacts (minor temporal drift, barely visible boundaries)

Return comprehensive technical documentation.`,
          response_json_schema: {
            type: "object",
            properties: {
              scene_description: { type: "string" },
              deepfake_indicators: {
                type: "array",
                items: { type: "string" }
              },
              temporal_characteristics: { type: "string" },
              face_manipulation_details: { type: "string" },
              technical_notes: { type: "string" },
              difficulty_assessment: { type: "string" }
            }
          }
        });

        return { concept, type: 'video_concept', metadata: { artifact, difficulty: difficultyLevel, original_prompt: userPrompt } };
      } else if (type === 'text') {
        // Generate AI-detectable text
        const text = await base44.integrations.Core.InvokeLLM({
          prompt: `Generate text content based on this request: ${userPrompt}

This text should contain ${difficultyLevel === 'easy' ? 'obvious' : difficultyLevel === 'medium' ? 'moderate' : 'subtle'} AI generation patterns including:
- Repetitive phrasing common in AI-generated content
- Overly formal or stilted language
- Generic statements lacking specific details
- Characteristic AI language patterns

Generate 200-300 words that fulfill the request while exhibiting these AI patterns.`
        });

        return { text, type: 'text', metadata: { artifact, difficulty: difficultyLevel, original_prompt: userPrompt } };
      }
    },
    onSuccess: (data) => {
      setGeneratedContent(data);
      toast.success('Content generated successfully!');
    },
    onError: (error) => {
      toast.error('Generation failed: ' + error.message);
    }
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-slate-200 border-t-slate-900 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user?.is_trainer && user?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl border-2 border-slate-200 p-8 text-center max-w-md">
          <Shield className="w-12 h-12 text-amber-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-900 mb-2">Trainer Access Required</h2>
          <p className="text-slate-600 mb-6">
            Only trainers can access the content generator. This tool creates test samples for improving AI detection.
          </p>
          <Link
            to={createPageUrl('Home')}
            className="inline-block px-6 py-3 bg-slate-900 text-white rounded-xl font-semibold hover:bg-slate-800 transition-colors"
          >
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <header className="border-b border-slate-100 bg-white/95 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link to={createPageUrl('TrainerDashboard')} className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-slate-800">AI Content Generator</h1>
                <p className="text-xs text-slate-500">Create test samples for detection training</p>
              </div>
            </Link>
            <span className="px-3 py-1 bg-indigo-600 text-white text-xs font-bold rounded-full">
              TRAINER TOOL
            </span>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Warning Banner */}
        <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-6 mb-8">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-6 h-6 text-amber-600 flex-shrink-0" />
            <div>
              <h3 className="font-bold text-amber-900 mb-1">Training Use Only</h3>
              <p className="text-sm text-amber-800">
                This tool generates AI content with intentional artifacts for detection training and testing. 
                Generated content should only be used to improve model accuracy and never for deceptive purposes.
              </p>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Generator Controls */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border-2 border-slate-200 p-6">
              <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                <Zap className="w-5 h-5 text-indigo-600" />
                Generation Settings
              </h2>

              {/* Content Type */}
              <div className="mb-4">
                <label className="block text-sm font-semibold text-slate-700 mb-2">Content Type</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => setContentType('image')}
                    className={`p-3 rounded-xl border-2 transition-all ${
                      contentType === 'image'
                        ? 'border-indigo-600 bg-indigo-50'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <ImageIcon className="w-5 h-5 mx-auto mb-1" />
                    <div className="text-xs font-medium">Image</div>
                  </button>
                  <button
                    onClick={() => setContentType('video_concept')}
                    className={`p-3 rounded-xl border-2 transition-all ${
                      contentType === 'video_concept'
                        ? 'border-indigo-600 bg-indigo-50'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <Video className="w-5 h-5 mx-auto mb-1" />
                    <div className="text-xs font-medium">Video Concept</div>
                  </button>
                  <button
                    onClick={() => setContentType('text')}
                    className={`p-3 rounded-xl border-2 transition-all ${
                      contentType === 'text'
                        ? 'border-indigo-600 bg-indigo-50'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <FileText className="w-5 h-5 mx-auto mb-1" />
                    <div className="text-xs font-medium">Text</div>
                  </button>
                </div>
              </div>

              {/* Artifact Type */}
              <div className="mb-4">
                <label className="block text-sm font-semibold text-slate-700 mb-2">Target Artifact</label>
                <Select value={artifactType} onValueChange={setArtifactType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hands">Hand Artifacts</SelectItem>
                    <SelectItem value="faces">Face Issues</SelectItem>
                    <SelectItem value="background">Background Melting</SelectItem>
                    <SelectItem value="text">Garbled Text</SelectItem>
                    <SelectItem value="lighting">Impossible Lighting</SelectItem>
                    <SelectItem value="symmetry">Perfect Symmetry</SelectItem>
                    <SelectItem value="deepfake">Deepfake Characteristics</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Difficulty */}
              <div className="mb-4">
                <label className="block text-sm font-semibold text-slate-700 mb-2">Detection Difficulty</label>
                <Select value={difficulty} onValueChange={setDifficulty}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="easy">Easy - Obvious artifacts</SelectItem>
                    <SelectItem value="medium">Medium - Subtle issues</SelectItem>
                    <SelectItem value="hard">Hard - Barely detectable</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Prompt */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Content Description
                </label>
                <Textarea
                  placeholder="E.g., A professional portrait of a businesswoman in an office..."
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  rows={4}
                  className="resize-none"
                />
              </div>

              {/* Generate Button */}
              <Button
                onClick={() => generateMutation.mutate({ 
                  type: contentType, 
                  userPrompt: prompt, 
                  artifact: artifactType, 
                  difficultyLevel: difficulty 
                })}
                disabled={!prompt || generateMutation.isPending}
                className="w-full h-12 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
              >
                {generateMutation.isPending ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5 mr-2" />
                    Generate Content
                  </>
                )}
              </Button>
            </div>

            {/* Info Card */}
            <div className="bg-indigo-50 border-2 border-indigo-200 rounded-2xl p-6">
              <h3 className="font-bold text-indigo-900 mb-3">How to Use</h3>
              <ul className="space-y-2 text-sm text-indigo-800">
                <li className="flex items-start gap-2">
                  <span className="text-indigo-600 mt-0.5">1.</span>
                  <span>Select the type of content you want to generate</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-indigo-600 mt-0.5">2.</span>
                  <span>Choose the artifact type to embed in the content</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-indigo-600 mt-0.5">3.</span>
                  <span>Set difficulty level (how detectable the artifacts should be)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-indigo-600 mt-0.5">4.</span>
                  <span>Describe the content you want to create</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-indigo-600 mt-0.5">5.</span>
                  <span>Test the generated content with the detection system</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Output Preview */}
          <div>
            <div className="bg-white rounded-2xl border-2 border-slate-200 p-6 sticky top-24">
              <h2 className="text-xl font-bold text-slate-900 mb-6">Generated Output</h2>

              {!generatedContent ? (
                <div className="text-center py-16">
                  <Sparkles className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-500 mb-2">No content generated yet</p>
                  <p className="text-sm text-slate-400">Configure settings and click Generate</p>
                </div>
              ) : generatedContent.type === 'image' ? (
                <div>
                  <img 
                    src={generatedContent.url} 
                    alt="Generated content" 
                    className="w-full rounded-xl mb-4"
                  />
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-600">Artifact:</span>
                      <span className="font-semibold text-slate-900 capitalize">
                        {generatedContent.metadata.artifact.replace('_', ' ')}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-600">Difficulty:</span>
                      <span className={`font-semibold capitalize ${
                        generatedContent.metadata.difficulty === 'easy' ? 'text-emerald-600' :
                        generatedContent.metadata.difficulty === 'medium' ? 'text-amber-600' :
                        'text-red-600'
                      }`}>
                        {generatedContent.metadata.difficulty}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => {
                        const link = document.createElement('a');
                        link.href = generatedContent.url;
                        link.download = `test-sample-${Date.now()}.png`;
                        link.click();
                      }}
                      variant="outline"
                      className="flex-1"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </Button>
                    <Button
                      onClick={() => {
                        window.open(createPageUrl('Home'), '_blank');
                      }}
                      className="flex-1 bg-indigo-600 hover:bg-indigo-700"
                    >
                      Test Detection
                    </Button>
                  </div>
                </div>
              ) : generatedContent.type === 'video_concept' ? (
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-slate-900 mb-2">Scene Description</h3>
                    <p className="text-sm text-slate-700 leading-relaxed">
                      {generatedContent.concept.scene_description}
                    </p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 mb-2">Deepfake Indicators</h3>
                    <ul className="space-y-1">
                      {generatedContent.concept.deepfake_indicators.map((indicator, idx) => (
                        <li key={idx} className="text-sm text-slate-700 flex items-start gap-2">
                          <span className="text-indigo-600 mt-0.5">•</span>
                          <span>{indicator}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 mb-2">Technical Notes</h3>
                    <p className="text-sm text-slate-700 leading-relaxed">
                      {generatedContent.concept.technical_notes}
                    </p>
                  </div>
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                    <p className="text-xs text-amber-800">
                      💡 This is a video concept for reference. Use this documentation to understand 
                      what characteristics to look for when testing real deepfake videos.
                    </p>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="bg-slate-50 rounded-xl p-4 mb-4 max-h-96 overflow-y-auto">
                    <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                      {generatedContent.text}
                    </p>
                  </div>
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-600">Difficulty:</span>
                      <span className="font-semibold text-slate-900 capitalize">
                        {generatedContent.metadata.difficulty}
                      </span>
                    </div>
                  </div>
                  <Button
                    onClick={() => {
                      navigator.clipboard.writeText(generatedContent.text);
                      toast.success('Text copied to clipboard');
                    }}
                    className="w-full bg-indigo-600 hover:bg-indigo-700"
                  >
                    Copy Text
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}