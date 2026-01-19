"use client"

import { useForm } from "react-hook-form";
import { useState } from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import InputField from "../InputField";
import { organizationsApi } from "@/lib/api";

const schema = z.object({
  name: z.string().min(2, { message: "Organization name is required" }),
  domain: z.string().optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email({ message: "Invalid email address" }).optional().or(z.literal("")),
  subscriptionTier: z.enum(["free", "basic", "premium", "enterprise"]).optional(),
  isActive: z.boolean().default(true),
});

type Inputs = z.infer<typeof schema>;

const OrganizationForm = ({
  type,
  data,
  onSuccess,
}: {
  type: "create" | "update";
  data?: any;
  onSuccess?: () => void;
}) => {
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Inputs>({
    resolver: zodResolver(schema),
    defaultValues: data ? {
      name: data.name,
      domain: data.domain,
      address: data.address,
      phone: data.phone,
      email: data.email,
      subscriptionTier: data.subscriptionTier,
      isActive: data.isActive !== undefined ? data.isActive : true,
    } : undefined,
  });

  const onSubmit = async (formData: Inputs) => {
    setLoading(true);
    try {
      if (type === "create") {
        await organizationsApi.create(formData);
      } else if (data?.id) {
        await organizationsApi.update(data.id, formData);
      }
      
      if (onSuccess) {
        onSuccess();
      } else {
        window.location.reload();
      }
    } catch (error: any) {
      alert(error.message || "Failed to save organization");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="flex flex-col gap-8" onSubmit={handleSubmit(onSubmit)}>
      <h1 className="text-xl font-semibold">
        {type === "create" ? "Create a new Organization" : "Update Organization"}
      </h1>
      <span className="text-xs text-gray-400">
        Organization information
      </span>
      <div className="flex justify-between flex-wrap gap-4">
        <InputField
          label="Organization Name"
          name="name"
          defaultValue={data?.name}
          register={register}
          error={errors.name}
        />
        <InputField
          label="Domain"
          name="domain"
          defaultValue={data?.domain}
          register={register}
          error={errors.domain}
        />
        <InputField
          label="Email"
          name="email"
          type="email"
          defaultValue={data?.email}
          register={register}
          error={errors.email}
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
        <div className="flex flex-col gap-2 w-full md:w-1/4">
          <label className="text-xs text-gray-500">Subscription Tier</label>
          <select
            className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
            defaultValue={data?.subscriptionTier || "free"}
            {...register("subscriptionTier")}
          >
            <option value="free">Free</option>
            <option value="basic">Basic</option>
            <option value="premium">Premium</option>
            <option value="enterprise">Enterprise</option>
          </select>
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

export default OrganizationForm;
