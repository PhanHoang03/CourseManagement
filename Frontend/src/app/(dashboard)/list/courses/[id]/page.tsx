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

type TabType = 'overview' | 'content' | 'assignments' | 'assessments' | 'settings' | 'enrollments' | 'analytics';

const CourseDetailPage = () => {
  const params = useParams();
  const router = useRouter();
  const { user: currentUser } = useAuth();
  const courseId = params.id as string;

  const [course, setCourse] = useState<any>(null);
  const [modules, setModules] = useState<any[]>([]);
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [assessments, setAssessments] = useState<any[]>([]);
  const [statistics, setStatistics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [selectedModule, setSelectedModule] = useState<string | null>(null);
  const [moduleContents, setModuleContents] = useState<{ [key: string]: any[] }>({});

  const canEdit = currentUser?.role === 'admin' || (currentUser?.role === 'instructor' && course?.instructorId === currentUser.id);

  const fetchCourseData = async () => {
    try {
      setLoading(true);
      const [courseRes, modulesRes, enrollmentsRes, assignmentsRes, assessmentsRes, statsRes] = await Promise.all([
        coursesApi.getById(courseId),
        modulesApi.getByCourse(courseId).catch(() => ({ success: false, data: [] })),
        enrollmentsApi.getAll({ courseId }).catch(() => ({ success: false, data: [] })),
        assignmentsApi.getAll({ courseId }).catch(() => ({ success: false, data: [] })),
        assessmentsApi.getAll({ courseId }).catch(() => ({ success: false, data: [] })),
        progressApi.getCourseProgress(courseId).catch(() => ({ success: false, data: null })),
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
  }, [courseId]);

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
      router.push('/list/courses');
    } catch (error: any) {
      alert(error.message || "Failed to delete course");
    }
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

  // Calculate stats
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
        <div className="flex items-center gap-2">
          <div className="flex-1 bg-gray-200 rounded-full h-2 w-24">
            <div
              className="bg-blue-600 h-2 rounded-full"
              style={{ width: `${enrollment.progressPercentage || 0}%` }}
            ></div>
          </div>
          <span className="text-xs font-medium">{enrollment.progressPercentage || 0}%</span>
        </div>
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
              {currentUser?.role === 'admin' && (
                <>
                  <button
                    onClick={handleDelete}
                    className="px-4 py-2 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700"
                  >
                    Delete
                  </button>
                </>
              )}
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
              { id: 'settings', label: 'Settings' },
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
                          <button
                            onClick={() => setActiveTab('settings')}
                            className="w-full text-left px-4 py-2 bg-white rounded-md hover:bg-gray-100 text-sm"
                          >
                            <Image src="/setting.png" alt="" width={16} height={16} className="inline mr-2" />
                            Edit Settings
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
                                assessment.type === 'exam' ? 'bg-red-100 text-red-800' :
                                'bg-purple-100 text-purple-800'
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

            {/* SETTINGS TAB */}
            {activeTab === 'settings' && (
              <div className="space-y-6">
                {canEdit ? (
                  <FormModal
                    table="course"
                    type="update"
                    id={courseId}
                    onSuccess={fetchCourseData}
                  />
                ) : (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-gray-500">You don't have permission to edit this course</p>
                  </div>
                )}
              </div>
            )}

            {/* ENROLLMENTS TAB */}
            {activeTab === 'enrollments' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold">Enrollments ({totalEnrollments})</h2>
                  {canEdit && (
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
};

export default CourseDetailPage;
