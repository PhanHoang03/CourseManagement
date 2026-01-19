import { z } from 'zod';

// Create course schema
export const createCourseSchema = z.object({
  body: z.object({
    organizationId: z.string().uuid('Invalid organization ID'),
    courseCode: z.string()
      .min(1, 'Course code is required')
      .max(100, 'Course code must be at most 100 characters'),
    title: z.string().min(2, 'Course title must be at least 2 characters'),
    description: z.string().optional(),
    instructorId: z.string().uuid('Invalid instructor ID'),
    departmentId: z.string().uuid('Invalid department ID').optional(),
    thumbnailUrl: z.string().url().optional(),
    difficultyLevel: z.enum(['beginner', 'intermediate', 'advanced']).default('beginner'),
    estimatedDuration: z.number().int().positive().optional(),
    maxEnrollments: z.number().int().positive().optional(),
    isCertified: z.boolean().default(false),
    certificateTemplateId: z.string().uuid('Invalid certificate template ID').optional(),
    status: z.enum(['draft', 'published', 'archived']).default('draft'),
    isPublic: z.boolean().default(false),
    tags: z.array(z.string()).optional(),
    metadata: z.record(z.string(), z.any()).optional(),
  }),
});

// Update course schema
export const updateCourseSchema = z.object({
  body: z.object({
    courseCode: z.string().min(1).max(100).optional(),
    title: z.string().min(2).optional(),
    description: z.string().optional(),
    instructorId: z.string().uuid().optional(),
    departmentId: z.string().uuid().optional(),
    thumbnailUrl: z.string().url().optional(),
    difficultyLevel: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
    estimatedDuration: z.number().int().positive().optional(),
    maxEnrollments: z.number().int().positive().optional(),
    isCertified: z.boolean().optional(),
    certificateTemplateId: z.string().uuid().optional(),
    status: z.enum(['draft', 'published', 'archived']).optional(),
    isPublic: z.boolean().optional(),
    tags: z.array(z.string()).optional(),
    metadata: z.record(z.string(), z.any()).optional(),
  }),
  params: z.object({
    id: z.string().uuid('Invalid course ID'),
  }),
});

// Get course by ID schema
export const getCourseByIdSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid course ID'),
  }),
});

// Query parameters schema
export const getCoursesQuerySchema = z.object({
  query: z.object({
    page: z.string().regex(/^\d+$/).transform(Number).optional().default(1),
    limit: z.string().regex(/^\d+$/).transform(Number).optional().default(10),
    organizationId: z.string().uuid().optional(),
    departmentId: z.string().uuid().optional(),
    instructorId: z.string().uuid().optional(),
    status: z.enum(['draft', 'published', 'archived']).optional(),
    difficultyLevel: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
    isPublic: z.string().transform((val) => val === 'true').optional(),
    search: z.string().optional(),
    tags: z.string().optional(), // Comma-separated tags
  }),
});

// Publish/Unpublish course schema
export const publishCourseSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid course ID'),
  }),
});

// Add prerequisite schema
export const addPrerequisiteSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid course ID'),
  }),
  body: z.object({
    prerequisiteCourseId: z.string().uuid('Invalid prerequisite course ID'),
    isMandatory: z.boolean().default(true),
  }),
});

// Remove prerequisite schema
export const removePrerequisiteSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid course ID'),
    prerequisiteId: z.string().uuid('Invalid prerequisite ID'),
  }),
});

// Enroll in course schema
export const enrollCourseSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid course ID'),
  }),
  body: z.object({
    dueDate: z.string().datetime().optional(),
  }),
});

export type CreateCourseInput = z.infer<typeof createCourseSchema>['body'];
export type UpdateCourseInput = z.infer<typeof updateCourseSchema>['body'];
export type GetCoursesQuery = z.infer<typeof getCoursesQuerySchema>['query'];
export type AddPrerequisiteInput = z.infer<typeof addPrerequisiteSchema>['body'];
