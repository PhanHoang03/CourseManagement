import { z } from 'zod';

// Create assignment schema
export const createAssignmentSchema = z.object({
  body: z.object({
    courseId: z.string().uuid('Invalid course ID'),
    moduleId: z.string().uuid('Invalid module ID').optional(),
    title: z.string().min(2, 'Assignment title must be at least 2 characters'),
    description: z.string().optional(),
    instructions: z.string().optional(),
    dueDate: z.string().datetime().optional().or(z.literal('')),
    maxScore: z.number().int().positive().default(100),
    isRequired: z.boolean().default(true),
  }),
});

// Update assignment schema
export const updateAssignmentSchema = z.object({
  body: z.object({
    title: z.string().min(2).optional(),
    description: z.string().optional(),
    instructions: z.string().optional(),
    dueDate: z.string().datetime().optional().or(z.literal('')),
    maxScore: z.number().int().positive().optional(),
    isRequired: z.boolean().optional(),
  }),
  params: z.object({
    id: z.string().uuid('Invalid assignment ID'),
  }),
});

// Get assignment by ID schema
export const getAssignmentByIdSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid assignment ID'),
  }),
});

// Query parameters schema
export const getAssignmentsQuerySchema = z.object({
  query: z.object({
    page: z.string().regex(/^\d+$/).transform(Number).optional().default(1),
    limit: z.string().regex(/^\d+$/).transform(Number).optional().default(10),
    courseId: z.string().uuid().optional(),
    moduleId: z.string().uuid().optional(),
    search: z.string().optional(),
  }),
});

// Submit assignment schema
export const submitAssignmentSchema = z.object({
  body: z.object({
    assignmentId: z.string().uuid('Invalid assignment ID'),
    enrollmentId: z.string().uuid('Invalid enrollment ID'),
    submissionText: z.string().optional(),
    submissionFiles: z.array(z.string()).optional(),
  }),
});

// Grade assignment schema
export const gradeAssignmentSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid submission ID'),
  }),
  body: z.object({
    score: z.number().int().min(0).max(100),
    feedback: z.string().optional(),
    status: z.enum(['graded', 'returned']).default('graded'),
  }),
});

// Get submission by ID schema
export const getSubmissionByIdSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid submission ID'),
  }),
});

// Get submissions query schema
export const getSubmissionsQuerySchema = z.object({
  query: z.object({
    page: z.string().regex(/^\d+$/).transform(Number).optional().default(1),
    limit: z.string().regex(/^\d+$/).transform(Number).optional().default(10),
    assignmentId: z.string().uuid().optional(),
    enrollmentId: z.string().uuid().optional(),
    traineeId: z.string().uuid().optional(),
    status: z.enum(['submitted', 'graded', 'returned']).optional(),
  }),
});

export type CreateAssignmentInput = z.infer<typeof createAssignmentSchema>['body'];
export type UpdateAssignmentInput = z.infer<typeof updateAssignmentSchema>['body'];
export type GetAssignmentsQuery = z.infer<typeof getAssignmentsQuerySchema>['query'];
export type SubmitAssignmentInput = z.infer<typeof submitAssignmentSchema>['body'];
export type GradeAssignmentInput = z.infer<typeof gradeAssignmentSchema>['body'];
export type GetSubmissionsQuery = z.infer<typeof getSubmissionsQuerySchema>['query'];
