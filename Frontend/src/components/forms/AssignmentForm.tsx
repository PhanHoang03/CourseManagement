"use client"

import { useForm } from "react-hook-form";
import { useState, useEffect } from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import InputField from "../InputField";
import { assignmentsApi, modulesApi } from "@/lib/api";

// Base schema with common fields
const baseSchema = z.object({
  title: z.string().min(2, { message: "Assignment title must be at least 2 characters" }),
  description: z.string().optional(),
  instructions: z.string().optional(),
  // Accept datetime-local format (YYYY-MM-DDTHH:mm) or ISO datetime string or empty
  dueDate: z.string()
    .optional()
    .refine((val) => {
      if (!val || val === '') return true; // Empty is allowed
      // Check if it's datetime-local format (YYYY-MM-DDTHH:mm)
      const datetimeLocalRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;
      // Check if it's ISO datetime format
      const isoRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?(Z|[+-]\d{2}:\d{2})$/;
      return datetimeLocalRegex.test(val) || isoRegex.test(val) || new Date(val).toString() !== 'Invalid Date';
    }, { message: "Invalid date format. Use YYYY-MM-DDTHH:mm format" })
    .or(z.literal('')),
  maxScore: z.number().int().positive().default(100),
  isRequired: z.boolean().default(true),
});

// Create schema (courseId required, moduleId optional)
const createSchema = baseSchema.extend({
  courseId: z.string().uuid({ message: "Course ID is required" }),
  moduleId: z.string().uuid().optional(),
});

// Update schema (all fields optional)
const updateSchema = baseSchema.partial();

type CreateInputs = z.infer<typeof createSchema>;
type UpdateInputs = z.infer<typeof updateSchema>;

