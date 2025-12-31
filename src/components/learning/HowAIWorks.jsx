import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, Layers, Zap, Eye, AlertCircle, ChevronRight, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

const AI_TECHNIQUES = [
  {
    id: 'gans',
    title: 'GANs (Generative Adversarial Networks)',
    icon: Brain,
    color: 'from-purple-500 to-pink-500',
    description: 'Two AI networks compete: one creates fake images, the other tries to detect them.',
    howItWorks: [
      'Generator creates synthetic images from random noise',
      'Discriminator evaluates if images are real or fake',
      'Both networks improve through competition',
      'Eventually produces highly realistic results'
    ],
    artifacts: [
      'Checkerboard patterns in frequency analysis',
      'Repetitive textures or features',
      'Unnatural symmetry',
      'Background melting or distortion'
    ],
    examples: 'StyleGAN, ProGAN, BigGAN',
    visual: '🔄'
  },
  {
    id: 'diffusion',
    title: 'Diffusion Models',
    icon: Layers,
    color: 'from-blue-500 to-cyan-500',
    description: 'Gradually removes noise from random data to create images, like sculpting from chaos.',
    howItWorks: [
      'Starts with pure random noise',
      'Progressively removes noise in small steps',
      'Guided by text prompts or conditions',
      'Refines details through multiple iterations'
    ],
    artifacts: [
      'Over-smoothed micro-details',
      'Boundary halos around objects',
      'Unnatural lighting consistency',
      'Missing fine texture variation'
    ],
    examples: 'DALL-E, Stable Diffusion, Midjourney',
    visual: '🌊'
  },
  {
    id: 'neural-rendering',
    title: 'Neural Rendering (NeRF)',
    icon: Eye,
    color: 'from-emerald-500 to-teal-500',
    description: 'Creates 3D representations that can be viewed from any angle.',
    howItWorks: [
      'Learns 3D scene structure from multiple views',
      'Stores scene as neural network weights',
      'Renders novel viewpoints on demand',
      'Captures lighting and materials'
    ],
    artifacts: [
      'View-dependent inconsistencies',
      'Volumetric rendering artifacts',
      'Normal map mismatches',
      'Quality drops at extreme angles'
    ],
    examples: 'NeRF, Instant NGP, Gaussian Splatting',
    visual: '🎭'
  },
  {
    id: 'deepfakes',
    title: 'Deepfakes (Face Swapping)',
    icon: Zap,
    color: 'from-red-500 to-orange-500',
    description: 'Replaces one person\'s face with another in photos or videos.',
    howItWorks: [
      'Learns facial features from source and target',
      'Maps facial expressions between individuals',
      'Blends swapped face with target video',
      'Adjusts lighting and skin tone to match'
    ],
    artifacts: [
      'Face boundary color mismatches',
      'Identity leakage (mixed features)',
      'Unnatural blinking patterns',
      'Lighting inconsistencies at edges'
    ],
    examples: 'DeepFaceLab, FaceSwap, Avatarify',
    visual: '🎭'
  }
];

