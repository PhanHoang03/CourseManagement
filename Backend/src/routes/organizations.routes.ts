import { Router } from 'express';
import organizationsController from '../controllers/organizations.controller';
import { authenticate } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/role.middleware';
import { validate } from '../middleware/validation.middleware';
import {
  createOrganizationSchema,
  updateOrganizationSchema,
  getOrganizationByIdSchema,
  getOrganizationsQuerySchema,
} from '../schemas/organization.schema';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Get all organizations (admin can see all, instructors can see their own org)
router.get(
  '/',
  validate(getOrganizationsQuerySchema),
  organizationsController.getAllOrganizations
);

// Get organization by ID
router.get(
  '/:id',
  validate(getOrganizationByIdSchema),
  organizationsController.getOrganizationById
);

// Create organization (admin only)
router.post(
  '/',
  requireRole('admin'),
  validate(createOrganizationSchema),
  organizationsController.createOrganization
);

// Update organization (admin only)
router.put(
  '/:id',
  requireRole('admin'),
  validate(updateOrganizationSchema),
  organizationsController.updateOrganization
);

// Delete organization (admin only)
router.delete(
  '/:id',
  requireRole('admin'),
  validate(getOrganizationByIdSchema),
  organizationsController.deleteOrganization
);

// Get organization statistics
router.get(
  '/:id/stats',
  validate(getOrganizationByIdSchema),
  organizationsController.getOrganizationStats
);

// Get organization settings
router.get(
  '/:id/settings',
  validate(getOrganizationByIdSchema),
  organizationsController.getOrganizationSettings
);

// Update organization settings
router.put(
  '/:id/settings',
  validate(getOrganizationByIdSchema),
  organizationsController.updateOrganizationSettings
);

export default router;
