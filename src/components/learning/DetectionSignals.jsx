import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, Lightbulb, Sparkles, Target, CheckCircle2, XCircle, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

const SIGNAL_CATEGORIES = [
  {
    id: 'visual',
    title: 'Visual Artifacts',
    icon: Eye,
    color: 'from-blue-500 to-cyan-500',
    signals: [
      {
        name: 'Unnatural Skin Texture',
        description: 'AI-generated faces often have overly smooth or "plastic-like" skin that lacks natural pores and fine lines.',
        example: '🔍 Look for: Perfect smoothness, missing pores, uniform texture',
        severity: 'high',
        quiz: {
          question: 'What is a key indicator of AI-generated skin?',
          options: ['Natural pores', 'Perfect smoothness', 'Visible wrinkles', 'Skin blemishes'],
          correct: 1
        }
      },
      {
        name: 'Impossible Anatomy',
        description: 'AI may create anatomically incorrect features like extra fingers, merged limbs, or wrong joint angles.',
        example: '🔍 Look for: Extra/missing fingers, impossible body positions, merged structures',
        severity: 'high',
        quiz: {
          question: 'How many fingers should a normal human hand have?',
          options: ['4', '5', '6', 'It varies'],
          correct: 1
        }
      },
      {
        name: 'Perfect Symmetry',
        description: 'Real faces have natural asymmetry. AI often creates faces that are too perfectly symmetrical.',
        example: '🔍 Look for: Eyes at exactly same height, perfectly mirrored features',
        severity: 'medium',
        quiz: {
          question: 'What is natural in human faces?',
          options: ['Perfect symmetry', 'Slight asymmetry', 'No symmetry at all', 'Mathematical ratios'],
          correct: 1
        }
      }
    ]
  },
  {
    id: 'lighting',
    title: 'Lighting & Shadows',
    icon: Lightbulb,
    color: 'from-yellow-500 to-orange-500',
    signals: [
      {
        name: 'Inconsistent Light Sources',
        description: 'AI may generate lighting that doesn\'t follow physics - shadows pointing different directions or multiple light sources that don\'t make sense.',
        example: '🔍 Look for: Shadows at impossible angles, multiple conflicting light sources',
        severity: 'high',
        quiz: {
          question: 'In natural photography, shadows should:',
          options: ['Point randomly', 'Follow the light source', 'Be perfectly dark', 'Never appear'],
          correct: 1
        }
      },
      {
        name: 'Missing Reflections',
        description: 'Eyes, glasses, and shiny surfaces should show appropriate reflections. AI often fails to generate these correctly.',
        example: '🔍 Look for: Eyes without catchlights, glasses with wrong reflections',
        severity: 'medium',
        quiz: {
          question: 'What should appear in a person\'s eyes in natural photos?',
          options: ['Nothing', 'Catchlights from light sources', 'Pure darkness', 'Random colors'],
          correct: 1
        }
      }
    ]
  },
  {
    id: 'technical',
    title: 'Technical Indicators',
    icon: Target,
    color: 'from-purple-500 to-pink-500',
    signals: [
      {
        name: 'Missing EXIF Data',
        description: 'Real camera photos contain metadata about camera settings. AI-generated images typically have no EXIF data.',
        example: '🔍 Look for: No camera model, no settings data, no timestamp',
        severity: 'high',
        quiz: {
          question: 'What is EXIF data?',
          options: ['Image size', 'Camera metadata', 'File format', 'Color profile'],
          correct: 1
        }
      },
      {
        name: 'Compression Artifacts',
        description: 'AI images may show different compression patterns than real photos, or unusual artifacts.',
        example: '🔍 Look for: Unusual patterns, inconsistent compression, strange artifacts',
        severity: 'medium',
        quiz: {
          question: 'Real camera photos typically have:',
          options: ['No compression', 'JPEG compression', 'Perfect quality', 'No artifacts'],
          correct: 1
        }
      }
    ]
  },
  {
    id: 'background',
    title: 'Background Analysis',
    icon: Sparkles,
    color: 'from-green-500 to-emerald-500',
    signals: [
      {
        name: 'Melting Backgrounds',
        description: 'AI often loses coherence in backgrounds, creating "melted" or morphing elements.',
        example: '🔍 Look for: Objects blending together, unclear structures, morphing shapes',
        severity: 'high',
        quiz: {
          question: 'What is a common AI artifact in backgrounds?',
          options: ['Crystal clarity', 'Melting/morphing', 'Perfect focus', 'No blur'],
          correct: 1
        }
      },
      {
        name: 'Repetitive Patterns',
        description: 'AI may create repeating textures or patterns that look copy-pasted rather than natural.',
        example: '🔍 Look for: Identical patterns, repeated elements, algorithmic textures',
        severity: 'medium',
        quiz: {
          question: 'Natural backgrounds typically have:',
          options: ['Perfect repetition', 'Variation and randomness', 'No texture', 'Mathematical patterns'],
          correct: 1
        }
      }
    ]
  }
];

