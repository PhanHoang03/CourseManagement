import { z } from 'zod';

// Create organization schema
export const createOrganizationSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Organization name must be at least 2 characters'),
    slug: z.string()
      .min(2, 'Slug must be at least 2 characters')
      .regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens'),
    domain: z.string().optional(),
    logoUrl: z.string().url().optional(),
    settings: z.record(z.string(), z.any()).optional(),
    subscriptionTier: z.enum(['free', 'basic', 'premium', 'enterprise']).default('free'),
  }),
});

// Update organization schema
export const updateOrganizationSchema = z.object({
  body: z.object({
    name: z.string().min(2).optional(),
    slug: z.string()
      .min(2)
      .regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens')
      .optional(),
    domain: z.string().optional(),
    logoUrl: z.string().url().optional(),
    settings: z.record(z.string(), z.any()).optional(),
    subscriptionTier: z.enum(['free', 'basic', 'premium', 'enterprise']).optional(),
    isActive: z.boolean().optional(),
  }),
  params: z.object({
    id: z.string().uuid('Invalid organization ID'),
  }),
});

// Get organization by ID schema
export const getOrganizationByIdSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid organization ID'),
  }),
});

// Query parameters schema
export const getOrganizationsQuerySchema = z.object({
  query: z.object({
    page: z.string().regex(/^\d+$/).transform(Number).optional().default(1),
    limit: z.string().regex(/^\d+$/).transform(Number).optional().default(10),
    search: z.string().optional(),
    isActive: z.string().transform((val) => val === 'true').optional(),
    subscriptionTier: z.enum(['free', 'basic', 'premium', 'enterprise']).optional(),
  }),
});

export type CreateOrganizationInput = z.infer<typeof createOrganizationSchema>['body'];
export type UpdateOrganizationInput = z.infer<typeof updateOrganizationSchema>['body'];
export type GetOrganizationsQuery = z.infer<typeof getOrganizationsQuerySchema>['query'];
