"use client"

import { useState, useRef, useEffect } from "react";
import { progressApi } from "@/lib/api";

interface VideoViewerProps {
  content: any;
  enrollmentId: string;
  onComplete?: (contentId: string) => void;
  onProgress?: (contentId: string, progress: number) => void;
  initialCompleted?: boolean;
}

const VideoViewer = ({ content, enrollmentId, onComplete, onProgress, initialCompleted }: VideoViewerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [watchedPercentage, setWatchedPercentage] = useState(0);
  const [isCompleted, setIsCompleted] = useState(!!initialCompleted);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Video URL from contentData or fileUrl
  const rawVideoUrl = content.contentData?.url || content.fileUrl || '';
  const completionThreshold = 0.8; // 80% watched = complete

  // Normalize video URL - convert relative paths to absolute URLs
  const normalizeVideoUrl = (url: string): string => {
    if (!url) return '';
    
    // Blob URLs should never be modified (they're created by the browser)
    if (url.startsWith('blob:')) {
      return url;
    }
    
    // Data URLs should not be modified
    if (url.startsWith('data:')) {
      return url;
    }
    
    // If it's already an absolute URL (http:// or https://), return as is
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('//')) {
      return url;
    }
    
    // If it starts with /, it's a relative path from server root
    // Get the backend base URL (remove /api/v1)
    const backendBaseUrl = typeof window !== 'undefined' 
      ? (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1')
      : 'http://localhost:5000/api/v1';
    
    // Remove /api/v1 to get base server URL
    const serverBase = backendBaseUrl.replace('/api/v1', '');
    
    // Ensure path starts with /
    const normalizedPath = url.startsWith('/') ? url : `/${url}`;
    
    return `${serverBase}${normalizedPath}`;
  };

  const videoUrl = normalizeVideoUrl(rawVideoUrl);

  // Reset/sync when switching content
  useEffect(() => {
    setIsCompleted(!!initialCompleted);
  }, [content.id, initialCompleted]);

  // Validate video URL
  useEffect(() => {
    if (!rawVideoUrl) {
      setError("No video URL available");
      setLoading(false);
      return;
    }

    // Check if normalized URL is valid
    try {
      const normalized = normalizeVideoUrl(rawVideoUrl);
      if (!normalized) {
        setError("Invalid video URL");
        setLoading(false);
        return;
      }
      
      // Check for placeholder URLs (e.g., cdn.example.com)
      if (normalized.includes('example.com') || normalized.includes('example.org')) {
        setError("Please update the video URL - placeholder URL detected (e.g., cdn.example.com). URL: " + normalized);
        setLoading(false);
        return;
      }
      
      new URL(normalized);
    } catch (e) {
      // For blob URLs, URL constructor might fail but they're still valid
      if (!rawVideoUrl.startsWith('blob:')) {
        setError(`Invalid video URL format: ${rawVideoUrl}`);
        setLoading(false);
        return;
      }
    }

    setError(null);
  }, [rawVideoUrl]);

  // Update video src when videoUrl changes
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !videoUrl) return;
    
    // For blob URLs, check if they're still valid before using
    if (videoUrl.startsWith('blob:')) {
      // Blob URLs should be set directly - don't call load() as it may invalidate them
      if (video.src !== videoUrl) {
        try {
          video.src = videoUrl;
          // Don't call load() for blob URLs - just set src
        } catch (e) {
          console.error("Error setting blob URL:", e);
          setError("Blob URL is invalid or has been revoked. Please reload the video or re-upload the file.");
          setLoading(false);
        }
      }
    } else {
      // For regular URLs, update and reload
      if (video.src !== videoUrl) {
        video.src = videoUrl;
        video.load(); // Reload the video with new source
      }
    }
  }, [videoUrl]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !videoUrl || error) return;

    const handleTimeUpdate = () => {
      const current = video.currentTime;
      const dur = video.duration || duration;
      setCurrentTime(current);
      
      if (dur > 0) {
        const percentage = (current / dur) * 100;
        setWatchedPercentage(percentage);
        
        // Auto-complete when threshold reached
        if (percentage >= completionThreshold * 100 && !isCompleted) {
          handleComplete();
        }
        
        // Report progress
        if (onProgress) {
          onProgress(content.id, Math.round(percentage));
        }
      }
    };

    const handleLoadedMetadata = () => {
      setDuration(video.duration);
      setLoading(false);
    };

    const handleEnded = () => {
      setPlaying(false);
      handleComplete();
    };

    const handleError = (e: Event) => {
      const video = e.target as HTMLVideoElement;
      if (video && video.error) {
        // Only show error if video element actually has an error
        console.error("Video error:", video.error);
        console.error("Video URL:", videoUrl);
        console.error("Raw video URL:", rawVideoUrl);
        let errorMessage = "Failed to load video.";
        
        switch (video.error.code) {
          case video.error.MEDIA_ERR_ABORTED:
            errorMessage = "Video loading was aborted.";
            break;
          case video.error.MEDIA_ERR_NETWORK:
            errorMessage = "Network error while loading video. Please check your connection and CORS settings.";
            break;
          case video.error.MEDIA_ERR_DECODE:
            errorMessage = "Video decoding error. The video file may be corrupted.";
            break;
          case video.error.MEDIA_ERR_SRC_NOT_SUPPORTED:
            if (videoUrl.startsWith('blob:')) {
              errorMessage = `Blob URL may be invalid or expired. URL: ${videoUrl}. This can happen if the blob was revoked or the file format is not supported.`;
            } else if (videoUrl.startsWith('data:')) {
              errorMessage = `Data URL format not supported. The video file format may not be compatible with the browser.`;
            } else if (!videoUrl.startsWith('http') && !videoUrl.startsWith('//')) {
              errorMessage = `Video format not supported or URL is invalid. URL: ${videoUrl} (Hint: Check if the URL is properly formatted with http:// or https://)`;
            } else {
              errorMessage = `Video format not supported by browser. URL: ${videoUrl}. The video file format may not be compatible, or the server may not be serving the file correctly.`;
            }
            break;
          default:
            errorMessage = `Unknown video error (code: ${video.error.code}). URL: ${videoUrl}`;
        }
        
        setError(errorMessage);
        setLoading(false);
      }
    };

    const handleLoadStart = () => {
      setLoading(true);
      setError(null); // Clear any previous errors when loading starts
    };

    const handleCanPlay = () => {
      setLoading(false);
      setError(null); // Clear any errors when video can play
    };

    const handleLoadedData = () => {
      setLoading(false);
      setError(null);
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('ended', handleEnded);
    video.addEventListener('error', handleError);
    video.addEventListener('loadstart', handleLoadStart);
    video.addEventListener('canplay', handleCanPlay);
    video.addEventListener('loadeddata', handleLoadedData);

    // Check if video already has an error (in case it failed before event listeners were attached)
    // Use setTimeout to check after a short delay to ensure error state is set
    const checkError = setTimeout(() => {
      if (video && video.error) {
        handleError(new Event('error'));
      }
    }, 100);

    return () => {
      clearTimeout(checkError);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('ended', handleEnded);
      video.removeEventListener('error', handleError);
      video.removeEventListener('loadstart', handleLoadStart);
      video.removeEventListener('canplay', handleCanPlay);
      video.removeEventListener('loadeddata', handleLoadedData);
    };
  }, [duration, isCompleted, content.id, onProgress, videoUrl, error]);

  const handleComplete = async () => {
    if (isCompleted) return;
    
    setIsCompleted(true);
    
    try {
      await progressApi.completeContent({
        enrollmentId,
        contentId: content.id,
        moduleId: content.moduleId,
        completed: true,
      });
      
      if (onComplete) {
        onComplete(content.id);
      }
    } catch (error) {
      console.error("Failed to mark content as complete:", error);
      setIsCompleted(false);
    }
  };

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    
    if (playing) {
      video.pause();
    } else {
      video.play();
    }
    setPlaying(!playing);
  };

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!videoUrl) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8">
        <div className="bg-white rounded-lg border border-gray-200 p-6 max-w-md">
          <div className="text-center">
            <p className="text-red-600 font-semibold mb-2">Video Not Available</p>
            <p className="text-gray-600 text-sm mb-4">
              No video URL available for this content.
            </p>
            {content.description && (
              <p className="text-gray-500 text-xs mb-4">{content.description}</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8">
        <div className="bg-white rounded-lg border border-gray-200 p-6 max-w-md">
          <div className="text-center">
            <p className="text-red-600 font-semibold mb-2">Video Playback Error</p>
            <p className="text-gray-600 text-sm mb-4">
              {error}
            </p>
            <p className="text-gray-500 text-xs mb-4">
              The video file may not be playable in the browser due to format or CORS restrictions.
            </p>
            {content.description && (
              <p className="text-gray-500 text-xs mb-4">{content.description}</p>
            )}
            <div className="flex flex-col gap-2">
              <a
                href={videoUrl}
                target="_blank"
                rel="noopener noreferrer"
                download
                className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700"
              >
                Download Video
              </a>
              <button
                onClick={async () => {
                  // Allow manual completion if video can't play in browser
                  if (!isCompleted) {
                    await handleComplete();
                  }
                }}
                className="px-4 py-2 bg-green-600 text-white rounded-md text-sm hover:bg-green-700"
              >
                Mark as Viewed
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-black min-h-0">
      {/* Video Player */}
      <div className="flex items-center justify-center relative max-h-[70vh] min-h-[400px]">
        {loading && !error && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-75 z-10">
            <div className="text-white">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-2"></div>
              <p className="text-sm">Loading video...</p>
            </div>
          </div>
        )}
        <video
          ref={videoRef}
          src={videoUrl}
          className="max-w-full max-h-[70vh] w-auto h-auto"
          controls
          preload="metadata"
          playsInline
        >
          Your browser does not support the video tag.
        </video>
        {!loading && !error && (
          <div className="absolute bottom-4 right-4">
            <a
              href={videoUrl}
              target="_blank"
              rel="noopener noreferrer"
              download
              className="px-3 py-2 bg-black bg-opacity-50 text-white rounded-md text-xs hover:bg-opacity-75"
              title="Download video"
            >
              ⬇ Download
            </a>
          </div>
        )}
      </div>

      {/* Video Controls Bar */}
      <div className="bg-gray-900 text-white p-4">
        <div className="flex items-center gap-4 mb-2">
          <button
            onClick={togglePlay}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md"
          >
            {playing ? "Pause" : "Play"}
          </button>
          <div className="flex-1">
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full"
                style={{ width: `${watchedPercentage}%` }}
              ></div>
            </div>
          </div>
          <div className="text-sm">
            {formatTime(currentTime)} / {formatTime(duration)}
          </div>
        </div>
        <div className="flex items-center justify-between text-xs text-gray-400">
          <span>{Math.round(watchedPercentage)}% watched</span>
          {watchedPercentage >= completionThreshold * 100 && (
            <span className="text-green-400">✓ Auto-completed</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default VideoViewer;
