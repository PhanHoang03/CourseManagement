"use client"

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/lib/auth";
import { coursesApi, organizationsApi, departmentsApi, usersApi } from "@/lib/api";
import InputField from "@/components/InputField";

type TabType = 'general' | 'organization' | 'details' | 'prerequisites' | 'advanced';

const updateCourseSchema = z.object({
  title: z.string().min(2, { message: "Course title must be at least 2 characters" }).optional(),
  courseCode: z.string().min(1, { message: "Course code is required" }).max(100).optional(),
  description: z.string().optional(),
  thumbnailUrl: z.union([z.string().url(), z.literal('')]).optional(),
  organizationId: z.string().uuid().optional(),
  departmentId: z.string().uuid().optional(),
  instructorId: z.string().uuid().optional(),
  difficultyLevel: z.enum(["beginner", "intermediate", "advanced"]).optional(),
  estimatedDuration: z.number().int().positive().optional().or(z.literal('')),
  maxEnrollments: z.number().int().positive().optional().or(z.literal('')),
  isCertified: z.boolean().optional(),
  certificateTemplateId: z.string().uuid().optional().or(z.literal('')),
  isPublic: z.boolean().optional(),
  status: z.enum(["draft", "published", "archived"]).optional(),
  tags: z.string().optional(), // Will be converted to array
});

type FormInputs = z.infer<typeof updateCourseSchema>;

