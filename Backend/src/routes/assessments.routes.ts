import { Router } from 'express';
import assessmentsController from '../controllers/assessments.controller';
import { authenticate } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/role.middleware';
import { validate } from '../middleware/validation.middleware';
import {
  createAssessmentSchema,
  updateAssessmentSchema,
  getAssessmentByIdSchema,
  getAssessmentsQueryValidationSchema,
  submitAssessmentSchema,
  getAttemptsQueryValidationSchema,
  getAttemptByIdSchema,
} from '../schemas/assessment.schema';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Submission routes (must be before /:id routes)
router.post(
  '/submit',
  requireRole('trainee'),
  validate(submitAssessmentSchema),
  assessmentsController.submitAssessment
);

router.get(
  '/attempts',
  validate(getAttemptsQueryValidationSchema),
  assessmentsController.getAttempts
);

router.get(
  '/attempts/:id',
  validate(getAttemptByIdSchema),
  assessmentsController.getAttemptById
);

// Assessment CRUD routes
router.get(
  '/',
  validate(getAssessmentsQueryValidationSchema),
  assessmentsController.getAllAssessments
);

router.get(
  '/:id',
  validate(getAssessmentByIdSchema),
  assessmentsController.getAssessmentById
);

router.post(
  '/',
  requireRole('admin', 'instructor'),
  validate(createAssessmentSchema),
  assessmentsController.createAssessment
);

router.put(
  '/:id',
  requireRole('admin', 'instructor'),
  validate(updateAssessmentSchema),
  assessmentsController.updateAssessment
);

router.delete(
  '/:id',
  requireRole('admin', 'instructor'),
  validate(getAssessmentByIdSchema),
  assessmentsController.deleteAssessment
);

export default router;
