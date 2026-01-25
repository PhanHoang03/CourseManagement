"use client"

import { useEffect, useState } from "react";
import FormModal from "@/components/FormModal";
import Pagination from "@/components/Pagination";
import Table from "@/components/Table";
import TableSearch from "@/components/TableSearch";
import { useAuth } from "@/lib/auth";
import { departmentsApi } from "@/lib/api";

type Department = {
  id: string;
  name: string;
  description?: string;
  organization: {
    name: string;
  };
  _count: {
    users: number;
    courses: number;
  };
};

const columns = [
  {
    header: "Department",
    accessor: "department",
  },
  {
    header: "Organization",
    accessor: "organization",
    className: "hidden md:table-cell",
  },
  {
    header: "Users",
    accessor: "users",
    className: "hidden md:table-cell",
  },
  {
    header: "Courses",
    accessor: "courses",
    className: "hidden lg:table-cell",
  },
  {
    header: "Actions",
    accessor: "actions",
  },
];

const DepartmentsListPage = () => {
  const { user } = useAuth();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });
  const [search, setSearch] = useState("");

  const fetchDepartments = async (page = 1, searchTerm = "") => {
    try {
      setLoading(true);
      const response = await departmentsApi.getAll({
        page,
        limit: 10,
        search: searchTerm,
      });

      if (response.success && response.data) {
        setDepartments(response.data);
        if (response.pagination) {
          setPagination(response.pagination);
        }
      }
    } catch (error) {
      console.error("Failed to fetch departments:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  const handleSearch = (searchTerm: string) => {
    setSearch(searchTerm);
    fetchDepartments(1, searchTerm);
  };

  const renderRow = (item: Department) => (
    <tr
      key={item.id}
      className="border-b border-gray-200 even:bg-slate-50 text-sm hover:bg-lamaPurpleLight"
    >
      <td className="p-4">
        <div className="flex flex-col">
          <h3 className="font-semibold">{item.name}</h3>
          <p className="text-sm text-gray-500 line-clamp-1">{item.description || "No description"}</p>
        </div>
      </td>
      <td className="hidden md:table-cell">{item.organization.name}</td>
      <td className="hidden md:table-cell">{item._count.users}</td>
      <td className="hidden lg:table-cell">{item._count.courses}</td>
      <td>
        <div className="flex items-center gap-2">
          {user?.role === "admin" && (
            <>
              <FormModal 
                table="department" 
                type="update" 
                id={item.id} 
                onSuccess={() => fetchDepartments(pagination.page, search)}
              />
              <FormModal 
                table="department" 
                type="delete" 
                id={item.id} 
                onSuccess={() => fetchDepartments(pagination.page, search)}
              />
            </>
          )}
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
        <h1 className="hidden md:block text-lg font-semibold">All Departments</h1>
        <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
          <TableSearch onSearch={handleSearch} />
          <div className="flex items-center gap-4 self-end">
            {user?.role === "admin" && (
              <FormModal 
                table="department" 
                type="create" 
                onSuccess={() => fetchDepartments(1, search)}
              />
            )}
          </div>
        </div>
      </div>
      {/* LIST */}
      <Table columns={columns} renderRow={renderRow} data={departments} />
      {/* PAGINATION */}
      <Pagination
        page={pagination.page}
        totalPages={pagination.totalPages}
        onPageChange={(page) => fetchDepartments(page, search)}
      />
    </div>
  );
};

export default DepartmentsListPage;