const CourseEditPage = () => {
  const params = useParams();
  const router = useRouter();
  const { user: currentUser } = useAuth();
  const courseId = params.id as string;

  const [course, setCourse] = useState<any>(null);
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [instructors, setInstructors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('general');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isDirty },
    reset,
    setValue,
  } = useForm<FormInputs>({
    resolver: zodResolver(updateCourseSchema),
  });

  const selectedOrgId = watch("organizationId");
  const selectedStatus = watch("status");

  useEffect(() => {
    setHasUnsavedChanges(isDirty);
  }, [isDirty]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [courseRes, orgsRes, deptsRes, instructorsRes] = await Promise.all([
          coursesApi.getById(courseId),
          organizationsApi.getAll().catch(() => ({ success: false, data: [] })),
          departmentsApi.getAll().catch(() => ({ success: false, data: [] })),
          usersApi.getAll({ role: "instructor" }).catch(() => ({ success: false, data: [] })),
        ]);

        if (courseRes.success && courseRes.data) {
          const courseData = courseRes.data;
          setCourse(courseData);
          
          // Reset form with course data
          reset({
            title: courseData.title,
            courseCode: courseData.courseCode,
            description: courseData.description || '',
            thumbnailUrl: courseData.thumbnailUrl || '',
            organizationId: courseData.organizationId,
            departmentId: courseData.departmentId || '',
            instructorId: courseData.instructorId,
            difficultyLevel: courseData.difficultyLevel || 'beginner',
            estimatedDuration: courseData.estimatedDuration || '',
            maxEnrollments: courseData.maxEnrollments || '',
            isCertified: courseData.isCertified || false,
            certificateTemplateId: courseData.certificateTemplateId || '',
            isPublic: courseData.isPublic || false,
            status: courseData.status || 'draft',
            tags: Array.isArray(courseData.tags) ? courseData.tags.join(', ') : (courseData.tags || ''),
          });
        }

        if (orgsRes.success && orgsRes.data) setOrganizations(orgsRes.data);
        if (deptsRes.success && deptsRes.data) setDepartments(deptsRes.data);
        if (instructorsRes.success && instructorsRes.data) setInstructors(instructorsRes.data);
      } catch (error) {
        console.error("Failed to fetch course data:", error);
      } finally {
        setLoading(false);
      }
    };

    if (courseId) {
      fetchData();
    }
  }, [courseId, reset]);

  // Update departments when organization changes
  useEffect(() => {
    if (selectedOrgId) {
      departmentsApi.getAll({ organizationId: selectedOrgId }).then((res) => {
        if (res.success && res.data) {
          setDepartments(res.data);
        }
      });
    }
  }, [selectedOrgId]);

  const onSubmit = async (data: FormInputs) => {
    if (!course) return;

    setSaving(true);
    try {
      const submitData: any = { ...data };

      // Convert tags string to array
      if (submitData.tags) {
        submitData.tags = submitData.tags.split(',').map((tag: string) => tag.trim()).filter((tag: string) => tag.length > 0);
      } else {
        delete submitData.tags;
      }

      // Handle empty strings for optional number fields
      if (submitData.estimatedDuration === '') delete submitData.estimatedDuration;
      if (submitData.maxEnrollments === '') delete submitData.maxEnrollments;
      if (submitData.certificateTemplateId === '') delete submitData.certificateTemplateId;
      if (submitData.departmentId === '') delete submitData.departmentId;
      if (submitData.thumbnailUrl === '') delete submitData.thumbnailUrl;

      // Convert string numbers to numbers
      if (submitData.estimatedDuration && typeof submitData.estimatedDuration === 'string') {
        submitData.estimatedDuration = parseInt(submitData.estimatedDuration);
      }
      if (submitData.maxEnrollments && typeof submitData.maxEnrollments === 'string') {
        submitData.maxEnrollments = parseInt(submitData.maxEnrollments);
      }

      // Remove undefined values
      Object.keys(submitData).forEach(key => {
        if (submitData[key] === undefined || submitData[key] === '') {
          delete submitData[key];
        }
      });

      await coursesApi.update(courseId, submitData);
      setHasUnsavedChanges(false);
      
      // Navigate back to detail page (use appropriate route based on user role)
      const redirectPath = currentUser?.role === 'instructor' 
        ? `/courses/${courseId}` 
        : `/list/courses/${courseId}`;
      router.push(redirectPath);
    } catch (error: any) {
      alert(error.message || "Failed to update course");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAndPublish = async (data: FormInputs) => {
    if (!course) return;

    setSaving(true);
    try {
      const submitData: any = { ...data };

      // Convert tags string to array
      if (submitData.tags) {
        submitData.tags = submitData.tags.split(',').map((tag: string) => tag.trim()).filter((tag: string) => tag.length > 0);
      } else {
        delete submitData.tags;
      }

      // Handle empty strings for optional number fields
      if (submitData.estimatedDuration === '') delete submitData.estimatedDuration;
      if (submitData.maxEnrollments === '') delete submitData.maxEnrollments;
      if (submitData.certificateTemplateId === '') delete submitData.certificateTemplateId;
      if (submitData.departmentId === '') delete submitData.departmentId;
      if (submitData.thumbnailUrl === '') delete submitData.thumbnailUrl;

      // Convert string numbers to numbers
      if (submitData.estimatedDuration && typeof submitData.estimatedDuration === 'string') {
        submitData.estimatedDuration = parseInt(submitData.estimatedDuration);
      }
      if (submitData.maxEnrollments && typeof submitData.maxEnrollments === 'string') {
        submitData.maxEnrollments = parseInt(submitData.maxEnrollments);
      }

      // Remove undefined values
      Object.keys(submitData).forEach(key => {
        if (submitData[key] === undefined || submitData[key] === '') {
          delete submitData[key];
        }
      });

      // Save the form data
      await coursesApi.update(courseId, submitData);
      
      // Then publish if not already published
      if (course.status !== 'published') {
        await coursesApi.publish(courseId);
      }
      
      setHasUnsavedChanges(false);
      
      // Navigate back to detail page (use appropriate route based on user role)
      const redirectPath = currentUser?.role === 'instructor' 
        ? `/courses/${courseId}` 
        : `/list/courses/${courseId}`;
      router.push(redirectPath);
    } catch (error: any) {
      alert(error.message || "Failed to save and publish course");
      setSaving(false);
    }
  };

  const handleCancel = () => {
    const redirectPath = currentUser?.role === 'instructor' 
      ? `/courses/${courseId}` 
      : `/list/courses/${courseId}`;
    
    if (hasUnsavedChanges) {
      if (confirm("You have unsaved changes. Are you sure you want to leave?")) {
        router.push(redirectPath);
      }
    } else {
      router.push(redirectPath);
    }
  };

  if (loading || !course) {
    return (
      <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0 flex items-center justify-center min-h-[600px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const canEdit = currentUser?.role === 'admin' || (currentUser?.role === 'instructor' && course.instructorId === currentUser.id);

  if (!canEdit) {
    return (
      <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0 flex items-center justify-center min-h-[600px]">
        <p className="text-gray-500">You don't have permission to edit this course</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex-1 m-4 mt-0 flex flex-col gap-4">
      {/* HEADER */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-md p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <nav className="text-sm text-gray-600 mb-2">
              {currentUser?.role === 'instructor' ? (
                <>
                  <Link href="/instructor/courses" className="hover:text-blue-600">My Courses</Link>
                  <span className="mx-2">/</span>
                  <Link href={`/courses/${courseId}`} className="hover:text-blue-600">{course.title}</Link>
                  <span className="mx-2">/</span>
                  <span className="text-gray-900">Edit</span>
                </>
              ) : (
                <>
                  <Link href="/list/courses" className="hover:text-blue-600">Courses</Link>
                  <span className="mx-2">/</span>
                  <Link href={`/list/courses/${courseId}`} className="hover:text-blue-600">{course.title}</Link>
                  <span className="mx-2">/</span>
                  <span className="text-gray-900">Edit</span>
                </>
              )}
            </nav>
            <h1 className="text-2xl font-bold text-gray-900">Edit Course</h1>
          </div>
          <div className="flex items-center gap-2">
            {hasUnsavedChanges && (
              <span className="text-xs text-orange-600 px-3 py-1 bg-orange-100 rounded-full">
                Unsaved changes
              </span>
            )}
            <button
              type="button"
              onClick={handleCancel}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-300"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit(handleSaveAndPublish)}
              disabled={saving}
              className="px-4 py-2 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700 disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save & Publish"}
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        </div>

        {/* Status Badge */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Status:</span>
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
            selectedStatus === 'published'
              ? 'bg-green-100 text-green-800'
              : selectedStatus === 'archived'
              ? 'bg-gray-100 text-gray-800'
              : 'bg-yellow-100 text-yellow-800'
          }`}>
            {selectedStatus || course.status}
          </span>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="bg-white rounded-md flex-1 flex flex-col min-h-[600px]">
        {/* TABS */}
        <div className="border-b border-gray-200 px-6">
          <nav className="flex -mb-px">
            {[
              { id: 'general', label: 'General Information' },
              { id: 'organization', label: 'Organization & Access' },
              { id: 'details', label: 'Course Details' },
              { id: 'prerequisites', label: 'Prerequisites' },
              { id: 'advanced', label: 'Advanced Settings' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`px-4 py-3 text-sm font-medium border-b-2 ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* TAB CONTENT */}
        <div className="flex-1 p-6 overflow-auto">
          {/* TAB 1: GENERAL INFORMATION */}
          {activeTab === 'general' && (
            <div className="space-y-6 max-w-3xl">
              <div>
                <h2 className="text-lg font-semibold mb-4">Basic Information</h2>
                <div className="space-y-4">
                  <InputField
                    label="Course Title"
                    name="title"
                    register={register}
                    error={errors.title}
                    required
                  />
                  <InputField
                    label="Course Code"
                    name="courseCode"
                    register={register}
                    error={errors.courseCode}
                    required
                  />
                  <div className="flex flex-col gap-2">
                    <label className="text-xs text-gray-500">Description</label>
                    <textarea
                      className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full min-h-[120px]"
                      {...register("description")}
                    />
                    {errors.description?.message && (
                      <p className="text-red-400 text-xs">{errors.description.message.toString()}</p>
                    )}
                  </div>

                  {/* Thumbnail */}
                  <div className="flex flex-col gap-2">
                    <label className="text-xs text-gray-500">Thumbnail URL</label>
                    <input
                      type="url"
                      className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
                      {...register("thumbnailUrl")}
                      placeholder="https://example.com/image.jpg"
                    />
                    {watch("thumbnailUrl") && watch("thumbnailUrl") !== '' && (
                      <div className="mt-2">
                        <img
                          src={watch("thumbnailUrl") || course.thumbnailUrl || '/lesson.png'}
                          alt="Course thumbnail"
                          width={200}
                          height={112}
                          className="rounded-md border border-gray-200 object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/lesson.png';
                          }}
                        />
                      </div>
                    )}
                    {errors.thumbnailUrl?.message && (
                      <p className="text-red-400 text-xs">{errors.thumbnailUrl.message.toString()}</p>
                    )}
                  </div>

                  {/* Tags */}
                  <div className="flex flex-col gap-2">
                    <label className="text-xs text-gray-500">Tags (comma-separated)</label>
                    <input
                      type="text"
                      className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
                      {...register("tags")}
                      placeholder="tag1, tag2, tag3"
                    />
                    {errors.tags?.message && (
                      <p className="text-red-400 text-xs">{errors.tags.message.toString()}</p>
                    )}
                    <p className="text-xs text-gray-400">Separate tags with commas</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: ORGANIZATION & ACCESS */}
          {activeTab === 'organization' && (
            <div className="space-y-6 max-w-3xl">
              <div>
                <h2 className="text-lg font-semibold mb-4">Organization & Access</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2">
                    <label className="text-xs text-gray-500">Organization</label>
                    <select
                      className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
                      {...register("organizationId")}
                      disabled={currentUser?.role !== 'admin'}
                    >
                      <option value="">Select Organization</option>
                      {organizations.map((org) => (
                        <option key={org.id} value={org.id}>
                          {org.name}
                        </option>
                      ))}
                    </select>
                    {currentUser?.role !== 'admin' && (
                      <p className="text-xs text-gray-400">Organization is read-only for instructors</p>
                    )}
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-xs text-gray-500">Department</label>
                    <select
                      className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
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

                  <div className="flex flex-col gap-2">
                    <label className="text-xs text-gray-500">Instructor</label>
                    <select
                      className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
                      {...register("instructorId")}
                      disabled={currentUser?.role === 'instructor'}
                    >
                      <option value="">Select Instructor</option>
                      {instructors
                        .filter((inst) => !selectedOrgId || inst.organizationId === selectedOrgId)
                        .map((inst) => (
                          <option key={inst.id} value={inst.id}>
                            {inst.firstName} {inst.lastName} ({inst.email})
                          </option>
                        ))}
                    </select>
                    {currentUser?.role === 'instructor' && (
                      <p className="text-xs text-gray-400">Instructor is read-only</p>
                    )}
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-xs text-gray-500">Difficulty Level</label>
                    <select
                      className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
                      {...register("difficultyLevel")}
                    >
                      <option value="beginner">Beginner</option>
                      <option value="intermediate">Intermediate</option>
                      <option value="advanced">Advanced</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-2 md:col-span-2">
                    <label className="text-xs text-gray-500">Status</label>
                    <select
                      className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
                      {...register("status")}
                    >
                      <option value="draft">Draft</option>
                      <option value="published">Published</option>
                      <option value="archived">Archived</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-xs text-gray-500">Max Enrollments</label>
                    <input
                      type="number"
                      className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
                      {...register("maxEnrollments", { 
                        setValueAs: (v) => v === '' ? '' : parseInt(v, 10)
                      })}
                      placeholder="Leave empty for unlimited"
                      min="1"
                    />
                    {errors.maxEnrollments?.message && (
                      <p className="text-red-400 text-xs">{errors.maxEnrollments.message.toString()}</p>
                    )}
                  </div>

                  <div className="flex flex-col gap-4 md:col-span-2">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="isPublic"
                        {...register("isPublic")}
                        className="w-4 h-4 text-blue-600 ring-gray-300 rounded"
                      />
                      <label htmlFor="isPublic" className="text-sm text-gray-700">
                        Make course public (allow external users to view/enroll)
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: COURSE DETAILS */}
          {activeTab === 'details' && (
            <div className="space-y-6 max-w-3xl">
              <div>
                <h2 className="text-lg font-semibold mb-4">Course Details</h2>
                <div className="space-y-4">
                  <InputField
                    label="Estimated Duration (hours)"
                    name="estimatedDuration"
                    type="number"
                    register={(name) => register(name, { setValueAs: (v: string) => v === '' ? '' : parseInt(v, 10) })}
                    error={errors.estimatedDuration}
                    inputProps={{
                      placeholder: "e.g., 10",
                      min: 1,
                      max: 1000,
                    }}
                  />
                  <p className="text-xs text-gray-400 -mt-2">Estimated time to complete the course</p>

                  <div className="flex items-center gap-2 pt-2">
                    <input
                      type="checkbox"
                      id="isCertified"
                      {...register("isCertified")}
                      className="w-4 h-4 text-blue-600 ring-gray-300 rounded"
                    />
                    <label htmlFor="isCertified" className="text-sm text-gray-700">
                      Enable certificate generation on course completion
                    </label>
                  </div>

                  {watch("isCertified") && (
                    <div className="flex flex-col gap-2 ml-6">
                      <label className="text-xs text-gray-500">Certificate Template</label>
                      <select
                        className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
                        {...register("certificateTemplateId")}
                      >
                        <option value="">None (Use default template)</option>
                        {/* TODO: Load certificate templates when available */}
                      </select>
                      <p className="text-xs text-gray-400">Certificate templates will be available soon</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: PREREQUISITES (Placeholder) */}
          {activeTab === 'prerequisites' && (
            <div className="space-y-6 max-w-3xl">
              <div>
                <h2 className="text-lg font-semibold mb-4">Prerequisites</h2>
                <div className="bg-gray-50 rounded-lg p-8 text-center">
                  <p className="text-gray-500 mb-2">Prerequisites management coming soon</p>
                  <p className="text-sm text-gray-400">This feature will allow you to set course dependencies</p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: ADVANCED SETTINGS (Placeholder) */}
          {activeTab === 'advanced' && (
            <div className="space-y-6 max-w-3xl">
              <div>
                <h2 className="text-lg font-semibold mb-4">Advanced Settings</h2>
                <div className="bg-gray-50 rounded-lg p-8 text-center">
                  <p className="text-gray-500 mb-2">Advanced settings coming soon</p>
                  <p className="text-sm text-gray-400">This will include enrollment settings, completion criteria, and notifications</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </form>
  );
};

export default CourseEditPage;
