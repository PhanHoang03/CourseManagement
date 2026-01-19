import { z } from 'zod';

// Update progress schema
export const updateProgressSchema = z.object({
  body: z.object({
    enrollmentId: z.string().uuid('Invalid enrollment ID'),
    moduleId: z.string().uuid('Invalid module ID'),
    contentId: z.string().uuid('Invalid content ID').optional(),
    status: z.enum(['not_started', 'in_progress', 'completed']).optional(),
    progressPercentage: z.number().min(0).max(100).optional(),
    timeSpent: z.number().int().positive().optional(),
  }),
});

// Get progress schema
export const getProgressSchema = z.object({
  params: z.object({
    enrollmentId: z.string().uuid('Invalid enrollment ID'),
  }),
  query: z.object({
    moduleId: z.string().uuid().optional(),
    contentId: z.string().uuid().optional(),
  }),
});

// Mark content as completed schema
export const completeContentSchema = z.object({
  body: z.object({
    enrollmentId: z.string().uuid('Invalid enrollment ID'),
    moduleId: z.string().uuid('Invalid module ID'),
    contentId: z.string().uuid('Invalid content ID'),
    timeSpent: z.number().int().positive().optional(),
    contentData: z.record(z.string(), z.any()).optional(), // For quiz submissions and other content-specific data
  }),
});

// Get user progress in course schema
export const getUserCourseProgressSchema = z.object({
  params: z.object({
    courseId: z.string().uuid('Invalid course ID'),
  }),
});

export type UpdateProgressInput = z.infer<typeof updateProgressSchema>['body'];
export type CompleteContentInput = z.infer<typeof completeContentSchema>['body'];
