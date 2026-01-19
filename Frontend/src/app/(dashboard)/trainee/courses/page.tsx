"use client"

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { enrollmentsApi } from "@/lib/api";
import ProtectedRoute from "@/components/ProtectedRoute";
import TableSearch from "@/components/TableSearch";
import Pagination from "@/components/Pagination";

type FilterType = 'all' | 'in_progress' | 'completed' | 'enrolled';
type SortType = 'recent' | 'progress' | 'title' | 'dueDate';

const MyCoursesPage = () => {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [filteredEnrollments, setFilteredEnrollments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterType>('all');
  const [sort, setSort] = useState<SortType>('recent');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    totalPages: 0,
  });

  const fetchEnrollments = async (page = 1, searchTerm = "") => {
    try {
      setLoading(true);
      const response = await enrollmentsApi.getAll({
        page,
        limit: pagination.limit,
        search: searchTerm || undefined,
      });

      if (response.success && response.data) {
        setEnrollments(response.data);
        setPagination(response.pagination || {
          page,
          limit: pagination.limit,
          total: response.data.length,
          totalPages: 1,
        });
      }
    } catch (error) {
      console.error("Failed to fetch enrollments:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchEnrollments();
    }
  }, [user]);

  // Filter and sort enrollments
  useEffect(() => {
    let result = [...enrollments];

    // Apply search filter
    if (search) {
      result = result.filter((enrollment) => {
        const course = enrollment.course;
        const searchLower = search.toLowerCase();
        return (
          course?.title?.toLowerCase().includes(searchLower) ||
          course?.courseCode?.toLowerCase().includes(searchLower) ||
          course?.description?.toLowerCase().includes(searchLower)
        );
      });
    }

    // Apply status filter
    if (filter !== 'all') {
      result = result.filter((enrollment) => {
        if (filter === 'in_progress') return enrollment.status === 'in_progress';
        if (filter === 'completed') return enrollment.status === 'completed';
        if (filter === 'enrolled') return enrollment.status === 'enrolled';
        return true;
      });
    }

    // Apply sorting
    result.sort((a, b) => {
      switch (sort) {
        case 'progress':
          return (b.progressPercentage || 0) - (a.progressPercentage || 0);
        case 'title':
          return (a.course?.title || '').localeCompare(b.course?.title || '');
        case 'dueDate':
          if (!a.dueDate && !b.dueDate) return 0;
          if (!a.dueDate) return 1;
          if (!b.dueDate) return -1;
          return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        case 'recent':
        default:
          return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
      }
    });

    setFilteredEnrollments(result);
  }, [enrollments, search, filter, sort]);

  const handleSearch = (searchTerm: string) => {
    setSearch(searchTerm);
    fetchEnrollments(1, searchTerm);
  };

  if (authLoading || loading) {
    return (
      <ProtectedRoute allowedRoles={["trainee"]}>
        <div className="p-4 flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </ProtectedRoute>
    );
  }

  const stats = {
    total: enrollments.length,
    inProgress: enrollments.filter((e: any) => e.status === 'in_progress').length,
    completed: enrollments.filter((e: any) => e.status === 'completed').length,
    enrolled: enrollments.filter((e: any) => e.status === 'enrolled').length,
  };

  return (
    <ProtectedRoute allowedRoles={["trainee"]}>
      <div className="p-4 space-y-6">
        {/* HEADER */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-md p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">My Courses</h1>
          <p className="text-gray-600">Manage and track your learning progress</p>
        </div>

        {/* STATS CARDS */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <p className="text-xs text-gray-500 mb-1">Total Courses</p>
            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <p className="text-xs text-gray-500 mb-1">In Progress</p>
            <p className="text-2xl font-bold text-blue-600">{stats.inProgress}</p>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <p className="text-xs text-gray-500 mb-1">Completed</p>
            <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <p className="text-xs text-gray-500 mb-1">Not Started</p>
            <p className="text-2xl font-bold text-gray-600">{stats.enrolled}</p>
          </div>
        </div>

        {/* FILTERS AND SEARCH */}
        <div className="bg-white rounded-md p-4">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            <div className="flex flex-wrap gap-2">
              {[
                { id: 'all', label: 'All' },
                { id: 'in_progress', label: 'In Progress' },
                { id: 'completed', label: 'Completed' },
                { id: 'enrolled', label: 'Not Started' },
              ].map((filterOption) => (
                <button
                  key={filterOption.id}
                  onClick={() => setFilter(filterOption.id as FilterType)}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                    filter === filterOption.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {filterOption.label}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-4 w-full md:w-auto">
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-600">Sort by:</label>
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value as SortType)}
                  className="px-3 py-1 rounded-md border border-gray-300 text-sm"
                >
                  <option value="recent">Recently Enrolled</option>
                  <option value="progress">Progress</option>
                  <option value="title">Title</option>
                  <option value="dueDate">Due Date</option>
                </select>
              </div>
              <TableSearch onSearch={handleSearch} />
            </div>
          </div>
        </div>

        {/* COURSES GRID */}
        {filteredEnrollments.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEnrollments.map((enrollment: any) => {
              const course = enrollment.course;
              const progress = enrollment.progressPercentage || 0;
              const isOverdue = enrollment.dueDate && new Date(enrollment.dueDate) < new Date() && enrollment.status !== 'completed';

              return (
                <Link
                  key={enrollment.id}
                  href={`/courses/${course?.id}`}
                  className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow overflow-hidden"
                >
                  {/* Course Thumbnail/Header */}
                  <div className="relative h-32 bg-gradient-to-br from-blue-500 to-indigo-600">
                    {course?.thumbnailUrl ? (
                      <img
                        src={course.thumbnailUrl}
                        alt={course.title}
                        className="absolute inset-0 w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Image src="/lesson.png" alt="Course" width={48} height={48} className="opacity-50" />
                      </div>
                    )}
                    <div className="absolute top-2 right-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        enrollment.status === 'completed'
                          ? 'bg-green-500 text-white'
                          : enrollment.status === 'in_progress'
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-500 text-white'
                      }`}>
                        {enrollment.status === 'completed' ? 'Completed' : 
                         enrollment.status === 'in_progress' ? 'In Progress' : 'Not Started'}
                      </span>
                    </div>
                    {isOverdue && (
                      <div className="absolute top-2 left-2">
                        <span className="px-2 py-1 bg-red-500 text-white rounded-full text-xs font-medium">
                          Overdue
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Course Content */}
                  <div className="p-4">
                    <h3 className="font-semibold text-lg text-gray-900 mb-1 line-clamp-2">
                      {course?.title || 'Untitled Course'}
                    </h3>
                    <p className="text-sm text-gray-500 mb-3">{course?.courseCode}</p>

                    {/* Progress Bar */}
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-gray-600">Progress</span>
                        <span className="text-xs font-medium text-gray-900">{progress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all ${
                            enrollment.status === 'completed'
                              ? 'bg-green-500'
                              : enrollment.status === 'in_progress'
                              ? 'bg-blue-500'
                              : 'bg-gray-300'
                          }`}
                          style={{ width: `${progress}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Course Info */}
                    <div className="space-y-2 text-xs text-gray-600 mb-4">
                      {course?.instructor && (
                        <div className="flex items-center gap-2">
                          <Image src="/teacher.png" alt="" width={14} height={14} />
                          <span>{course.instructor.firstName} {course.instructor.lastName}</span>
                        </div>
                      )}
                      {course?.difficultyLevel && (
                        <div className="flex items-center gap-2">
                          <Image src="/subject.png" alt="" width={14} height={14} />
                          <span className="capitalize">{course.difficultyLevel}</span>
                        </div>
                      )}
                      {course?.estimatedDuration && (
                        <div className="flex items-center gap-2">
                          <Image src="/lesson.png" alt="" width={14} height={14} />
                          <span>{course.estimatedDuration} hours</span>
                        </div>
                      )}
                    </div>

                    {/* Dates and Actions */}
                    <div className="pt-4 border-t border-gray-200 space-y-2">
                      {enrollment.startedAt && (
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-500">Started:</span>
                          <span className="text-gray-700">
                            {new Date(enrollment.startedAt).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                      {enrollment.dueDate && (
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-500">Due Date:</span>
                          <span className={isOverdue ? 'text-red-600 font-medium' : 'text-gray-700'}>
                            {new Date(enrollment.dueDate).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                      {enrollment.completedAt && (
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-500">Completed:</span>
                          <span className="text-green-600 font-medium">
                            {new Date(enrollment.completedAt).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                      <div className="flex gap-2 pt-2">
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            router.push(`/courses/${course?.id}`);
                          }}
                          className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                            enrollment.status === 'completed'
                              ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                              : 'bg-blue-600 text-white hover:bg-blue-700'
                          }`}
                        >
                          {enrollment.status === 'completed' ? 'Review' : 'Continue'}
                        </button>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="bg-white rounded-md p-12 text-center">
            <Image src="/lesson.png" alt="No courses" width={64} height={64} className="mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {search || filter !== 'all' ? 'No courses found' : 'No courses enrolled'}
            </h3>
            <p className="text-gray-500 mb-4">
              {search || filter !== 'all'
                ? 'Try adjusting your search or filter criteria'
                : 'Explore available courses and enroll to get started'}
            </p>
            {!search && filter === 'all' && (
              <Link
                href="/trainee/explore"
                className="inline-block px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700"
              >
                Explore Courses
              </Link>
            )}
          </div>
        )}

        {/* PAGINATION */}
        {pagination.totalPages > 1 && (
          <div className="flex justify-center">
            <Pagination
              page={pagination.page}
              totalPages={pagination.totalPages}
              onPageChange={(page) => fetchEnrollments(page, search)}
            />
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
};

export default MyCoursesPage;
