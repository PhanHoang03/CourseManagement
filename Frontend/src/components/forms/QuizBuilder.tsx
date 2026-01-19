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

interface QuizBuilderProps {
  value?: any;
  onChange: (quizData: any) => void;
}

const QuizBuilder = ({ value, onChange }: QuizBuilderProps) => {
  const [quizData, setQuizData] = useState<any>(() => {
    if (value) {
      return typeof value === 'string' ? JSON.parse(value) : value;
    }
    return {
      questions: [],
      settings: {
        passingScore: 70,
        allowRetake: true,
        randomizeQuestions: false,
        showResultsImmediately: true,
      },
    };
  });

  const updateQuizData = (updates: any) => {
    const newData = { ...quizData, ...updates };
    setQuizData(newData);
    onChange(newData);
  };

  const addQuestion = () => {
    const newQuestion: QuizQuestion = {
      id: `q-${Date.now()}`,
      type: 'multiple-choice',
      question: '',
      options: ['', ''],
      correctAnswers: 0,
      points: 1,
    };
    updateQuizData({
      questions: [...quizData.questions, newQuestion],
    });
  };

  const updateQuestion = (questionId: string, updates: Partial<QuizQuestion>) => {
    const newQuestions = quizData.questions.map((q: QuizQuestion) =>
      q.id === questionId ? { ...q, ...updates } : q
    );
    updateQuizData({ questions: newQuestions });
  };

  const deleteQuestion = (questionId: string) => {
    const newQuestions = quizData.questions.filter((q: QuizQuestion) => q.id !== questionId);
    updateQuizData({ questions: newQuestions });
  };

  const addOption = (questionId: string) => {
    const question = quizData.questions.find((q: QuizQuestion) => q.id === questionId);
    if (question) {
      updateQuestion(questionId, {
        options: [...question.options, ''],
      });
    }
  };

  const updateOption = (questionId: string, optionIndex: number, value: string) => {
    const question = quizData.questions.find((q: QuizQuestion) => q.id === questionId);
    if (question) {
      const newOptions = [...question.options];
      newOptions[optionIndex] = value;
      updateQuestion(questionId, { options: newOptions });
    }
  };

  const deleteOption = (questionId: string, optionIndex: number) => {
    const question = quizData.questions.find((q: QuizQuestion) => q.id === questionId);
    if (question && question.options.length > 2) {
      const newOptions = question.options.filter((_, i) => i !== optionIndex);
      const newCorrectAnswers = Array.isArray(question.correctAnswers)
        ? question.correctAnswers.filter(a => a !== optionIndex).map(a => a > optionIndex ? a - 1 : a)
        : question.correctAnswers === optionIndex ? 0 : question.correctAnswers > optionIndex ? question.correctAnswers - 1 : question.correctAnswers;
      updateQuestion(questionId, {
        options: newOptions,
        correctAnswers: newCorrectAnswers,
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Settings */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h3 className="font-semibold mb-4">Quiz Settings</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-gray-500 block mb-1">Passing Score (%)</label>
            <input
              type="number"
              min="0"
              max="100"
              value={quizData.settings.passingScore}
              onChange={(e) => updateQuizData({
                settings: { ...quizData.settings, passingScore: parseInt(e.target.value) || 70 },
              })}
              className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={quizData.settings.allowRetake}
              onChange={(e) => updateQuizData({
                settings: { ...quizData.settings, allowRetake: e.target.checked },
              })}
              className="w-4 h-4"
            />
            <label className="text-sm text-gray-700">Allow retake if failed</label>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={quizData.settings.randomizeQuestions}
              onChange={(e) => updateQuizData({
                settings: { ...quizData.settings, randomizeQuestions: e.target.checked },
              })}
              className="w-4 h-4"
            />
            <label className="text-sm text-gray-700">Randomize question order</label>
          </div>
        </div>
      </div>

      {/* Questions */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">Questions ({quizData.questions.length})</h3>
          <button
            type="button"
            onClick={addQuestion}
            className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700"
          >
            + Add Question
          </button>
        </div>

        <div className="space-y-4">
          {quizData.questions.map((question: QuizQuestion, index: number) => (
            <div key={question.id} className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-start justify-between mb-4">
                <h4 className="font-medium">Question {index + 1}</h4>
                <button
                  type="button"
                  onClick={() => deleteQuestion(question.id)}
                  className="text-red-600 hover:text-red-800 text-sm"
                >
                  Delete
                </button>
              </div>

              <div className="space-y-4">
                {/* Question Type */}
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Question Type</label>
                  <select
                    value={question.type}
                    onChange={(e) => {
                      const newType = e.target.value as QuizQuestion['type'];
                      let newCorrectAnswers: number | number[] = 0;
                      if (newType === 'true-false') {
                        newCorrectAnswers = 0;
                        updateQuestion(question.id, { type: newType, options: ['True', 'False'], correctAnswers: newCorrectAnswers });
                      } else if (newType === 'multiple-select') {
                        newCorrectAnswers = Array.isArray(question.correctAnswers) ? question.correctAnswers : [question.correctAnswers];
                        updateQuestion(question.id, { type: newType, correctAnswers: newCorrectAnswers });
                      } else {
                        newCorrectAnswers = Array.isArray(question.correctAnswers) ? question.correctAnswers[0] : question.correctAnswers;
                        updateQuestion(question.id, { type: newType, correctAnswers: newCorrectAnswers });
                      }
                    }}
                    className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
                  >
                    <option value="multiple-choice">Multiple Choice</option>
                    <option value="true-false">True/False</option>
                    <option value="multiple-select">Multiple Select</option>
                  </select>
                </div>

                {/* Question Text */}
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Question</label>
                  <textarea
                    value={question.question}
                    onChange={(e) => updateQuestion(question.id, { question: e.target.value })}
                    className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
                    rows={2}
                    placeholder="Enter your question here..."
                  />
                </div>

                {/* Options */}
                {question.type !== 'true-false' && (
                  <div>
                    <label className="text-xs text-gray-500 block mb-2">Options</label>
                    <div className="space-y-2">
                      {question.options.map((option, optionIndex) => (
                        <div key={optionIndex} className="flex items-center gap-2">
                          <input
                            type={question.type === 'multiple-select' ? 'checkbox' : 'radio'}
                            name={`correct-${question.id}`}
                            checked={
                              question.type === 'multiple-select'
                                ? (question.correctAnswers as number[]).includes(optionIndex)
                                : question.correctAnswers === optionIndex
                            }
                            onChange={(e) => {
                              if (question.type === 'multiple-select') {
                                const current = (question.correctAnswers as number[]) || [];
                                const newAnswers = current.includes(optionIndex)
                                  ? current.filter(a => a !== optionIndex)
                                  : [...current, optionIndex];
                                updateQuestion(question.id, { correctAnswers: newAnswers });
                              } else {
                                updateQuestion(question.id, { correctAnswers: optionIndex });
                              }
                            }}
                            className="w-4 h-4"
                          />
                          <input
                            type="text"
                            value={option}
                            onChange={(e) => updateOption(question.id, optionIndex, e.target.value)}
                            className="flex-1 ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm"
                            placeholder={`Option ${optionIndex + 1}`}
                          />
                          {question.options.length > 2 && (
                            <button
                              type="button"
                              onClick={() => deleteOption(question.id, optionIndex)}
                              className="text-red-600 hover:text-red-800 px-2"
                            >
                              ×
                            </button>
                          )}
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => addOption(question.id)}
                        className="text-blue-600 hover:text-blue-800 text-sm"
                      >
                        + Add Option
                      </button>
                    </div>
                  </div>
                )}

                {/* True/False Options */}
                {question.type === 'true-false' && (
                  <div>
                    <label className="text-xs text-gray-500 block mb-2">Correct Answer</label>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name={`correct-${question.id}`}
                          checked={question.correctAnswers === 0}
                          onChange={() => updateQuestion(question.id, { correctAnswers: 0 })}
                          className="w-4 h-4"
                        />
                        <span>True</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name={`correct-${question.id}`}
                          checked={question.correctAnswers === 1}
                          onChange={() => updateQuestion(question.id, { correctAnswers: 1 })}
                          className="w-4 h-4"
                        />
                        <span>False</span>
                      </label>
                    </div>
                  </div>
                )}

                {/* Points */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-gray-500 block mb-1">Points</label>
                    <input
                      type="number"
                      min="1"
                      value={question.points}
                      onChange={(e) => updateQuestion(question.id, { points: parseInt(e.target.value) || 1 })}
                      className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 block mb-1">Explanation (optional)</label>
                    <input
                      type="text"
                      value={question.explanation || ''}
                      onChange={(e) => updateQuestion(question.id, { explanation: e.target.value })}
                      className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
                      placeholder="Why this is correct..."
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}

          {quizData.questions.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <p>No questions yet. Click "Add Question" to get started.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuizBuilder;
