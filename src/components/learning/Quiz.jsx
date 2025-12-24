import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, XCircle, Trophy, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import confetti from 'canvas-confetti';

export default function Quiz({ questions, onComplete, moduleId }) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [answers, setAnswers] = useState([]);
  const [score, setScore] = useState(0);
  const [completed, setCompleted] = useState(false);

  const question = questions[currentQuestion];
  const isCorrect = selectedAnswer === question.correct_answer;
  const progress = ((currentQuestion + 1) / questions.length) * 100;

  const handleAnswer = (index) => {
    if (showExplanation) return;
    setSelectedAnswer(index);
    setShowExplanation(true);
    
    const correct = index === question.correct_answer;
    setAnswers([...answers, { question: currentQuestion, correct }]);
    if (correct) {
      setScore(score + 1);
    }
  };

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      setSelectedAnswer(null);
      setShowExplanation(false);
    } else {
      const finalScore = Math.round((score / questions.length) * 100);
      setCompleted(true);
      onComplete({ score: finalScore, attempts: 1 });
      
      if (finalScore >= 80) {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });
      }
    }
  };

  if (completed) {
    const finalScore = Math.round((score / questions.length) * 100);
    const isPerfect = finalScore === 100;
    
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center py-12"
      >
        <div className={`w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center ${
          isPerfect ? 'bg-gradient-to-br from-yellow-400 to-orange-500' : 
          finalScore >= 80 ? 'bg-gradient-to-br from-green-400 to-emerald-500' :
          'bg-gradient-to-br from-blue-400 to-indigo-500'
        }`}>
          <Trophy className="w-10 h-10 text-white" />
        </div>
        <h3 className="text-3xl font-bold text-slate-900 mb-2">
          {isPerfect ? '🎉 Perfect Score!' : finalScore >= 80 ? '✨ Great Job!' : '👍 Quiz Complete'}
        </h3>
        <p className="text-xl text-slate-600 mb-6">
          You scored {finalScore}% ({score}/{questions.length} correct)
        </p>
        {isPerfect && (
          <div className="inline-block px-4 py-2 bg-yellow-100 text-yellow-800 rounded-full text-sm font-bold mb-6">
            🏆 Achievement Unlocked: Perfect Score!
          </div>
        )}
      </motion.div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex justify-between text-sm text-slate-600 mb-2">
          <span>Question {currentQuestion + 1} of {questions.length}</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            className="h-full bg-gradient-to-r from-indigo-500 to-purple-500"
          />
        </div>
      </div>

      {/* Question */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentQuestion}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="bg-white rounded-2xl border-2 border-slate-200 p-8 mb-6"
        >
          <h3 className="text-2xl font-bold text-slate-900 mb-6">
            {question.question}
          </h3>

          <div className="space-y-3">
            {question.options.map((option, index) => {
              const isSelected = selectedAnswer === index;
              const isCorrectAnswer = index === question.correct_answer;
              const showResult = showExplanation;

              return (
                <motion.button
                  key={index}
                  onClick={() => handleAnswer(index)}
                  disabled={showExplanation}
                  whileHover={!showExplanation ? { scale: 1.02 } : {}}
                  whileTap={!showExplanation ? { scale: 0.98 } : {}}
                  className={`w-full p-4 rounded-xl text-left font-medium transition-all ${
                    showResult
                      ? isCorrectAnswer
                        ? 'bg-green-100 border-2 border-green-500 text-green-900'
                        : isSelected
                        ? 'bg-red-100 border-2 border-red-500 text-red-900'
                        : 'bg-slate-50 border-2 border-slate-200 text-slate-400'
                      : isSelected
                      ? 'bg-indigo-50 border-2 border-indigo-500 text-indigo-900'
                      : 'bg-slate-50 border-2 border-slate-200 text-slate-700 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span>{option}</span>
                    {showResult && isCorrectAnswer && (
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                    )}
                    {showResult && isSelected && !isCorrectAnswer && (
                      <XCircle className="w-5 h-5 text-red-600" />
                    )}
                  </div>
                </motion.button>
              );
            })}
          </div>

          {/* Explanation */}
          <AnimatePresence>
            {showExplanation && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className={`mt-6 p-4 rounded-xl ${
                  isCorrect ? 'bg-green-50 border-2 border-green-200' : 'bg-red-50 border-2 border-red-200'
                }`}
              >
                <p className={`font-semibold mb-2 ${isCorrect ? 'text-green-900' : 'text-red-900'}`}>
                  {isCorrect ? '✓ Correct!' : '✗ Not quite'}
                </p>
                <p className="text-slate-700">{question.explanation}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </AnimatePresence>

      {/* Next Button */}
      {showExplanation && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <Button
            onClick={handleNext}
            className="w-full py-6 text-lg bg-indigo-600 hover:bg-indigo-700"
          >
            {currentQuestion < questions.length - 1 ? (
              <>
                Next Question
                <ArrowRight className="w-5 h-5 ml-2" />
              </>
            ) : (
              'Finish Quiz'
            )}
          </Button>
        </motion.div>
      )}
    </div>
  );
}