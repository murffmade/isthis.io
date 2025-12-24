import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, XCircle, Award, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import confetti from 'canvas-confetti';

export default function Quiz({ quiz, onComplete }) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [answers, setAnswers] = useState([]);
  const [showResults, setShowResults] = useState(false);

  const questions = quiz.questions || [];
  const question = questions[currentQuestion];
  const isCorrect = selectedAnswer === question?.correct_answer;
  const score = (answers.filter(a => a.correct).length / questions.length) * 100;
  const passed = score >= (quiz.passing_score || 70);

  const handleAnswerSelect = (index) => {
    if (showFeedback) return;
    setSelectedAnswer(index);
  };

  const handleSubmitAnswer = () => {
    setShowFeedback(true);
    const correct = selectedAnswer === question.correct_answer;
    setAnswers([...answers, { questionIndex: currentQuestion, selected: selectedAnswer, correct }]);
  };

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      setSelectedAnswer(null);
      setShowFeedback(false);
    } else {
      setShowResults(true);
      if (passed) {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });
        onComplete?.(score);
      }
    }
  };

  const handleRetry = () => {
    setCurrentQuestion(0);
    setSelectedAnswer(null);
    setShowFeedback(false);
    setAnswers([]);
    setShowResults(false);
  };

  if (!questions.length) {
    return <div className="text-center text-slate-600">No quiz available</div>;
  }

  if (showResults) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl border-2 border-slate-200 p-8 text-center"
      >
        <div className={`w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center ${
          passed ? 'bg-emerald-100' : 'bg-red-100'
        }`}>
          {passed ? (
            <Award className="w-10 h-10 text-emerald-600" />
          ) : (
            <XCircle className="w-10 h-10 text-red-600" />
          )}
        </div>
        
        <h3 className="text-2xl font-bold text-slate-900 mb-2">
          {passed ? 'Congratulations!' : 'Keep Practicing'}
        </h3>
        
        <p className="text-lg text-slate-600 mb-6">
          You scored <span className="font-bold text-[#3498DB]">{Math.round(score)}%</span>
        </p>
        
        {passed ? (
          <p className="text-slate-600 mb-6">
            Great job! You've mastered this module.
          </p>
        ) : (
          <p className="text-slate-600 mb-6">
            You need {quiz.passing_score}% to pass. Review the material and try again!
          </p>
        )}
        
        <div className="flex gap-4 justify-center">
          {!passed && (
            <Button onClick={handleRetry} variant="outline" className="gap-2">
              <RotateCcw className="w-4 h-4" />
              Retry Quiz
            </Button>
          )}
          <Button onClick={() => onComplete?.(score)} className="bg-[#3498DB] hover:bg-[#2980b9]">
            Continue
          </Button>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border-2 border-slate-200 p-6 md:p-8">
      {/* Progress */}
      <div className="mb-6">
        <div className="flex items-center justify-between text-sm text-slate-600 mb-2">
          <span>Question {currentQuestion + 1} of {questions.length}</span>
          <span>{Math.round(((currentQuestion + 1) / questions.length) * 100)}%</span>
        </div>
        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
          <div 
            className="h-full bg-[#3498DB] transition-all"
            style={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }}
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
        >
          <h3 className="text-xl font-bold text-slate-900 mb-6">{question.question}</h3>
          
          {/* Options */}
          <div className="space-y-3 mb-6">
            {question.options.map((option, index) => {
              const isSelected = selectedAnswer === index;
              const isCorrectAnswer = index === question.correct_answer;
              const showCorrect = showFeedback && isCorrectAnswer;
              const showIncorrect = showFeedback && isSelected && !isCorrect;
              
              return (
                <button
                  key={index}
                  onClick={() => handleAnswerSelect(index)}
                  disabled={showFeedback}
                  className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                    showCorrect 
                      ? 'border-emerald-500 bg-emerald-50'
                      : showIncorrect
                      ? 'border-red-500 bg-red-50'
                      : isSelected
                      ? 'border-[#3498DB] bg-blue-50'
                      : 'border-slate-200 hover:border-slate-300'
                  } ${showFeedback ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`${
                      showCorrect || showIncorrect ? 'font-semibold' : ''
                    }`}>
                      {option}
                    </span>
                    {showCorrect && <CheckCircle2 className="w-5 h-5 text-emerald-600" />}
                    {showIncorrect && <XCircle className="w-5 h-5 text-red-600" />}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Feedback */}
          {showFeedback && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-4 rounded-xl mb-6 ${
                isCorrect ? 'bg-emerald-50 border border-emerald-200' : 'bg-red-50 border border-red-200'
              }`}
            >
              <div className="flex gap-2 mb-2">
                {isCorrect ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                )}
                <div>
                  <p className={`font-semibold mb-1 ${isCorrect ? 'text-emerald-900' : 'text-red-900'}`}>
                    {isCorrect ? 'Correct!' : 'Not quite right'}
                  </p>
                  <p className="text-sm text-slate-700">{question.explanation}</p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Actions */}
          <div className="flex justify-end">
            {!showFeedback ? (
              <Button
                onClick={handleSubmitAnswer}
                disabled={selectedAnswer === null}
                className="bg-[#3498DB] hover:bg-[#2980b9]"
              >
                Submit Answer
              </Button>
            ) : (
              <Button onClick={handleNext} className="bg-[#3498DB] hover:bg-[#2980b9]">
                {currentQuestion < questions.length - 1 ? 'Next Question' : 'See Results'}
              </Button>
            )}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}