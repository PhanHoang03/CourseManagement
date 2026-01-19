"use client"

import { useForm } from "react-hook-form";
import { useState, useEffect } from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import Image from "next/image";
import InputField from "../InputField";
import { usersApi, organizationsApi, departmentsApi } from "@/lib/api";

// Base schema with all fields
const baseSchema = z.object({
  username: z.string()
    .min(3, { message: "Username must be at least 3 characters" })
    .max(20, { message: "Username must be at most 20 characters" })
    .regex(/^[a-zA-Z0-9_]+$/, { message: "Username can only contain letters, numbers, and underscores" })
    .optional(),
  email: z.string().email({ message: "Invalid email address" }).optional(),
  password: z.string()
    .min(8, { message: "Password must be at least 8 characters" })
    .regex(/[A-Z]/, { message: "Password must contain at least one uppercase letter" })
    .regex(/[a-z]/, { message: "Password must contain at least one lowercase letter" })
    .regex(/[0-9]/, { message: "Password must contain at least one number" })
    .optional(),
  firstName: z.string().min(2, { message: "First name is required" }),
  lastName: z.string().min(2, { message: "Last name is required" }),
  phone: z.string().optional(),
  address: z.string().optional(),
  role: z.enum(["admin", "instructor", "trainee"], { message: "Role is required" }),
  organizationId: z.string().uuid().optional(),
  departmentId: z.string().uuid().optional(),
  employeeId: z.string().optional(),
  position: z.string().optional(),
  bio: z.string().optional(),
  expertise: z.string().optional(), // Will be converted to array
  photoUrl: z.union([z.string().url(), z.literal('')]).optional(),
  isActive: z.boolean().default(true),
});

// Create schema (username, email, password required)
const createSchema = baseSchema.extend({
  username: z.string()
    .min(3, { message: "Username must be at least 3 characters" })
    .max(20, { message: "Username must be at most 20 characters" })
    .regex(/^[a-zA-Z0-9_]+$/, { message: "Username can only contain letters, numbers, and underscores" }),
  email: z.string().email({ message: "Invalid email address" }),
  password: z.string()
    .min(8, { message: "Password must be at least 8 characters" })
    .regex(/[A-Z]/, { message: "Password must contain at least one uppercase letter" })
    .regex(/[a-z]/, { message: "Password must contain at least one lowercase letter" })
    .regex(/[0-9]/, { message: "Password must contain at least one number" }),
});

// Update schema (all fields optional)
const updateSchema = baseSchema.partial().extend({
  firstName: z.string().min(2).optional(),
  lastName: z.string().min(2).optional(),
  role: z.enum(["admin", "instructor", "trainee"]).optional(),
});

type FormInputs = z.infer<typeof baseSchema>;

