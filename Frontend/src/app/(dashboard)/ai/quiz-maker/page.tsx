"use client"

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import DocumentUploader from "@/components/ai/DocumentUploader";
import QuizPreview from "@/components/ai/QuizPreview";
import { aiApi, coursesApi, modulesApi, assessmentsApi } from "@/lib/api";

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

const QuizMakerPage = () => {
  const router = useRouter();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [generatedQuiz, setGeneratedQuiz] = useState<QuizData | null>(null);
  const [loading, setLoading] = useState(false);
  const [summarizing, setSummarizing] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Quiz generation options
  const [numQuestions, setNumQuestions] = useState(10);
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [questionTypes, setQuestionTypes] = useState<('multiple-choice' | 'true-false' | 'multiple-select')[]>(['multiple-choice', 'true-false']);

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    setGeneratedQuiz(null);
    setSummary(null);
    setError(null);
  };

  const handleGenerateQuiz = async () => {
    if (!selectedFile) {
      setError("Please select a file first");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await aiApi.generateQuiz(selectedFile, {
        numQuestions,
        difficulty,
        questionTypes,
      });

      if (response.success && response.data) {
        setGeneratedQuiz(response.data);
      } else {
        setError(response.error || "Failed to generate quiz");
      }
    } catch (err: any) {
      setError(err.message || "Failed to generate quiz. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSummarize = async () => {
    if (!selectedFile) {
      setError("Please select a file first");
      return;
    }

    setSummarizing(true);
    setError(null);

    try {
      // For PDF/DOCX, we need to send the file to backend for parsing
      // For TXT, we can read it directly
      let text = '';
      
      if (selectedFile.name.endsWith('.txt')) {
        text = await selectedFile.text();
      } else {
        // For PDF/DOCX, we'll need to use a backend endpoint that parses and summarizes
        // For now, show a message that full file summarization requires backend parsing
        setError("Full document summarization for PDF/DOCX files will be available soon. For now, please use text files or generate a quiz first.");
        setSummarizing(false);
        return;
      }
      
      if (text.length < 50) {
        setError("File content is too short to summarize");
        setSummarizing(false);
        return;
      }

      const response = await aiApi.summarize(text, {
        length: 'medium',
        focus: 'key-points',
      });

      if (response.success && response.data) {
        setSummary(response.data.summary);
      } else {
        setError(response.error || "Failed to summarize document");
      }
    } catch (err: any) {
      setError(err.message || "Failed to summarize document. Please try again.");
    } finally {
      setSummarizing(false);
    }
  };

  const handleEditQuestion = (questionId: string) => {
    // TODO: Implement question editing
    console.log("Edit question:", questionId);
  };

  const handleDeleteQuestion = (questionId: string) => {
    if (!generatedQuiz) return;
    
    const updatedQuestions = generatedQuiz.questions.filter(q => q.id !== questionId);
    setGeneratedQuiz({
      ...generatedQuiz,
      questions: updatedQuestions,
    });
  };

  const [showSaveModal, setShowSaveModal] = useState(false);
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [selectedModuleId, setSelectedModuleId] = useState<string>('');
  const [availableCourses, setAvailableCourses] = useState<any[]>([]);
  const [availableModules, setAvailableModules] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [loadingCourses, setLoadingCourses] = useState(false);

  useEffect(() => {
    if (showSaveModal) {
      fetchCourses();
    }
  }, [showSaveModal]);

  useEffect(() => {
    if (selectedCourseId) {
      fetchModules(selectedCourseId);
    } else {
      setAvailableModules([]);
      setSelectedModuleId('');
    }
  }, [selectedCourseId]);

  const fetchCourses = async () => {
    setLoadingCourses(true);
    try {
      const response = await coursesApi.getAll({ limit: 100 });
      if (response.success && response.data) {
        setAvailableCourses(response.data);
      }
    } catch (error) {
      console.error("Failed to fetch courses:", error);
    } finally {
      setLoadingCourses(false);
    }
  };

  const fetchModules = async (courseId: string) => {
    try {
      const response = await modulesApi.getByCourse(courseId);
      if (response.success && response.data) {
        setAvailableModules(response.data);
      }
    } catch (error) {
      console.error("Failed to fetch modules:", error);
      setAvailableModules([]);
    }
  };

  const handleSaveToCourse = () => {
    setShowSaveModal(true);
  };

  const handleSaveQuiz = async () => {
    if (!generatedQuiz || !selectedCourseId) {
      setError("Please select a course");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      // Get quiz title from input or use default
      const titleInput = document.getElementById('quiz-title-input') as HTMLInputElement;
      const quizTitle = titleInput?.value || `Quiz: ${selectedFile?.name.replace(/\.[^/.]+$/, '') || 'Generated Quiz'}`;
      
      // Create Assessment for the course
      const assessmentData = {
        courseId: selectedCourseId,
        moduleId: selectedModuleId || undefined,
        title: quizTitle,
        description: `AI-generated quiz from ${selectedFile?.name || 'document'}`,
        type: 'quiz' as const,
        questions: generatedQuiz.questions,
        passingScore: generatedQuiz.settings.passingScore || 70,
        timeLimit: generatedQuiz.settings.timeLimit ? Math.ceil(generatedQuiz.settings.timeLimit / 60) : undefined, // Convert seconds to minutes
        maxAttempts: generatedQuiz.settings.allowRetake ? undefined : 1, // If retake not allowed, set maxAttempts to 1
        isRequired: true,
        settings: {
          passingScore: generatedQuiz.settings.passingScore || 70,
          allowRetake: generatedQuiz.settings.allowRetake,
          timeLimit: generatedQuiz.settings.timeLimit ? Math.ceil(generatedQuiz.settings.timeLimit / 60) : undefined, // Convert seconds to minutes
          randomizeQuestions: generatedQuiz.settings.randomizeQuestions || false,
          showResultsImmediately: generatedQuiz.settings.showResultsImmediately !== false,
        },
      };

      const response = await assessmentsApi.create(assessmentData);

      if (response.success) {
        alert("Assessment created successfully!");
        setShowSaveModal(false);
        // Navigate to course detail page to see the new assessment
        router.push(`/list/courses/${selectedCourseId}`);
      } else {
        setError(response.error || "Failed to create assessment");
      }
    } catch (err: any) {
      setError(err.message || "Failed to create assessment. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleDownloadJSON = () => {
    if (!generatedQuiz) return;

    const dataStr = JSON.stringify(generatedQuiz, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `quiz-${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">AI Quiz Maker</h1>
        <p className="text-gray-600 mt-1">
          Upload a document and let AI generate a quiz for you
        </p>
      </div>

      {/* File Upload Section */}
      <div className="bg-white rounded-lg border p-6">
        <h2 className="text-lg font-semibold mb-4">Upload Document</h2>
        <DocumentUploader onFileSelect={handleFileSelect} />
        
        {selectedFile && (
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">{selectedFile.name}</p>
                <p className="text-sm text-gray-600">
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
              <button
                onClick={() => {
                  setSelectedFile(null);
                  setGeneratedQuiz(null);
                  setSummary(null);
                }}
                className="text-red-600 hover:text-red-800 text-sm"
              >
                Remove
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Options Section */}
      {selectedFile && (
        <div className="bg-white rounded-lg border p-6">
          <h2 className="text-lg font-semibold mb-4">Quiz Generation Options</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Number of Questions */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Number of Questions
              </label>
              <input
                type="number"
                min="1"
                max="50"
                value={numQuestions}
                onChange={(e) => setNumQuestions(parseInt(e.target.value) || 10)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Difficulty */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Difficulty Level
              </label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as 'easy' | 'medium' | 'hard')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>

            {/* Question Types */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Question Types
              </label>
              <div className="space-y-2">
                {['multiple-choice', 'true-false', 'multiple-select'].map((type) => (
                  <label key={type} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={questionTypes.includes(type as any)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setQuestionTypes([...questionTypes, type as any]);
                        } else {
                          setQuestionTypes(questionTypes.filter(t => t !== type));
                        }
                      }}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700 capitalize">
                      {type.replace('-', ' ')}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 mt-6">
            <button
              onClick={handleGenerateQuiz}
              disabled={loading || !selectedFile}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
            >
              {loading ? "Generating Quiz..." : "Generate Quiz"}
            </button>
            
            <button
              onClick={handleSummarize}
              disabled={summarizing || !selectedFile}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
            >
              {summarizing ? "Summarizing..." : "Summarize Document"}
            </button>
          </div>
        </div>
      )}

      {/* Summary Section */}
      {summary && (
        <div className="bg-white rounded-lg border p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Document Summary</h2>
            <button
              onClick={() => {
                navigator.clipboard.writeText(summary);
                alert("Summary copied to clipboard!");
              }}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Copy to Clipboard
            </button>
          </div>
          <div className="prose max-w-none">
            <p className="text-gray-700 whitespace-pre-wrap">{summary}</p>
          </div>
        </div>
      )}

      {/* Generated Quiz Preview */}
      {generatedQuiz && (
        <div className="bg-white rounded-lg border p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Generated Quiz Preview</h2>
            <div className="flex gap-2">
              <button
                onClick={handleDownloadJSON}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 text-sm"
              >
                Download JSON
              </button>
              <button
                onClick={handleSaveToCourse}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
              >
                Create Assessment
              </button>
            </div>
          </div>
          
          <QuizPreview
            quizData={generatedQuiz}
            onEdit={handleEditQuestion}
            onDelete={handleDeleteQuestion}
            onSave={handleSaveToCourse}
            editable={true}
          />
        </div>
      )}

      {/* Save to Course Modal */}
      {showSaveModal && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={() => setShowSaveModal(false)}
        >
          <div 
            className="bg-white rounded-lg p-6 max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-semibold mb-4">Create Assessment for Course</h2>
            
            <div className="space-y-4">
              {/* Course Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Course
                </label>
                {loadingCourses ? (
                  <div className="text-sm text-gray-500">Loading courses...</div>
                ) : (
                  <select
                    value={selectedCourseId}
                    onChange={(e) => setSelectedCourseId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">-- Select a Course --</option>
                    {availableCourses.map((course) => (
                      <option key={course.id} value={course.id}>
                        {course.title} ({course.courseCode})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Module Selection */}
              {selectedCourseId && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Module
                  </label>
                  {availableModules.length === 0 ? (
                    <div className="text-sm text-gray-500">
                      No modules found. Please create a module first.
                    </div>
                  ) : (
                    <select
                      value={selectedModuleId}
                      onChange={(e) => setSelectedModuleId(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">-- Select a Module --</option>
                      {availableModules.map((module) => (
                        <option key={module.id} value={module.id}>
                          {module.order}. {module.title}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              )}

              {/* Quiz Title */}
              {selectedModuleId && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Assessment Title
                  </label>
                  <input
                    type="text"
                    defaultValue={`Quiz: ${selectedFile?.name.replace(/\.[^/.]+$/, '') || 'Generated Quiz'}`}
                    id="quiz-title-input"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}

              <div className="flex gap-3 justify-end pt-4">
                <button
                  onClick={() => {
                    setShowSaveModal(false);
                    setSelectedCourseId('');
                    setSelectedModuleId('');
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveQuiz}
                  disabled={saving || !selectedModuleId}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {saving ? "Creating..." : "Create Assessment"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}
    </div>
  );
};

export default QuizMakerPage;
