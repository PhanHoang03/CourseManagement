import { z } from 'zod';

// Question schema
export const questionSchema = z.object({
  id: z.string(),
  type: z.enum(['multiple-choice', 'true-false', 'multiple-select']),
  question: z.string().min(1),
  options: z.array(z.string()).min(2),
  correctAnswers: z.union([z.number(), z.array(z.number())]),
  points: z.number().min(0).default(10),
  explanation: z.string().optional(),
});

// Settings schema
export const assessmentSettingsSchema = z.object({
  passingScore: z.number().min(0).max(100).default(70),
  allowRetake: z.boolean().default(true),
  timeLimit: z.number().positive().optional(),
  randomizeQuestions: z.boolean().default(false),
  showResultsImmediately: z.boolean().default(true),
});

// Create Assessment Input
export const createAssessmentInputSchema = z.object({
  moduleId: z.string().uuid().optional(),
  courseId: z.string().uuid(),
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  type: z.enum(['quiz', 'assignment']).default('quiz'),
  passingScore: z.number().min(0).max(100).default(70),
  maxAttempts: z.number().positive().optional(),
  timeLimit: z.number().positive().optional(), // in minutes
  isRequired: z.boolean().default(true),
  questions: z.array(questionSchema).min(1, 'At least one question is required'),
  settings: assessmentSettingsSchema.optional(),
});

export type CreateAssessmentInput = z.infer<typeof createAssessmentInputSchema>;

// Update Assessment Input
export const updateAssessmentInputSchema = createAssessmentInputSchema.partial().extend({
  id: z.string().uuid(),
});

export type UpdateAssessmentInput = z.infer<typeof updateAssessmentInputSchema>;

// Get Assessments Query
export const getAssessmentsQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(10),
  courseId: z.string().uuid().optional(),
  moduleId: z.string().uuid().optional(),
  type: z.enum(['quiz', 'assignment']).optional(),
  search: z.string().optional(),
});

export type GetAssessmentsQuery = z.infer<typeof getAssessmentsQuerySchema>;

// Submit Assessment Input
export const submitAssessmentInputSchema = z.object({
  assessmentId: z.string().uuid(),
  enrollmentId: z.string().uuid(),
  answers: z.record(z.string(), z.union([z.number(), z.array(z.number())])),
  timeTaken: z.number().positive().optional(), // in seconds
});

export type SubmitAssessmentInput = z.infer<typeof submitAssessmentInputSchema>;

// Get Attempts Query
export const getAttemptsQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(10),
  assessmentId: z.string().uuid().optional(),
  enrollmentId: z.string().uuid().optional(),
  traineeId: z.string().uuid().optional(),
});

export type GetAttemptsQuery = z.infer<typeof getAttemptsQuerySchema>;

// Validation schemas for routes (following assignment pattern)
export const createAssessmentSchema = z.object({
  body: createAssessmentInputSchema,
});

export const updateAssessmentSchema = z.object({
  body: updateAssessmentInputSchema.omit({ id: true }),
  params: z.object({
    id: z.string().uuid('Invalid assessment ID'),
  }),
});

export const getAssessmentByIdSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid assessment ID'),
  }),
});

export const getAssessmentsQueryValidationSchema = z.object({
  query: getAssessmentsQuerySchema,
});

export const submitAssessmentSchema = z.object({
  body: submitAssessmentInputSchema,
});

export const getAttemptsQueryValidationSchema = z.object({
  query: getAttemptsQuerySchema,
});

export const getAttemptByIdSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid attempt ID'),
  }),
});
