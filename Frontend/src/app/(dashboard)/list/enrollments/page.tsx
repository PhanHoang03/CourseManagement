"use client"

import { useEffect, useState } from "react";
import Pagination from "@/components/Pagination";
import Table from "@/components/Table";
import TableSearch from "@/components/TableSearch";
import { useAuth } from "@/lib/auth";
import { enrollmentsApi } from "@/lib/api";
import Image from "next/image";
import Link from "next/link";

type Enrollment = {
  id: string;
  status: string;
  progress: number;
  startedAt?: string;
  completedAt?: string;
  course: {
    id: string;
    title: string;
    courseCode: string;
  };
  trainee: {
    firstName: string;
    lastName: string;
    email: string;
  };
};

const columns = [
  {
    header: "Course",
    accessor: "course",
  },
  {
    header: "Trainee",
    accessor: "trainee",
    className: "hidden md:table-cell",
  },
  {
    header: "Status",
    accessor: "status",
    className: "hidden md:table-cell",
  },
  {
    header: "Progress",
    accessor: "progress",
    className: "hidden lg:table-cell",
  },
  {
    header: "Started",
    accessor: "started",
    className: "hidden lg:table-cell",
  },
  {
    header: "Actions",
    accessor: "actions",
  },
];

const EnrollmentsListPage = () => {
  const { user } = useAuth();
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });
  const [search, setSearch] = useState("");

  const fetchEnrollments = async (page = 1, searchTerm = "") => {
    try {
      setLoading(true);
      const params: any = { page, limit: 10 };
      
      // Trainees only see their own enrollments
      if (user?.role === "trainee") {
        params.traineeId = user.id;
      }
      
      const response = await enrollmentsApi.getAll(params);

      if (response.success && response.data) {
        setEnrollments(response.data);
        if (response.pagination) {
          setPagination(response.pagination);
        }
      }
    } catch (error) {
      console.error("Failed to fetch enrollments:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEnrollments();
  }, []);

  const handleSearch = (searchTerm: string) => {
    setSearch(searchTerm);
    fetchEnrollments(1, searchTerm);
  };

  const renderRow = (item: Enrollment) => (
    <tr
      key={item.id}
      className="border-b border-gray-200 even:bg-slate-50 text-sm hover:bg-lamaPurpleLight"
    >
      <td className="p-4">
        <div className="flex flex-col">
          <h3 className="font-semibold">{item.course.title}</h3>
          <p className="text-sm text-gray-500">{item.course.courseCode}</p>
        </div>
      </td>
      <td className="hidden md:table-cell">
        {user?.role !== "trainee" && (
          <div>
            <p className="font-medium">
              {item.trainee.firstName} {item.trainee.lastName}
            </p>
            <p className="text-xs text-gray-500">{item.trainee.email}</p>
          </div>
        )}
      </td>
      <td className="hidden md:table-cell">
        <span
          className={`px-2 py-1 rounded-full text-xs capitalize ${
            item.status === "completed"
              ? "bg-green-100 text-green-800"
              : item.status === "in_progress"
              ? "bg-blue-100 text-blue-800"
              : "bg-gray-100 text-gray-800"
          }`}
        >
          {item.status}
        </span>
      </td>
      <td className="hidden lg:table-cell">
        <div className="flex items-center gap-2">
          <div className="w-16 bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full"
              style={{ width: `${item.progress}%` }}
            ></div>
          </div>
          <span className="text-xs">{item.progress}%</span>
        </div>
      </td>
      <td className="hidden lg:table-cell">
        {item.startedAt
          ? new Date(item.startedAt).toLocaleDateString()
          : "Not started"}
      </td>
      <td>
        <div className="flex items-center gap-2">
          <Link href={`/list/courses/${item.course.id}`}>
            <button className="w-7 h-7 flex items-center justify-center rounded-full bg-lamaSky">
              <Image src="/view.png" alt="" width={16} height={16} />
            </button>
          </Link>
        </div>
      </td>
    </tr>
  );

  if (loading) {
    return (
      <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
      {/* TOP */}
      <div className="flex items-center justify-between">
        <h1 className="hidden md:block text-lg font-semibold">
          {user?.role === "trainee" ? "My Enrollments" : "All Enrollments"}
        </h1>
        <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
          <TableSearch onSearch={handleSearch} />
        </div>
      </div>
      {/* LIST */}
      <Table columns={columns} renderRow={renderRow} data={enrollments} />
      {/* PAGINATION */}
      <Pagination
        page={pagination.page}
        totalPages={pagination.totalPages}
        onPageChange={(page) => fetchEnrollments(page, search)}
      />
    </div>
  );
};

export default EnrollmentsListPage;
