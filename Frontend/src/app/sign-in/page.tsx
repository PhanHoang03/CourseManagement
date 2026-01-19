"use client"

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/lib/auth";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import InputField from "@/components/InputField";

const schema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
  password: z.string().min(8, { message: "Password must be at least 8 characters" }),
});

type Inputs = z.infer<typeof schema>;

const LoginPage = () => {
  const { login, user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    if (!authLoading && user) {
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
    }
  }, [user, authLoading, router]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Inputs>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: Inputs) => {
    setError("");
    setLoading(true);
    try {
      await login(data.email, data.password);
      // Get user role after login to redirect appropriately
      const token = localStorage.getItem('accessToken');
      if (token) {
        try {
          // Decode JWT to get role (simple base64 decode)
          const payload = JSON.parse(atob(token.split('.')[1]));
          const role = payload.role;
          
          // Redirect based on role
          switch (role) {
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
        } catch {
          // Fallback to admin if role can't be determined
          router.push('/admin');
        }
      } else {
        router.push('/admin');
      }
      router.refresh(); // Force refresh to update auth state
    } catch (err: any) {
      setError(err.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Show loading while checking auth
  if (authLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't show login form if already logged in (will redirect)
  if (user) {
    return null;
  }

  return (
    <div className="h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
        <div className="flex items-center justify-center mb-8">
          <Image src="/logo.png" alt="logo" width={48} height={48} />
          <h1 className="text-2xl font-bold ml-2">Course Manager</h1>
        </div>
        
        <h2 className="text-xl font-semibold mb-6 text-center">Sign In</h2>
        
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <InputField
            label="Email"
            name="email"
            type="email"
            register={register}
            error={errors.email}
          />
          
          <InputField
            label="Password"
            name="password"
            type="password"
            register={register}
            error={errors.password}
          />

          <button
            type="submit"
            disabled={loading}
            className="bg-blue-500 hover:bg-blue-600 text-white p-3 rounded-md font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Don't have an account?{" "}
            <Link href="/sign-up" className="text-blue-500 hover:text-blue-600 font-medium">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
