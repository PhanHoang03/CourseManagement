"use client"

import { useForm } from "react-hook-form";
import { useState, useEffect } from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import InputField from "../InputField";
import { assessmentsApi, modulesApi } from "@/lib/api";
import QuizBuilder from "./QuizBuilder";

// Base schema with common fields
const baseSchema = z.object({
  title: z.string().min(2, { message: "Assessment title must be at least 2 characters" }),
  description: z.string().optional(),
  type: z.enum(['quiz', 'assignment']).default('quiz'),
  passingScore: z.number().int().min(0).max(100).default(70),
  maxAttempts: z.number().int().positive().optional(),
  timeLimit: z.number().int().positive().optional(), // in minutes
  isRequired: z.boolean().default(true),
  questions: z.array(z.any()).min(1, { message: "At least one question is required" }).optional(),
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

const AssessmentForm = ({
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
  const [quizData, setQuizData] = useState<any>(() => {
    if (data?.questions) {
      return {
        questions: data.questions,
        settings: {
          passingScore: data.passingScore || 70,
          allowRetake: data.maxAttempts ? data.maxAttempts > 1 : true,
          timeLimit: data.timeLimit ? data.timeLimit * 60 : undefined, // Convert minutes to seconds
          randomizeQuestions: false,
          showResultsImmediately: true,
        }
      };
    }
    return null;
  });

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
      type: data.type || 'quiz',
      passingScore: data.passingScore || 70,
      maxAttempts: data.maxAttempts,
      timeLimit: data.timeLimit,
      isRequired: data.isRequired !== undefined ? data.isRequired : true,
      ...(type === "create" && data.courseId ? { courseId: data.courseId } : {}),
      ...(type === "create" && data.moduleId ? { moduleId: data.moduleId } : {}),
    } : undefined,
  });

  const courseId = watch("courseId");
  const assessmentType = watch("type");

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

      // Handle quiz data if provided
      if (quizData && quizData.questions) {
        submitData.questions = quizData.questions;
        submitData.settings = {
          passingScore: submitData.passingScore || quizData.settings?.passingScore || 70,
          allowRetake: submitData.maxAttempts ? submitData.maxAttempts > 1 : true,
          timeLimit: submitData.timeLimit ? submitData.timeLimit * 60 : undefined, // Use form's timeLimit, convert minutes to seconds
          randomizeQuestions: quizData.settings?.randomizeQuestions || false,
          showResultsImmediately: quizData.settings?.showResultsImmediately !== false,
        };
        // Update passingScore from settings if not set
        if (!submitData.passingScore && quizData.settings?.passingScore) {
          submitData.passingScore = quizData.settings.passingScore;
        }
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
        await assessmentsApi.create(submitData as CreateInputs);
        reset();
        setQuizData(null);
      } else if (data?.id) {
        await assessmentsApi.update(data.id, submitData as UpdateInputs);
      }

      if (onSuccess) {
        onSuccess();
      }
    } catch (error: any) {
      alert(error.message || "Failed to save assessment");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="flex flex-col gap-8" onSubmit={handleSubmit(onSubmit)}>
      <h1 className="text-xl font-semibold">
        {type === "create" ? "Create a new Assessment" : "Update Assessment"}
      </h1>

      <span className="text-xs text-gray-400">
        Assessment information
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
        {type === "create" && modules.length > 0 && (
          <div className="flex flex-col gap-2 w-full md:w-1/4">
            <label className="text-xs text-gray-500">Module (Optional)</label>
            <select
              className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
              defaultValue={data?.moduleId || ''}
              {...register("moduleId")}
            >
              <option value="">None (Course-level)</option>
              {modules.map((module) => (
                <option key={module.id} value={module.id}>
                  {module.title}
                </option>
              ))}
            </select>
          </div>
        )}
        <div className="flex flex-col gap-2 w-full md:w-1/4">
          <label className="text-xs text-gray-500">Type</label>
          <select
            className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
            defaultValue={data?.type || 'quiz'}
            {...register("type")}
          >
            <option value="quiz">Quiz</option>
            <option value="assignment">Assignment</option>
          </select>
        </div>
        <InputField
          label="Passing Score (%)"
          name="passingScore"
          type="number"
          register={(name) => register(name, { setValueAs: (v) => v === '' ? 70 : parseInt(v, 10) })}
          error={errors.passingScore}
          defaultValue={data?.passingScore?.toString() || '70'}
        />
        <InputField
          label="Max Attempts (Optional)"
          name="maxAttempts"
          type="number"
          register={(name) => register(name, { setValueAs: (v) => v === '' ? undefined : parseInt(v, 10) })}
          error={errors.maxAttempts}
          defaultValue={data?.maxAttempts?.toString() || ''}
        />
        <InputField
          label="Time Limit (minutes, Optional)"
          name="timeLimit"
          type="number"
          register={(name) => register(name, { setValueAs: (v) => v === '' ? undefined : parseInt(v, 10) })}
          error={errors.timeLimit}
          defaultValue={data?.timeLimit?.toString() || ''}
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

      {/* Quiz Builder for quiz type */}
      {assessmentType === 'quiz' && (
        <div className="w-full">
          <span className="text-xs text-gray-400 mb-2 block">
            Quiz Questions
          </span>
          <QuizBuilder
            value={quizData}
            onChange={(data) => setQuizData(data)}
          />
        </div>
      )}

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

export default AssessmentForm;
