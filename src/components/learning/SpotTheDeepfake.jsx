import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, XCircle, AlertCircle, ArrowRight, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

const CHALLENGE_IMAGES = [
  {
    id: 1,
    imageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800',
    isAI: false,
    difficulty: 'easy',
    explanation: 'This is a real photograph with natural skin texture, authentic lighting, and genuine camera artifacts.',
    signals: ['Natural skin pores', 'Asymmetric features', 'Authentic EXIF data', 'Lens distortion present']
  },
  {
    id: 2,
    imageUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=800',
    isAI: false,
    difficulty: 'medium',
    explanation: 'Real photo with professional retouching, but still shows natural characteristics and camera metadata.',
    signals: ['Some retouching visible', 'Natural hair texture', 'Real depth of field', 'Camera metadata present']
  },
  {
    id: 3,
    imageUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=800',
    isAI: false,
    difficulty: 'hard',
    explanation: 'Professional portrait with advanced editing, but authentic origin with real camera artifacts.',
    signals: ['Professional editing', 'Natural asymmetry', 'Real bokeh pattern', 'Authentic lighting']
  }
];

export default function SpotTheDeepfake({ onComplete }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState([]);
  const [showResult, setShowResult] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [gameComplete, setGameComplete] = useState(false);

  const currentImage = CHALLENGE_IMAGES[currentIndex];
  const progress = ((currentIndex + 1) / CHALLENGE_IMAGES.length) * 100;

  const handleAnswer = (isAI) => {
    setSelectedAnswer(isAI);
    const correct = isAI === currentImage.isAI;
    
    setUserAnswers([...userAnswers, {
      imageId: currentImage.id,
      userAnswer: isAI,
      correct,
      difficulty: currentImage.difficulty
    }]);

    setShowResult(true);
  };

  const handleNext = () => {
    setShowResult(false);
    setSelectedAnswer(null);
    
    if (currentIndex < CHALLENGE_IMAGES.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setGameComplete(true);
      const score = Math.round((userAnswers.filter(a => a.correct).length / CHALLENGE_IMAGES.length) * 100);
      onComplete?.({ score, totalQuestions: CHALLENGE_IMAGES.length, answers: userAnswers });
    }
  };

  const handleRestart = () => {
    setCurrentIndex(0);
    setUserAnswers([]);
    setShowResult(false);
    setSelectedAnswer(null);
    setGameComplete(false);
  };

  if (gameComplete) {
    const correctCount = userAnswers.filter(a => a.correct).length;
    const score = Math.round((correctCount / CHALLENGE_IMAGES.length) * 100);

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-2xl mx-auto text-center"
      >
        <div className="bg-white rounded-3xl p-12 shadow-xl border-2 border-slate-200">
          <div className={`w-24 h-24 mx-auto mb-6 rounded-full flex items-center justify-center ${
            score >= 80 ? 'bg-green-100' : score >= 60 ? 'bg-yellow-100' : 'bg-red-100'
          }`}>
            {score >= 80 ? (
              <CheckCircle2 className="w-12 h-12 text-green-600" />
            ) : score >= 60 ? (
              <AlertCircle className="w-12 h-12 text-yellow-600" />
            ) : (
              <XCircle className="w-12 h-12 text-red-600" />
            )}
          </div>

          <h2 className="text-4xl font-bold text-slate-900 mb-4">
            Challenge Complete!
          </h2>
          
          <div className="text-6xl font-extrabold text-slate-900 mb-6">
            {score}%
          </div>

          <p className="text-xl text-slate-600 mb-8">
            You got {correctCount} out of {CHALLENGE_IMAGES.length} correct
          </p>

          <div className="space-y-4 mb-8">
            {userAnswers.map((answer, i) => (
              <div
                key={i}
                className={`p-4 rounded-xl border-2 ${
                  answer.correct ? 'border-green-300 bg-green-50' : 'border-red-300 bg-red-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-900">
                    Image {i + 1} ({answer.difficulty})
                  </span>
                  {answer.correct ? (
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-600" />
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-4 justify-center">
            <Button onClick={handleRestart} variant="outline" size="lg">
              <RotateCcw className="w-5 h-5 mr-2" />
              Try Again
            </Button>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-semibold text-slate-700">
            Question {currentIndex + 1} of {CHALLENGE_IMAGES.length}
          </span>
          <span className="text-sm text-slate-600 capitalize">
            {currentImage.difficulty} Difficulty
          </span>
        </div>
        <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            className="h-full bg-gradient-to-r from-indigo-600 to-purple-600"
          />
        </div>
      </div>

      {/* Image Display */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="bg-white rounded-3xl shadow-xl overflow-hidden border-2 border-slate-200"
        >
          <div className="aspect-[4/3] bg-slate-100 relative">
            <img
              src={currentImage.imageUrl}
              alt={`Challenge ${currentIndex + 1}`}
              className="w-full h-full object-cover"
            />
            <div className="absolute top-4 right-4 px-3 py-1 bg-white/90 backdrop-blur-sm rounded-full text-sm font-semibold text-slate-900">
              🔍 Analyze carefully
            </div>
          </div>

          <div className="p-8">
            <h3 className="text-2xl font-bold text-slate-900 mb-6 text-center">
              Is this image AI-generated or real?
            </h3>

            {!showResult ? (
              <div className="grid grid-cols-2 gap-4">
                <Button
                  onClick={() => handleAnswer(false)}
                  size="lg"
                  variant="outline"
                  className="h-20 text-lg font-semibold border-2 hover:border-green-500 hover:bg-green-50"
                >
                  📸 Real Photo
                </Button>
                <Button
                  onClick={() => handleAnswer(true)}
                  size="lg"
                  variant="outline"
                  className="h-20 text-lg font-semibold border-2 hover:border-purple-500 hover:bg-purple-50"
                >
                  🤖 AI Generated
                </Button>
              </div>
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`p-6 rounded-2xl mb-6 ${
                  selectedAnswer === currentImage.isAI
                    ? 'bg-green-50 border-2 border-green-300'
                    : 'bg-red-50 border-2 border-red-300'
                }`}
              >
                <div className="flex items-start gap-4 mb-4">
                  {selectedAnswer === currentImage.isAI ? (
                    <CheckCircle2 className="w-8 h-8 text-green-600 flex-shrink-0" />
                  ) : (
                    <XCircle className="w-8 h-8 text-red-600 flex-shrink-0" />
                  )}
                  <div>
                    <h4 className="text-xl font-bold text-slate-900 mb-2">
                      {selectedAnswer === currentImage.isAI ? 'Correct!' : 'Not quite...'}
                    </h4>
                    <p className="text-slate-700 mb-4">
                      {currentImage.explanation}
                    </p>
                    <div className="space-y-2">
                      <p className="font-semibold text-slate-900 text-sm">Key Signals:</p>
                      {currentImage.signals.map((signal, i) => (
                        <div key={i} className="flex items-center gap-2 text-sm text-slate-600">
                          <div className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                          {signal}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <Button onClick={handleNext} size="lg" className="w-full">
                  {currentIndex < CHALLENGE_IMAGES.length - 1 ? (
                    <>
                      Next Image <ArrowRight className="w-5 h-5 ml-2" />
                    </>
                  ) : (
                    'See Results'
                  )}
                </Button>
              </motion.div>
            )}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}