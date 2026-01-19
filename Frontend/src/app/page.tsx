"use client"

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";

const Homepage = () => {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (loading) return; // Wait for auth to load

    if (user) {
      // User is logged in, redirect to their dashboard
      switch (user.role) {
        case 'admin':
          router.push('/admin');
          break;
        case 'instructor':
          router.push('/instructor');
          break;
        case 'trainee':
          router.push('/trainee');
          break;
        default:
          router.push('/admin');
      }
    } else {
      // No user, redirect to sign-in
      router.push("/sign-in");
    }
  }, [user, loading, router]);

  return (
    <div className="h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading...</p>
      </div>
    </div>
  );
};

export default Homepage;