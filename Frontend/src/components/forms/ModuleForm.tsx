"use client"

import { useForm } from "react-hook-form";
import { useState, useEffect } from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import InputField from "../InputField";
import { modulesApi } from "@/lib/api";

// Base schema with common fields
const baseSchema = z.object({
  title: z.string().min(2, { message: "Module title must be at least 2 characters" }),
  description: z.string().optional(),
  order: z.number().int().positive().optional(),
  estimatedDuration: z.number().int().positive().optional(),
  isRequired: z.boolean().default(true),
});

// Create schema (courseId required)
const createSchema = baseSchema.extend({
  courseId: z.string().uuid({ message: "Course ID is required" }),
});

// Update schema (all fields optional)
const updateSchema = baseSchema.partial();

type CreateInputs = z.infer<typeof createSchema>;
type UpdateInputs = z.infer<typeof updateSchema>;

const ModuleForm = ({
  type,
  data,
  onSuccess,
}: {
  type: "create" | "update";
  data?: any;
  onSuccess?: () => void;
}) => {
  const [loading, setLoading] = useState(false);
  const [existingOrders, setExistingOrders] = useState<number[]>([]);

  // Fetch existing orders for the course when creating or updating a module
  useEffect(() => {
    const fetchExistingOrders = async () => {
      // For create: need courseId from data
      // For update: need courseId from fetched module data or from the module's course
      const courseId = type === "create" ? data?.courseId : data?.course?.id || data?.courseId;
      
      if (courseId) {
        try {
          const res = await modulesApi.getByCourse(courseId);
          if (res.success && res.data) {
            // Filter out the current module's order if updating (so it can keep its own order)
            const orders = res.data
              .filter((module: any) => type === "update" ? module.id !== data?.id : true)
              .map((module: any) => module.order)
              .filter((order: number) => order !== undefined && order !== null) as number[];
            setExistingOrders(orders);
          }
        } catch (error) {
          console.error("Failed to fetch existing modules:", error);
        }
      }
    };
    fetchExistingOrders();
  }, [type, data?.courseId, data?.id, data?.course?.id]);

  // Dynamic schema with validation for existing orders (for both create and update)
  const formSchema = type === "create" 
    ? createSchema.refine(
        (data) => {
          if (data.order && existingOrders.includes(data.order)) {
            return false;
          }
          return true;
        },
        {
          message: "This order already exists for this course",
          path: ["order"],
        }
      )
    : updateSchema.refine(
        (data) => {
          if (data.order && existingOrders.includes(data.order)) {
            return false;
          }
          return true;
        },
        {
          message: "This order already exists for this course",
          path: ["order"],
        }
      );

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    reset,
    setError,
    clearErrors,
  } = useForm<CreateInputs | UpdateInputs>({
    resolver: zodResolver(formSchema),
    defaultValues: data ? {
      title: data.title,
      description: data.description,
      order: data.order ? Number(data.order) : undefined,
      estimatedDuration: data.estimatedDuration ? Number(data.estimatedDuration) : undefined,
      isRequired: data.isRequired !== undefined ? data.isRequired : true,
      ...(type === "create" && data.courseId ? { courseId: data.courseId } : {}),
    } : undefined,
  });

  const orderValue = watch("order");

  // Check order value when it changes (for real-time validation on both create and update)
  useEffect(() => {
    if (orderValue && existingOrders.length > 0) {
      if (existingOrders.includes(orderValue)) {
        setError("order", {
          type: "manual",
          message: "This order already exists for this course",
        });
      } else {
        clearErrors("order");
      }
    }
  }, [orderValue, existingOrders, setError, clearErrors]);

  // Convert BigInt values to regular numbers to avoid serialization errors
  const convertBigIntToString = (obj: any): any => {
    if (obj === null || obj === undefined) return obj;
    if (typeof obj === 'bigint') {
      return Number(obj);
    }
    if (Array.isArray(obj)) {
      return obj.map(convertBigIntToString);
    }
    if (typeof obj === 'object') {
      const converted: any = {};
      for (const key in obj) {
        converted[key] = convertBigIntToString(obj[key]);
      }
      return converted;
    }
    return obj;
  };

  const onSubmit = async (formData: CreateInputs | UpdateInputs) => {
    setLoading(true);
    try {
      // Convert any BigInt values to Numbers before sending
      const sanitizedFormData = convertBigIntToString(formData);
      
      if (type === "create") {
        await modulesApi.create(sanitizedFormData as CreateInputs);
        reset();
      } else if (data?.id) {
        // For update, remove undefined/empty fields
        const updateData: any = {};
        Object.keys(sanitizedFormData).forEach((key) => {
          const value = (sanitizedFormData as any)[key];
          if (value !== undefined && value !== null && value !== "") {
            updateData[key] = value;
          }
        });
        await modulesApi.update(data.id, updateData);
      }

      if (onSuccess) {
        onSuccess();
      }
    } catch (error: any) {
      alert(error.message || "Failed to save module");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="flex flex-col gap-8" onSubmit={handleSubmit(onSubmit)}>
      <h1 className="text-xl font-semibold">
        {type === "create" ? "Create a new Module" : "Update Module"}
      </h1>

      <span className="text-xs text-gray-400">
        Module information
      </span>
      <div className="flex justify-between flex-wrap gap-4">
        <InputField
          label="Title"
          name="title"
          register={register}
          error={errors.title}
          defaultValue={data?.title}
        />
        <div className="flex flex-col gap-2 w-full">
          <label className="text-xs text-gray-500">Description</label>
          <textarea
            className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
            rows={3}
            defaultValue={data?.description}
            {...register("description")}
          />
        </div>
        <div className="flex flex-col gap-2 w-full md:w-1/4">
          <label className="text-xs text-gray-500">
            Order {existingOrders.length > 0 && `(Existing: ${existingOrders.sort((a, b) => a - b).join(", ")})`}
          </label>
          <input
            type="number"
            className={`ring-[1.5px] ${errors.order ? 'ring-red-300' : 'ring-gray-300'} p-2 rounded-md text-sm w-full`}
            defaultValue={data?.order?.toString()}
            {...register("order", { 
              valueAsNumber: true, 
              setValueAs: (v) => v === '' ? undefined : parseInt(v, 10),
              validate: (value) => {
                if (value && existingOrders.includes(value)) {
                  return "This order already exists for this course";
                }
                return true;
              },
            })}
          />
          {errors.order?.message && (
            <p className="text-red-400 text-xs">{errors.order.message.toString()}</p>
          )}
        </div>
        <InputField
          label="Estimated Duration (minutes)"
          name="estimatedDuration"
          type="number"
          register={(name: string) => register(name as any, { valueAsNumber: true, setValueAs: (v) => v === '' ? undefined : parseInt(v, 10) })}
          error={errors.estimatedDuration}
          defaultValue={data?.estimatedDuration?.toString()}
        />
        <div className="flex flex-col gap-2 w-full md:w-1/4">
          <label className="text-xs text-gray-500">Required</label>
          <select
            className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
            defaultValue={data?.isRequired !== undefined ? (data.isRequired ? "true" : "false") : "true"}
            {...register("isRequired", { setValueAs: (v) => v === "true" })}
          >
            <option value="true">Required</option>
            <option value="false">Optional</option>
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

export default ModuleForm;
