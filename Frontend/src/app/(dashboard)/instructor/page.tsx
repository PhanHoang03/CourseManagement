"use client"

import { useEffect, useState } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/lib/auth";
import { coursesApi, enrollmentsApi, usersApi } from "@/lib/api";
import Link from "next/link";
import Image from "next/image";

const InstructorPage = () => {
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalCourses: 0,
    publishedCourses: 0,
    draftCourses: 0,
    totalStudents: 0,
    totalEnrollments: 0,
  });
  const [recentCourses, setRecentCourses] = useState<any[]>([]);

  const instructorId = user?.id;
  const instructorOrgId = user?.organizationId;

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!instructorId) return;

      setLoading(true);
      try {
        // Fetch courses
        const coursesRes = await coursesApi.getAll({ 
          instructorId, 
          limit: 100 
        });

        if (coursesRes?.success && coursesRes.data) {
          const courses = coursesRes.data;
          setStats(prev => ({
            ...prev,
            totalCourses: courses.length,
            publishedCourses: courses.filter((c: any) => c.status === "published").length,
            draftCourses: courses.filter((c: any) => c.status === "draft").length,
          }));

          // Get recent courses (last 5)
          setRecentCourses(courses.slice(0, 5));
        }

        // Fetch enrollments for all courses
        if (coursesRes?.success && coursesRes.data) {
          const courseIds = coursesRes.data.map((c: any) => c.id);
          let totalEnrollments = 0;
          const uniqueStudentIds = new Set<string>();

          for (const courseId of courseIds) {
            const enrollmentsRes = await enrollmentsApi.getAll({ 
              courseId,
              limit: 100 
            });
            if (enrollmentsRes?.success && enrollmentsRes.data) {
              totalEnrollments += enrollmentsRes.data.length;
              enrollmentsRes.data.forEach((e: any) => {
                uniqueStudentIds.add(e.traineeId);
              });
            }
          }

          setStats(prev => ({
            ...prev,
            totalEnrollments: totalEnrollments,
            totalStudents: uniqueStudentIds.size,
          }));
        }
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [instructorId]);

  if (authLoading || loading) {
    return (
      <ProtectedRoute allowedRoles={["instructor"]}>
        <div className="p-4 flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute allowedRoles={["instructor"]}>
      <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">
            Welcome back, {user?.firstName} {user?.lastName}
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Courses</p>
                <p className="text-2xl font-bold text-blue-700 mt-1">
                  {stats.totalCourses}
                </p>
              </div>
              <div className="bg-blue-200 p-3 rounded-full">
                <Image src="/lesson.png" alt="Courses" width={24} height={24} />
              </div>
            </div>
          </div>

          <div className="bg-green-50 p-4 rounded-lg border border-green-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Published</p>
                <p className="text-2xl font-bold text-green-700 mt-1">
                  {stats.publishedCourses}
                </p>
              </div>
              <div className="bg-green-200 p-3 rounded-full">
                <Image src="/class.png" alt="Published" width={24} height={24} />
              </div>
            </div>
          </div>

          <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Students</p>
                <p className="text-2xl font-bold text-purple-700 mt-1">
                  {stats.totalStudents}
                </p>
              </div>
              <div className="bg-purple-200 p-3 rounded-full">
                <Image src="/student.png" alt="Students" width={24} height={24} />
              </div>
            </div>
          </div>

          <div className="bg-orange-50 p-4 rounded-lg border border-orange-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Enrollments</p>
                <p className="text-2xl font-bold text-orange-700 mt-1">
                  {stats.totalEnrollments}
                </p>
              </div>
              <div className="bg-orange-200 p-3 rounded-full">
                <Image src="/result.png" alt="Enrollments" width={24} height={24} />
              </div>
            </div>
          </div>
        </div>

        {/* Recent Courses */}
        <div className="bg-white border rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Recent Courses</h2>
            <Link
              href="/instructor/courses"
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              View All →
            </Link>
          </div>

          {recentCourses.length === 0 ? (
            <div className="py-8 text-center text-gray-500">
              <p>You don't have any courses yet.</p>
              <Link
                href="/instructor/courses/new"
                className="inline-block mt-2 text-blue-600 hover:text-blue-700 text-sm"
              >
                Create your first course
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {recentCourses.map((course) => (
                <Link
                  key={course.id}
                  href={`/list/courses/${course.id}`}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex-1">
                    <h3 className="font-semibold">{course.title}</h3>
                    <p className="text-sm text-gray-500 mt-1">
                      {course.courseCode} • {course.difficultyLevel}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${
                        course.status === "published"
                          ? "bg-green-100 text-green-700"
                          : "bg-yellow-100 text-yellow-700"
                      }`}
                    >
                      {course.status}
                    </span>
                    <span className="text-sm text-gray-500">
                      {course._count?.enrollments || 0} enrolled
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

      </div>
    </ProtectedRoute>
  );
};

export default InstructorPage;
