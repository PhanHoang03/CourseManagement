import { Router } from 'express';
import contentsController, { contentUpload } from '../controllers/contents.controller';
import { authenticate } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/role.middleware';
import { validate } from '../middleware/validation.middleware';
import {
  createContentSchema,
  updateContentSchema,
  getContentByIdSchema,
  getContentsQuerySchema,
  reorderContentSchema,
  getContentsByModuleSchema,
} from '../schemas/content.schema';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Get contents by module (path parameter - RESTful)
router.get(
  '/modules/:moduleId',
  validate(getContentsByModuleSchema),
  contentsController.getContentsByModulePath
);

// Get content by ID
router.get(
  '/:id',
  validate(getContentByIdSchema),
  contentsController.getContentById
);

// Create content (admin, instructor)
router.post(
  '/',
  requireRole('admin', 'instructor'),
  validate(createContentSchema),
  contentsController.createContent
);

// Update content (admin, instructor - own courses)
router.put(
  '/:id',
  requireRole('admin', 'instructor'),
  validate(updateContentSchema),
  contentsController.updateContent
);

// Delete content (admin, instructor - own courses)
router.delete(
  '/:id',
  requireRole('admin', 'instructor'),
  validate(getContentByIdSchema),
  contentsController.deleteContent
);

// Reorder content
router.put(
  '/modules/:moduleId/reorder',
  requireRole('admin', 'instructor'),
  validate(reorderContentSchema),
  contentsController.reorderContent
);

// Upload file for content (videos, documents)
// This endpoint uploads files and returns permanent URLs
router.post(
  '/upload',
  requireRole('admin', 'instructor'),
  contentUpload.single('file'),
  contentsController.uploadFile
);

export default router;
