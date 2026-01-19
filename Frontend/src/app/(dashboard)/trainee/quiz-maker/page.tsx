"use client"

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import DocumentUploader from "@/components/ai/DocumentUploader";
import QuizPreview from "@/components/ai/QuizPreview";
import { aiApi } from "@/lib/api";

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

const TraineeQuizMakerPage = () => {
  const router = useRouter();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [generatedQuiz, setGeneratedQuiz] = useState<QuizData | null>(null);
  const [loading, setLoading] = useState(false);
  const [summarizing, setSummarizing] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [savedQuizzes, setSavedQuizzes] = useState<any[]>([]);
  const [showSavedQuizzes, setShowSavedQuizzes] = useState(false);

  // Quiz generation options
  const [numQuestions, setNumQuestions] = useState(10);
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [questionTypes, setQuestionTypes] = useState<('multiple-choice' | 'true-false' | 'multiple-select')[]>(['multiple-choice', 'true-false']);

  // Load saved quizzes on mount and check for shared quiz import
  useEffect(() => {
    // Load saved quizzes from localStorage
    try {
      const saved = JSON.parse(localStorage.getItem('personalQuizzes') || '[]');
      setSavedQuizzes(saved);
    } catch (e) {
      console.error("Failed to load saved quizzes:", e);
    }

    // Check for shared quiz import from URL
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const importData = params.get('import');
      if (importData) {
        try {
          const decoded = atob(importData);
          const quizData = JSON.parse(decoded);
          setGeneratedQuiz(quizData);
          // Clean URL
          window.history.replaceState({}, '', window.location.pathname);
        } catch (e) {
          setError("Failed to import shared quiz. The link may be invalid.");
        }
      }
    }
  }, []);

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

  const handleSaveToPersonalLibrary = () => {
    if (!generatedQuiz) {
      setError("No quiz to save");
      return;
    }

    try {
      // Get saved quizzes from localStorage
      const saved = JSON.parse(localStorage.getItem('personalQuizzes') || '[]');
      
      // Create quiz entry
      const quizEntry = {
        id: `quiz-${Date.now()}`,
        title: `Quiz: ${selectedFile?.name.replace(/\.[^/.]+$/, '') || 'Generated Quiz'}`,
        createdAt: new Date().toISOString(),
        quizData: generatedQuiz,
        sourceFile: selectedFile?.name || 'Unknown',
      };

      // Add to saved quizzes
      const updated = [...saved, quizEntry];
      localStorage.setItem('personalQuizzes', JSON.stringify(updated));
      setSavedQuizzes(updated);

      alert("Quiz saved to your personal library!");
    } catch (err: any) {
      setError("Failed to save quiz to personal library: " + err.message);
    }
  };

  const handleLoadSavedQuiz = (quiz: any) => {
    setGeneratedQuiz(quiz.quizData);
    setShowSavedQuizzes(false);
    setError(null);
  };

  const handleDeleteSavedQuiz = (quizId: string) => {
    if (!confirm("Are you sure you want to delete this saved quiz?")) return;
    
    try {
      const updated = savedQuizzes.filter((q: any) => q.id !== quizId);
      localStorage.setItem('personalQuizzes', JSON.stringify(updated));
      setSavedQuizzes(updated);
    } catch (err: any) {
      setError("Failed to delete quiz: " + err.message);
    }
  };

  const handleShareQuiz = () => {
    if (!generatedQuiz) {
      setError("No quiz to share");
      return;
    }

    try {
      // Create a shareable link (base64 encoded quiz data)
      const quizData = JSON.stringify(generatedQuiz);
      const encoded = btoa(quizData);
      const shareUrl = `${window.location.origin}/trainee/quiz-maker?import=${encoded}`;
      
      // Copy to clipboard
      navigator.clipboard.writeText(shareUrl);
      alert("Quiz link copied to clipboard! Share it with others to let them import this quiz.");
    } catch (err: any) {
      setError("Failed to generate share link: " + err.message);
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">AI Quiz Maker</h1>
          <p className="text-gray-600 mt-1">
            Upload a document and let AI generate a quiz for you
          </p>
        </div>
        {savedQuizzes.length > 0 && (
          <button
            onClick={() => setShowSavedQuizzes(!showSavedQuizzes)}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm"
          >
            {showSavedQuizzes ? 'Hide' : 'View'} Saved Quizzes ({savedQuizzes.length})
          </button>
        )}
      </div>

      {/* Saved Quizzes Panel */}
      {showSavedQuizzes && (
        <div className="bg-white rounded-lg border p-6">
          <h2 className="text-lg font-semibold mb-4">My Saved Quizzes</h2>
          {savedQuizzes.length === 0 ? (
            <p className="text-gray-500">No saved quizzes yet. Generate and save a quiz to see it here.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {savedQuizzes.map((quiz: any) => (
                <div key={quiz.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                  <h3 className="font-medium text-gray-900 mb-2">{quiz.title}</h3>
                  <p className="text-sm text-gray-500 mb-2">
                    {new Date(quiz.createdAt).toLocaleDateString()}
                  </p>
                  <p className="text-xs text-gray-400 mb-3">
                    Source: {quiz.sourceFile}
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleLoadSavedQuiz(quiz)}
                      className="flex-1 px-3 py-1.5 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                    >
                      Load
                    </button>
                    <button
                      onClick={() => handleDeleteSavedQuiz(quiz.id)}
                      className="px-3 py-1.5 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

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
                onClick={handleSaveToPersonalLibrary}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
              >
                Save to Library
              </button>
              <button
                onClick={handleShareQuiz}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
              >
                Share Quiz
              </button>
            </div>
          </div>
          
          <QuizPreview
            quizData={generatedQuiz}
            onEdit={handleEditQuestion}
            onDelete={handleDeleteQuestion}
            editable={true}
          />
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

export default TraineeQuizMakerPage;
