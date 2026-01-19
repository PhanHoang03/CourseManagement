import { Router } from 'express';
import usersController from '../controllers/users.controller';
import { authenticate } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/role.middleware';
import { validate } from '../middleware/validation.middleware';
import {
  createUserSchema,
  updateUserSchema,
  getUserByIdSchema,
  getUsersQuerySchema,
  toggleUserStatusSchema,
} from '../schemas/user.schema';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Get all users (admin, instructor can see all; trainees see limited)
router.get(
  '/',
  validate(getUsersQuerySchema),
  usersController.getAllUsers
);

// Get user by ID
router.get(
  '/:id',
  validate(getUserByIdSchema),
  usersController.getUserById
);

// Create user (admin only)
router.post(
  '/',
  requireRole('admin'),
  validate(createUserSchema),
  usersController.createUser
);

// Update user (admin can update anyone; users can update themselves)
router.put(
  '/:id',
  validate(updateUserSchema),
  usersController.updateUser
);

// Delete user (admin only)
router.delete(
  '/:id',
  requireRole('admin'),
  validate(getUserByIdSchema),
  usersController.deleteUser
);

// Activate user (admin only)
router.put(
  '/:id/activate',
  requireRole('admin'),
  validate(toggleUserStatusSchema),
  usersController.activateUser
);

// Deactivate user (admin only)
router.put(
  '/:id/deactivate',
  requireRole('admin'),
  validate(toggleUserStatusSchema),
  usersController.deactivateUser
);

// Get user's courses
router.get(
  '/:id/courses',
  validate(getUserByIdSchema),
  usersController.getUserCourses
);

// Get user's progress
router.get(
  '/:id/progress',
  validate(getUserByIdSchema),
  usersController.getUserProgress
);

// Get user's certificates
router.get(
  '/:id/certificates',
  validate(getUserByIdSchema),
  usersController.getUserCertificates
);

export default router;
