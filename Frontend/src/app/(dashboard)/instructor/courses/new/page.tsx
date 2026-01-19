"use client";

import { useRouter } from "next/navigation";
import ProtectedRoute from "@/components/ProtectedRoute";
import CourseForm from "@/components/forms/CourseForm";
import { useAuth } from "@/lib/auth";

export default function InstructorCreateCoursePage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="p-4 flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
      </div>
    );
  }

  return (
    <ProtectedRoute allowedRoles={["instructor"]}>
      <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
        <CourseForm
          type="create"
          data={{
            organizationId: user?.organizationId,
            departmentId: user?.departmentId,
            instructorId: user?.id,
            status: "draft",
            difficultyLevel: "beginner",
            isPublic: false,
            isCertified: false,
          }}
          onSuccess={() => router.push("/instructor/courses")}
        />
      </div>
    </ProtectedRoute>
  );
}

