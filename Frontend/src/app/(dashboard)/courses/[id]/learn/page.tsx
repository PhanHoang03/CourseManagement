"use client"

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { coursesApi, modulesApi, contentsApi, enrollmentsApi, progressApi, assessmentsApi } from "@/lib/api";
import Image from "next/image";
import Link from "next/link";
import ContentViewer from "@/components/learning/ContentViewer";
import AssessmentViewer from "@/components/learning/AssessmentViewer";
import CourseChatbot from "@/components/learning/CourseChatbot";

const LearningPage = () => {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const courseId = params.id as string;

  const [course, setCourse] = useState<any>(null);
  const [enrollment, setEnrollment] = useState<any>(null);
  const [modules, setModules] = useState<any[]>([]);
  const [moduleContents, setModuleContents] = useState<{ [key: string]: any[] }>({});
  const [moduleAssessments, setModuleAssessments] = useState<{ [key: string]: any[] }>({});
  const [courseAssessments, setCourseAssessments] = useState<any[]>([]);
  const [progress, setProgress] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Current content/assessment tracking
  const [currentModuleId, setCurrentModuleId] = useState<string | null>(null);
  const [currentContentId, setCurrentContentId] = useState<string | null>(null);
  const [currentAssessmentId, setCurrentAssessmentId] = useState<string | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [chatbotOpen, setChatbotOpen] = useState(false);

  // Fetch all course data
  useEffect(() => {
    const fetchCourseData = async () => {
      if (!user) return;

      try {
        setLoading(true);
        
        // Fetch course
        const courseRes = await coursesApi.getById(courseId);
        if (!courseRes.success || !courseRes.data) {
          alert("Course not found");
          router.push("/trainee/courses");
          return;
        }
        setCourse(courseRes.data);

        // Check enrollment
        const enrollmentsRes = await enrollmentsApi.getAll({ courseId, traineeId: user.id });
        if (!enrollmentsRes.success || !enrollmentsRes.data || enrollmentsRes.data.length === 0) {
          alert("You are not enrolled in this course");
          router.push(`/courses/${courseId}`);
          return;
        }
        const userEnrollment = enrollmentsRes.data[0];
        setEnrollment(userEnrollment);

        // Fetch modules
        const modulesRes = await modulesApi.getByCourse(courseId);
        if (modulesRes.success && modulesRes.data) {
          const sortedModules = modulesRes.data.sort((a: any, b: any) => 
            (a.order || 0) - (b.order || 0)
          );
          setModules(sortedModules);

          // Fetch contents for each module
          const contentsPromises = sortedModules.map((module: any) =>
            contentsApi.getByModule(module.id).then(res => ({
              moduleId: module.id,
              contents: res.success && res.data ? res.data.sort((a: any, b: any) => 
                (a.order || 0) - (b.order || 0)
              ) : [],
            })).catch(() => ({ moduleId: module.id, contents: [] }))
          );
          const contentsResults = await Promise.all(contentsPromises);
          const contentsMap: { [key: string]: any[] } = {};
          contentsResults.forEach(({ moduleId, contents }) => {
            contentsMap[moduleId] = contents;
          });
          setModuleContents(contentsMap);

          // Fetch assessments for each module (replaces quizzes)
          const assessmentsPromises = sortedModules.map((module: any) =>
            assessmentsApi.getAll({ moduleId: module.id, type: 'quiz' }).then(res => ({
              moduleId: module.id,
              assessments: res.success && res.data ? res.data : [],
            })).catch(() => ({ moduleId: module.id, assessments: [] }))
          );
          const assessmentsResults = await Promise.all(assessmentsPromises);
          const assessmentsMap: { [key: string]: any[] } = {};
          assessmentsResults.forEach(({ moduleId, assessments }) => {
            assessmentsMap[moduleId] = assessments;
          });
          setModuleAssessments(assessmentsMap);

          // Fetch course-level assessments
          const courseAssessmentsRes = await assessmentsApi.getAll({ courseId, type: 'quiz' });
          if (courseAssessmentsRes.success && courseAssessmentsRes.data) {
            // Filter out module-level assessments (they're already in moduleAssessments)
            const courseLevelOnly = courseAssessmentsRes.data.filter((a: any) => !a.moduleId);
            setCourseAssessments(courseLevelOnly);
          }

          // Set initial content (first module, first content or assessment)
          if (sortedModules.length > 0) {
            const firstModule = sortedModules[0];
            setCurrentModuleId(firstModule.id);
            if (contentsMap[firstModule.id] && contentsMap[firstModule.id].length > 0) {
              setCurrentContentId(contentsMap[firstModule.id][0].id);
            } else if (assessmentsMap[firstModule.id] && assessmentsMap[firstModule.id].length > 0) {
              setCurrentAssessmentId(assessmentsMap[firstModule.id][0].id);
            }
          }
        }

        // Fetch progress
        const progressRes = await progressApi.getByEnrollment(userEnrollment.id);
        if (progressRes.success && progressRes.data) {
          setProgress(progressRes.data);
        }
      } catch (error) {
        console.error("Failed to fetch course data:", error);
        alert("Failed to load course data");
      } finally {
        setLoading(false);
      }
    };

    fetchCourseData();
  }, [courseId, user, router]);

  // Calculate overall progress
  const calculateProgress = () => {
    if (!modules.length || !enrollment) return 0;
    
    const totalContents = Object.values(moduleContents).reduce((sum, contents) => sum + contents.length, 0);
    if (totalContents === 0) return 0;
    
    // Check status === 'completed' (backend returns this)
    // Only count records with contentId (content-specific progress)
    const completedContents = progress.filter((p: any) => 
      p.contentId && (p.status === 'completed' || p.completed === true)
    ).length;
    return Math.round((completedContents / totalContents) * 100);
  };

  // Get progress for specific content
  const getContentProgress = (contentId: string) => {
    return progress.find((p: any) => p.contentId === contentId);
  };

  // Check if content is completed
  const isContentCompleted = (contentId: string) => {
    const contentProgress = getContentProgress(contentId);
    // Check status === 'completed' (backend returns this)
    return contentProgress?.status === 'completed' || contentProgress?.completed === true || false;
  };

  // Check if module is completed
  const isModuleCompleted = (moduleId: string) => {
    const contents = moduleContents[moduleId] || [];
    if (contents.length === 0) return false;
    return contents.every((content: any) => isContentCompleted(content.id));
  };

  // Navigate to content
  const navigateToContent = (moduleId: string, contentId: string) => {
    setCurrentModuleId(moduleId);
    setCurrentContentId(contentId);
    setCurrentAssessmentId(null); // Clear assessment when navigating to content
  };

  // Navigate to assessment (replaces quiz)
  const navigateToAssessment = (assessmentId: string, moduleId?: string) => {
    if (moduleId) setCurrentModuleId(moduleId);
    setCurrentAssessmentId(assessmentId);
    setCurrentContentId(null); // Clear content when navigating to assessment
  };

  // Get current content
  const currentContent = currentContentId && currentModuleId
    ? moduleContents[currentModuleId]?.find((c: any) => c.id === currentContentId)
    : null;

  // Get current assessment
  const currentAssessment = currentAssessmentId
    ? (currentModuleId && moduleAssessments[currentModuleId]?.find((a: any) => a.id === currentAssessmentId)) ||
      courseAssessments.find((a: any) => a.id === currentAssessmentId)
    : null;

  // Find previous/next content
  const findPreviousContent = () => {
    if (!currentModuleId || !currentContentId) return null;

    const currentModuleIndex = modules.findIndex((m: any) => m.id === currentModuleId);
    const currentContents = moduleContents[currentModuleId] || [];
    const currentContentIndex = currentContents.findIndex((c: any) => c.id === currentContentId);

    // Check previous in same module
    if (currentContentIndex > 0) {
      return {
        moduleId: currentModuleId,
        contentId: currentContents[currentContentIndex - 1].id,
      };
    }

    // Check previous module
    if (currentModuleIndex > 0) {
      const prevModule = modules[currentModuleIndex - 1];
      const prevContents = moduleContents[prevModule.id] || [];
      if (prevContents.length > 0) {
        return {
          moduleId: prevModule.id,
          contentId: prevContents[prevContents.length - 1].id,
        };
      }
    }

    return null;
  };

  const findNextContent = () => {
    if (!currentModuleId || !currentContentId) return null;

    const currentModuleIndex = modules.findIndex((m: any) => m.id === currentModuleId);
    const currentContents = moduleContents[currentModuleId] || [];
    const currentContentIndex = currentContents.findIndex((c: any) => c.id === currentContentId);

    // Check next in same module
    if (currentContentIndex < currentContents.length - 1) {
      return {
        moduleId: currentModuleId,
        contentId: currentContents[currentContentIndex + 1].id,
      };
    }

    // Check next module
    if (currentModuleIndex < modules.length - 1) {
      const nextModule = modules[currentModuleIndex + 1];
      const nextContents = moduleContents[nextModule.id] || [];
      if (nextContents.length > 0) {
        return {
          moduleId: nextModule.id,
          contentId: nextContents[0].id,
        };
      }
    }

    return null;
  };

  const previousContent = findPreviousContent();
  const nextContent = findNextContent();

  // Handle content completion
  const handleContentComplete = async (contentId: string) => {
    // Refresh progress
    if (enrollment) {
      try {
        const progressRes = await progressApi.getByEnrollment(enrollment.id);
        if (progressRes.success && progressRes.data) {
          setProgress(progressRes.data);
        }
      } catch (error) {
        console.error("Failed to refresh progress:", error);
      }
    }
  };

  // Navigate to next content after completion
  const handleNavigateNext = () => {
    if (nextContent) {
      navigateToContent(nextContent.moduleId, nextContent.contentId);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!course || !enrollment) {
    return null;
  }

  const overallProgress = calculateProgress();

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href={`/courses/${courseId}`}
              className="text-gray-600 hover:text-gray-900"
            >
              ← Back to Course
            </Link>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">{course.title}</h1>
              <p className="text-sm text-gray-500">{course.courseCode}</p>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-right">
              <p className="text-sm text-gray-500">Progress</p>
              <p className="text-lg font-semibold">{overallProgress}%</p>
            </div>
            <div className="w-32 bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all"
                style={{ width: `${overallProgress}%` }}
              ></div>
            </div>
            <button
              onClick={() => setChatbotOpen(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center gap-2"
              title="Ask AI assistant about this course"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <span className="hidden sm:inline">AI Assistant</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Modules */}
        <div className={`${sidebarCollapsed ? 'w-0' : 'w-80'} bg-white border-r border-gray-200 overflow-y-auto transition-all duration-300`}>
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900">Course Content</h2>
              <button
                onClick={() => setSidebarCollapsed(true)}
                className="text-gray-500 hover:text-gray-700"
              >
                ←
              </button>
            </div>
            <div className="space-y-2">
              {modules.map((module: any) => {
                const contents = moduleContents[module.id] || [];
                const moduleCompleted = isModuleCompleted(module.id);
                const moduleProgress = contents.length > 0
                  ? Math.round((contents.filter((c: any) => isContentCompleted(c.id)).length / contents.length) * 100)
                  : 0;

                return (
                  <div key={module.id} className="border border-gray-200 rounded-lg">
                    <div
                      className={`p-3 cursor-pointer hover:bg-gray-50 ${
                        currentModuleId === module.id ? 'bg-blue-50 border-l-4 border-blue-600' : ''
                      }`}
                      onClick={() => {
                        if (contents.length > 0) {
                          navigateToContent(module.id, contents[0].id);
                        }
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {moduleCompleted ? (
                            <span className="text-green-600">✓</span>
                          ) : (
                            <span className="text-gray-400">○</span>
                          )}
                          <span className="font-medium text-sm">{module.title}</span>
                        </div>
                        <span className="text-xs text-gray-500">{module.order}</span>
                      </div>
                      {contents.length > 0 && (
                        <div className="mt-2">
                          <div className="w-full bg-gray-200 rounded-full h-1">
                            <div
                              className="bg-blue-600 h-1 rounded-full"
                              style={{ width: `${moduleProgress}%` }}
                            ></div>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            {contents.filter((c: any) => isContentCompleted(c.id)).length} / {contents.length} completed
                          </p>
                        </div>
                      )}
                    </div>
                    {/* Content items */}
                    {contents.map((content: any) => {
                      const contentCompleted = isContentCompleted(content.id);
                      const isActive = currentContentId === content.id;

                      return (
                        <div
                          key={content.id}
                          className={`pl-8 pr-3 py-2 cursor-pointer hover:bg-gray-50 text-sm ${
                            isActive ? 'bg-blue-50 border-l-4 border-blue-600' : ''
                          }`}
                          onClick={() => navigateToContent(module.id, content.id)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              {contentCompleted ? (
                                <span className="text-green-600 text-xs">✓</span>
                              ) : (
                                <span className="text-gray-400 text-xs">○</span>
                              )}
                              <span className={`${isActive ? 'font-semibold' : ''}`}>
                                {content.title}
                              </span>
                            </div>
                            <span className="text-xs text-gray-400">
                              {content.contentType === 'video' && '📹'}
                              {content.contentType === 'document' && '📄'}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                    {/* Assessment items (replaces quizzes) */}
                    {moduleAssessments[module.id]?.map((assessment: any) => {
                      const isActive = currentAssessmentId === assessment.id;

                      return (
                        <div
                          key={assessment.id}
                          className={`pl-8 pr-3 py-2 cursor-pointer hover:bg-gray-50 text-sm ${
                            isActive ? 'bg-blue-50 border-l-4 border-blue-600' : ''
                          }`}
                          onClick={() => navigateToAssessment(assessment.id, module.id)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-gray-400 text-xs">○</span>
                              <span className={`${isActive ? 'font-semibold' : ''}`}>
                                {assessment.title}
                              </span>
                            </div>
                            <span className="text-xs text-gray-400">📝</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
              {/* Course-level assessments */}
              {courseAssessments.length > 0 && (
                <div className="mt-4 border border-gray-200 rounded-lg">
                  <div className="p-3 bg-gray-50">
                    <h3 className="font-medium text-sm text-gray-700">Course Assessments</h3>
                  </div>
                  {courseAssessments.map((assessment: any) => {
                    const isActive = currentAssessmentId === assessment.id;
                    return (
                      <div
                        key={assessment.id}
                        className={`pl-4 pr-3 py-2 cursor-pointer hover:bg-gray-50 text-sm ${
                          isActive ? 'bg-blue-50 border-l-4 border-blue-600' : ''
                        }`}
                        onClick={() => navigateToAssessment(assessment.id)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-gray-400 text-xs">○</span>
                            <span className={`${isActive ? 'font-semibold' : ''}`}>
                              {assessment.title}
                            </span>
                          </div>
                          <span className="text-xs text-gray-400">📝</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Collapse button when sidebar is hidden */}
        {sidebarCollapsed && (
          <button
            onClick={() => setSidebarCollapsed(false)}
            className="absolute left-0 top-1/2 transform -translate-y-1/2 bg-white border border-gray-200 rounded-r-lg px-2 py-4 text-gray-600 hover:text-gray-900"
          >
            →
          </button>
        )}

        {/* Main Content Viewer */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {currentAssessment ? (
            <div className="flex-1 flex flex-col">
              {/* Assessment Header */}
              <div className="bg-white border-b border-gray-200 px-6 py-4">
                <h2 className="text-lg font-semibold">{currentAssessment.title}</h2>
                {currentAssessment.description && (
                  <p className="text-sm text-gray-600 mt-1">{currentAssessment.description}</p>
                )}
              </div>

              {/* Assessment Body */}
              <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
                <AssessmentViewer
                  assessmentId={currentAssessment.id}
                  enrollmentId={enrollment.id}
                  onComplete={() => {
                    // Refresh progress after assessment completion
                    const refreshProgress = async () => {
                      if (enrollment) {
                        const progressRes = await progressApi.getByEnrollment(enrollment.id);
                        if (progressRes.success && progressRes.data) {
                          setProgress(progressRes.data);
                        }
                      }
                    };
                    refreshProgress();
                  }}
                />
              </div>
            </div>
          ) : currentContent ? (
            <div className="flex-1 flex flex-col">
              {/* Content Header */}
              <div className="bg-white border-b border-gray-200 px-6 py-4">
                <h2 className="text-lg font-semibold">{currentContent.title}</h2>
                {currentContent.description && (
                  <p className="text-sm text-gray-600 mt-1">{currentContent.description}</p>
                )}
              </div>

              {/* Content Body */}
              <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
                <ContentViewer
                  content={currentContent ? { ...currentContent, moduleId: currentModuleId } : null}
                  enrollmentId={enrollment.id}
                  onComplete={handleContentComplete}
                  progress={progress}
                />
              </div>

              {/* Navigation Footer */}
              <div className="bg-white border-t border-gray-200 px-6 py-4 flex items-center justify-between">
                <button
                  onClick={() => {
                    if (previousContent) {
                      navigateToContent(previousContent.moduleId, previousContent.contentId);
                    }
                  }}
                  disabled={!previousContent}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  ← Previous
                </button>
                <div className="text-sm text-gray-600">
                  {/* Assessment completion shown in AssessmentViewer */}
                </div>
                <button
                  onClick={() => {
                    if (nextContent) {
                      navigateToContent(nextContent.moduleId, nextContent.contentId);
                    } else {
                      // Course completed
                      alert("Congratulations! You've completed all content in this course.");
                    }
                  }}
                  disabled={!nextContent}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next →
                </button>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-gray-500">No content selected</p>
            </div>
          )}
        </div>

        {/* Right Panel - Progress Info */}
        <div className="w-80 bg-white border-l border-gray-200 overflow-y-auto">
          <div className="p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Progress Overview</h3>
            
            {/* Overall Stats */}
            <div className="mb-6">
              <div className="text-center mb-4">
                <div className="text-4xl font-bold text-blue-600">{overallProgress}%</div>
                <p className="text-sm text-gray-500 mt-1">Course Complete</p>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Modules</span>
                  <span className="font-medium">
                    {modules.filter((m: any) => isModuleCompleted(m.id)).length} / {modules.length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Contents</span>
                  <span className="font-medium">
                    {progress.filter((p: any) => p.contentId && (p.status === 'completed' || p.completed === true)).length} / {Object.values(moduleContents).reduce((sum, contents) => sum + contents.length, 0)}
                  </span>
                </div>
              </div>
            </div>

            {/* Current Module Info */}
            {currentModuleId && (
              <div className="mb-6">
                <h4 className="font-medium text-gray-900 mb-2">Current Module</h4>
                {modules.find((m: any) => m.id === currentModuleId) && (
                  <div>
                    <p className="text-sm text-gray-700">
                      {modules.find((m: any) => m.id === currentModuleId)?.title}
                    </p>
                    <div className="mt-2">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-green-600 h-2 rounded-full"
                          style={{
                            width: `${Math.round((moduleContents[currentModuleId]?.filter((c: any) => isContentCompleted(c.id)).length || 0) / (moduleContents[currentModuleId]?.length || 1) * 100)}%`,
                          }}
                        ></div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Course Chatbot */}
      {course && modules.length > 0 && (
        <CourseChatbot
          courseId={courseId}
          courseTitle={course.title}
          courseDescription={course.description || undefined}
          modules={modules.map((m: any) => ({
            title: m.title,
            description: m.description || undefined
          }))}
          isOpen={chatbotOpen}
          onClose={() => setChatbotOpen(false)}
        />
      )}
    </div>
  );
};

export default LearningPage;
