import { z } from 'zod';

// Create module schema
export const createModuleSchema = z.object({
  body: z.object({
    courseId: z.string().uuid('Invalid course ID'),
    title: z.string().min(2, 'Module title must be at least 2 characters'),
    description: z.string().optional(),
    order: z.number().int().positive().optional(),
    estimatedDuration: z.number().int().positive().optional(),
    isRequired: z.boolean().default(true),
  }),
});

// Update module schema
export const updateModuleSchema = z.object({
  body: z.object({
    title: z.string().min(2).optional(),
    description: z.string().optional(),
    order: z.number().int().positive().optional(),
    estimatedDuration: z.number().int().positive().optional(),
    isRequired: z.boolean().optional(),
  }),
  params: z.object({
    id: z.string().uuid('Invalid module ID'),
  }),
});

// Get module by ID schema
export const getModuleByIdSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid module ID'),
  }),
});

// Query parameters schema
export const getModulesQuerySchema = z.object({
  query: z.object({
    courseId: z.string().uuid('Invalid course ID').optional(),
  }),
});

// Reorder modules schema
export const reorderModulesSchema = z.object({
  body: z.object({
    moduleOrders: z.array(z.object({
      moduleId: z.string().uuid(),
      order: z.number().int().positive(),
    })),
  }),
  params: z.object({
    courseId: z.string().uuid('Invalid course ID'),
  }),
});

export type CreateModuleInput = z.infer<typeof createModuleSchema>['body'];
export type UpdateModuleInput = z.infer<typeof updateModuleSchema>['body'];
export type ReorderModulesInput = z.infer<typeof reorderModulesSchema>['body'];
