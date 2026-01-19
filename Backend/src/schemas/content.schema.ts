import { z } from 'zod';

// Create content schema
export const createContentSchema = z.object({
  body: z.object({
    moduleId: z.string().uuid('Invalid module ID'),
    title: z.string().min(2, 'Content title must be at least 2 characters'),
    description: z.string().optional(),
    contentType: z.enum(['video', 'document', 'text', 'link', 'assignment']),
    contentUrl: z.string().url().optional(),
    fileUrl: z.string().url().optional(),
    fileSize: z.number().int().positive().optional(),
    order: z.number().int().positive().optional(),
    duration: z.number().int().positive().optional(), // For video content
    isRequired: z.boolean().default(true),
    contentData: z.record(z.string(), z.any()).optional(),
  }),
});

// Update content schema
export const updateContentSchema = z.object({
  body: z.object({
    title: z.string().min(2).optional(),
    description: z.string().optional(),
    contentType: z.enum(['video', 'document', 'text', 'link', 'quiz', 'assignment']).optional(),
    contentUrl: z.string().url().optional(),
    fileUrl: z.string().url().optional(),
    fileSize: z.number().int().positive().optional(),
    order: z.number().int().positive().optional(),
    duration: z.number().int().positive().optional(),
    isRequired: z.boolean().optional(),
    contentData: z.record(z.string(), z.any()).optional(),
  }),
  params: z.object({
    id: z.string().uuid('Invalid content ID'),
  }),
});

// Get content by ID schema
export const getContentByIdSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid content ID'),
  }),
});

// Get contents by module ID schema
export const getContentsByModuleSchema = z.object({
  params: z.object({
    moduleId: z.string().uuid('Invalid module ID'),
  }),
});

// Query parameters schema
export const getContentsQuerySchema = z.object({
  query: z.object({
    moduleId: z.string().uuid('Invalid module ID').optional(),
    contentType: z.enum(['video', 'document', 'text', 'link', 'quiz', 'assignment']).optional(),
  }),
});

// Reorder content schema
export const reorderContentSchema = z.object({
  body: z.object({
    contentOrders: z.array(z.object({
      contentId: z.string().uuid(),
      order: z.number().int().positive(),
    })),
  }),
  params: z.object({
    moduleId: z.string().uuid('Invalid module ID'),
  }),
});

export type CreateContentInput = z.infer<typeof createContentSchema>['body'];
export type UpdateContentInput = z.infer<typeof updateContentSchema>['body'];
export type ReorderContentInput = z.infer<typeof reorderContentSchema>['body'];
