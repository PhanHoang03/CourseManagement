import { Router } from 'express';
import departmentsController from '../controllers/departments.controller';
import { authenticate } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/role.middleware';
import { validate } from '../middleware/validation.middleware';
import {
  createDepartmentSchema,
  updateDepartmentSchema,
  getDepartmentByIdSchema,
  getDepartmentsQuerySchema,
} from '../schemas/department.schema';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Get all departments (admin, instructor can see all; filtered by org)
router.get(
  '/',
  validate(getDepartmentsQuerySchema),
  departmentsController.getAllDepartments
);

// Get department by ID
router.get(
  '/:id',
  validate(getDepartmentByIdSchema),
  departmentsController.getDepartmentById
);

// Create department (admin only)
router.post(
  '/',
  requireRole('admin'),
  validate(createDepartmentSchema),
  departmentsController.createDepartment
);

// Update department (admin only)
router.put(
  '/:id',
  requireRole('admin'),
  validate(updateDepartmentSchema),
  departmentsController.updateDepartment
);

// Delete department (admin only)
router.delete(
  '/:id',
  requireRole('admin'),
  validate(getDepartmentByIdSchema),
  departmentsController.deleteDepartment
);

// Get department users
router.get(
  '/:id/users',
  validate(getDepartmentByIdSchema),
  departmentsController.getDepartmentUsers
);

// Get department courses
router.get(
  '/:id/courses',
  validate(getDepartmentByIdSchema),
  departmentsController.getDepartmentCourses
);

export default router;
