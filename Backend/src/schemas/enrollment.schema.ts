import { z } from 'zod';

// Create enrollment schema (for admins/instructors to enroll users)
export const createEnrollmentSchema = z.object({
  body: z.object({
    traineeId: z.string().uuid('Invalid trainee ID'),
    courseId: z.string().uuid('Invalid course ID'),
    dueDate: z.string().datetime().optional(),
    enrollmentType: z.enum(['self', 'assigned', 'invited']).default('assigned'),
  }),
});

// Update enrollment schema
export const updateEnrollmentSchema = z.object({
  body: z.object({
    status: z.enum(['enrolled', 'in_progress', 'completed', 'dropped']).optional(),
    progressPercentage: z.number().min(0).max(100).optional(),
    dueDate: z.string().datetime().optional(),
  }),
  params: z.object({
    id: z.string().uuid('Invalid enrollment ID'),
  }),
});

// Get enrollment by ID schema
export const getEnrollmentByIdSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid enrollment ID'),
  }),
});

// Query parameters schema
export const getEnrollmentsQuerySchema = z.object({
  query: z.object({
    page: z.string().regex(/^\d+$/).transform(Number).optional().default(1),
    limit: z.string().regex(/^\d+$/).transform(Number).optional().default(10),
    courseId: z.string().uuid().optional(),
    traineeId: z.string().uuid().optional(),
    status: z.enum(['enrolled', 'in_progress', 'completed', 'dropped']).optional(),
    search: z.string().optional(),
  }),
});

// Complete enrollment schema
export const completeEnrollmentSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid enrollment ID'),
  }),
});

// Drop enrollment schema
export const dropEnrollmentSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid enrollment ID'),
  }),
});

export type CreateEnrollmentInput = z.infer<typeof createEnrollmentSchema>['body'];
export type UpdateEnrollmentInput = z.infer<typeof updateEnrollmentSchema>['body'];
export type GetEnrollmentsQuery = z.infer<typeof getEnrollmentsQuerySchema>['query'];