export default function DetectionSignals({ onComplete }) {
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [currentSignalIndex, setCurrentSignalIndex] = useState(0);
  const [quizAnswers, setQuizAnswers] = useState({});
  const [showQuizResult, setShowQuizResult] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [completedCategories, setCompletedCategories] = useState([]);

  const handleCategorySelect = (category) => {
    setSelectedCategory(category);
    setCurrentSignalIndex(0);
    setShowQuizResult(false);
    setSelectedAnswer(null);
  };

  const handleQuizAnswer = (answerIndex) => {
    const currentSignal = selectedCategory.signals[currentSignalIndex];
    const isCorrect = answerIndex === currentSignal.quiz.correct;
    
    setSelectedAnswer(answerIndex);
    setShowQuizResult(true);
    setQuizAnswers({
      ...quizAnswers,
      [`${selectedCategory.id}-${currentSignalIndex}`]: isCorrect
    });
  };

  const handleNext = () => {
    if (currentSignalIndex < selectedCategory.signals.length - 1) {
      setCurrentSignalIndex(currentSignalIndex + 1);
      setShowQuizResult(false);
      setSelectedAnswer(null);
    } else {
      const newCompleted = [...completedCategories, selectedCategory.id];
      setCompletedCategories(newCompleted);
      
      if (newCompleted.length === SIGNAL_CATEGORIES.length) {
        const totalQuestions = SIGNAL_CATEGORIES.reduce((sum, cat) => sum + cat.signals.length, 0);
        const correctAnswers = Object.values(quizAnswers).filter(Boolean).length;
        onComplete?.({ 
          score: Math.round((correctAnswers / totalQuestions) * 100),
          categoriesCompleted: newCompleted.length 
        });
      }
      
      setSelectedCategory(null);
      setCurrentSignalIndex(0);
    }
  };

  const totalSignals = SIGNAL_CATEGORIES.reduce((sum, cat) => sum + cat.signals.length, 0);
  const learnedSignals = Object.keys(quizAnswers).length;
  const progress = (learnedSignals / totalSignals) * 100;

  if (selectedCategory) {
    const currentSignal = selectedCategory.signals[currentSignalIndex];
    const Icon = selectedCategory.icon;
    const isCorrect = selectedAnswer !== null && selectedAnswer === currentSignal.quiz.correct;

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto"
      >
        <Button
          onClick={() => setSelectedCategory(null)}
          variant="ghost"
          className="mb-6"
        >
          ← Back to Categories
        </Button>

        <div className="bg-white rounded-3xl shadow-xl border-2 border-slate-200 overflow-hidden">
          {/* Header */}
          <div className={`bg-gradient-to-r ${selectedCategory.color} p-6 text-white`}>
            <div className="flex items-center gap-3 mb-2">
              <Icon className="w-6 h-6" />
              <h3 className="text-xl font-bold">{selectedCategory.title}</h3>
            </div>
            <div className="text-sm text-white/80">
              Signal {currentSignalIndex + 1} of {selectedCategory.signals.length}
            </div>
          </div>

          {/* Content */}
          <div className="p-8">
            <div className={`inline-flex px-3 py-1 rounded-full text-xs font-bold mb-4 ${
              currentSignal.severity === 'high' 
                ? 'bg-red-100 text-red-700' 
                : 'bg-yellow-100 text-yellow-700'
            }`}>
              {currentSignal.severity.toUpperCase()} PRIORITY
            </div>

            <h4 className="text-2xl font-bold text-slate-900 mb-4">
              {currentSignal.name}
            </h4>

            <p className="text-lg text-slate-700 mb-6">
              {currentSignal.description}
            </p>

            <div className="p-4 bg-blue-50 border-2 border-blue-200 rounded-xl mb-8">
              <p className="text-slate-700">{currentSignal.example}</p>
            </div>

            {/* Quiz */}
            <div className="bg-slate-50 rounded-2xl p-6">
              <h5 className="font-bold text-slate-900 mb-4">Test Your Knowledge</h5>
              <p className="text-slate-700 mb-4">{currentSignal.quiz.question}</p>

              <div className="space-y-3 mb-6">
                {currentSignal.quiz.options.map((option, i) => (
                  <button
                    key={i}
                    onClick={() => !showQuizResult && handleQuizAnswer(i)}
                    disabled={showQuizResult}
                    className={`w-full p-4 rounded-xl border-2 text-left font-medium transition-all ${
                      showQuizResult
                        ? i === currentSignal.quiz.correct
                          ? 'border-green-500 bg-green-50 text-green-900'
                          : i === selectedAnswer
                          ? 'border-red-500 bg-red-50 text-red-900'
                          : 'border-slate-200 bg-white text-slate-400'
                        : 'border-slate-200 bg-white hover:border-indigo-500 hover:bg-indigo-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span>{option}</span>
                      {showQuizResult && i === currentSignal.quiz.correct && (
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                      )}
                      {showQuizResult && i === selectedAnswer && i !== currentSignal.quiz.correct && (
                        <XCircle className="w-5 h-5 text-red-600" />
                      )}
                    </div>
                  </button>
                ))}
              </div>

              {showQuizResult && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <Button onClick={handleNext} size="lg" className="w-full">
                    {currentSignalIndex < selectedCategory.signals.length - 1 ? (
                      <>
                        Next Signal <ArrowRight className="w-5 h-5 ml-2" />
                      </>
                    ) : (
                      'Complete Category'
                    )}
                  </Button>
                </motion.div>
              )}
            </div>
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
          <h3 className="text-lg font-bold text-slate-900">Learning Progress</h3>
          <span className="text-sm font-semibold text-indigo-600">
            {learnedSignals} / {totalSignals} signals learned
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
          Understanding Detection Signals
        </h2>
        <p className="text-xl text-slate-600 max-w-3xl mx-auto">
          Learn to recognize key indicators of AI-generated or manipulated content
        </p>
      </div>

      {/* Category Cards */}
      <div className="grid md:grid-cols-2 gap-6">
        {SIGNAL_CATEGORIES.map((category, i) => {
          const Icon = category.icon;
          const isCompleted = completedCategories.includes(category.id);
          const categoryProgress = category.signals.filter((_, idx) => 
            quizAnswers[`${category.id}-${idx}`] !== undefined
          ).length;

          return (
            <motion.button
              key={category.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              onClick={() => handleCategorySelect(category)}
              className="bg-white rounded-2xl shadow-lg border-2 border-slate-200 hover:border-indigo-500 hover:shadow-xl transition-all p-6 text-left group"
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`w-14 h-14 bg-gradient-to-br ${category.color} rounded-2xl flex items-center justify-center`}>
                  <Icon className="w-7 h-7 text-white" />
                </div>
                {isCompleted && (
                  <div className="px-3 py-1 bg-green-100 rounded-full flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                    <span className="text-xs font-bold text-green-700">Complete</span>
                  </div>
                )}
              </div>

              <h3 className="text-xl font-bold text-slate-900 mb-2 group-hover:text-indigo-600 transition-colors">
                {category.title}
              </h3>
              <p className="text-slate-600 mb-4">
                {category.signals.length} detection signals
              </p>

              {categoryProgress > 0 && (
                <div className="mb-4">
                  <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full bg-gradient-to-r ${category.color}`}
                      style={{ width: `${(categoryProgress / category.signals.length) * 100}%` }}
                    />
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    {categoryProgress} / {category.signals.length} learned
                  </p>
                </div>
              )}

              <div className="flex items-center text-indigo-600 font-semibold text-sm">
                Start Learning
                <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}