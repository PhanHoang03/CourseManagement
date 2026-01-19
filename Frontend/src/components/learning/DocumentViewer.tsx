"use client"

import { useEffect, useState } from "react";
import { progressApi } from "@/lib/api";

interface DocumentViewerProps {
  content: any;
  enrollmentId: string;
  onComplete?: (contentId: string) => void;
  initialCompleted?: boolean;
}

const DocumentViewer = ({ content, enrollmentId, onComplete, initialCompleted }: DocumentViewerProps) => {
  const [isCompleted, setIsCompleted] = useState(!!initialCompleted);
  const [loading, setLoading] = useState(false);

  const documentUrl = content.contentData?.url || content.fileUrl || '';

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

  if (!documentUrl) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-gray-500">No document URL available</p>
      </div>
    );
  }

  // Check if it's a PDF
  const isPDF = documentUrl.toLowerCase().endsWith('.pdf') || 
                documentUrl.toLowerCase().includes('.pdf') ||
                content.fileUrl?.toLowerCase().includes('.pdf');

  return (
    <div className="flex-1 flex flex-col">
      {/* Document Viewer */}
      <div className="flex-1 bg-gray-100 p-6">
        {isPDF ? (
          <iframe
            src={documentUrl}
            className="w-full h-full border border-gray-300 rounded-lg"
            title={content.title}
          />
        ) : (
          <div className="bg-white rounded-lg p-6 h-full flex flex-col items-center justify-center">
            <div className="text-center">
              <p className="text-gray-600 mb-4">Document Preview</p>
              <a
                href={documentUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 underline"
              >
                Open document in new tab
              </a>
            </div>
          </div>
        )}
      </div>

      {/* Action Bar */}
      <div className="bg-white border-t border-gray-200 px-6 py-4 flex items-center justify-between">
        <div className="text-sm text-gray-600">
          {content.fileSize && (
            <span>File size: {(content.fileSize / 1024 / 1024).toFixed(2)} MB</span>
          )}
        </div>
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

export default DocumentViewer;
