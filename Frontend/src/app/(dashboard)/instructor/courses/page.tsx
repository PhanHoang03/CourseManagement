"use client"

import { useEffect, useState } from "react";
import FormModal from "@/components/FormModal";
import Pagination from "@/components/Pagination";
import Table from "@/components/Table";
import TableSearch from "@/components/TableSearch";
import { useAuth } from "@/lib/auth";
import { coursesApi } from "@/lib/api";
import Image from "next/image";
import Link from "next/link";

type Course = {
  id: string;
  courseCode: string;
  title: string;
  description?: string;
  status: string;
  difficultyLevel: string;
  instructor: {
    firstName: string;
    lastName: string;
  };
  _count: {
    enrollments: number;
    modules: number;
  };
};

const columns = [
  {
    header: "Course",
    accessor: "course",
  },
  {
    header: "Code",
    accessor: "code",
    className: "hidden md:table-cell",
  },
  {
    header: "Instructor",
    accessor: "instructor",
    className: "hidden md:table-cell",
  },
  {
    header: "Status",
    accessor: "status",
    className: "hidden md:table-cell",
  },
  {
    header: "Difficulty",
    accessor: "difficulty",
    className: "hidden lg:table-cell",
  },
  {
    header: "Enrollments",
    accessor: "enrollments",
    className: "hidden lg:table-cell",
  },
  {
    header: "Actions",
    accessor: "actions",
  },
];

const InstructorCoursesPage = () => {
  const { user } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });
  const [search, setSearch] = useState("");

  const fetchCourses = async (page = 1, searchTerm = "") => {
    try {
      setLoading(true);
      // Filter courses by instructorId for instructors
      const instructorId = user?.id;
      const response = await coursesApi.getAll({ 
        page, 
        limit: 10, 
        search: searchTerm || undefined,
        instructorId: instructorId 
      });

      if (response.success && response.data) {
        setCourses(response.data);
        if (response.pagination) {
          setPagination(response.pagination);
        }
      }
    } catch (error) {
      console.error("Failed to fetch courses:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, [user]);

  const handleSearch = (searchTerm: string) => {
    setSearch(searchTerm);
    fetchCourses(1, searchTerm);
  };

  const renderRow = (item: Course) => (
    <tr
      key={item.id}
      className="border-b border-gray-200 even:bg-slate-50 text-sm hover:bg-lamaPurpleLight"
    >
      <td className="p-4">
        <div className="flex flex-col">
          <h3 className="font-semibold">{item.title}</h3>
          <p className="text-sm text-gray-500 line-clamp-1">{item.description || "No description"}</p>
        </div>
      </td>
      <td className="hidden md:table-cell">{item.courseCode}</td>
      <td className="hidden md:table-cell">
        {item.instructor.firstName} {item.instructor.lastName}
      </td>
      <td className="hidden md:table-cell">
        <span
          className={`px-2 py-1 rounded-full text-xs capitalize ${
            item.status === "published"
              ? "bg-green-100 text-green-800"
              : item.status === "draft"
              ? "bg-yellow-100 text-yellow-800"
              : "bg-gray-100 text-gray-800"
          }`}
        >
          {item.status}
        </span>
      </td>
      <td className="hidden lg:table-cell">
        <span className="capitalize">{item.difficultyLevel}</span>
      </td>
      <td className="hidden lg:table-cell">{item._count.enrollments}</td>
      <td>
        <div className="flex items-center gap-2">
          <Link href={`/list/courses/${item.id}`}>
            <button className="w-7 h-7 flex items-center justify-center rounded-full bg-lamaSky">
              <Image src="/view.png" alt="" width={16} height={16} />
            </button>
          </Link>
          <FormModal 
            table="course" 
            type="update" 
            id={item.id} 
            onSuccess={() => fetchCourses(pagination.page, search)}
          />
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
        <h1 className="hidden md:block text-lg font-semibold">My Courses</h1>
        <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
          <TableSearch onSearch={handleSearch} />
          <div className="flex items-center gap-4 self-end">
            <FormModal 
              table="course" 
              type="create" 
              onSuccess={() => fetchCourses(1, search)}
            />
          </div>
        </div>
      </div>
      {/* LIST */}
      <Table columns={columns} renderRow={renderRow} data={courses} />
      {/* PAGINATION */}
      <Pagination
        page={pagination.page}
        totalPages={pagination.totalPages}
        onPageChange={(page) => fetchCourses(page, search)}
      />
    </div>
  );
};

export default InstructorCoursesPage;
