"use client"

import { useEffect, useState, useMemo } from "react";
import FormModal from "@/components/FormModal";
import Pagination from "@/components/Pagination";
import Table from "@/components/Table";
import TableSearch from "@/components/TableSearch";
import { useAuth } from "@/lib/auth";
import { usersApi, coursesApi, enrollmentsApi } from "@/lib/api";
import Image from "next/image";
import Link from "next/link";

type User = {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  employeeId?: string;
  phone?: string;
  photoUrl?: string;
  isActive: boolean;
  department?: {
    id: string;
    name: string;
  };
  enrolledCourses?: number; // For instructor view
};

// Admin columns
const adminColumns = [
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
    header: "Role",
    accessor: "role",
    className: "hidden md:table-cell",
  },
  {
    header: "Phone",
    accessor: "phone",
    className: "hidden lg:table-cell",
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

// Instructor columns (shows students enrolled in their courses)
const instructorColumns = [
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

const UsersListPage = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });
  const [search, setSearch] = useState("");

  const isInstructor = user?.role === "instructor";
  const isAdmin = user?.role === "admin";

  // For instructors: fetch students enrolled in their courses
  const fetchInstructorStudents = async (page = 1, searchTerm = "") => {
    if (!user?.id) return;

    setLoading(true);
    try {
      // Get all courses for this instructor
      const coursesRes = await coursesApi.getAll({ 
        instructorId: user.id, 
        limit: 100 
      });
      
      if (!coursesRes?.success || !coursesRes.data || coursesRes.data.length === 0) {
        setUsers([]);
        setPagination({
          page: 1,
          limit: 10,
          total: 0,
          totalPages: 0,
        });
        setLoading(false);
        return;
      }

      const courses = coursesRes.data;
      const courseIds = courses.map((c: any) => c.id);

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
        setUsers([]);
        setPagination({
          page: 1,
          limit: 10,
          total: 0,
          totalPages: 0,
        });
        setLoading(false);
        return;
      }

      // Fetch trainee details
      const traineesRes = await usersApi.getAll({
        role: "trainee",
        organizationId: user.organizationId,
        limit: 100,
      });

      if (!traineesRes?.success || !traineesRes.data) {
        setUsers([]);
        setPagination({
          page: 1,
          limit: 10,
          total: 0,
          totalPages: 0,
        });
        setLoading(false);
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

      // Map to User type
      const studentsData: User[] = enrolledTrainees.map((t: any) => ({
        id: t.id,
        username: t.username,
        email: t.email,
        firstName: t.firstName,
        lastName: t.lastName,
        role: t.role,
        employeeId: t.employeeId,
        phone: t.phone,
        photoUrl: t.photoUrl,
        isActive: t.isActive,
        department: t.department,
        enrolledCourses: enrollmentsByTrainee[t.id] || 0,
      }));

      // Apply search filter
      const filtered = searchTerm
        ? studentsData.filter(
            (s) =>
              s.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
              s.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
              s.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
              s.employeeId?.toLowerCase().includes(searchTerm.toLowerCase())
          )
        : studentsData;

      // Client-side pagination for instructor view
      const limit = 10;
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginated = filtered.slice(startIndex, endIndex);

      setUsers(paginated);
      setPagination({
        page,
        limit,
        total: filtered.length,
        totalPages: Math.ceil(filtered.length / limit),
      });
    } catch (error) {
      console.error("Failed to fetch students:", error);
    } finally {
      setLoading(false);
    }
  };

  // For admins: fetch all users
  const fetchUsers = async (page = 1, searchTerm = "") => {
    try {
      setLoading(true);
      const response = await usersApi.getAll({
        page,
        limit: 10,
        search: searchTerm,
      });

      if (response.success && response.data) {
        setUsers(response.data);
        if (response.pagination) {
          setPagination(response.pagination);
        }
      }
    } catch (error) {
      console.error("Failed to fetch users:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user?.id) return;
    
    if (isInstructor) {
      fetchInstructorStudents(1, search);
    } else if (isAdmin) {
      fetchUsers(1, search);
    }
  }, [user?.id, user?.role, search]);

  const handleSearch = (searchTerm: string) => {
    setSearch(searchTerm);
    if (isInstructor) {
      fetchInstructorStudents(1, searchTerm);
    } else {
      fetchUsers(1, searchTerm);
    }
  };

  const handlePageChange = (page: number) => {
    if (isInstructor) {
      fetchInstructorStudents(page, search);
    } else {
      fetchUsers(page, search);
    }
  };

  const renderRow = (item: User) => (
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
      {isAdmin ? (
        <>
          <td className="hidden md:table-cell">
            <span className="capitalize">{item.role}</span>
          </td>
          <td className="hidden lg:table-cell">{item.phone || "N/A"}</td>
        </>
      ) : (
        <>
          <td className="hidden lg:table-cell">
            {item.department?.name || "N/A"}
          </td>
          <td className="hidden lg:table-cell">{item.phone || "N/A"}</td>
          <td className="hidden md:table-cell">
            <span className="px-2 py-1 rounded-full text-xs bg-blue-50 text-blue-700">
              {item.enrolledCourses} course{item.enrolledCourses !== 1 ? "s" : ""}
            </span>
          </td>
        </>
      )}
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
          {isAdmin && (
            <>
              <FormModal 
                table="user" 
                type="update" 
                id={item.id} 
                onSuccess={() => fetchUsers(pagination.page, search)}
              />
              <FormModal 
                table="user" 
                type="delete" 
                id={item.id} 
                onSuccess={() => fetchUsers(pagination.page, search)}
              />
            </>
          )}
        </div>
      </td>
    </tr>
  );

  const stats = useMemo(() => {
    if (isInstructor) {
      const total = users.length;
      const active = users.filter((s) => s.isActive).length;
      return { total, active };
    }
    return null;
  }, [users, isInstructor]);

  if (loading) {
    return (
      <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const columns = isAdmin ? adminColumns : instructorColumns;
  const title = isAdmin ? "All Users" : "My Students";

  return (
    <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
      {/* TOP */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="hidden md:block text-lg font-semibold">{title}</h1>
          {isInstructor && stats && (
            <p className="text-sm text-gray-500 md:hidden lg:block mt-1">
              Total: {stats.total} • Active: {stats.active}
            </p>
          )}
        </div>
        <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
          <TableSearch onSearch={handleSearch} />
          <div className="flex items-center gap-4 self-end">
            {isAdmin && (
              <FormModal 
                table="user" 
                type="create" 
                onSuccess={() => fetchUsers(1, search)}
              />
            )}
          </div>
        </div>
      </div>
      {/* LIST */}
      {users.length === 0 ? (
        <div className="py-12 text-center">
          <p className="text-gray-600">
            {search
              ? isAdmin
                ? "No users found matching your search."
                : "No students found matching your search."
              : isAdmin
              ? "No users found."
              : "You don't have any students enrolled in your courses yet."}
          </p>
        </div>
      ) : (
        <>
          <Table columns={columns} renderRow={renderRow} data={users} />
          {/* PAGINATION */}
          {pagination.totalPages > 1 && (
            <Pagination
              page={pagination.page}
              totalPages={pagination.totalPages}
              onPageChange={handlePageChange}
            />
          )}
        </>
      )}
    </div>
  );
};

export default UsersListPage;
