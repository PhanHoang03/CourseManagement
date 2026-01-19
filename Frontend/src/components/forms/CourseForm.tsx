"use client"

import { useForm } from "react-hook-form";
import { useState, useEffect } from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import InputField from "../InputField";
import { coursesApi, organizationsApi, departmentsApi, usersApi } from "@/lib/api";
import { useAuth } from "@/lib/auth";

const schema = z.object({
  title: z.string().min(2, { message: "Course title is required" }),
  courseCode: z.string().min(1, { message: "Course code is required" }),
  description: z.string().optional(),
  organizationId: z.string().uuid({ message: "Organization is required" }).optional(),
  departmentId: z.string().uuid().optional(),
  instructorId: z.string().uuid({ message: "Instructor is required" }).optional(),
  difficultyLevel: z.enum(["beginner", "intermediate", "advanced"]).default("beginner"),
  estimatedDuration: z.number().int().positive().optional(),
  maxEnrollments: z.number().int().positive().optional(),
  isCertified: z.boolean().default(false),
  isPublic: z.boolean().default(false),
  status: z.enum(["draft", "published", "archived"]).default("draft"),
  tags: z.string().optional(), // Will be converted to array
});

type Inputs = z.infer<typeof schema>;

// Match backend requirements:
// - create requires organizationId + instructorId
// - update allows partial updates
const createSchema = schema.extend({
  organizationId: z.string().uuid({ message: "Organization is required" }),
  instructorId: z.string().uuid({ message: "Instructor is required" }),
});

const updateSchema = schema.partial();

