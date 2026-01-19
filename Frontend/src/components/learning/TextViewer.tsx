"use client"

import { useEffect, useState } from "react";
import { progressApi } from "@/lib/api";

interface TextViewerProps {
  content: any;
  enrollmentId: string;
  onComplete?: (contentId: string) => void;
  initialCompleted?: boolean;
}

const TextViewer = ({ content, enrollmentId, onComplete, initialCompleted }: TextViewerProps) => {
  const [isCompleted, setIsCompleted] = useState(!!initialCompleted);
  const [loading, setLoading] = useState(false);

  const textContent = content.contentData?.text || content.description || '';

  // Reset/sync when switching content
  useEffect(() => {
    setIsCompleted(!!initialCompleted);
    setLoading(false);
  }, [content.id, initialCompleted]);

  const handleComplete = async () => {
    if (isCompleted || loading) return;
    
    setLoading(true);
    
    try {
      await progressApi.completeContent({
        enrollmentId,
        contentId: content.id,
        moduleId: content.moduleId,
        completed: true,
      });
      
      setIsCompleted(true);
      
      if (onComplete) {
        onComplete(content.id);
      }
    } catch (error) {
      console.error("Failed to mark content as complete:", error);
      alert("Failed to mark as complete. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col">
      {/* Text Content */}
      <div className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-4xl mx-auto prose prose-lg">
          <div 
            className="text-gray-700 whitespace-pre-wrap"
            dangerouslySetInnerHTML={{ __html: textContent }}
          />
        </div>
      </div>

      {/* Action Bar */}
      <div className="bg-white border-t border-gray-200 px-6 py-4 flex items-center justify-end">
        <button
          onClick={handleComplete}
          disabled={isCompleted || loading}
          className={`px-6 py-2 rounded-md text-sm font-medium ${
            isCompleted
              ? 'bg-green-100 text-green-800 cursor-not-allowed'
              : loading
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {loading ? "Marking..." : isCompleted ? "✓ Completed" : "Mark as Complete"}
        </button>
      </div>
    </div>
  );
};

export default TextViewer;
