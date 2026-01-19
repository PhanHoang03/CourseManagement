"use client"

import { useEffect, useState } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import { usersApi, coursesApi, enrollmentsApi, organizationsApi } from "@/lib/api";
import Image from "next/image";
import Link from "next/link";

const AdminPage = () => {
  const [stats, setStats] = useState({
    users: { total: 0, admins: 0, instructors: 0, trainees: 0 },
    courses: 0,
    enrollments: 0,
    organizations: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [usersRes, coursesRes, enrollmentsRes, orgsRes] = await Promise.all([
          usersApi.getAll({ limit: 1 }),
          coursesApi.getAll({ limit: 1 }),
          enrollmentsApi.getAll({ limit: 1 }),
          organizationsApi.getAll({ limit: 1 }),
        ]);

        // Get user counts by role
        const usersByRole = await Promise.all([
          usersApi.getAll({ role: "admin", limit: 1 }),
          usersApi.getAll({ role: "instructor", limit: 1 }),
          usersApi.getAll({ role: "trainee", limit: 1 }),
        ]);

        setStats({
          users: {
            total: usersRes.pagination?.total || 0,
            admins: usersByRole[0].pagination?.total || 0,
            instructors: usersByRole[1].pagination?.total || 0,
            trainees: usersByRole[2].pagination?.total || 0,
          },
          courses: coursesRes.pagination?.total || 0,
          enrollments: enrollmentsRes.pagination?.total || 0,
          organizations: orgsRes.pagination?.total || 0,
        });
      } catch (error) {
        console.error("Failed to fetch stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="p-4 flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <div className="p-4 space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-md p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
          <p className="text-gray-600">Overview of system statistics and key metrics</p>
        </div>

        {/* Key Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-500">Total Users</h3>
              <Image src="/teacher.png" alt="Users" width={24} height={24} className="opacity-50" />
            </div>
            <p className="text-3xl font-bold text-gray-900">{stats.users.total}</p>
            <div className="mt-4 pt-4 border-t border-gray-100">
              <div className="flex justify-between text-xs text-gray-600">
                <span>Admins: {stats.users.admins}</span>
                <span>Instructors: {stats.users.instructors}</span>
                <span>Trainees: {stats.users.trainees}</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-500">Total Courses</h3>
              <Image src="/lesson.png" alt="Courses" width={24} height={24} className="opacity-50" />
            </div>
            <p className="text-3xl font-bold text-gray-900">{stats.courses}</p>
            <div className="mt-4">
              <Link 
                href="/list/courses"
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                View All Courses →
              </Link>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-500">Total Enrollments</h3>
              <Image src="/student.png" alt="Enrollments" width={24} height={24} className="opacity-50" />
            </div>
            <p className="text-3xl font-bold text-gray-900">{stats.enrollments}</p>
            <div className="mt-4">
              <Link 
                href="/list/enrollments"
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                View All Enrollments →
              </Link>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-500">Organizations</h3>
              <Image src="/class.png" alt="Organizations" width={24} height={24} className="opacity-50" />
            </div>
            <p className="text-3xl font-bold text-gray-900">{stats.organizations}</p>
            <div className="mt-4">
              <Link 
                href="/list/organizations"
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                View All Organizations →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default AdminPage;
