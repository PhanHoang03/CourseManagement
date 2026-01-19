import { Router } from 'express';
import modulesController from '../controllers/modules.controller';
import { authenticate } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/role.middleware';
import { validate } from '../middleware/validation.middleware';
import {
  createModuleSchema,
  updateModuleSchema,
  getModuleByIdSchema,
  getModulesQuerySchema,
  reorderModulesSchema,
} from '../schemas/module.schema';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Get modules by course
router.get(
  '/',
  validate(getModulesQuerySchema),
  modulesController.getModulesByCourse
);

// Get module by ID
router.get(
  '/:id',
  validate(getModuleByIdSchema),
  modulesController.getModuleById
);

// Create module (admin, instructor)
router.post(
  '/',
  requireRole('admin', 'instructor'),
  validate(createModuleSchema),
  modulesController.createModule
);

// Update module (admin, instructor - own courses)
router.put(
  '/:id',
  requireRole('admin', 'instructor'),
  validate(updateModuleSchema),
  modulesController.updateModule
);

// Delete module (admin, instructor - own courses)
router.delete(
  '/:id',
  requireRole('admin', 'instructor'),
  validate(getModuleByIdSchema),
  modulesController.deleteModule
);

// Reorder modules
router.put(
  '/course/:courseId/reorder',
  requireRole('admin', 'instructor'),
  validate(reorderModulesSchema),
  modulesController.reorderModules
);

export default router;
