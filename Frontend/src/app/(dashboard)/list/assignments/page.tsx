"use client"

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { assignmentsApi } from "@/lib/api";
import FormModal from "@/components/FormModal";
import Image from "next/image";
import Link from "next/link";

type Assignment = {
  id: string;
  title: string;
  description?: string;
  dueDate?: string;
  maxScore: number;
  course?: {
    id: string;
    title: string;
    courseCode: string;
  };
  _count?: {
    submissions: number;
  };
};

const AssignmentListPage = () => {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchAssignments();
  }, [page, search]);

  const fetchAssignments = async () => {
    try {
      setLoading(true);
      const response = await assignmentsApi.getAll({
        page,
        limit: 10,
        search: search || undefined,
      });

      if (response.success && response.data) {
        setAssignments(response.data);
        // Calculate total pages (assuming backend returns total count)
        // For now, we'll use a simple pagination
        setTotalPages(Math.ceil((response.data.length || 0) / 10));
      }
    } catch (error) {
      console.error("Failed to fetch assignments:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this assignment?")) return;

    try {
      await assignmentsApi.delete(id);
      fetchAssignments();
    } catch (error: any) {
      alert(error.message || "Failed to delete assignment");
    }
  };

  const canEdit = user?.role === "admin" || user?.role === "instructor";

  return (
    <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
      {/* TOP */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-lg font-semibold">All Assignments</h1>
        <div className="flex items-center gap-4">
          <input
            type="text"
            placeholder="Search assignments..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {canEdit && (
            <p className="text-xs text-gray-500">
              Create assignments from within a course
            </p>
          )}
        </div>
      </div>

      {/* LIST */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      ) : assignments.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p>No assignments found</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left p-4 text-sm font-semibold text-gray-700">Title</th>
                <th className="text-left p-4 text-sm font-semibold text-gray-700 hidden md:table-cell">
                  Course
                </th>
                <th className="text-left p-4 text-sm font-semibold text-gray-700 hidden md:table-cell">
                  Due Date
                </th>
                <th className="text-left p-4 text-sm font-semibold text-gray-700 hidden md:table-cell">
                  Max Score
                </th>
                <th className="text-left p-4 text-sm font-semibold text-gray-700 hidden md:table-cell">
                  Submissions
                </th>
                <th className="text-left p-4 text-sm font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {assignments.map((assignment) => {
                const isOverdue =
                  assignment.dueDate && new Date(assignment.dueDate) < new Date();

                return (
                  <tr
                    key={assignment.id}
                    className="border-b border-gray-200 even:bg-slate-50 text-sm hover:bg-gray-50"
                  >
                    <td className="p-4">
                      <div>
                        <p className="font-medium text-gray-900">{assignment.title}</p>
                        {assignment.description && (
                          <p className="text-xs text-gray-500 mt-1 line-clamp-1">
                            {assignment.description}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="p-4 hidden md:table-cell">
                      {assignment.course ? (
                        <Link
                          href={`/list/courses/${assignment.course.id}`}
                          className="text-blue-600 hover:text-blue-700"
                        >
                          {assignment.course.title}
                        </Link>
                      ) : (
                        <span className="text-gray-400">N/A</span>
                      )}
                    </td>
                    <td className="p-4 hidden md:table-cell">
                      {assignment.dueDate ? (
                        <span className={isOverdue ? "text-red-600" : "text-gray-700"}>
                          {new Date(assignment.dueDate).toLocaleDateString()}
                        </span>
                      ) : (
                        <span className="text-gray-400">No due date</span>
                      )}
                    </td>
                    <td className="p-4 hidden md:table-cell">{assignment.maxScore} points</td>
                    <td className="p-4 hidden md:table-cell">
                      {assignment._count?.submissions || 0}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        {assignment.course && (
                          <Link href={`/list/courses/${assignment.course.id}`}>
                            <button className="w-7 h-7 flex items-center justify-center rounded-full bg-blue-100 hover:bg-blue-200">
                              <Image src="/view.png" alt="View" width={16} height={16} />
                            </button>
                          </Link>
                        )}
                        {canEdit && (
                          <>
                            <FormModal
                              entity="assignment"
                              type="update"
                              data={assignment}
                              onSuccess={fetchAssignments}
                            />
                            <button
                              onClick={() => handleDelete(assignment.id)}
                              className="w-7 h-7 flex items-center justify-center rounded-full bg-red-100 hover:bg-red-200"
                            >
                              <Image src="/delete.png" alt="Delete" width={16} height={16} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* PAGINATION */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 pt-4 border-t">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <span className="text-sm text-gray-600">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      )}

    </div>
  );
};

export default AssignmentListPage;