const UserForm = ({
  type,
  data,
  onSuccess,
}: {
  type: "create" | "update";
  data?: any;
  onSuccess?: () => void;
}) => {
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormInputs>({
    resolver: zodResolver(type === "create" ? createSchema : updateSchema),
    defaultValues: data ? {
      username: data.username,
      email: data.email,
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone,
      address: data.address,
      role: data.role,
      organizationId: data.organizationId,
      departmentId: data.departmentId,
      employeeId: data.employeeId,
      position: data.position,
      bio: data.bio,
      expertise: Array.isArray(data.expertise) ? data.expertise.join(', ') : (data.expertise || ''),
      photoUrl: data.photoUrl,
      isActive: data.isActive !== undefined ? data.isActive : true,
    } : undefined,
  });

  const selectedOrgId = watch("organizationId");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [orgsRes, deptsRes] = await Promise.all([
          organizationsApi.getAll(),
          departmentsApi.getAll(),
        ]);
        if (orgsRes.success && orgsRes.data) setOrganizations(orgsRes.data);
        if (deptsRes.success && deptsRes.data) setDepartments(deptsRes.data);
      } catch (error) {
        console.error("Failed to fetch data:", error);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (selectedOrgId) {
      departmentsApi.getAll({ organizationId: selectedOrgId }).then((res) => {
        if (res.success && res.data) {
          setDepartments(res.data);
        }
      });
    }
  }, [selectedOrgId]);

  const onSubmit = async (formData: FormInputs) => {
    setLoading(true);
    try {
      // Convert expertise string to array if provided
      const submitData: any = { ...formData };
      if (submitData.expertise && typeof submitData.expertise === 'string') {
        submitData.expertise = submitData.expertise.split(',').map((exp: string) => exp.trim()).filter((exp: string) => exp.length > 0);
      } else if (!submitData.expertise) {
        delete submitData.expertise;
      }
      
      // Handle isActive boolean conversion
      if (submitData.isActive !== undefined && typeof submitData.isActive === 'string') {
        submitData.isActive = submitData.isActive === 'true';
      }
      
      // Remove empty photoUrl
      if (submitData.photoUrl === '' || !submitData.photoUrl) {
        delete submitData.photoUrl;
      }
      
      if (type === "create") {
        // Ensure required fields for create
        if (!submitData.username || !submitData.email || !submitData.password) {
          alert("Username, email, and password are required");
          setLoading(false);
          return;
        }
        await usersApi.create(submitData);
      } else if (data?.id) {
        // For update, remove undefined/empty fields and password if not provided
        Object.keys(submitData).forEach(key => {
          if (submitData[key] === undefined || submitData[key] === '') {
            delete submitData[key];
          }
        });
        if (!submitData.password) delete submitData.password;
        await usersApi.update(data.id, submitData);
      }
      
      if (onSuccess) {
        onSuccess();
      } else {
        window.location.reload();
      }
    } catch (error: any) {
      alert(error.message || "Failed to save user");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="flex flex-col gap-8" onSubmit={handleSubmit(onSubmit)}>
      <h1 className="text-xl font-semibold">
        {type === "create" ? "Create a new User" : "Update User"}
      </h1>
      <span className="text-xs text-gray-400">
        Authentication information
      </span>
      <div className="flex justify-between flex-wrap gap-4">
        {type === "create" && (
          <>
            <InputField
              label="Username"
              name="username"
              register={register}
              error={errors.username}
            />
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
          </>
        )}
        {type === "update" && (
          <InputField
            label="Password (leave blank to keep current)"
            name="password"
            type="password"
            register={register}
            error={errors.password}
          />
        )}
      </div>

      <span className="text-xs text-gray-400">
        Personal information
      </span>
      <div className="flex justify-between flex-wrap gap-4">
        <InputField
          label="First name"
          name="firstName"
          defaultValue={data?.firstName}
          register={register}
          error={errors.firstName}
        />
        <InputField
          label="Last name"
          name="lastName"
          defaultValue={data?.lastName}
          register={register}
          error={errors.lastName}
        />
        <InputField
          label="Phone"
          name="phone"
          defaultValue={data?.phone}
          register={register}
          error={errors.phone}
        />
        <InputField
          label="Address"
          name="address"
          defaultValue={data?.address}
          register={register}
          error={errors.address}
        />
        {type === "create" && (
          <InputField
            label="Employee ID"
            name="employeeId"
            defaultValue={data?.employeeId}
            register={register}
            error={errors.employeeId}
          />
        )}
        <InputField
          label="Position"
          name="position"
          defaultValue={data?.position}
          register={register}
          error={errors.position}
        />
        <InputField
          label="Photo URL"
          name="photoUrl"
          type="url"
          defaultValue={data?.photoUrl}
          register={register}
          error={errors.photoUrl}
        />
      </div>

      <span className="text-xs text-gray-400">
        Additional information
      </span>
      <div className="flex justify-between flex-wrap gap-4">
        <div className="flex flex-col gap-2 w-full">
          <label className="text-xs text-gray-500">Bio</label>
          <textarea
            className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
            rows={3}
            defaultValue={data?.bio}
            {...register("bio")}
          />
        </div>
        <InputField
          label="Expertise (comma-separated)"
          name="expertise"
          defaultValue={Array.isArray(data?.expertise) ? data.expertise.join(', ') : (data?.expertise || '')}
          register={register}
          error={errors.expertise}
        />
      </div>

      <span className="text-xs text-gray-400">
        Role & Organization
      </span>
      <div className="flex justify-between flex-wrap gap-4">
        <div className="flex flex-col gap-2 w-full md:w-1/4">
          <label className="text-xs text-gray-500">Role</label>
          <select
            className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
            defaultValue={data?.role}
            {...register("role")}
          >
            <option value="">Select Role</option>
            <option value="admin">Admin</option>
            <option value="instructor">Instructor</option>
            <option value="trainee">Trainee</option>
          </select>
          {errors.role?.message && (
            <p className="text-red-400 text-xs">{errors.role.message.toString()}</p>
          )}
        </div>
        <div className="flex flex-col gap-2 w-full md:w-1/4">
          <label className="text-xs text-gray-500">Organization</label>
          <select
            className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
            defaultValue={data?.organizationId}
            {...register("organizationId")}
          >
            <option value="">None</option>
            {organizations.map((org) => (
              <option key={org.id} value={org.id}>
                {org.name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-2 w-full md:w-1/4">
          <label className="text-xs text-gray-500">Department</label>
          <select
            className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
            defaultValue={data?.departmentId}
            {...register("departmentId")}
            disabled={!selectedOrgId}
          >
            <option value="">None</option>
            {departments
              .filter((dept) => !selectedOrgId || dept.organizationId === selectedOrgId)
              .map((dept) => (
                <option key={dept.id} value={dept.id}>
                  {dept.name}
                </option>
              ))}
          </select>
        </div>
        {type === "update" && (
          <div className="flex flex-col gap-2 w-full md:w-1/4">
            <label className="text-xs text-gray-500">Status</label>
            <select
              className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
              defaultValue={data?.isActive !== undefined ? (data.isActive ? "true" : "false") : "true"}
              {...register("isActive", { setValueAs: (v) => v === "true" })}
            >
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </div>
        )}
      </div>

      <button
        type="submit"
        disabled={loading}
        className="bg-blue-400 text-white p-2 rounded-md disabled:opacity-50"
      >
        {loading ? "Saving..." : type === "create" ? "Create" : "Update"}
      </button>
    </form>
  );
};

export default UserForm;
