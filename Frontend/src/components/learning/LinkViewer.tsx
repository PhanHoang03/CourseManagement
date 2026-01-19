"use client"

import { useEffect, useState } from "react";
import { progressApi } from "@/lib/api";

interface LinkViewerProps {
  content: any;
  enrollmentId: string;
  onComplete?: (contentId: string) => void;
  initialCompleted?: boolean;
}

const LinkViewer = ({ content, enrollmentId, onComplete, initialCompleted }: LinkViewerProps) => {
  const [isCompleted, setIsCompleted] = useState(!!initialCompleted);
  const [loading, setLoading] = useState(false);

  const linkUrl = content.contentData?.url || content.contentUrl || '';

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

  if (!linkUrl) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-gray-500">No link URL available</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col">
      {/* Link Content */}
      <div className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold mb-4">External Link</h3>
            <p className="text-gray-600 mb-4">{content.description || "Click the link below to view external content."}</p>
            <a
              href={linkUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Open Link →
            </a>
            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
              <p className="text-sm text-yellow-800">
                ⚠️ This link will open in a new tab. Make sure to review the content before marking as complete.
              </p>
            </div>
          </div>
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

export default LinkViewer;