export default function HowAIWorks({ onComplete }) {
  const [selectedTechnique, setSelectedTechnique] = useState(null);
  const [completedTechniques, setCompletedTechniques] = useState([]);

  const handleExplore = (technique) => {
    setSelectedTechnique(technique);
  };

  const handleMarkComplete = () => {
    if (selectedTechnique && !completedTechniques.includes(selectedTechnique.id)) {
      const newCompleted = [...completedTechniques, selectedTechnique.id];
      setCompletedTechniques(newCompleted);
      
      if (newCompleted.length === AI_TECHNIQUES.length) {
        onComplete?.({ completedAll: true, techniquesLearned: newCompleted.length });
      }
    }
    setSelectedTechnique(null);
  };

  const progress = (completedTechniques.length / AI_TECHNIQUES.length) * 100;

  if (selectedTechnique) {
    const Icon = selectedTechnique.icon;
    
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto"
      >
        <Button
          onClick={() => setSelectedTechnique(null)}
          variant="ghost"
          className="mb-6"
        >
          ← Back to Overview
        </Button>

        <div className="bg-white rounded-3xl shadow-xl border-2 border-slate-200 overflow-hidden">
          {/* Header */}
          <div className={`bg-gradient-to-r ${selectedTechnique.color} p-8 text-white`}>
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                <Icon className="w-8 h-8" />
              </div>
              <div>
                <h2 className="text-3xl font-bold">{selectedTechnique.title}</h2>
                <p className="text-white/90 mt-1">{selectedTechnique.description}</p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-8 space-y-8">
            {/* How It Works */}
            <div>
              <h3 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                <span className="text-3xl">{selectedTechnique.visual}</span>
                How It Works
              </h3>
              <div className="space-y-3">
                {selectedTechnique.howItWorks.map((step, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="flex items-start gap-3 p-4 bg-slate-50 rounded-xl"
                  >
                    <div className="w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center flex-shrink-0 font-bold">
                      {i + 1}
                    </div>
                    <p className="text-slate-700 pt-1">{step}</p>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Detection Artifacts */}
            <div>
              <h3 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                <AlertCircle className="w-6 h-6 text-red-500" />
                Common Artifacts to Look For
              </h3>
              <div className="grid md:grid-cols-2 gap-3">
                {selectedTechnique.artifacts.map((artifact, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.1 }}
                    className="p-4 bg-red-50 border-2 border-red-200 rounded-xl"
                  >
                    <div className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0" />
                      <p className="text-slate-700 font-medium">{artifact}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Examples */}
            <div className="p-6 bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl border-2 border-slate-200">
              <h4 className="font-bold text-slate-900 mb-2">Popular Tools & Models</h4>
              <p className="text-slate-700">{selectedTechnique.examples}</p>
            </div>

            {/* Action Button */}
            <Button
              onClick={handleMarkComplete}
              size="lg"
              className="w-full"
            >
              {completedTechniques.includes(selectedTechnique.id) ? (
                <>
                  <CheckCircle2 className="w-5 h-5 mr-2" />
                  Completed
                </>
              ) : (
                <>
                  Mark as Complete
                  <ChevronRight className="w-5 h-5 ml-2" />
                </>
              )}
            </Button>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      {/* Progress */}
      <div className="mb-8 p-6 bg-white rounded-2xl shadow-md border-2 border-slate-200">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-lg font-bold text-slate-900">Your Progress</h3>
          <span className="text-sm font-semibold text-indigo-600">
            {completedTechniques.length} / {AI_TECHNIQUES.length} completed
          </span>
        </div>
        <div className="h-3 bg-slate-200 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            className="h-full bg-gradient-to-r from-indigo-600 to-purple-600"
          />
        </div>
      </div>

      {/* Intro */}
      <div className="text-center mb-12">
        <h2 className="text-4xl font-bold text-slate-900 mb-4">
          How AI Generation Works
        </h2>
        <p className="text-xl text-slate-600 max-w-3xl mx-auto">
          Understand the techniques behind AI-generated content and what artifacts to look for
        </p>
      </div>

      {/* Technique Cards */}
      <div className="grid md:grid-cols-2 gap-6">
        {AI_TECHNIQUES.map((technique, i) => {
          const Icon = technique.icon;
          const isCompleted = completedTechniques.includes(technique.id);

          return (
            <motion.button
              key={technique.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              onClick={() => handleExplore(technique)}
              className="bg-white rounded-2xl shadow-lg border-2 border-slate-200 hover:border-indigo-500 hover:shadow-xl transition-all p-6 text-left group"
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`w-14 h-14 bg-gradient-to-br ${technique.color} rounded-2xl flex items-center justify-center`}>
                  <Icon className="w-7 h-7 text-white" />
                </div>
                {isCompleted && (
                  <div className="px-3 py-1 bg-green-100 rounded-full flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                    <span className="text-xs font-bold text-green-700">Done</span>
                  </div>
                )}
              </div>

              <h3 className="text-xl font-bold text-slate-900 mb-2 group-hover:text-indigo-600 transition-colors">
                {technique.title}
              </h3>
              <p className="text-slate-600 mb-4">
                {technique.description}
              </p>

              <div className="flex items-center text-indigo-600 font-semibold text-sm">
                Learn More
                <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}