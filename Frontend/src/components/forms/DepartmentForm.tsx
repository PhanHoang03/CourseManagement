"use client"

import { useForm } from "react-hook-form";
import { useState, useEffect } from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import InputField from "../InputField";
import { departmentsApi, organizationsApi } from "@/lib/api";

const schema = z.object({
  name: z.string().min(2, { message: "Department name is required" }),
  code: z.string().optional(),
  description: z.string().optional(),
  organizationId: z.string().uuid({ message: "Organization is required" }),
  managerId: z.string().uuid().optional(),
  isActive: z.boolean().default(true),
});

type Inputs = z.infer<typeof schema>;

const DepartmentForm = ({
  type,
  data,
  onSuccess,
}: {
  type: "create" | "update";
  data?: any;
  onSuccess?: () => void;
}) => {
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Inputs>({
    resolver: zodResolver(schema),
    defaultValues: data ? {
      name: data.name,
      code: data.code,
      description: data.description,
      organizationId: data.organizationId,
      managerId: data.managerId,
      isActive: data.isActive !== undefined ? data.isActive : true,
    } : undefined,
  });

  useEffect(() => {
    const fetchOrganizations = async () => {
      try {
        const res = await organizationsApi.getAll();
        if (res.success && res.data) {
          setOrganizations(res.data);
        }
      } catch (error) {
        console.error("Failed to fetch organizations:", error);
      }
    };
    fetchOrganizations();
  }, []);

  const onSubmit = async (formData: Inputs) => {
    setLoading(true);
    try {
      if (type === "create") {
        await departmentsApi.create(formData);
      } else if (data?.id) {
        await departmentsApi.update(data.id, formData);
      }
      
      if (onSuccess) {
        onSuccess();
      } else {
        window.location.reload();
      }
    } catch (error: any) {
      alert(error.message || "Failed to save department");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="flex flex-col gap-8" onSubmit={handleSubmit(onSubmit)}>
      <h1 className="text-xl font-semibold">
        {type === "create" ? "Create a new Department" : "Update Department"}
      </h1>
      <span className="text-xs text-gray-400">
        Department information
      </span>
      <div className="flex justify-between flex-wrap gap-4">
        <InputField
          label="Department Name"
          name="name"
          defaultValue={data?.name}
          register={register}
          error={errors.name}
        />
        <InputField
          label="Code"
          name="code"
          defaultValue={data?.code}
          register={register}
          error={errors.code}
        />
        <InputField
          label="Description"
          name="description"
          defaultValue={data?.description}
          register={register}
          error={errors.description}
        />
        <div className="flex flex-col gap-2 w-full md:w-1/4">
          <label className="text-xs text-gray-500">Organization</label>
          <select
            className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
            defaultValue={data?.organizationId}
            {...register("organizationId")}
          >
            <option value="">Select Organization</option>
            {organizations.map((org) => (
              <option key={org.id} value={org.id}>
                {org.name}
              </option>
            ))}
          </select>
          {errors.organizationId?.message && (
            <p className="text-red-400 text-xs">{errors.organizationId.message.toString()}</p>
          )}
        </div>
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

export default DepartmentForm;
