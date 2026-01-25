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

type TabType = 'overview' | 'content' | 'assignments' | 'assessments' | 'enrollments' | 'analytics';

const CourseDetailPage = () => {
  const params = useParams();
  const router = useRouter();
  const { user: currentUser } = useAuth();
  const courseId = params.id as string;

  const [course, setCourse] = useState<any>(null);
  const [enrollment, setEnrollment] = useState<any>(null);
  const [modules, setModules] = useState<any[]>([]);
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [assessments, setAssessments] = useState<any[]>([]);
  const [statistics, setStatistics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [selectedModule, setSelectedModule] = useState<string | null>(null);
  const [moduleContents, setModuleContents] = useState<{ [key: string]: any[] }>({});
  const [mySubmissions, setMySubmissions] = useState<any[]>([]);
  const [progress, setProgress] = useState<any[]>([]);

  const fetchCourseData = async () => {
    try {
      setLoading(true);
      
      // First, fetch the course to determine the view
      const courseRes = await coursesApi.getById(courseId);
      if (!courseRes.success || !courseRes.data) {
        return;
      }
      
      const courseData = courseRes.data;
      setCourse(courseData);
      
      // Check if current user is the instructor owner
      const isInstructorOwner = currentUser?.role === 'instructor' && courseData.instructorId === currentUser.id;
      
      // For instructors viewing their own course, fetch admin-style data
      if (isInstructorOwner) {
        const [modulesRes, enrollmentsRes, assignmentsRes, assessmentsRes, statsRes] = await Promise.all([
          modulesApi.getByCourse(courseId).catch(() => ({ success: false, data: [] })),
          enrollmentsApi.getAll({ courseId }).catch(() => ({ success: false, data: [] })),
          assignmentsApi.getAll({ courseId }).catch(() => ({ success: false, data: [] })),
          assessmentsApi.getAll({ courseId }).catch(() => ({ success: false, data: [] })),
          progressApi.getCourseProgress(courseId).catch(() => ({ success: false, data: null })),
        ]);

        if (modulesRes.success && modulesRes.data) {
          setModules(modulesRes.data);
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
        if (enrollmentsRes.success && enrollmentsRes.data) {
          setEnrollments(enrollmentsRes.data);
        }
        if (assignmentsRes.success && assignmentsRes.data) {
          setAssignments(assignmentsRes.data);
        }
        if (assessmentsRes.success && assessmentsRes.data) {
          setAssessments(assessmentsRes.data);
        }
        if (statsRes.success && statsRes.data) {
          setStatistics(statsRes.data);
        }
      } else {
        // For trainees, fetch trainee-style data
        const [modulesRes, assignmentsRes] = await Promise.all([
          modulesApi.getByCourse(courseId).catch(() => ({ success: false, data: [] })),
          assignmentsApi.getAll({ courseId }).catch(() => ({ success: false, data: [] })),
        ]);

        if (modulesRes.success && modulesRes.data) {
          setModules(modulesRes.data);
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
        if (currentUser) {
          try {
            const enrollmentsRes = await enrollmentsApi.getAll({ courseId, traineeId: currentUser.id });
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
                  traineeId: currentUser.id 
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
  }, [courseId, currentUser]);

  const handleEnroll = async () => {
    if (!currentUser) {
      router.push('/sign-in');
      return;
    }

    setEnrolling(true);
    try {
      await coursesApi.enroll(courseId);
      await fetchCourseData();
      router.push(`/courses/${courseId}`);
    } catch (error: any) {
      alert(error.message || "Failed to enroll in course");
    } finally {
      setEnrolling(false);
    }
  };

  const handlePublish = async () => {
    if (!course) return;
    try {
      const action = course.status === 'published' ? coursesApi.unpublish : coursesApi.publish;
      await action(courseId);
      fetchCourseData();
    } catch (error: any) {
      alert(error.message || "Failed to update course status");
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this course? This action cannot be undone.")) return;
    try {
      await coursesApi.delete(courseId);
      router.push('/instructor/courses');
    } catch (error: any) {
      alert(error.message || "Failed to delete course");
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

  // Check if current user is the instructor owner (after course is loaded)
  const canEdit = currentUser?.role === 'admin' || (currentUser?.role === 'instructor' && course?.instructorId === currentUser.id);
  const isInstructorOwner = currentUser?.role === 'instructor' && course?.instructorId === currentUser.id;
  const isTrainee = currentUser?.role === 'trainee';

  // Calculate stats for instructor/admin view
  const totalEnrollments = enrollments.length;
  const completedEnrollments = enrollments.filter((e: any) => e.status === 'completed').length;
  const inProgressEnrollments = enrollments.filter((e: any) => e.status === 'in_progress').length;
  const averageProgress = enrollments.length > 0
    ? Math.round(enrollments.reduce((sum: number, e: any) => sum + (e.progressPercentage || 0), 0) / enrollments.length)
    : 0;
  const totalModules = modules.length;
  const totalContents = Object.values(moduleContents).reduce((sum, contents) => sum + contents.length, 0);

  const enrollmentColumns = [
    { header: "Trainee", accessor: "trainee" },
    { header: "Status", accessor: "status" },
    { header: "Progress", accessor: "progress" },
    { header: "Started", accessor: "started" },
    { header: "Due Date", accessor: "dueDate" },
    { header: "Actions", accessor: "actions" },
  ];

  const renderEnrollmentRow = (enrollment: any) => (
    <tr key={enrollment.id} className="border-b border-gray-200 even:bg-slate-50 text-sm hover:bg-lamaPurpleLight">
      <td>
        <div className="flex items-center gap-2">
          <img 
            src={enrollment.trainee?.photoUrl || "/avatar.png"} 
            alt="" 
            width={32} 
            height={32} 
            className="rounded-full object-cover" 
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/avatar.png';
            }}
          />
          <div>
            <p className="font-medium">{enrollment.trainee?.firstName} {enrollment.trainee?.lastName}</p>
            <p className="text-xs text-gray-500">{enrollment.trainee?.email}</p>
          </div>
        </div>
      </td>
      <td>
        <span className={`px-2 py-1 rounded-full text-xs ${
          enrollment.status === 'completed'
            ? 'bg-green-100 text-green-800'
            : enrollment.status === 'in_progress'
            ? 'bg-blue-100 text-blue-800'
            : 'bg-gray-100 text-gray-800'
        }`}>
          {enrollment.status}
        </span>
      </td>
      <td>
        <span className="text-sm font-medium">{enrollment.progressPercentage ?? 0}%</span>
      </td>
      <td className="text-xs text-gray-500">
        {enrollment.startedAt ? new Date(enrollment.startedAt).toLocaleDateString() : 'N/A'}
      </td>
      <td className="text-xs text-gray-500">
        {enrollment.dueDate ? new Date(enrollment.dueDate).toLocaleDateString() : 'N/A'}
      </td>
      <td>
        <Link href={`/list/users/${enrollment.traineeId}`}>
          <button className="w-7 h-7 flex items-center justify-center rounded-full bg-lamaSky">
            <Image src="/view.png" alt="" width={16} height={16} />
          </button>
        </Link>
      </td>
    </tr>
  );

  // For instructor viewing their own course, show admin-style page
  if (isInstructorOwner) {
    return (
      <div className="flex-1 m-4 mt-0 flex flex-col gap-4">
        {/* HEADER */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-md p-6">
          <div className="flex flex-col md:flex-row gap-4 items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl font-bold text-gray-900">{course.title}</h1>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  course.status === 'published'
                    ? 'bg-green-100 text-green-800'
                    : course.status === 'archived'
                    ? 'bg-gray-100 text-gray-800'
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {course.status}
                </span>
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
                {course.organization && (
                  <div className="flex items-center gap-2">
                    <Image src="/class.png" alt="" width={16} height={16} />
                    <span>{course.organization.name}</span>
                  </div>
                )}
                {course.department && (
                  <div className="flex items-center gap-2">
                    <Image src="/subject.png" alt="" width={16} height={16} />
                    <span>{course.department.name}</span>
                  </div>
                )}
              </div>
            </div>
            {canEdit && (
              <div className="flex items-center gap-2">
                <Link
                  href={`/list/courses/${courseId}/edit`}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700"
                >
                  Edit Course
                </Link>
                <button
                  onClick={handlePublish}
                  className={`px-4 py-2 rounded-md text-sm font-medium ${
                    course.status === 'published'
                      ? 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                      : 'bg-green-600 text-white hover:bg-green-700'
                  }`}
                >
                  {course.status === 'published' ? 'Unpublish' : 'Publish'}
                </button>
              </div>
            )}
          </div>

          {/* STATS CARDS */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <p className="text-xs text-gray-500">Total Enrollments</p>
              <p className="text-2xl font-bold text-gray-900">{totalEnrollments}</p>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <p className="text-xs text-gray-500">Completed</p>
              <p className="text-2xl font-bold text-green-600">{completedEnrollments}</p>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <p className="text-xs text-gray-500">In Progress</p>
              <p className="text-2xl font-bold text-blue-600">{inProgressEnrollments}</p>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <p className="text-xs text-gray-500">Avg Progress</p>
              <p className="text-2xl font-bold text-gray-900">{averageProgress}%</p>
            </div>
          </div>
        </div>

        {/* TABS AND CONTENT */}
        <div className="bg-white rounded-md flex-1 flex flex-col min-h-[600px]">
          {/* TABS */}
          <div className="border-b border-gray-200 px-6">
            <nav className="flex -mb-px">
              {[
                { id: 'overview', label: 'Overview' },
                { id: 'content', label: 'Content' },
                { id: 'assignments', label: 'Assignments' },
                { id: 'assessments', label: 'Assessments' },
                { id: 'enrollments', label: 'Enrollments' },
                { id: 'analytics', label: 'Analytics' },
              ].map((tab) => (
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
          <div className="flex-1 flex gap-4 p-6 overflow-auto">
            {/* LEFT SIDEBAR - Course Structure (for Content tab) */}
            {activeTab === 'content' && modules.length > 0 && (
              <div className="w-64 bg-gray-50 rounded-lg p-4 h-fit">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-sm">Course Structure</h3>
                  {canEdit && (
                    <FormModal
                      table="module"
                      type="create"
                      data={{ courseId }}
                      onSuccess={fetchCourseData}
                    />
                  )}
                </div>
                <div className="space-y-2">
                  {modules.map((module) => (
                    <div
                      key={module.id}
                      className={`p-3 rounded-md cursor-pointer transition-colors ${
                        selectedModule === module.id
                          ? 'bg-blue-100 border border-blue-300'
                          : 'bg-white border border-gray-200 hover:bg-gray-100'
                      }`}
                      onClick={() => setSelectedModule(selectedModule === module.id ? null : module.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="text-sm font-medium">{module.title}</p>
                          <p className="text-xs text-gray-500">
                            {moduleContents[module.id]?.length || 0} items
                          </p>
                        </div>
                        {canEdit && (
                          <div className="flex items-center gap-1">
                            <FormModal
                              table="module"
                              type="update"
                              id={module.id}
                              onSuccess={fetchCourseData}
                            />
                            <FormModal
                              table="module"
                              type="delete"
                              id={module.id}
                              onSuccess={fetchCourseData}
                            />
                          </div>
                        )}
                      </div>
                      {selectedModule === module.id && moduleContents[module.id] && moduleContents[module.id].length > 0 && (
                        <div className="mt-2 space-y-1 pl-2 border-l-2 border-blue-300">
                          {moduleContents[module.id].map((content: any) => (
                            <div
                              key={content.id}
                              className="p-2 bg-white rounded text-xs flex items-center justify-between"
                            >
                              <div className="flex items-center gap-2">
                                <Image src={`/${content.contentType}.png`} alt="" width={12} height={12} />
                                <span>{content.title}</span>
                              </div>
                              {canEdit && (
                                <div className="flex items-center gap-1">
                                  <FormModal
                                    table="content"
                                    type="update"
                                    id={content.id}
                                    onSuccess={fetchCourseData}
                                  />
                                  <FormModal
                                    table="content"
                                    type="delete"
                                    id={content.id}
                                    onSuccess={fetchCourseData}
                                  />
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* MAIN CONTENT */}
            <div className="flex-1">
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
                          <p className="font-medium">{totalModules}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Content Items</p>
                          <p className="font-medium">{totalContents}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Assignments</p>
                          <p className="font-medium">{assignments.length}</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-4">
                      <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
                      <div className="space-y-2">
                        {canEdit && (
                          <>
                            <button
                              onClick={() => setActiveTab('content')}
                              className="w-full text-left px-4 py-2 bg-white rounded-md hover:bg-gray-100 text-sm"
                            >
                              <Image src="/lesson.png" alt="" width={16} height={16} className="inline mr-2" />
                              Manage Content
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => setActiveTab('enrollments')}
                          className="w-full text-left px-4 py-2 bg-white rounded-md hover:bg-gray-100 text-sm"
                        >
                          <Image src="/teacher.png" alt="" width={16} height={16} className="inline mr-2" />
                          View Enrollments
                        </button>
                      </div>
                    </div>
                  </div>

                  {assignments.length > 0 && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h2 className="text-lg font-semibold mb-4">Recent Assignments</h2>
                      <div className="space-y-2">
                        {assignments.slice(0, 5).map((assignment: any) => (
                          <div key={assignment.id} className="bg-white p-3 rounded-md flex items-center justify-between">
                            <div>
                              <p className="font-medium text-sm">{assignment.title}</p>
                              {assignment.dueDate && (
                                <p className="text-xs text-gray-500">
                                  Due: {new Date(assignment.dueDate).toLocaleDateString()}
                                </p>
                              )}
                            </div>
                            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                              {assignment._count?.submissions || 0} submissions
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* CONTENT TAB */}
              {activeTab === 'content' && (
                <div className="space-y-4">
                  {selectedModule ? (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold">
                          {modules.find((m: any) => m.id === selectedModule)?.title}
                        </h2>
                        {canEdit && (
                          <FormModal
                            table="content"
                            type="create"
                            data={{ moduleId: selectedModule }}
                            onSuccess={fetchCourseData}
                          />
                        )}
                      </div>
                      <div className="space-y-2">
                        {moduleContents[selectedModule]?.map((content: any) => (
                          <div key={content.id} className="bg-white p-4 rounded-md flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <Image src={`/${content.contentType}.png`} alt="" width={24} height={24} />
                              <div>
                                <p className="font-medium">{content.title}</p>
                                <p className="text-xs text-gray-500 capitalize">{content.contentType}</p>
                              </div>
                            </div>
                            {canEdit && (
                              <div className="flex items-center gap-2">
                                <FormModal
                                  table="content"
                                  type="update"
                                  id={content.id}
                                  onSuccess={fetchCourseData}
                                />
                                <FormModal
                                  table="content"
                                  type="delete"
                                  id={content.id}
                                  onSuccess={fetchCourseData}
                                />
                              </div>
                            )}
                          </div>
                        ))}
                        {(!moduleContents[selectedModule] || moduleContents[selectedModule].length === 0) && (
                          <p className="text-gray-500 text-center py-8">No content in this module</p>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-gray-500 text-center py-8">Select a module from the sidebar to view its content</p>
                    </div>
                  )}
                </div>
              )}

              {/* ASSIGNMENTS TAB */}
              {activeTab === 'assignments' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold">Assignments ({assignments.length})</h2>
                    {canEdit && (
                      <FormModal
                        table="assignment"
                        type="create"
                        data={{ courseId }}
                        onSuccess={fetchCourseData}
                      />
                    )}
                  </div>
                  {assignments.length === 0 ? (
                    <div className="bg-gray-50 rounded-lg p-8 text-center">
                      <p className="text-gray-500">No assignments yet</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {assignments.map((assignment: any) => (
                        <div key={assignment.id} className="bg-gray-50 rounded-lg p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <h3 className="font-semibold text-lg">{assignment.title}</h3>
                                {assignment.module && (
                                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                                    {assignment.module.title}
                                  </span>
                                )}
                              </div>
                              {assignment.description && (
                                <p className="text-sm text-gray-600 mb-2">{assignment.description}</p>
                              )}
                              {assignment.instructions && (
                                <p className="text-xs text-gray-500 mb-2">{assignment.instructions}</p>
                              )}
                              <div className="flex items-center gap-4 text-xs text-gray-500">
                                {assignment.dueDate && (
                                  <span>
                                    Due: {new Date(assignment.dueDate).toLocaleDateString()}
                                  </span>
                                )}
                                <span>
                                  Max Score: {assignment.maxScore || 100}
                                </span>
                                <span className={`px-2 py-1 rounded-full ${
                                  assignment.isRequired
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-gray-100 text-gray-800'
                                }`}>
                                  {assignment.isRequired ? 'Required' : 'Optional'}
                                </span>
                                {assignment._count?.submissions !== undefined && (
                                  <span>
                                    {assignment._count.submissions} submission{assignment._count.submissions !== 1 ? 's' : ''}
                                  </span>
                                )}
                              </div>
                            </div>
                            {canEdit && (
                              <div className="flex items-center gap-2">
                                <FormModal
                                  table="assignment"
                                  type="update"
                                  id={assignment.id}
                                  onSuccess={fetchCourseData}
                                />
                                <FormModal
                                  table="assignment"
                                  type="delete"
                                  id={assignment.id}
                                  onSuccess={fetchCourseData}
                                />
                              </div>
                            )}
                          </div>
                          {canEdit && assignment._count?.submissions > 0 && (
                            <div className="mt-3 pt-3 border-t">
                              <AssignmentSubmissionsList 
                                assignmentId={assignment.id} 
                                maxScore={assignment.maxScore || 100}
                                onGraded={fetchCourseData}
                              />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* ASSESSMENTS TAB */}
              {activeTab === 'assessments' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold">Assessments ({assessments.length})</h2>
                    {canEdit && (
                      <FormModal
                        table="assessment"
                        type="create"
                        data={{ courseId }}
                        onSuccess={fetchCourseData}
                      />
                    )}
                  </div>
                  {assessments.length === 0 ? (
                    <div className="bg-gray-50 rounded-lg p-8 text-center">
                      <p className="text-gray-500">No assessments yet</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {assessments.map((assessment: any) => (
                        <div key={assessment.id} className="bg-gray-50 rounded-lg p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <h3 className="font-semibold text-lg">{assessment.title}</h3>
                                <span className={`text-xs px-2 py-1 rounded-full ${
                                  assessment.type === 'quiz' ? 'bg-blue-100 text-blue-800' :
                                  assessment.type === 'assignment' ? 'bg-purple-100 text-purple-800' :
                                  'bg-gray-100 text-gray-800'
                                }`}>
                                  {assessment.type}
                                </span>
                                {assessment.module && (
                                  <span className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded-full">
                                    {assessment.module.title}
                                  </span>
                                )}
                              </div>
                              {assessment.description && (
                                <p className="text-sm text-gray-600 mb-2">{assessment.description}</p>
                              )}
                              <div className="flex items-center gap-4 text-xs text-gray-500">
                                <span>
                                  Passing Score: {assessment.passingScore || 70}%
                                </span>
                                {assessment.maxAttempts && (
                                  <span>
                                    Max Attempts: {assessment.maxAttempts}
                                  </span>
                                )}
                                {assessment.timeLimit && (
                                  <span>
                                    Time Limit: {assessment.timeLimit} min
                                  </span>
                                )}
                                <span className={`px-2 py-1 rounded-full ${
                                  assessment.isRequired
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-gray-100 text-gray-800'
                                }`}>
                                  {assessment.isRequired ? 'Required' : 'Optional'}
                                </span>
                                {assessment.questions && Array.isArray(assessment.questions) && (
                                  <span>
                                    {assessment.questions.length} question{assessment.questions.length !== 1 ? 's' : ''}
                                  </span>
                                )}
                              </div>
                            </div>
                            {canEdit && (
                              <div className="flex items-center gap-2">
                                <FormModal
                                  table="assessment"
                                  type="update"
                                  id={assessment.id}
                                  onSuccess={fetchCourseData}
                                />
                                <FormModal
                                  table="assessment"
                                  type="delete"
                                  id={assessment.id}
                                  onSuccess={fetchCourseData}
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* ENROLLMENTS TAB */}
              {activeTab === 'enrollments' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold">Enrollments ({totalEnrollments})</h2>
                    {isInstructorOwner && (
                      <button className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700">
                        Enroll Users
                      </button>
                    )}
                  </div>
                  {enrollments.length > 0 ? (
                    <Table
                      columns={enrollmentColumns}
                      renderRow={renderEnrollmentRow}
                      data={enrollments}
                    />
                  ) : (
                    <div className="bg-gray-50 rounded-lg p-8 text-center">
                      <p className="text-gray-500">No enrollments yet</p>
                    </div>
                  )}
                </div>
              )}

              {/* ANALYTICS TAB */}
              {activeTab === 'analytics' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-sm text-gray-500">Completion Rate</p>
                      <p className="text-3xl font-bold mt-2">
                        {totalEnrollments > 0 ? Math.round((completedEnrollments / totalEnrollments) * 100) : 0}%
                      </p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-sm text-gray-500">Average Progress</p>
                      <p className="text-3xl font-bold mt-2">{averageProgress}%</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-sm text-gray-500">Active Learners</p>
                      <p className="text-3xl font-bold mt-2">{inProgressEnrollments}</p>
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-semibold mb-4">Progress Distribution</h3>
                    <div className="space-y-2">
                      {enrollments.map((enrollment: any) => (
                        <div key={enrollment.id} className="bg-white p-3 rounded-md">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium">
                              {enrollment.trainee?.firstName} {enrollment.trainee?.lastName}
                            </span>
                            <span className="text-sm text-gray-500">{enrollment.progressPercentage || 0}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full"
                              style={{ width: `${enrollment.progressPercentage || 0}%` }}
                            ></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // For trainees, show the trainee-style page (existing code)
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
            {enrollment ? (
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

      {enrollment && (
        <>
          {/* TABS */}
          <div className="bg-white rounded-md flex-1 flex flex-col min-h-[600px]">
            <div className="border-b border-gray-200 px-6">
              <nav className="flex -mb-px">
                {[
                  { id: 'overview', label: 'Overview' },
                  { id: 'modules', label: 'Modules' },
                  { id: 'assignments', label: 'Assignments' },
                  { id: 'progress', label: 'My Progress' },
                ].map((tab: any) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
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

            {/* TAB CONTENT - Trainee view (keep existing trainee tabs logic) */}
            <div className="flex-1 p-6 overflow-auto">
              {/* OVERVIEW TAB */}
              {(activeTab as any) === 'overview' && (
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
              {(activeTab as any) === 'modules' && (
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
              {(activeTab as any) === 'assignments' && (
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
              {(activeTab as any) === 'progress' && (
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

export default CourseDetailPage;
