"use client"

import { useState, useEffect, useCallback } from "react";
import { assessmentsApi } from "@/lib/api";

interface AssessmentViewerProps {
  assessmentId: string;
  enrollmentId: string;
  onComplete?: (assessmentId: string) => void;
}

interface Question {
  id: string;
  type: 'multiple-choice' | 'true-false' | 'multiple-select';
  question: string;
  options: string[];
  correctAnswers: number[] | number;
  points: number;
  explanation?: string;
}

interface Assessment {
  id: string;
  title: string;
  description?: string;
  type: 'quiz' | 'assignment' | 'exam';
  passingScore: number;
  maxAttempts?: number;
  timeLimit?: number; // in seconds
  questions: Question[];
  settings: any;
}

const AssessmentViewer = ({ assessmentId, enrollmentId, onComplete }: AssessmentViewerProps) => {
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [answers, setAnswers] = useState<{ [questionId: string]: number[] | number }>({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState<{ earned: number; total: number; percentage: number; passed: boolean } | null>(null);
  const [loading, setLoading] = useState(false);
  const [attempts, setAttempts] = useState<any[]>([]);
  const [isAlreadyCompleted, setIsAlreadyCompleted] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [quizStarted, setQuizStarted] = useState(false);
  const [autoSubmit, setAutoSubmit] = useState(false);

  // Load assessment
  useEffect(() => {
    const loadAssessment = async () => {
      try {
        const response = await assessmentsApi.getById(assessmentId);
        if (response.success && response.data) {
          setAssessment(response.data);
          
          // Check existing attempts
          const attemptsResponse = await assessmentsApi.getAttempts({
            assessmentId,
            enrollmentId,
          });
          
          if (attemptsResponse.success && attemptsResponse.data) {
            const attemptsList = Array.isArray(attemptsResponse.data) ? attemptsResponse.data : [];
            setAttempts(attemptsList);
            
            // Check if max attempts reached
            if (response.data.maxAttempts && attemptsList.length >= response.data.maxAttempts) {
              setIsAlreadyCompleted(true);
              // Load last attempt score
              if (attemptsList.length > 0) {
                const lastAttempt = attemptsList[0];
                setScore({
                  earned: 0,
                  total: 0,
                  percentage: Number(lastAttempt.score) || 0,
                  passed: lastAttempt.isPassed || false,
                });
                setSubmitted(true);
              }
            }
          }
          
          // Initialize timer if time limit exists (but don't start it yet)
          if (response.data.timeLimit) {
            setTimeRemaining(response.data.timeLimit);
          }
        }
      } catch (error: any) {
        console.error("Failed to load assessment:", error);
        alert(error.message || "Failed to load assessment");
      }
    };
    
    loadAssessment();
  }, [assessmentId, enrollmentId]);

  // Timer countdown (only starts when quizStarted is true)
  useEffect(() => {
    if (quizStarted && timeRemaining !== null && timeRemaining > 0 && !submitted) {
      const timer = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev === null || prev <= 1) {
            // Time's up - trigger auto submit
            setAutoSubmit(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      
      return () => clearInterval(timer);
    }
  }, [quizStarted, timeRemaining, submitted]);

  const handleAnswerChange = (questionId: string, answer: number | number[]) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer,
    }));
  };

  const handleSubmit = useCallback(async () => {
    if (!assessment || submitted) return;
    
    setLoading(true);
    setSubmitted(true);

    try {
      const timeTaken = assessment.timeLimit && timeRemaining !== null 
        ? assessment.timeLimit - timeRemaining 
        : undefined;

      const response = await assessmentsApi.submit({
        assessmentId,
        enrollmentId,
        answers,
        timeTaken,
      });

      if (response.success && response.data) {
        const attempt = response.data;
        setScore({
          earned: 0, // Backend calculates this
          total: 0,
          percentage: Number(attempt.score) || 0,
          passed: attempt.isPassed || false,
        });
        
        // Refresh attempts
        const attemptsResponse = await assessmentsApi.getAttempts({
          assessmentId,
          enrollmentId,
        });
        if (attemptsResponse.success && attemptsResponse.data) {
          setAttempts(Array.isArray(attemptsResponse.data) ? attemptsResponse.data : []);
        }
        
        if (onComplete) {
          onComplete(assessmentId);
        }
      }
    } catch (error: any) {
      console.error("Failed to submit assessment:", error);
      alert(error.message || "Failed to submit assessment. Please try again.");
      setSubmitted(false);
    } finally {
      setLoading(false);
    }
  }, [assessment, submitted, timeRemaining, answers, assessmentId, enrollmentId, onComplete]);

  // Auto-submit when time runs out
  useEffect(() => {
    if (autoSubmit && !submitted && assessment) {
      handleSubmit();
      setAutoSubmit(false);
    }
  }, [autoSubmit, submitted, assessment, handleSubmit]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!assessment) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-gray-500">Loading assessment...</p>
      </div>
    );
  }

  if (isAlreadyCompleted && assessment.maxAttempts) {
    return (
      <div className="flex-1 p-8 overflow-y-auto min-h-0">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white rounded-lg border-2 p-6 border-gray-300">
            <h2 className="text-2xl font-bold mb-4">Assessment Complete</h2>
            <p className="text-gray-600 mb-4">
              You have reached the maximum number of attempts ({assessment.maxAttempts}) for this assessment.
            </p>
            {score && (
              <div className="text-center">
                <div className={`text-4xl font-bold mb-2 ${score.passed ? 'text-green-600' : 'text-red-600'}`}>
                  {score.percentage.toFixed(0)}%
                </div>
                <p className={`text-lg font-semibold ${score.passed ? 'text-green-600' : 'text-red-600'}`}>
                  {score.passed ? '✓ Passed' : '✗ Failed'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  const handleStartQuiz = () => {
    setQuizStarted(true);
  };

  const currentQuestion = assessment.questions[currentQuestionIndex];
  const allAnswered = assessment.questions.every(q => answers[q.id] !== undefined);

  // Show start screen if quiz hasn't started
  if (!quizStarted && !submitted) {
    return (
      <div className="flex-1 p-8 overflow-y-auto min-h-0">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white rounded-lg border-2 border-gray-200 p-8 text-center">
            <h2 className="text-3xl font-bold mb-4">{assessment.title}</h2>
            {assessment.description && (
              <p className="text-gray-600 mb-6">{assessment.description}</p>
            )}
            
            <div className="bg-gray-50 rounded-lg p-6 mb-6 text-left">
              <h3 className="font-semibold mb-4">Assessment Details:</h3>
              <ul className="space-y-2 text-gray-700">
                <li className="flex justify-between">
                  <span>Total Questions:</span>
                  <span className="font-medium">{assessment.questions.length}</span>
                </li>
                <li className="flex justify-between">
                  <span>Passing Score:</span>
                  <span className="font-medium">{assessment.passingScore}%</span>
                </li>
                {assessment.timeLimit && (
                  <li className="flex justify-between">
                    <span>Time Limit:</span>
                    <span className="font-medium">{formatTime(assessment.timeLimit)}</span>
                  </li>
                )}
                {assessment.maxAttempts && (
                  <li className="flex justify-between">
                    <span>Max Attempts:</span>
                    <span className="font-medium">{assessment.maxAttempts}</span>
                  </li>
                )}
                {attempts.length > 0 && (
                  <li className="flex justify-between">
                    <span>Your Attempts:</span>
                    <span className="font-medium">{attempts.length} / {assessment.maxAttempts || '∞'}</span>
                  </li>
                )}
              </ul>
            </div>

            {assessment.maxAttempts && attempts.length >= assessment.maxAttempts ? (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                <p className="text-yellow-800">
                  You have reached the maximum number of attempts for this assessment.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                  <p className="text-blue-800 font-medium mb-2">Important Instructions:</p>
                  <ul className="text-blue-700 text-sm space-y-1 text-left list-disc list-inside">
                    {assessment.timeLimit && (
                      <li>The timer will start once you click "Start Quiz"</li>
                    )}
                    <li>Answer all questions before submitting</li>
                    <li>You can navigate between questions using Previous/Next buttons</li>
                    {assessment.maxAttempts && (
                      <li>You have {assessment.maxAttempts - attempts.length} attempt(s) remaining</li>
                    )}
                  </ul>
                </div>
                
                <button
                  onClick={handleStartQuiz}
                  className="px-8 py-3 bg-blue-600 text-white text-lg font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-md"
                >
                  Start Quiz
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Show results if submitted
  if (submitted && score) {
    return (
      <div className="flex-1 p-8 overflow-y-auto min-h-0">
        <div className="max-w-3xl mx-auto">
          <div className={`bg-white rounded-lg border-2 p-6 ${score.passed ? 'border-green-500' : 'border-red-500'}`}>
            <h2 className="text-2xl font-bold mb-4">Assessment Results</h2>
            <div className="text-center mb-6">
              <div className={`text-5xl font-bold mb-2 ${score.passed ? 'text-green-600' : 'text-red-600'}`}>
                {score.percentage.toFixed(0)}%
              </div>
              <p className={`mt-2 text-lg font-semibold ${score.passed ? 'text-green-600' : 'text-red-600'}`}>
                {score.passed ? '✓ Passed' : '✗ Failed'} (Passing: {assessment.passingScore}%)
              </p>
            </div>

            {/* Question Review */}
            <div className="space-y-4 mt-6">
              <h3 className="font-semibold">Question Review</h3>
              {assessment.questions.map((question, index) => {
                const userAnswer = answers[question.id];
                const correctAnswers = Array.isArray(question.correctAnswers) 
                  ? question.correctAnswers 
                  : [question.correctAnswers];
                
                // Note: For trainees, correctAnswers might be hidden by backend
                // So we'll show user's answer but not mark as correct/incorrect if we don't have correctAnswers
                const hasCorrectAnswers = question.correctAnswers !== undefined;
                const isCorrect = hasCorrectAnswers && (
                  Array.isArray(userAnswer)
                    ? userAnswer.length === correctAnswers.length && userAnswer.every(a => correctAnswers.includes(a))
                    : correctAnswers.includes(userAnswer as number)
                );

                return (
                  <div key={question.id} className={`p-4 rounded-lg border ${hasCorrectAnswers ? (isCorrect ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200') : 'bg-gray-50 border-gray-200'}`}>
                    <div className="flex items-start justify-between mb-2">
                      <p className="font-medium">{index + 1}. {question.question}</p>
                      {hasCorrectAnswers && (
                        isCorrect ? (
                          <span className="text-green-600">✓</span>
                        ) : (
                          <span className="text-red-600">✗</span>
                        )
                      )}
                    </div>
                    <div className="space-y-2">
                      {question.options.map((option, optIndex) => {
                        const isSelected = Array.isArray(userAnswer) 
                          ? userAnswer.includes(optIndex)
                          : userAnswer === optIndex;
                        const isCorrectAnswer = hasCorrectAnswers && correctAnswers.includes(optIndex);
                        
                        return (
                          <div
                            key={optIndex}
                            className={`p-2 rounded ${
                              isSelected && hasCorrectAnswers
                                ? isCorrectAnswer
                                  ? 'bg-green-100 border border-green-300'
                                  : 'bg-red-100 border border-red-300'
                                : isCorrectAnswer && hasCorrectAnswers
                                  ? 'bg-green-50 border border-green-200'
                                  : isSelected
                                    ? 'bg-blue-50 border border-blue-200'
                                    : 'bg-gray-50 border border-gray-200'
                            }`}
                          >
                            {option}
                            {isSelected && <span className="ml-2 text-sm text-gray-600">(Your answer)</span>}
                            {isCorrectAnswer && hasCorrectAnswers && !isSelected && <span className="ml-2 text-sm text-green-600">(Correct answer)</span>}
                          </div>
                        );
                      })}
                    </div>
                    {question.explanation && (
                      <p className="mt-2 text-sm text-gray-600 italic">{question.explanation}</p>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Attempts info */}
            {assessment.maxAttempts && (
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">
                  Attempts: {attempts.length} / {assessment.maxAttempts}
                </p>
                {attempts.length < assessment.maxAttempts && !score.passed && (
                  <button
                    onClick={() => {
                      setSubmitted(false);
                      setScore(null);
                      setAnswers({});
                      setCurrentQuestionIndex(0);
                      setQuizStarted(false);
                      if (assessment.timeLimit) {
                        setTimeRemaining(assessment.timeLimit);
                      }
                    }}
                    className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Retake Assessment
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Quiz form
  return (
    <div className="flex-1 p-8 overflow-y-auto min-h-0">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-2">{assessment.title}</h2>
          {assessment.description && (
            <p className="text-gray-600">{assessment.description}</p>
          )}
          <div className="mt-4 flex items-center gap-4 text-sm text-gray-600">
            <span>Questions: {assessment.questions.length}</span>
            <span>Passing Score: {assessment.passingScore}%</span>
            {assessment.maxAttempts && (
              <span>Attempts: {attempts.length} / {assessment.maxAttempts}</span>
            )}
            {quizStarted && timeRemaining !== null && (
              <span className={`font-semibold ${timeRemaining < 60 ? 'text-red-600' : ''}`}>
                Time Remaining: {formatTime(timeRemaining)}
              </span>
            )}
          </div>
        </div>

        {/* Progress bar */}
        <div className="mb-6">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all"
              style={{ width: `${((currentQuestionIndex + 1) / assessment.questions.length) * 100}%` }}
            ></div>
          </div>
          <p className="text-sm text-gray-600 mt-1">
            Question {currentQuestionIndex + 1} of {assessment.questions.length}
          </p>
        </div>

        {/* Question */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <h3 className="text-lg font-semibold mb-4">{currentQuestion.question}</h3>
          <div className="space-y-3">
            {currentQuestion.options.map((option, index) => {
              const isSelected = Array.isArray(answers[currentQuestion.id])
                ? (answers[currentQuestion.id] as number[]).includes(index)
                : answers[currentQuestion.id] === index;

              return (
                <label
                  key={index}
                  className={`flex items-center p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                    isSelected
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type={currentQuestion.type === 'multiple-select' ? 'checkbox' : 'radio'}
                    name={`question-${currentQuestion.id}`}
                    checked={isSelected}
                    onChange={() => {
                      if (currentQuestion.type === 'multiple-select') {
                        const currentAnswers = Array.isArray(answers[currentQuestion.id])
                          ? (answers[currentQuestion.id] as number[])
                          : answers[currentQuestion.id] !== undefined
                            ? [answers[currentQuestion.id] as number]
                            : [];
                        const newAnswers = isSelected
                          ? currentAnswers.filter(a => a !== index)
                          : [...currentAnswers, index];
                        handleAnswerChange(currentQuestion.id, newAnswers);
                      } else {
                        handleAnswerChange(currentQuestion.id, index);
                      }
                    }}
                    className="mr-3"
                  />
                  <span>{option}</span>
                </label>
              );
            })}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
            disabled={currentQuestionIndex === 0}
            className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ← Previous
          </button>
          {currentQuestionIndex < assessment.questions.length - 1 ? (
            <button
              onClick={() => setCurrentQuestionIndex(prev => Math.min(assessment.questions.length - 1, prev + 1))}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Next →
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={!allAnswered || loading}
              className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Submitting...' : 'Submit Assessment'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default AssessmentViewer;
