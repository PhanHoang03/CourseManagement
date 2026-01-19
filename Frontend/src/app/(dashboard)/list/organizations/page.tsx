"use client"

import { useEffect, useState } from "react";
import FormModal from "@/components/FormModal";
import Pagination from "@/components/Pagination";
import Table from "@/components/Table";
import TableSearch from "@/components/TableSearch";
import { useAuth } from "@/lib/auth";
import { organizationsApi } from "@/lib/api";
import Image from "next/image";
import Link from "next/link";

type Organization = {
  id: string;
  name: string;
  domain?: string;
  address?: string;
  phone?: string;
  email?: string;
  _count: {
    users: number;
    departments: number;
  };
};

const columns = [
  {
    header: "Organization",
    accessor: "organization",
  },
  {
    header: "Domain",
    accessor: "domain",
    className: "hidden md:table-cell",
  },
  {
    header: "Users",
    accessor: "users",
    className: "hidden md:table-cell",
  },
  {
    header: "Departments",
    accessor: "departments",
    className: "hidden lg:table-cell",
  },
  {
    header: "Actions",
    accessor: "actions",
  },
];

const OrganizationsListPage = () => {
  const { user } = useAuth();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });
  const [search, setSearch] = useState("");

  const fetchOrganizations = async (page = 1, searchTerm = "") => {
    try {
      setLoading(true);
      const response = await organizationsApi.getAll({
        page,
        limit: 10,
        search: searchTerm,
      });

      if (response.success && response.data) {
        setOrganizations(response.data);
        if (response.pagination) {
          setPagination(response.pagination);
        }
      }
    } catch (error) {
      console.error("Failed to fetch organizations:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrganizations();
  }, []);

  const handleSearch = (searchTerm: string) => {
    setSearch(searchTerm);
    fetchOrganizations(1, searchTerm);
  };

  const renderRow = (item: Organization) => (
    <tr
      key={item.id}
      className="border-b border-gray-200 even:bg-slate-50 text-sm hover:bg-lamaPurpleLight"
    >
      <td className="p-4">
        <div className="flex flex-col">
          <h3 className="font-semibold">{item.name}</h3>
          <p className="text-sm text-gray-500">{item.email || "No email"}</p>
        </div>
      </td>
      <td className="hidden md:table-cell">{item.domain || "N/A"}</td>
      <td className="hidden md:table-cell">{item._count.users}</td>
      <td className="hidden lg:table-cell">{item._count.departments}</td>
      <td>
        <div className="flex items-center gap-2">
          <Link href={`/list/organizations/${item.id}`}>
            <button className="w-7 h-7 flex items-center justify-center rounded-full bg-lamaSky">
              <Image src="/view.png" alt="" width={16} height={16} />
            </button>
          </Link>
          {user?.role === "admin" && (
            <>
              <FormModal 
                table="organization" 
                type="update" 
                id={item.id} 
                onSuccess={() => fetchOrganizations(pagination.page, search)}
              />
              <FormModal 
                table="organization" 
                type="delete" 
                id={item.id} 
                onSuccess={() => fetchOrganizations(pagination.page, search)}
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
        <h1 className="hidden md:block text-lg font-semibold">All Organizations</h1>
        <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
          <TableSearch onSearch={handleSearch} />
          <div className="flex items-center gap-4 self-end">
            {user?.role === "admin" && (
              <FormModal 
                table="organization" 
                type="create" 
                onSuccess={() => fetchOrganizations(1, search)}
              />
            )}
          </div>
        </div>
      </div>
      {/* LIST */}
      <Table columns={columns} renderRow={renderRow} data={organizations} />
      {/* PAGINATION */}
      <Pagination
        page={pagination.page}
        totalPages={pagination.totalPages}
        onPageChange={(page) => fetchOrganizations(page, search)}
      />
    </div>
  );
};

export default OrganizationsListPage;
