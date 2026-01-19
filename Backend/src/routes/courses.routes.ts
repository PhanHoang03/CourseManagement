import { Router } from 'express';
import coursesController from '../controllers/courses.controller';
import { authenticate } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/role.middleware';
import { validate } from '../middleware/validation.middleware';
import {
  createCourseSchema,
  updateCourseSchema,
  getCourseByIdSchema,
  getCoursesQuerySchema,
  publishCourseSchema,
  addPrerequisiteSchema,
  removePrerequisiteSchema,
  enrollCourseSchema,
} from '../schemas/course.schema';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Get all courses (with filters)
router.get(
  '/',
  validate(getCoursesQuerySchema),
  coursesController.getAllCourses
);

// Get public courses (only published, public courses)
router.get(
  '/public',
  validate(getCoursesQuerySchema),
  coursesController.getPublicCourses
);

// Get course by ID
router.get(
  '/:id',
  validate(getCourseByIdSchema),
  coursesController.getCourseById
);

// Create course (admin, instructor)
router.post(
  '/',
  requireRole('admin', 'instructor'),
  validate(createCourseSchema),
  coursesController.createCourse
);

// Update course (admin, instructor - own courses)
router.put(
  '/:id',
  requireRole('admin', 'instructor'),
  validate(updateCourseSchema),
  coursesController.updateCourse
);

// Delete course (admin, instructor - own courses)
router.delete(
  '/:id',
  requireRole('admin', 'instructor'),
  validate(getCourseByIdSchema),
  coursesController.deleteCourse
);

// Publish course
router.put(
  '/:id/publish',
  requireRole('admin', 'instructor'),
  validate(publishCourseSchema),
  coursesController.publishCourse
);

// Unpublish course
router.put(
  '/:id/unpublish',
  requireRole('admin', 'instructor'),
  validate(publishCourseSchema),
  coursesController.unpublishCourse
);

// Get course modules
router.get(
  '/:id/modules',
  validate(getCourseByIdSchema),
  coursesController.getCourseModules
);

// Get course enrollments (instructor, admin)
router.get(
  '/:id/enrollments',
  requireRole('admin', 'instructor'),
  validate(getCourseByIdSchema),
  coursesController.getCourseEnrollments
);

// Get course statistics (instructor, admin)
router.get(
  '/:id/stats',
  requireRole('admin', 'instructor'),
  validate(getCourseByIdSchema),
  coursesController.getCourseStats
);

// Get course prerequisites
router.get(
  '/:id/prerequisites',
  validate(getCourseByIdSchema),
  coursesController.getCoursePrerequisites
);

// Add prerequisite
router.post(
  '/:id/prerequisites',
  requireRole('admin', 'instructor'),
  validate(addPrerequisiteSchema),
  coursesController.addPrerequisite
);

// Remove prerequisite
router.delete(
  '/:id/prerequisites/:prerequisiteId',
  requireRole('admin', 'instructor'),
  validate(removePrerequisiteSchema),
  coursesController.removePrerequisite
);

// Enroll in course (trainee)
router.post(
  '/:id/enroll',
  validate(enrollCourseSchema),
  coursesController.enrollInCourse
);

// Unenroll from course (trainee)
router.post(
  '/:id/unenroll',
  validate(getCourseByIdSchema),
  coursesController.unenrollFromCourse
);

export default router;
