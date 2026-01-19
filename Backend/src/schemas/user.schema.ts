import { z } from 'zod';

// Create user schema
export const createUserSchema = z.object({
  body: z.object({
    username: z
      .string()
      .min(3, 'Username must be at least 3 characters')
      .max(20, 'Username must be at most 20 characters')
      .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
    email: z.string().email('Invalid email address'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number'),
    firstName: z.string().min(2, 'First name is required'),
    lastName: z.string().min(2, 'Last name is required'),
    phone: z.string().optional(),
    address: z.string().optional(),
    role: z.enum(['admin', 'instructor', 'trainee']),
    organizationId: z.string().uuid().optional(),
    departmentId: z.string().uuid().optional(),
    employeeId: z.string().optional(),
    position: z.string().optional(),
    bio: z.string().optional(),
    expertise: z.array(z.string()).optional(),
    photoUrl: z.string().url().optional(),
  }),
});

// Update user schema
export const updateUserSchema = z.object({
  body: z.object({
    firstName: z.string().min(2).optional(),
    lastName: z.string().min(2).optional(),
    phone: z.string().optional(),
    address: z.string().optional(),
    role: z.enum(['admin', 'instructor', 'trainee']).optional(),
    organizationId: z.string().uuid().optional(),
    departmentId: z.string().uuid().optional(),
    position: z.string().optional(),
    bio: z.string().optional(),
    expertise: z.array(z.string()).optional(),
    photoUrl: z.string().url().optional(),
  }),
  params: z.object({
    id: z.string().uuid('Invalid user ID'),
  }),
});

// Get user by ID schema
export const getUserByIdSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid user ID'),
  }),
});

// Query parameters schema
export const getUsersQuerySchema = z.object({
  query: z.object({
    page: z.string().regex(/^\d+$/).transform(Number).optional().default(1),
    limit: z.string().regex(/^\d+$/).transform(Number).optional().default(10),
    role: z.enum(['admin', 'instructor', 'trainee']).optional(),
    organizationId: z.string().uuid().optional(),
    departmentId: z.string().uuid().optional(),
    search: z.string().optional(),
    isActive: z.string().transform((val) => val === 'true').optional(),
  }),
});

// Activate/Deactivate user schema
export const toggleUserStatusSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid user ID'),
  }),
});

export type CreateUserInput = z.infer<typeof createUserSchema>['body'];
export type UpdateUserInput = z.infer<typeof updateUserSchema>['body'];
export type GetUsersQuery = z.infer<typeof getUsersQuerySchema>['query'];
