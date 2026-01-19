"use client"

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { usersApi, enrollmentsApi, assignmentsApi } from "@/lib/api";
import FormModal from "@/components/FormModal";
import ProtectedRoute from "@/components/ProtectedRoute";

type TabType = 'overview' | 'courses' | 'assignments' | 'activity';

const ProfilePage = () => {
  const router = useRouter();
  const { user: currentUser, refreshUser } = useAuth();

  const [user, setUser] = useState<any>(null);
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('overview');

  const fetchUserData = async () => {
    if (!currentUser?.id) return;

    try {
      setLoading(true);
      const [userRes, enrollmentsRes, assignmentsRes] = await Promise.all([
        usersApi.getById(currentUser.id),
        enrollmentsApi.getAll({ traineeId: currentUser.id }).catch(() => ({ success: false, data: [] })),
        assignmentsApi.getAllSubmissions({ traineeId: currentUser.id }).catch(() => ({ success: false, data: [] })),
      ]);

      if (userRes.success && userRes.data) {
        setUser(userRes.data);
      }
      if (enrollmentsRes.success && enrollmentsRes.data) {
        setEnrollments(enrollmentsRes.data);
      }
      if (assignmentsRes.success && assignmentsRes.data) {
        setAssignments(assignmentsRes.data);
      }
    } catch (error) {
      console.error("Failed to fetch user data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser) {
      fetchUserData();
    }
  }, [currentUser]);

  const handleUpdateSuccess = async () => {
    await fetchUserData();
    await refreshUser(); // Refresh auth context
  };

  if (loading || !user) {
    return (
      <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0 flex items-center justify-center min-h-[600px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Calculate stats
  const totalCourses = enrollments.length;
  const completedCourses = enrollments.filter((e: any) => e.status === 'completed').length;
  const inProgressCourses = enrollments.filter((e: any) => e.status === 'in_progress').length;
  const averageProgress = enrollments.length > 0
    ? Math.round(enrollments.reduce((sum: number, e: any) => sum + (e.progressPercentage || 0), 0) / enrollments.length)
    : 0;
  const totalAssignments = assignments.length;
  const completedAssignments = assignments.filter((a: any) => a.status === 'graded').length;

  // Get initials for avatar
  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
  };

  return (
    <div className="bg-white rounded-md flex-1 m-4 mt-0">
      {/* HEADER / HERO SECTION */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 py-8 px-6 rounded-t-md">
        <div className="flex flex-col md:flex-row gap-6 items-start">
          {/* Profile Photo */}
          <div className="relative">
            {user.photoUrl ? (
              <img
                src={user.photoUrl}
                alt={`${user.firstName} ${user.lastName}`}
                width={144}
                height={144}
                className="w-36 h-36 rounded-full object-cover border-4 border-white shadow-lg"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                  const fallback = (e.target as HTMLElement).nextElementSibling as HTMLElement;
                  if (fallback) fallback.style.display = 'flex';
                }}
              />
            ) : null}
            <div 
              className={`w-36 h-36 rounded-full bg-blue-500 items-center justify-center text-white text-4xl font-semibold border-4 border-white shadow-lg ${user.photoUrl ? 'hidden' : 'flex'}`}
            >
              {getInitials(user.firstName, user.lastName)}
            </div>
          </div>

          {/* User Info */}
          <div className="flex-1">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {user.firstName} {user.lastName}
                </h1>
                <p className="text-gray-600 mt-1">{user.email}</p>
                {user.position && (
                  <p className="text-sm text-gray-500 mt-1">{user.position}</p>
                )}
                <div className="flex items-center gap-4 mt-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {user.isActive ? 'Active' : 'Inactive'}
                  </span>
                  <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 capitalize">
                    {user.role}
                  </span>
                </div>
              </div>
              <FormModal 
                table="user" 
                type="update" 
                id={user.id} 
                onSuccess={handleUpdateSuccess}
              />
            </div>

            {/* Department & Organization */}
            {(user.organization || user.department) && (
              <div className="mt-4 flex flex-wrap gap-3">
                {user.organization && (
                  <div className="flex items-center gap-2 px-3 py-1 bg-white rounded-full shadow-sm">
                    <Image src="/class.png" alt="Organization" width={14} height={14} />
                    <span className="text-sm text-gray-700">{user.organization.name}</span>
                  </div>
                )}
                {user.department && (
                  <div className="flex items-center gap-2 px-3 py-1 bg-white rounded-full shadow-sm">
                    <Image src="/subject.png" alt="Department" width={14} height={14} />
                    <span className="text-sm text-gray-700">{user.department.name}</span>
                  </div>
                )}
              </div>
            )}

            {/* Bio */}
            {user.bio && (
              <p className="mt-4 text-sm text-gray-600">{user.bio}</p>
            )}

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
              <div className="bg-white rounded-lg p-3 shadow-sm">
                <p className="text-xs text-gray-500">Total Courses</p>
                <p className="text-2xl font-bold text-gray-900">{totalCourses}</p>
              </div>
              <div className="bg-white rounded-lg p-3 shadow-sm">
                <p className="text-xs text-gray-500">Completed</p>
                <p className="text-2xl font-bold text-green-600">{completedCourses}</p>
              </div>
              <div className="bg-white rounded-lg p-3 shadow-sm">
                <p className="text-xs text-gray-500">In Progress</p>
                <p className="text-2xl font-bold text-blue-600">{inProgressCourses}</p>
              </div>
              <div className="bg-white rounded-lg p-3 shadow-sm">
                <p className="text-xs text-gray-500">Avg Progress</p>
                <p className="text-2xl font-bold text-gray-900">{averageProgress}%</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* TABS */}
      <div className="border-b border-gray-200">
        <nav className="flex -mb-px px-6">
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'courses', label: 'My Courses' },
            { id: 'assignments', label: 'Assignments' },
            { id: 'activity', label: 'Activity' },
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
      <div className="p-6">
        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Personal Information */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h2 className="text-lg font-semibold mb-4">Personal Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500">Employee ID</p>
                  <p className="text-sm font-medium">{user.employeeId || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Phone</p>
                  <p className="text-sm font-medium">{user.phone || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Address</p>
                  <p className="text-sm font-medium">{user.address || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Email</p>
                  <p className="text-sm font-medium">{user.email}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Joined</p>
                  <p className="text-sm font-medium">
                    {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Last Login</p>
                  <p className="text-sm font-medium">
                    {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}
                  </p>
                </div>
              </div>
            </div>

            {/* Expertise */}
            {user.expertise && user.expertise.length > 0 && (
              <div className="bg-gray-50 rounded-lg p-4">
                <h2 className="text-lg font-semibold mb-4">Expertise</h2>
                <div className="flex flex-wrap gap-2">
                  {user.expertise.map((skill: string, index: number) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Organizational Affiliations */}
            {(user.organization || user.department) && (
              <div className="bg-gray-50 rounded-lg p-4">
                <h2 className="text-lg font-semibold mb-4">Organizational Affiliations</h2>
                <div className="space-y-3">
                  {user.organization && (
                    <div className="flex items-center gap-3">
                      <Image src="/class.png" alt="Organization" width={20} height={20} />
                      <div>
                        <p className="font-medium">{user.organization.name}</p>
                        {user.organization.domain && (
                          <p className="text-xs text-gray-500">{user.organization.domain}</p>
                        )}
                      </div>
                    </div>
                  )}
                  {user.department && (
                    <div className="flex items-center gap-3">
                      <Image src="/subject.png" alt="Department" width={20} height={20} />
                      <div>
                        <p className="font-medium">{user.department.name}</p>
                        {user.department.description && (
                          <p className="text-xs text-gray-500">{user.department.description}</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* COURSES TAB */}
        {activeTab === 'courses' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">My Courses ({totalCourses})</h2>
              <Link
                href="/trainee/courses"
                className="text-sm text-blue-600 hover:underline"
              >
                View All →
              </Link>
            </div>
            {enrollments.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No courses enrolled</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {enrollments.slice(0, 6).map((enrollment: any) => (
                  <Link
                    key={enrollment.id}
                    href={`/courses/${enrollment.course.id}`}
                    className="bg-gray-50 rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <h3 className="font-semibold mb-2">{enrollment.course.title}</h3>
                    <p className="text-xs text-gray-500 mb-3">{enrollment.course.courseCode}</p>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: `${enrollment.progressPercentage || 0}%` }}
                        ></div>
                      </div>
                      <span className="text-xs font-medium">{enrollment.progressPercentage || 0}%</span>
                    </div>
                    <div className="flex items-center justify-between mt-3">
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        enrollment.status === 'completed'
                          ? 'bg-green-100 text-green-800'
                          : enrollment.status === 'in_progress'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {enrollment.status}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ASSIGNMENTS TAB */}
        {activeTab === 'assignments' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Assignments ({totalAssignments})</h2>
            </div>
            {assignments.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No assignments yet</p>
            ) : (
              <div className="space-y-3">
                {assignments.map((submission: any) => (
                  <div key={submission.id} className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">{submission.assignment?.title}</h3>
                        {submission.assignment?.course && (
                          <p className="text-sm text-gray-500 mt-1">
                            {submission.assignment.course.title}
                          </p>
                        )}
                        <p className="text-xs text-gray-500 mt-2">
                          Submitted: {submission.submittedAt ? new Date(submission.submittedAt).toLocaleDateString() : 'N/A'}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          submission.status === 'graded'
                            ? 'bg-green-100 text-green-800'
                            : submission.status === 'submitted'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {submission.status === 'graded' && submission.score !== null
                            ? `Score: ${submission.score}/${submission.assignment?.maxScore || 100}`
                            : submission.status}
                        </span>
                        {submission.feedback && (
                          <p className="text-xs text-gray-600 mt-2 max-w-xs">{submission.feedback}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ACTIVITY TAB */}
        {activeTab === 'activity' && (
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold mb-3">Recent Activity</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span>Last login: {user.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'Never'}</span>
                </div>
                {enrollments.length > 0 && (
                  <div className="flex items-center gap-3 text-sm">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>Enrolled in {enrollments.length} course{enrollments.length !== 1 ? 's' : ''}</span>
                  </div>
                )}
                {completedCourses > 0 && (
                  <div className="flex items-center gap-3 text-sm">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    <span>Completed {completedCourses} course{completedCourses !== 1 ? 's' : ''}</span>
                  </div>
                )}
                {completedAssignments > 0 && (
                  <div className="flex items-center gap-3 text-sm">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                    <span>Completed {completedAssignments} assignment{completedAssignments !== 1 ? 's' : ''}</span>
                  </div>
                )}
                {user.createdAt && (
                  <div className="flex items-center gap-3 text-sm">
                    <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
                    <span>Account created: {new Date(user.createdAt).toLocaleDateString()}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfilePage;
