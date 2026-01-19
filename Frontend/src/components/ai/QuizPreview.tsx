"use client"

import { useState } from "react";

interface QuizQuestion {
  id: string;
  type: 'multiple-choice' | 'true-false' | 'multiple-select';
  question: string;
  options: string[];
  correctAnswers: number[] | number;
  points: number;
  explanation?: string;
}

interface QuizData {
  questions: QuizQuestion[];
  settings: {
    passingScore: number;
    allowRetake: boolean;
    timeLimit?: number;
    randomizeQuestions: boolean;
    showResultsImmediately: boolean;
  };
}

interface QuizPreviewProps {
  quizData: QuizData;
  onEdit?: (questionId: string) => void;
  onDelete?: (questionId: string) => void;
  onSave?: () => void;
  editable?: boolean;
}

const QuizPreview = ({ quizData, onEdit, onDelete, onSave, editable = true }: QuizPreviewProps) => {
  const [expandedQuestion, setExpandedQuestion] = useState<string | null>(null);

  const getCorrectAnswerText = (question: QuizQuestion): string => {
    if (question.type === 'true-false') {
      return question.correctAnswers === 0 ? 'True' : 'False';
    }
    
    const correctIndices = Array.isArray(question.correctAnswers) 
      ? question.correctAnswers 
      : [question.correctAnswers];
    
    return correctIndices.map(idx => question.options[idx]).join(', ');
  };

  return (
    <div className="w-full space-y-4">
      {/* Quiz Settings Summary */}
      <div className="bg-white rounded-lg border p-4">
        <h3 className="font-semibold mb-2">Quiz Settings</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-gray-600">Questions:</span>
            <span className="ml-2 font-medium">{quizData.questions.length}</span>
          </div>
          <div>
            <span className="text-gray-600">Passing Score:</span>
            <span className="ml-2 font-medium">{quizData.settings.passingScore}%</span>
          </div>
          <div>
            <span className="text-gray-600">Allow Retake:</span>
            <span className="ml-2 font-medium">{quizData.settings.allowRetake ? 'Yes' : 'No'}</span>
          </div>
          <div>
            <span className="text-gray-600">Time Limit:</span>
            <span className="ml-2 font-medium">
              {quizData.settings.timeLimit ? `${quizData.settings.timeLimit} min` : 'None'}
            </span>
          </div>
        </div>
      </div>

      {/* Questions List */}
      <div className="space-y-3">
        {quizData.questions.map((question, index) => (
          <div
            key={question.id}
            className="bg-white rounded-lg border p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-semibold text-gray-700">
                    Question {index + 1}
                  </span>
                  <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded">
                    {question.type.replace('-', ' ')}
                  </span>
                  <span className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded">
                    {question.points} {question.points === 1 ? 'point' : 'points'}
                  </span>
                </div>
                
                <p className="text-gray-900 mb-3">{question.question}</p>
                
                <div className="space-y-1 mb-3">
                  {question.options.map((option, optIndex) => {
                    const isCorrect = Array.isArray(question.correctAnswers)
                      ? question.correctAnswers.includes(optIndex)
                      : question.correctAnswers === optIndex;
                    
                    return (
                      <div
                        key={optIndex}
                        className={`flex items-center gap-2 p-2 rounded ${
                          isCorrect ? 'bg-green-50 border border-green-200' : 'bg-gray-50'
                        }`}
                      >
                        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                          isCorrect ? 'bg-green-500 text-white' : 'bg-gray-300 text-gray-700'
                        }`}>
                          {String.fromCharCode(65 + optIndex)}
                        </span>
                        <span className={isCorrect ? 'text-green-800 font-medium' : 'text-gray-700'}>
                          {option}
                        </span>
                        {isCorrect && (
                          <span className="ml-auto text-green-600 text-xs">✓ Correct</span>
                        )}
                      </div>
                    );
                  })}
                </div>

                {question.explanation && (
                  <div className="mt-2">
                    <button
                      onClick={() => setExpandedQuestion(
                        expandedQuestion === question.id ? null : question.id
                      )}
                      className="text-sm text-blue-600 hover:text-blue-800"
                    >
                      {expandedQuestion === question.id ? 'Hide' : 'Show'} Explanation
                    </button>
                    {expandedQuestion === question.id && (
                      <div className="mt-2 p-3 bg-blue-50 rounded text-sm text-gray-700">
                        {question.explanation}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {editable && (onEdit || onDelete) && (
                <div className="flex gap-2 ml-4">
                  {onEdit && (
                    <button
                      onClick={() => onEdit(question.id)}
                      className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                      Edit
                    </button>
                  )}
                  {onDelete && (
                    <button
                      onClick={() => onDelete(question.id)}
                      className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
                    >
                      Delete
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {editable && onSave && (
        <div className="flex justify-end gap-4 pt-4">
          <button
            onClick={onSave}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
          >
            Save Quiz to Course
          </button>
        </div>
      )}
    </div>
  );
};

export default QuizPreview;
