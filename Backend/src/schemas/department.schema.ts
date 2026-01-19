import { z } from 'zod';

// Create department schema
export const createDepartmentSchema = z.object({
  body: z.object({
    organizationId: z.string().uuid('Invalid organization ID'),
    name: z.string().min(2, 'Department name must be at least 2 characters'),
    code: z.string()
      .min(1, 'Department code is required')
      .max(50, 'Department code must be at most 50 characters')
      .regex(/^[A-Z0-9-]+$/, 'Code can only contain uppercase letters, numbers, and hyphens'),
    description: z.string().optional(),
    managerId: z.string().uuid('Invalid manager ID').optional(),
  }),
});

// Update department schema
export const updateDepartmentSchema = z.object({
  body: z.object({
    name: z.string().min(2).optional(),
    code: z.string()
      .min(1)
      .max(50)
      .regex(/^[A-Z0-9-]+$/, 'Code can only contain uppercase letters, numbers, and hyphens')
      .optional(),
    description: z.string().optional(),
    managerId: z.string().uuid('Invalid manager ID').optional(),
    isActive: z.boolean().optional(),
  }),
  params: z.object({
    id: z.string().uuid('Invalid department ID'),
  }),
});

// Get department by ID schema
export const getDepartmentByIdSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid department ID'),
  }),
});

// Query parameters schema
export const getDepartmentsQuerySchema = z.object({
  query: z.object({
    page: z.string().regex(/^\d+$/).transform(Number).optional().default(1),
    limit: z.string().regex(/^\d+$/).transform(Number).optional().default(10),
    organizationId: z.string().uuid().optional(),
    search: z.string().optional(),
    isActive: z.string().transform((val) => val === 'true').optional(),
  }),
});

export type CreateDepartmentInput = z.infer<typeof createDepartmentSchema>['body'];
export type UpdateDepartmentInput = z.infer<typeof updateDepartmentSchema>['body'];
export type GetDepartmentsQuery = z.infer<typeof getDepartmentsQuerySchema>['query'];
