import { Router } from 'express';
import progressController from '../controllers/progress.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validation.middleware';
import {
  updateProgressSchema,
  getProgressSchema,
  completeContentSchema,
  getUserCourseProgressSchema,
} from '../schemas/progress.schema';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Get progress for enrollment
router.get(
  '/enrollment/:enrollmentId',
  validate(getProgressSchema),
  progressController.getProgress
);

// Update progress
router.put(
  '/',
  validate(updateProgressSchema),
  progressController.updateProgress
);

// Complete content
router.post(
  '/complete-content',
  validate(completeContentSchema),
  progressController.completeContent
);

// Get user's progress in a course
router.get(
  '/course/:courseId',
  validate(getUserCourseProgressSchema),
  progressController.getUserCourseProgress
);

export default router;