const AssignmentForm = ({
  type,
  data,
  onSuccess,
}: {
  type: "create" | "update";
  data?: any;
  onSuccess?: () => void;
}) => {
  const [loading, setLoading] = useState(false);
  const [modules, setModules] = useState<any[]>([]);

  const formSchema = type === "create" ? createSchema : updateSchema;

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    reset,
  } = useForm<CreateInputs | UpdateInputs>({
    resolver: zodResolver(formSchema),
    defaultValues: data ? {
      title: data.title,
      description: data.description,
      instructions: data.instructions,
      dueDate: data.dueDate ? (() => {
        // Convert ISO date string to datetime-local format (YYYY-MM-DDTHH:mm)
        try {
          const date = new Date(data.dueDate);
          if (isNaN(date.getTime())) return '';
          // Get local date components
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const day = String(date.getDate()).padStart(2, '0');
          const hours = String(date.getHours()).padStart(2, '0');
          const minutes = String(date.getMinutes()).padStart(2, '0');
          return `${year}-${month}-${day}T${hours}:${minutes}`;
        } catch {
          return '';
        }
      })() : '',
      maxScore: data.maxScore || 100,
      isRequired: data.isRequired !== undefined ? data.isRequired : true,
      ...(type === "create" && data.courseId ? { courseId: data.courseId } : {}),
      ...(type === "create" && data.moduleId ? { moduleId: data.moduleId } : {}),
    } : undefined,
  });

  const courseId = watch("courseId");

  useEffect(() => {
    const fetchModules = async () => {
      if (courseId || data?.courseId) {
        try {
          const res = await modulesApi.getByCourse(courseId || data.courseId);
          if (res.success && res.data) {
            setModules(res.data);
          }
        } catch (error) {
          console.error("Failed to fetch modules:", error);
        }
      }
    };
    fetchModules();
  }, [courseId, data?.courseId]);

  const onSubmit = async (formData: CreateInputs | UpdateInputs) => {
    setLoading(true);
    try {
      const submitData: any = { ...formData };

      // Convert dueDate from datetime-local format to ISO string
      // datetime-local gives format: "YYYY-MM-DDTHH:mm" (local time, no timezone)
      if (submitData.dueDate && submitData.dueDate !== '') {
        try {
          const dateTimeString = submitData.dueDate.trim();
          
          // Check if it's already in ISO format (has Z or timezone offset)
          const hasTimezone = dateTimeString.includes('Z') || 
                              (dateTimeString.includes('+') && dateTimeString.length > 19) ||
                              (dateTimeString.includes('-') && dateTimeString.length > 19 && dateTimeString.lastIndexOf('-') > 10);
          
          if (hasTimezone) {
            // Already in ISO format, validate it
            const testDate = new Date(dateTimeString);
            if (isNaN(testDate.getTime())) {
              throw new Error("Invalid ISO date format");
            }
            submitData.dueDate = dateTimeString;
          } else {
            // datetime-local format: "YYYY-MM-DDTHH:mm" - treat as local time
            // Parse the components explicitly to avoid timezone issues
            const match = dateTimeString.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?(?:\.(\d{3}))?$/);
            
            if (!match) {
              throw new Error("Date must be in format YYYY-MM-DDTHH:mm");
            }
            
            const [, year, month, day, hour, minute, second = '0', millisecond = '0'] = match;
            
            // Create date object using local time components
            // Note: month is 0-indexed in Date constructor
            const localDate = new Date(
              parseInt(year),
              parseInt(month) - 1,
              parseInt(day),
              parseInt(hour),
              parseInt(minute),
              parseInt(second),
              parseInt(millisecond)
            );
            
            // Validate the date
            if (isNaN(localDate.getTime())) {
              throw new Error("Invalid date values");
            }
            
            // Convert to ISO string (this will include timezone offset)
            submitData.dueDate = localDate.toISOString();
          }
        } catch (error: any) {
          alert(`Invalid date format: ${error.message}. Please use format: YYYY-MM-DDTHH:mm`);
          setLoading(false);
          return;
        }
      } else {
        delete submitData.dueDate;
      }

      // Remove undefined/empty fields for update
      if (type === "update") {
        Object.keys(submitData).forEach((key) => {
          if (submitData[key] === undefined || submitData[key] === null || submitData[key] === '') {
            delete submitData[key];
          }
        });
      }

      if (type === "create") {
        await assignmentsApi.create(submitData as CreateInputs);
        reset();
      } else if (data?.id) {
        await assignmentsApi.update(data.id, submitData as UpdateInputs);
      }

      if (onSuccess) {
        onSuccess();
      }
    } catch (error: any) {
      alert(error.message || "Failed to save assignment");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="flex flex-col gap-8" onSubmit={handleSubmit(onSubmit)}>
      <h1 className="text-xl font-semibold">
        {type === "create" ? "Create a new Assignment" : "Update Assignment"}
      </h1>

      <span className="text-xs text-gray-400">
        Assignment information
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
        <div className="flex flex-col gap-2 w-full">
          <label className="text-xs text-gray-500">Instructions</label>
          <textarea
            className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
            rows={4}
            defaultValue={data?.instructions}
            {...register("instructions")}
          />
        </div>
        {type === "create" && modules.length > 0 && (
          <div className="flex flex-col gap-2 w-full md:w-1/4">
            <label className="text-xs text-gray-500">Module (Optional)</label>
            <select
              className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
              defaultValue={data?.moduleId || ''}
              {...register("moduleId")}
            >
              <option value="">None</option>
              {modules.map((module) => (
                <option key={module.id} value={module.id}>
                  {module.title}
                </option>
              ))}
            </select>
          </div>
        )}
        <InputField
          label="Due Date"
          name="dueDate"
          type="datetime-local"
          register={register}
          error={errors.dueDate}
          defaultValue={data?.dueDate ? (() => {
            try {
              const date = new Date(data.dueDate);
              if (isNaN(date.getTime())) return '';
              const year = date.getFullYear();
              const month = String(date.getMonth() + 1).padStart(2, '0');
              const day = String(date.getDate()).padStart(2, '0');
              const hours = String(date.getHours()).padStart(2, '0');
              const minutes = String(date.getMinutes()).padStart(2, '0');
              return `${year}-${month}-${day}T${hours}:${minutes}`;
            } catch {
              return '';
            }
          })() : ''}
        />
        <InputField
          label="Max Score"
          name="maxScore"
          type="number"
          register={(name) => register(name, { setValueAs: (v) => v === '' ? 100 : parseInt(v, 10) })}
          error={errors.maxScore}
          defaultValue={data?.maxScore?.toString() || '100'}
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

export default AssignmentForm;
