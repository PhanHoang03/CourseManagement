"use client"

import { useState, useEffect } from "react";
import VideoViewer from "./VideoViewer";
import DocumentViewer from "./DocumentViewer";
import TextViewer from "./TextViewer";
import LinkViewer from "./LinkViewer";
// Quiz removed - use Assessment instead

interface ContentViewerProps {
  content: any;
  enrollmentId: string;
  onComplete?: (contentId: string) => void;
  onProgress?: (contentId: string, progress: number) => void;
  progress?: any; // Progress data to check completion status
}

const ContentViewer = ({ content, enrollmentId, onComplete, onProgress, progress }: ContentViewerProps) => {
  if (!content) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-gray-500">No content selected</p>
      </div>
    );
  }

  const isCompleted =
    Array.isArray(progress) &&
    progress.some(
      (p: any) =>
        p?.contentId === content.id && (p?.status === "completed" || p?.completed === true)
    );

  const renderContent = () => {
    switch (content.contentType) {
      case 'video':
        return (
          <VideoViewer
            key={content.id}
            content={content}
            enrollmentId={enrollmentId}
            onComplete={onComplete}
            onProgress={onProgress}
            initialCompleted={isCompleted}
          />
        );
      case 'document':
        return (
          <DocumentViewer
            key={content.id}
            content={content}
            enrollmentId={enrollmentId}
            onComplete={onComplete}
            initialCompleted={isCompleted}
          />
        );
      case 'text':
        return (
          <TextViewer
            key={content.id}
            content={content}
            enrollmentId={enrollmentId}
            onComplete={onComplete}
            initialCompleted={isCompleted}
          />
        );
      case 'link':
        return (
          <LinkViewer
            key={content.id}
            content={content}
            enrollmentId={enrollmentId}
            onComplete={onComplete}
            initialCompleted={isCompleted}
          />
        );
      default:
        return (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-gray-500">Content type "{content.contentType}" not supported yet</p>
          </div>
        );
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
      <div className="flex-1 min-h-0 overflow-y-auto">
        {renderContent()}
      </div>
    </div>
  );
};

export default ContentViewer;
