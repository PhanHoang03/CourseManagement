"use client";

import { useEffect, useState, useMemo } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/lib/auth";
import { coursesApi, enrollmentsApi, usersApi } from "@/lib/api";
import Image from "next/image";
import Link from "next/link";
import Table from "@/components/Table";
import TableSearch from "@/components/TableSearch";
import Pagination from "@/components/Pagination";

type Student = {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  employeeId?: string;
  phone?: string;
  photoUrl?: string;
  isActive: boolean;
  organization?: {
    id: string;
    name: string;
  };
  department?: {
    id: string;
    name: string;
  };
  enrolledCourses?: number;
};

const columns = [
  {
    header: "Info",
    accessor: "info",
  },
  {
    header: "Employee ID",
    accessor: "employeeId",
    className: "hidden md:table-cell",
  },
  {
    header: "Department",
    accessor: "department",
    className: "hidden lg:table-cell",
  },
  {
    header: "Phone",
    accessor: "phone",
    className: "hidden lg:table-cell",
  },
  {
    header: "Enrolled Courses",
    accessor: "enrolledCourses",
    className: "hidden md:table-cell",
  },
  {
    header: "Status",
    accessor: "status",
    className: "hidden md:table-cell",
  },
  {
    header: "Actions",
    accessor: "actions",
  },
];

