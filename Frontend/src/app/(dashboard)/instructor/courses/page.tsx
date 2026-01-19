"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/lib/auth";
import { coursesApi } from "@/lib/api";

export default function InstructorCoursesPage() {
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [courses, setCourses] = useState<any[]>([]);

  const instructorId = user?.id;

  const stats = useMemo(() => {
    const total = courses.length;
    const published = courses.filter((c) => c.status === "published").length;
    const draft = courses.filter((c) => c.status === "draft").length;
    return { total, published, draft };
  }, [courses]);

  useEffect(() => {
    const fetchCourses = async () => {
      if (!instructorId) return;
      setLoading(true);
      setError(null);
      try {
        const res = await coursesApi.getAll({ instructorId, limit: 50 });
        if (res?.success && res.data) {
          setCourses(res.data);
        } else {
          setCourses([]);
        }
      } catch (e: any) {
        setError(e?.message || "Failed to load courses");
      } finally {
        setLoading(false);
      }
    };
    fetchCourses();
  }, [instructorId]);

  if (authLoading) {
    return (
      <div className="p-4 flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
      </div>
    );
  }

  return (
    <ProtectedRoute allowedRoles={["instructor"]}>
      <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-lg font-semibold">My Courses</h1>
            <p className="text-sm text-gray-500">
              Total: {stats.total} • Published: {stats.published} • Draft: {stats.draft}
            </p>
          </div>
          <Link
            href="/instructor/courses/new"
            className="bg-blue-500 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-600"
          >
            Create Course
          </Link>
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-md bg-red-50 text-red-700 text-sm">
            {error}
          </div>
        )}

        <div className="mt-4">
          {loading ? (
            <div className="py-8 text-center text-gray-500">Loading courses...</div>
          ) : courses.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-gray-600">You don’t have any courses yet.</p>
              <Link
                href="/instructor/courses/new"
                className="inline-block mt-4 bg-blue-500 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-600"
              >
                Create your first course
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {courses.map((course) => (
                <div key={course.id} className="border rounded-lg p-4 hover:shadow-sm transition-shadow">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h2 className="font-semibold truncate">{course.title}</h2>
                      <p className="text-xs text-gray-500 mt-1">
                        {course.courseCode} • {course.difficultyLevel}
                      </p>
                    </div>
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${
                        course.status === "published"
                          ? "bg-green-50 text-green-700"
                          : course.status === "draft"
                            ? "bg-yellow-50 text-yellow-700"
                            : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {course.status}
                    </span>
                  </div>

                  {course.description && (
                    <p className="text-sm text-gray-600 mt-3 line-clamp-3">{course.description}</p>
                  )}

                  <div className="mt-4 flex items-center justify-between text-xs text-gray-500">
                    <span>Modules: {course?._count?.modules ?? 0}</span>
                    <span>Enrollments: {course?._count?.enrollments ?? 0}</span>
                  </div>

                  <div className="mt-4 flex items-center justify-end gap-2">
                    <Link
                      href={`/courses/${course.id}`}
                      className="text-sm px-3 py-1.5 rounded-md border hover:bg-gray-50"
                    >
                      View
                    </Link>
                    <Link
                      href={`/list/courses/${course.id}/edit`}
                      className="text-sm px-3 py-1.5 rounded-md bg-blue-500 text-white hover:bg-blue-600"
                    >
                      Edit
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}