const CourseForm = ({
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
  const [instructors, setInstructors] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const isInstructor = user?.role === 'instructor';

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<Inputs>({
    resolver: zodResolver(type === "create" ? createSchema : updateSchema),
    defaultValues: data ? {
      title: data.title,
      courseCode: data.courseCode,
      description: data.description,
      organizationId: data.organizationId,
      departmentId: data.departmentId,
      instructorId: data.instructorId,
      difficultyLevel: data.difficultyLevel || "beginner",
      estimatedDuration: data.estimatedDuration,
      maxEnrollments: data.maxEnrollments,
      isCertified: data.isCertified !== undefined ? data.isCertified : false,
      isPublic: data.isPublic !== undefined ? data.isPublic : false,
      status: data.status || "draft",
      tags: Array.isArray(data.tags) ? data.tags.join(', ') : (data.tags || ''),
    } : undefined,
  });

  const selectedOrgId = watch("organizationId");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [orgsRes, deptsRes, instructorsRes] = await Promise.all([
          organizationsApi.getAll(),
          departmentsApi.getAll(),
          usersApi.getAll({ role: "instructor" }),
        ]);
        if (orgsRes.success && orgsRes.data) setOrganizations(orgsRes.data);
        if (deptsRes.success && deptsRes.data) setDepartments(deptsRes.data);
        if (instructorsRes.success && instructorsRes.data) setInstructors(instructorsRes.data);
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

  const onSubmit = async (formData: Inputs) => {
    setLoading(true);
    try {
      // Convert tags string to array if provided
      const submitData: any = { ...formData };
      if (submitData.tags && typeof submitData.tags === 'string') {
        submitData.tags = submitData.tags.split(',').map((tag: string) => tag.trim()).filter((tag: string) => tag.length > 0);
      }
      
      if (type === "create") {
        // Ensure instructorId is set (use pre-filled value if provided)
        if (!submitData.instructorId && data?.instructorId) {
          submitData.instructorId = data.instructorId;
        }
        // Ensure organizationId is set (use pre-filled value if provided)
        if (!submitData.organizationId && data?.organizationId) {
          submitData.organizationId = data.organizationId;
        }
        await coursesApi.create(submitData);
      } else if (data?.id) {
        await coursesApi.update(data.id, submitData);
      }
      
      if (onSuccess) {
        onSuccess();
      } else {
        window.location.reload();
      }
    } catch (error: any) {
      alert(error.message || "Failed to save course");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="flex flex-col gap-8" onSubmit={handleSubmit(onSubmit)}>
      <h1 className="text-xl font-semibold">
        {type === "create" ? "Create a new Course" : "Update Course"}
      </h1>
      <span className="text-xs text-gray-400">
        Course information
      </span>
      <div className="flex justify-between flex-wrap gap-4">
        <InputField
          label="Course Title"
          name="title"
          defaultValue={data?.title}
          register={register}
          error={errors.title}
        />
        <InputField
          label="Course Code"
          name="courseCode"
          defaultValue={data?.courseCode}
          register={register}
          error={errors.courseCode}
        />
        <InputField
          label="Description"
          name="description"
          defaultValue={data?.description}
          register={register}
          error={errors.description}
        />
        <InputField
          label="Estimated Duration (hours)"
          name="estimatedDuration"
          type="number"
          defaultValue={data?.estimatedDuration}
          register={register}
          error={errors.estimatedDuration}
        />
        <InputField
          label="Max Enrollments"
          name="maxEnrollments"
          type="number"
          defaultValue={data?.maxEnrollments}
          register={register}
          error={errors.maxEnrollments}
        />
      </div>
      <span className="text-xs text-gray-400">
        Organization & Assignment
      </span>
      <div className="flex justify-between flex-wrap gap-4">
        <div className="flex flex-col gap-2 w-full md:w-1/4">
          <label className="text-xs text-gray-500">Organization</label>
          {type === "create" && isInstructor && data?.organizationId ? (
            // For instructors creating courses, show organization as read-only
            <>
              <input
                type="hidden"
                {...register("organizationId")}
                value={data.organizationId}
              />
              <input
                type="text"
                className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full bg-gray-100"
                value={organizations.find((o) => o.id === data.organizationId)?.name || "Loading..."}
                readOnly
              />
            </>
          ) : (
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
          )}
          {errors.organizationId?.message && (
            <p className="text-red-400 text-xs">{errors.organizationId.message.toString()}</p>
          )}
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
        <div className="flex flex-col gap-2 w-full md:w-1/4">
          <label className="text-xs text-gray-500">Instructor</label>
          {type === "create" && data?.instructorId ? (
            // For create mode with pre-filled instructorId, show as read-only
            <>
              <input
                type="hidden"
                {...register("instructorId")}
                value={data.instructorId}
              />
              <input
                type="text"
                className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full bg-gray-100"
                value={instructors.find((i) => i.id === data.instructorId)?.firstName + " " + instructors.find((i) => i.id === data.instructorId)?.lastName || "Loading..."}
                readOnly
              />
            </>
          ) : (
            <select
              className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
              defaultValue={data?.instructorId}
              {...register("instructorId")}
            >
              <option value="">Select Instructor</option>
              {instructors.map((instructor) => (
                <option key={instructor.id} value={instructor.id}>
                  {instructor.firstName} {instructor.lastName}
                </option>
              ))}
            </select>
          )}
          {errors.instructorId?.message && (
            <p className="text-red-400 text-xs">{errors.instructorId.message.toString()}</p>
          )}
        </div>
        <div className="flex flex-col gap-2 w-full md:w-1/4">
          <label className="text-xs text-gray-500">Difficulty Level</label>
          <select
            className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
            defaultValue={data?.difficultyLevel || "beginner"}
            {...register("difficultyLevel")}
          >
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>
        </div>
      </div>
      <span className="text-xs text-gray-400">
        Settings
      </span>
      <div className="flex justify-between flex-wrap gap-4">
        <div className="flex flex-col gap-2 w-full md:w-1/4">
          <label className="text-xs text-gray-500">Status</label>
          <select
            className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
            defaultValue={data?.status || "draft"}
            {...register("status")}
          >
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="archived">Archived</option>
          </select>
        </div>
        <div className="flex flex-col gap-2 w-full md:w-1/4">
          <label className="text-xs text-gray-500">Certified Course</label>
          <select
            className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
            defaultValue={data?.isCertified !== undefined ? (data.isCertified ? "true" : "false") : "false"}
            {...register("isCertified", { setValueAs: (v) => v === "true" })}
          >
            <option value="false">No</option>
            <option value="true">Yes</option>
          </select>
        </div>
        <div className="flex flex-col gap-2 w-full md:w-1/4">
          <label className="text-xs text-gray-500">Public Course</label>
          <select
            className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
            defaultValue={data?.isPublic !== undefined ? (data.isPublic ? "true" : "false") : "false"}
            {...register("isPublic", { setValueAs: (v) => v === "true" })}
          >
            <option value="false">No</option>
            <option value="true">Yes</option>
          </select>
        </div>
        <InputField
          label="Tags (comma-separated)"
          name="tags"
          defaultValue={Array.isArray(data?.tags) ? data.tags.join(', ') : (data?.tags || '')}
          register={register}
          error={errors.tags}
        />
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

export default CourseForm;