export default function InstructorStudentsPage() {
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [search, setSearch] = useState("");
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });

  const instructorId = user?.id;
  const instructorOrgId = user?.organizationId;

  // Fetch students enrolled in instructor's courses
  useEffect(() => {
    const fetchStudents = async () => {
      if (!instructorId) return;
      
      setLoading(true);
      setError(null);
      
      try {
        // Get all courses for this instructor
        const coursesRes = await coursesApi.getAll({ 
          instructorId, 
          limit: 100 
        });
        
        if (!coursesRes?.success || !coursesRes.data) {
          setStudents([]);
          setPagination({
            page: 1,
            limit: 10,
            total: 0,
            totalPages: 0,
          });
          return;
        }

        const courses = coursesRes.data;
        const courseIds = courses.map((c: any) => c.id);

        if (courseIds.length === 0) {
          setStudents([]);
          setPagination({
            page: 1,
            limit: 10,
            total: 0,
            totalPages: 0,
          });
          return;
        }

        // Get all enrollments for these courses
        const allEnrollments: any[] = [];
        for (const courseId of courseIds) {
          const enrollmentsRes = await enrollmentsApi.getAll({ 
            courseId,
            limit: 100 
          });
          if (enrollmentsRes?.success && enrollmentsRes.data) {
            allEnrollments.push(...enrollmentsRes.data);
          }
        }

        // Get unique trainee IDs
        const uniqueTraineeIds = Array.from(
          new Set(allEnrollments.map((e: any) => e.traineeId))
        );

        if (uniqueTraineeIds.length === 0) {
          setStudents([]);
          setPagination({
            page: 1,
            limit: 10,
            total: 0,
            totalPages: 0,
          });
          return;
        }

        // Fetch trainee details
        // Filter by organization and role
        const traineesRes = await usersApi.getAll({
          role: "trainee",
          organizationId: instructorOrgId,
          limit: 100,
        });

        if (!traineesRes?.success || !traineesRes.data) {
          setStudents([]);
          setPagination({
            page: 1,
            limit: 10,
            total: 0,
            totalPages: 0,
          });
          return;
        }

        // Filter to only include trainees enrolled in instructor's courses
        const enrolledTrainees = traineesRes.data.filter((t: any) =>
          uniqueTraineeIds.includes(t.id)
        );

        // Count enrollments per trainee
        const enrollmentsByTrainee = allEnrollments.reduce((acc: any, e: any) => {
          acc[e.traineeId] = (acc[e.traineeId] || 0) + 1;
          return acc;
        }, {});

        // Map to Student type
        const studentsData: Student[] = enrolledTrainees.map((t: any) => ({
          id: t.id,
          username: t.username,
          email: t.email,
          firstName: t.firstName,
          lastName: t.lastName,
          employeeId: t.employeeId,
          phone: t.phone,
          photoUrl: t.photoUrl,
          isActive: t.isActive,
          organization: t.organization,
          department: t.department,
          enrolledCourses: enrollmentsByTrainee[t.id] || 0,
        }));

        // Apply search filter
        const filtered = search
          ? studentsData.filter(
              (s) =>
                s.firstName.toLowerCase().includes(search.toLowerCase()) ||
                s.lastName.toLowerCase().includes(search.toLowerCase()) ||
                s.email.toLowerCase().includes(search.toLowerCase()) ||
                s.employeeId?.toLowerCase().includes(search.toLowerCase())
            )
          : studentsData;

        // Pagination
        const currentPage = pagination.page;
        const limit = pagination.limit;
        const startIndex = (currentPage - 1) * limit;
        const endIndex = startIndex + limit;
        const paginated = filtered.slice(startIndex, endIndex);

        setStudents(paginated);
        setPagination((prev) => ({
          ...prev,
          total: filtered.length,
          totalPages: Math.ceil(filtered.length / limit),
        }));
      } catch (e: any) {
        setError(e?.message || "Failed to load students");
        console.error("Failed to fetch students:", e);
      } finally {
        setLoading(false);
      }
    };

    fetchStudents();
  }, [instructorId, instructorOrgId, search, pagination.page]);

  const handleSearch = (searchTerm: string) => {
    setSearch(searchTerm);
    setPagination({ ...pagination, page: 1 });
  };

  const renderRow = (item: Student) => (
    <tr
      key={item.id}
      className="border-b border-gray-200 even:bg-slate-50 text-sm hover:bg-lamaPurpleLight"
    >
      <td className="flex items-center gap-4 p-4">
        <Image
          src={item.photoUrl || "/avatar.png"}
          alt=""
          width={40}
          height={40}
          className="md:hidden xl:block w-10 h-10 rounded-full object-cover"
        />
        <div className="flex flex-col">
          <h3 className="font-semibold">
            {item.firstName} {item.lastName}
          </h3>
          <p className="text-sm text-gray-500">{item.email}</p>
        </div>
      </td>
      <td className="hidden md:table-cell">{item.employeeId || "N/A"}</td>
      <td className="hidden lg:table-cell">
        {item.department?.name || "N/A"}
      </td>
      <td className="hidden lg:table-cell">{item.phone || "N/A"}</td>
      <td className="hidden md:table-cell">
        <span className="px-2 py-1 rounded-full text-xs bg-blue-50 text-blue-700">
          {item.enrolledCourses} course{item.enrolledCourses !== 1 ? "s" : ""}
        </span>
      </td>
      <td className="hidden md:table-cell">
        <span
          className={`px-2 py-1 rounded-full text-xs ${
            item.isActive
              ? "bg-green-100 text-green-800"
              : "bg-red-100 text-red-800"
          }`}
        >
          {item.isActive ? "Active" : "Inactive"}
        </span>
      </td>
      <td>
        <div className="flex items-center gap-2">
          <Link href={`/list/users/${item.id}`}>
            <button className="w-7 h-7 flex items-center justify-center rounded-full bg-lamaSky">
              <Image src="/view.png" alt="" width={16} height={16} />
            </button>
          </Link>
        </div>
      </td>
    </tr>
  );

  const stats = useMemo(() => {
    const total = students.length;
    const active = students.filter((s) => s.isActive).length;
    return { total, active };
  }, [students]);

  if (authLoading || loading) {
    return (
      <ProtectedRoute allowedRoles={["instructor"]}>
        <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute allowedRoles={["instructor"]}>
      <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
        {/* TOP */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-lg font-semibold">My Students</h1>
            <p className="text-sm text-gray-500">
              Total: {stats.total} • Active: {stats.active}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <TableSearch onSearch={handleSearch} />
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-md bg-red-50 text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* LIST */}
        {students.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-gray-600">
              {search
                ? "No students found matching your search."
                : "You don't have any students enrolled in your courses yet."}
            </p>
          </div>
        ) : (
          <>
            <Table columns={columns} renderRow={renderRow} data={students} />
            {/* PAGINATION */}
            {pagination.totalPages > 1 && (
              <Pagination
                page={pagination.page}
                totalPages={pagination.totalPages}
                onPageChange={(page) =>
                  setPagination({ ...pagination, page })
                }
              />
            )}
          </>
        )}
      </div>
    </ProtectedRoute>
  );
}
