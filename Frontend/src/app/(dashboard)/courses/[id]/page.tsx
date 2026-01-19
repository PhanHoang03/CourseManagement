"use client"

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { coursesApi, modulesApi, contentsApi, enrollmentsApi, assignmentsApi, assessmentsApi, progressApi } from "@/lib/api";
import FormModal from "@/components/FormModal";
import Table from "@/components/Table";
import AssignmentSubmissionsList from "@/components/assignments/AssignmentSubmissionsList";

type TabType = 'overview' | 'modules' | 'assignments' | 'progress';

const CourseDetailTraineePage = () => {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const courseId = params.id as string;

  const [course, setCourse] = useState<any>(null);
  const [enrollment, setEnrollment] = useState<any>(null);
  const [modules, setModules] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [mySubmissions, setMySubmissions] = useState<any[]>([]);
  const [progress, setProgress] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [moduleContents, setModuleContents] = useState<{ [key: string]: any[] }>({});
  const isInstructorOwner = user?.role === "instructor" && course?.instructorId === user?.id;

  const fetchCourseData = async () => {
    try {
      setLoading(true);
      const [courseRes, modulesRes, assignmentsRes] = await Promise.all([
        coursesApi.getById(courseId),
        modulesApi.getByCourse(courseId).catch(() => ({ success: false, data: [] })),
        assignmentsApi.getAll({ courseId }).catch(() => ({ success: false, data: [] })),
      ]);

      if (courseRes.success && courseRes.data) {
        setCourse(courseRes.data);
      }

      if (modulesRes.success && modulesRes.data) {
        setModules(modulesRes.data);
        // Fetch contents for each module
        const contentsPromises = modulesRes.data.map((module: any) =>
          contentsApi.getByModule(module.id).then(res => ({
            moduleId: module.id,
            contents: res.success && res.data ? res.data : [],
          })).catch(() => ({ moduleId: module.id, contents: [] }))
        );
        const contentsResults = await Promise.all(contentsPromises);
        const contentsMap: { [key: string]: any[] } = {};
        contentsResults.forEach(({ moduleId, contents }) => {
          contentsMap[moduleId] = contents;
        });
        setModuleContents(contentsMap);
      }

      if (assignmentsRes.success && assignmentsRes.data) {
        setAssignments(assignmentsRes.data);
      }

      // Check if user is enrolled
      if (user) {
        try {
          const enrollmentsRes = await enrollmentsApi.getAll({ courseId, traineeId: user.id });
          if (enrollmentsRes.success && enrollmentsRes.data && enrollmentsRes.data.length > 0) {
            const userEnrollment = enrollmentsRes.data[0];
            setEnrollment(userEnrollment);

            // Fetch progress for enrolled user
            try {
              const progressRes = await progressApi.getByEnrollment(userEnrollment.id);
              if (progressRes.success && progressRes.data) {
                setProgress(progressRes.data);
              }
            } catch (error) {
              console.error("Failed to fetch progress:", error);
            }

            // Fetch user's submissions for this course
            try {
              const submissionsRes = await assignmentsApi.getAllSubmissions({ 
                enrollmentId: userEnrollment.id,
                traineeId: user.id 
              });
              if (submissionsRes.success && submissionsRes.data) {
                setMySubmissions(submissionsRes.data);
              }
            } catch (error) {
              console.error("Failed to fetch submissions:", error);
            }
          }
        } catch (error) {
          console.error("Failed to fetch enrollment:", error);
        }
      }
    } catch (error) {
      console.error("Failed to fetch course data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (courseId) {
      fetchCourseData();
    }
  }, [courseId, user]);

  const handleEnroll = async () => {
    if (!user) {
      router.push('/sign-in');
      return;
    }

    setEnrolling(true);
    try {
      await coursesApi.enroll(courseId);
      await fetchCourseData(); // Refresh to get enrollment data
      // Redirect to the course page to show enrolled state
      router.push(`/courses/${courseId}`);
    } catch (error: any) {
      alert(error.message || "Failed to enroll in course");
    } finally {
      setEnrolling(false);
    }
  };

  const getContentProgress = (moduleId: string, contentId: string) => {
    const contentProgress = progress.find(
      (p: any) => p.moduleId === moduleId && p.contentId === contentId
    );
    return contentProgress;
  };

  const getModuleProgress = (moduleId: string) => {
    const moduleProgress = progress.filter((p: any) => p.moduleId === moduleId);
    const completed = moduleProgress.filter((p: any) => p.status === 'completed').length;
    const total = moduleContents[moduleId]?.length || 0;
    return total > 0 ? Math.round((completed / total) * 100) : 0;
  };

  const getAssignmentSubmission = (assignmentId: string) => {
    return mySubmissions.find((s: any) => s.assignmentId === assignmentId);
  };

  const findNextContent = () => {
    for (const module of modules) {
      const contents = moduleContents[module.id] || [];
      for (const content of contents) {
        const contentProg = getContentProgress(module.id, content.id);
        if (!contentProg || contentProg.status !== 'completed') {
          return { module, content };
        }
      }
    }
    return null;
  };

  if (loading) {
    return (
      <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0 flex items-center justify-center min-h-[600px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0 flex items-center justify-center min-h-[600px]">
        <p className="text-gray-500">Course not found</p>
      </div>
    );
  }

  const nextContent = enrollment ? findNextContent() : null;
  const overallProgress = enrollment?.progressPercentage || 0;

  return (
    <div className="flex-1 m-4 mt-0 flex flex-col gap-4">
      {/* HEADER */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-md p-6">
        <div className="flex flex-col md:flex-row gap-4 items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold text-gray-900">{course.title}</h1>
              {enrollment && (
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  enrollment.status === 'completed'
                    ? 'bg-green-100 text-green-800'
                    : enrollment.status === 'in_progress'
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {enrollment.status}
                </span>
              )}
            </div>
            <p className="text-gray-600 mb-2">{course.courseCode}</p>
            {course.description && (
              <p className="text-sm text-gray-600 mb-4">{course.description}</p>
            )}
            <div className="flex flex-wrap gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Image src="/teacher.png" alt="" width={16} height={16} />
                <span>{course.instructor?.firstName} {course.instructor?.lastName}</span>
              </div>
              {course.difficultyLevel && (
                <div className="flex items-center gap-2">
                  <Image src="/subject.png" alt="" width={16} height={16} />
                  <span className="capitalize">{course.difficultyLevel}</span>
                </div>
              )}
              {course.estimatedDuration && (
                <div className="flex items-center gap-2">
                  <Image src="/lesson.png" alt="" width={16} height={16} />
                  <span>{course.estimatedDuration} hours</span>
                </div>
              )}
            </div>
          </div>
          <div className="flex flex-col gap-2">
            {(enrollment || isInstructorOwner) ? (
              <>
                {enrollment && (
                  <>
                    <div className="bg-white rounded-lg p-4 shadow-sm">
                      <p className="text-xs text-gray-500 mb-2">Your Progress</p>
                      <div className="flex items-center gap-2 mb-2">
                        <div className="flex-1 bg-gray-200 rounded-full h-3">
                          <div
                            className="bg-blue-600 h-3 rounded-full"
                            style={{ width: `${overallProgress}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium">{overallProgress}%</span>
                      </div>
                    </div>
                    <Link
                      href={`/courses/${courseId}/learn`}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 text-center"
                    >
                      {nextContent ? "Continue Learning" : "Start Learning"}
                    </Link>
                    {!nextContent && enrollment.status !== 'completed' && (
                      <button
                        onClick={async () => {
                          try {
                            await enrollmentsApi.complete(enrollment.id);
                            fetchCourseData();
                          } catch (error: any) {
                            alert(error.message || "Failed to complete course");
                          }
                        }}
                        className="px-4 py-2 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700"
                      >
                        Mark as Complete
                      </button>
                    )}
                  </>
                )}

                {isInstructorOwner && (
                  <>
                    <Link
                      href={`/list/courses/${courseId}/edit`}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 text-center"
                    >
                      Manage Course
                    </Link>
                    <p className="text-xs text-gray-500 text-center">
                      You’re the instructor for this course. Enrollment is not required to view it.
                    </p>
                  </>
                )}
              </>
            ) : (
              <button
                onClick={handleEnroll}
                disabled={enrolling}
                className="px-6 py-3 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
              >
                {enrolling ? "Enrolling..." : "Enroll in Course"}
              </button>
            )}
          </div>
        </div>
      </div>

      {(enrollment || isInstructorOwner) && (
        <>
          {/* TABS */}
          <div className="bg-white rounded-md flex-1 flex flex-col min-h-[600px]">
            <div className="border-b border-gray-200 px-6">
              <nav className="flex -mb-px">
                {[
                  { id: 'overview', label: 'Overview' },
                  { id: 'modules', label: 'Modules' },
                  { id: 'assignments', label: 'Assignments' },
                  ...(isInstructorOwner ? [] : [{ id: 'progress', label: 'My Progress' }]),
                ].map((tab: any) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as TabType)}
                    className={`px-4 py-3 text-sm font-medium border-b-2 ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </nav>
            </div>

            {/* TAB CONTENT */}
            <div className="flex-1 p-6 overflow-auto">
              {/* OVERVIEW TAB */}
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h2 className="text-lg font-semibold mb-4">Course Information</h2>
                      <div className="space-y-3 text-sm">
                        <div>
                          <p className="text-gray-500">Course Code</p>
                          <p className="font-medium">{course.courseCode}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Difficulty</p>
                          <p className="font-medium capitalize">{course.difficultyLevel}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Duration</p>
                          <p className="font-medium">{course.estimatedDuration ? `${course.estimatedDuration} hours` : 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Modules</p>
                          <p className="font-medium">{modules.length}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Assignments</p>
                          <p className="font-medium">{assignments.length}</p>
                        </div>
                      </div>
                    </div>

                    {enrollment ? (
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h2 className="text-lg font-semibold mb-4">Your Progress</h2>
                        <div className="space-y-4">
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm text-gray-600">Overall Progress</span>
                              <span className="text-sm font-medium">{overallProgress}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-3">
                              <div
                                className="bg-blue-600 h-3 rounded-full"
                                style={{ width: `${overallProgress}%` }}
                              ></div>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                            <div>
                              <p className="text-xs text-gray-500">Started</p>
                              <p className="text-sm font-medium">
                                {enrollment.startedAt ? new Date(enrollment.startedAt).toLocaleDateString() : 'N/A'}
                              </p>
                            </div>
                            {enrollment.dueDate && (
                              <div>
                                <p className="text-xs text-gray-500">Due Date</p>
                                <p className="text-sm font-medium">
                                  {new Date(enrollment.dueDate).toLocaleDateString()}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ) : isInstructorOwner ? (
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h2 className="text-lg font-semibold mb-4">Course Statistics</h2>
                        <div className="space-y-3 text-sm">
                          <div>
                            <p className="text-gray-500">Total Modules</p>
                            <p className="font-medium">{modules.length}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Total Assignments</p>
                            <p className="font-medium">{assignments.length}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Course Status</p>
                            <p className="font-medium capitalize">{course.status}</p>
                          </div>
                        </div>
                      </div>
                    ) : null}
                  </div>

                  {assignments.length > 0 && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h2 className="text-lg font-semibold mb-4">Recent Assignments</h2>
                      <div className="space-y-2">
                        {assignments.slice(0, 5).map((assignment: any) => {
                          const submission = getAssignmentSubmission(assignment.id);
                          return (
                            <div key={assignment.id} className="bg-white p-3 rounded-md flex items-center justify-between">
                              <div>
                                <p className="font-medium text-sm">{assignment.title}</p>
                                {assignment.dueDate && (
                                  <p className="text-xs text-gray-500">
                                    Due: {new Date(assignment.dueDate).toLocaleDateString()}
                                  </p>
                                )}
                              </div>
                              <span className={`text-xs px-2 py-1 rounded-full ${
                                submission?.status === 'graded'
                                  ? 'bg-green-100 text-green-800'
                                  : submission?.status === 'submitted'
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-gray-100 text-gray-800'
                              }`}>
                                {submission ? (submission.score !== null ? `${submission.score}/${assignment.maxScore}` : 'Submitted') : 'Not Started'}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* MODULES TAB */}
              {activeTab === 'modules' && (
                <div className="space-y-4">
                  {modules.map((module) => {
                    const moduleProgress = getModuleProgress(module.id);
                    return (
                      <div key={module.id} className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg">{module.title}</h3>
                            {module.description && (
                              <p className="text-sm text-gray-600 mt-1">{module.description}</p>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium">{moduleProgress}%</p>
                            <div className="w-24 bg-gray-200 rounded-full h-2 mt-1">
                              <div
                                className="bg-blue-600 h-2 rounded-full"
                                style={{ width: `${moduleProgress}%` }}
                              ></div>
                            </div>
                          </div>
                        </div>
                        <div className="space-y-2 mt-4">
                          {moduleContents[module.id]?.map((content: any) => {
                            const contentProg = getContentProgress(module.id, content.id);
                            const isCompleted = contentProg?.status === 'completed';
                            const isStarted = contentProg?.status === 'in_progress' || isCompleted;

                            return (
                              <Link
                                key={content.id}
                                href={`/courses/${courseId}/modules/${module.id}/contents/${content.id}`}
                                className={`block bg-white p-3 rounded-md flex items-center justify-between hover:bg-gray-100 transition-colors ${
                                  isCompleted ? 'border-l-4 border-green-500' : isStarted ? 'border-l-4 border-blue-500' : ''
                                }`}
                              >
                                <div className="flex items-center gap-3 flex-1">
                                  <Image 
                                    src={`/${content.contentType}.png`} 
                                    alt="" 
                                    width={20} 
                                    height={20} 
                                  />
                                  <div className="flex-1">
                                    <p className="font-medium text-sm">{content.title}</p>
                                    <p className="text-xs text-gray-500 capitalize">{content.contentType}</p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  {isCompleted && (
                                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                                      Completed
                                    </span>
                                  )}
                                  {isStarted && !isCompleted && (
                                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                                      In Progress
                                    </span>
                                  )}
                                  <Image src="/view.png" alt="" width={16} height={16} />
                                </div>
                              </Link>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                  {modules.length === 0 && (
                    <div className="bg-gray-50 rounded-lg p-8 text-center">
                      <p className="text-gray-500">No modules available yet</p>
                    </div>
                  )}
                </div>
              )}

              {/* ASSIGNMENTS TAB */}
              {activeTab === 'assignments' && (
                <div className="space-y-4">
                  {assignments.map((assignment: any) => {
                    const submission = getAssignmentSubmission(assignment.id);
                    const isOverdue = assignment.dueDate && new Date(assignment.dueDate) < new Date() && !submission;

                    return (
                      <div key={assignment.id} className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg">{assignment.title}</h3>
                            {assignment.description && (
                              <p className="text-sm text-gray-600 mt-1">{assignment.description}</p>
                            )}
                            {assignment.instructions && (
                              <div className="mt-2 p-2 bg-white rounded text-xs text-gray-700">
                                <p className="font-medium mb-1">Instructions:</p>
                                <p>{assignment.instructions}</p>
                              </div>
                            )}
                          </div>
                          <div className="text-right">
                            {assignment.dueDate && (
                              <p className={`text-xs ${isOverdue ? 'text-red-600' : 'text-gray-500'}`}>
                                Due: {new Date(assignment.dueDate).toLocaleDateString()}
                                {isOverdue && ' (Overdue)'}
                              </p>
                            )}
                            <p className="text-xs text-gray-500 mt-1">Max Score: {assignment.maxScore}</p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between pt-3 border-t">
                          <div>
                            {submission ? (
                              <div>
                                <span className={`text-xs px-2 py-1 rounded-full ${
                                  submission.status === 'graded'
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-blue-100 text-blue-800'
                                }`}>
                                  {submission.status === 'graded' 
                                    ? `Graded: ${submission.score}/${assignment.maxScore}`
                                    : 'Submitted - Awaiting Grade'
                                  }
                                </span>
                                {submission.feedback && (
                                  <p className="text-xs text-gray-600 mt-1">Feedback: {submission.feedback}</p>
                                )}
                              </div>
                            ) : (
                              <span className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded-full">
                                Not Submitted
                              </span>
                            )}
                          </div>
                          <Link
                            href={`/courses/${courseId}/assignments/${assignment.id}`}
                            className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700"
                          >
                            {submission ? 'View Submission' : 'Submit Assignment'}
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                  {assignments.length === 0 && (
                    <div className="bg-gray-50 rounded-lg p-8 text-center">
                      <p className="text-gray-500">No assignments available</p>
                    </div>
                  )}
                </div>
              )}

              {/* PROGRESS TAB */}
              {activeTab === 'progress' && (
                <div className="space-y-6">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-semibold mb-4">Overall Progress</h3>
                    <div className="space-y-2">
                      {modules.map((module) => {
                        const moduleProgress = getModuleProgress(module.id);
                        const contents = moduleContents[module.id] || [];
                        const completedCount = contents.filter((content: any) => {
                          const prog = getContentProgress(module.id, content.id);
                          return prog?.status === 'completed';
                        }).length;

                        return (
                          <div key={module.id} className="bg-white p-3 rounded-md">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-medium">{module.title}</span>
                              <span className="text-sm text-gray-500">{completedCount} / {contents.length} completed</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-blue-600 h-2 rounded-full"
                                style={{ width: `${moduleProgress}%` }}
                              ></div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {!enrollment && (
        <div className="bg-white rounded-md p-6 text-center">
          <p className="text-gray-600 mb-4">Enroll in this course to access all content and track your progress.</p>
        </div>
      )}
    </div>
  );
};

export default CourseDetailTraineePage;
