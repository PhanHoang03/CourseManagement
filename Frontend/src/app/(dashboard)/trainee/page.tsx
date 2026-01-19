"use client"

import { useEffect, useState } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/lib/auth";
import { coursesApi, departmentsApi } from "@/lib/api";
import Image from "next/image";
import Link from "next/link";

const TraineePage = () => {
  const { user, loading } = useAuth();
  const [recommendedCourses, setRecommendedCourses] = useState<any[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchInput, setSearchInput] = useState(""); // For the input field value
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<string>("");
  const [departments, setDepartments] = useState<any[]>([]);
  const [loadingDepartments, setLoadingDepartments] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCourses, setTotalCourses] = useState(0);
  const coursesPerPage = 12;

  // Fetch departments
  useEffect(() => {
    const fetchDepartments = async () => {
      setLoadingDepartments(true);
      try {
        const res = await departmentsApi.getAll({ limit: 100 });
        if (res.success && res.data) {
          setDepartments(res.data);
        }
      } catch (error) {
        console.error("Failed to fetch departments:", error);
      } finally {
        setLoadingDepartments(false);
      }
    };

    if (user) {
      fetchDepartments();
    }
  }, [user]);

  // Fetch courses with filters and pagination
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setLoadingCourses(true);
        
        // Reset to page 1 when filters change
        if (currentPage === 1 || searchQuery || selectedDepartmentId) {
          // Only reset if we're not already on page 1 or filters changed
        }

        // Get recommended courses (public courses) with filters and pagination
        try {
          let coursesRes;
          // Always use getAll to ensure organization filtering for trainees
          coursesRes = await coursesApi.getAll({ 
            page: currentPage,
            limit: coursesPerPage,
            search: searchQuery || undefined,
            departmentId: selectedDepartmentId || undefined,
          });
          // Filter to only show public, published courses
          const filtered = (coursesRes.data || []).filter((c: any) => c.isPublic && c.status === 'published');
          setRecommendedCourses(filtered);
          // Use pagination from API response if available
          if (coursesRes.pagination) {
            setTotalPages(coursesRes.pagination.totalPages || 1);
            setTotalCourses(coursesRes.pagination.total || filtered.length);
          } else {
            // Fallback estimation
            if (filtered.length < coursesPerPage) {
              setTotalPages(currentPage);
            } else {
              setTotalPages(currentPage + 1);
            }
            setTotalCourses(filtered.length + (currentPage - 1) * coursesPerPage);
          }
        } catch (error) {
          console.error("Failed to fetch courses:", error);
          // Fallback: try regular getAll with filters
          try {
            const coursesRes = await coursesApi.getAll({ 
              page: currentPage,
              limit: coursesPerPage,
              search: searchQuery || undefined,
              departmentId: selectedDepartmentId || undefined,
            });
            const filtered = (coursesRes.data || []).filter((c: any) => c.isPublic);
            setRecommendedCourses(filtered);
            if (filtered.length < coursesPerPage) {
              setTotalPages(currentPage);
            } else {
              setTotalPages(currentPage + 1);
            }
            setTotalCourses(filtered.length + (currentPage - 1) * coursesPerPage);
          } catch (fallbackError) {
            console.error("Fallback course fetch failed:", fallbackError);
            setRecommendedCourses([]);
            setTotalPages(1);
            setTotalCourses(0);
          }
        }
      } catch (error) {
        console.error("Failed to fetch courses:", error);
      } finally {
        setLoadingCourses(false);
      }
    };

    if (user) {
      fetchCourses();
    }
  }, [user, searchQuery, selectedDepartmentId, currentPage]);

  // Reset to page 1 when search or department filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedDepartmentId]);

  if (loading || loadingCourses) {
    return (
      <div className="p-4 flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <ProtectedRoute allowedRoles={["trainee"]}>
      <div className="p-4 space-y-6">
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-8 rounded-lg">
          <h1 className="text-3xl font-bold mb-2">
            Welcome back, {user?.firstName}!
          </h1>
          <p className="text-blue-100">
            Continue your learning journey
          </p>
        </div>

        {/* Explore Courses */}
        <div>
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-4">
            <h2 className="text-xl font-semibold">Explore Courses</h2>
            
            {/* Search and Filter */}
            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
              {/* Search Input */}
              <div className="relative flex-1 md:flex-initial">
                <input
                  type="text"
                  placeholder="Search courses..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      setSearchQuery(searchInput);
                    }
                  }}
                  className="w-full md:w-64 px-4 py-2 pl-10 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <Image
                  src="/search.png"
                  alt="Search"
                  width={16}
                  height={16}
                  className="absolute left-3 top-1/2 transform -translate-y-1/2"
                />
              </div>
              
              {/* Department Filter */}
              <select
                value={selectedDepartmentId}
                onChange={(e) => setSelectedDepartmentId(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                disabled={loadingDepartments}
              >
                <option value="">All Departments</option>
                {departments.map((dept) => (
                  <option key={dept.id} value={dept.id}>
                    {dept.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          {recommendedCourses.length === 0 && !loadingCourses ? (
            <div className="bg-white p-8 rounded-lg text-center">
              <p className="text-gray-500">
                {searchQuery || selectedDepartmentId 
                  ? "No courses found matching your filters." 
                  : "No courses available at the moment."}
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {recommendedCourses.map((course: any) => (
                  <Link
                    key={course.id}
                    href={`/courses/${course.id}`}
                    className="bg-white p-4 rounded-lg shadow hover:shadow-lg transition-shadow"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Image src="/lesson.png" alt="Course" width={32} height={32} />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">{course.title}</h3>
                        <p className="text-sm text-gray-500">{course.courseCode}</p>
                        {course.organization && (
                          <p className="text-xs text-gray-400 mt-1">
                            {course.organization.name}
                          </p>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-6">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1 || loadingCourses}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }
                      
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          disabled={loadingCourses}
                          className={`px-3 py-2 border rounded-md text-sm ${
                            currentPage === pageNum
                              ? 'bg-blue-600 text-white border-blue-600'
                              : 'border-gray-300 hover:bg-gray-50'
                          } disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>

                  <button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage >= totalPages || loadingCourses}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default TraineePage;
