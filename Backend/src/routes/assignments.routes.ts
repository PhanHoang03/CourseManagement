import { Router } from 'express';
import assignmentsController from '../controllers/assignments.controller';
import { authenticate } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/role.middleware';
import { validate } from '../middleware/validation.middleware';
import {
  createAssignmentSchema,
  updateAssignmentSchema,
  getAssignmentByIdSchema,
  getAssignmentsQuerySchema,
  submitAssignmentSchema,
  gradeAssignmentSchema,
  getSubmissionByIdSchema,
  getSubmissionsQuerySchema,
} from '../schemas/assignment.schema';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Submission routes (must be before /:id routes)
router.post(
  '/submissions',
  requireRole('trainee'),
  validate(submitAssignmentSchema),
  assignmentsController.submitAssignment
);

router.get(
  '/submissions',
  validate(getSubmissionsQuerySchema),
  assignmentsController.getAllSubmissions
);

router.get(
  '/submissions/:id',
  validate(getSubmissionByIdSchema),
  assignmentsController.getSubmissionById
);

router.put(
  '/submissions/:id/grade',
  requireRole('admin', 'instructor'),
  validate(gradeAssignmentSchema),
  assignmentsController.gradeAssignment
);

// Assignment CRUD routes
router.get(
  '/',
  validate(getAssignmentsQuerySchema),
  assignmentsController.getAllAssignments
);

router.get(
  '/:id',
  validate(getAssignmentByIdSchema),
  assignmentsController.getAssignmentById
);

router.post(
  '/',
  requireRole('admin', 'instructor'),
  validate(createAssignmentSchema),
  assignmentsController.createAssignment
);

router.put(
  '/:id',
  requireRole('admin', 'instructor'),
  validate(updateAssignmentSchema),
  assignmentsController.updateAssignment
);

router.delete(
  '/:id',
  requireRole('admin', 'instructor'),
  validate(getAssignmentByIdSchema),
  assignmentsController.deleteAssignment
);

export default router;
