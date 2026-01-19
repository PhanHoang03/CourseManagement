import { Router } from 'express';
import enrollmentsController from '../controllers/enrollments.controller';
import { authenticate } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/role.middleware';
import { validate } from '../middleware/validation.middleware';
import {
  createEnrollmentSchema,
  updateEnrollmentSchema,
  getEnrollmentByIdSchema,
  getEnrollmentsQuerySchema,
  completeEnrollmentSchema,
  dropEnrollmentSchema,
} from '../schemas/enrollment.schema';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Get all enrollments
router.get(
  '/',
  validate(getEnrollmentsQuerySchema),
  enrollmentsController.getAllEnrollments
);

// Get enrollment by ID
router.get(
  '/:id',
  validate(getEnrollmentByIdSchema),
  enrollmentsController.getEnrollmentById
);

// Create enrollment (admin, instructor)
router.post(
  '/',
  requireRole('admin', 'instructor'),
  validate(createEnrollmentSchema),
  enrollmentsController.createEnrollment
);

// Update enrollment
router.put(
  '/:id',
  validate(updateEnrollmentSchema),
  enrollmentsController.updateEnrollment
);

// Complete enrollment
router.put(
  '/:id/complete',
  validate(completeEnrollmentSchema),
  enrollmentsController.completeEnrollment
);

// Drop enrollment
router.put(
  '/:id/drop',
  validate(dropEnrollmentSchema),
  enrollmentsController.dropEnrollment
);

// Calculate enrollment progress
router.post(
  '/:id/calculate-progress',
  validate(getEnrollmentByIdSchema),
  enrollmentsController.calculateProgress
);

export default router;
