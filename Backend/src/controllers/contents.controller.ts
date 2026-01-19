import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import contentService from '../services/content.service';
import { CreateContentInput, UpdateContentInput, ReorderContentInput } from '../schemas/content.schema';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { BadRequestError } from '../utils/errors';

// Configure multer for content file uploads (videos, documents)
const contentStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Determine upload directory based on file type
    let uploadDir: string;
    if (file.mimetype.startsWith('video/')) {
      uploadDir = path.join(__dirname, '../../uploads/videos');
    } else if (file.mimetype.startsWith('application/pdf') || 
               file.mimetype.includes('document') || 
               file.mimetype.includes('presentation')) {
      uploadDir = path.join(__dirname, '../../uploads/documents');
    } else {
      uploadDir = path.join(__dirname, '../../uploads/files');
    }
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename: timestamp-random-originalname
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9]/g, '-');
    cb(null, `${uniqueSuffix}-${name}${ext}`);
  },
});

const contentUpload = multer({
  storage: contentStorage,
  limits: {
    fileSize: 500 * 1024 * 1024, // 500MB max file size
  },
  fileFilter: (req, file, cb) => {
    // Accept videos, documents, PDFs
    const allowedMimes = [
      'video/mp4', 'video/webm', 'video/ogg', 'video/quicktime',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    ];
    
    if (allowedMimes.includes(file.mimetype) || file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new BadRequestError(`File type ${file.mimetype} is not supported. Allowed types: videos, PDF, DOC, DOCX, PPT, PPTX`));
    }
  },
});

class ContentsController {
  getContentsByModule = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized',
        });
      }

      const { moduleId } = req.query as { moduleId: string };
      if (!moduleId) {
        return res.status(400).json({
          success: false,
          message: 'moduleId is required',
        });
      }

      const contents = await contentService.getContentsByModule(
        moduleId,
        req.user.role,
        req.user.organizationId
      );

      res.json({
        success: true,
        data: contents,
      });
    } catch (error) {
      next(error);
    }
  };

  getContentsByModulePath = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized',
        });
      }

      const { moduleId } = req.params as { moduleId: string };
      const contents = await contentService.getContentsByModule(
        moduleId,
        req.user.role,
        req.user.organizationId
      );

      res.json({
        success: true,
        data: contents,
      });
    } catch (error) {
      next(error);
    }
  };

  getContentById = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized',
        });
      }

      const { id } = req.params as { id: string };
      const content = await contentService.getContentById(
        id,
        req.user.role,
        req.user.organizationId
      );

      res.json({
        success: true,
        data: content,
      });
    } catch (error) {
      next(error);
    }
  };

  createContent = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized',
        });
      }

      const data = req.body as CreateContentInput;
      const content = await contentService.createContent(
        data,
        req.user.id,
        req.user.role,
        req.user.organizationId
      );

      res.status(201).json({
        success: true,
        message: 'Content created successfully',
        data: content,
      });
    } catch (error) {
      next(error);
    }
  };

  updateContent = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized',
        });
      }

      const { id } = req.params as { id: string };
      const data = req.body as UpdateContentInput;
      const content = await contentService.updateContent(
        id,
        data,
        req.user.id,
        req.user.role,
        req.user.organizationId
      );

      res.json({
        success: true,
        message: 'Content updated successfully',
        data: content,
      });
    } catch (error) {
      next(error);
    }
  };

  deleteContent = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized',
        });
      }

      const { id } = req.params as { id: string };
      const result = await contentService.deleteContent(
        id,
        req.user.id,
        req.user.role,
        req.user.organizationId
      );

      res.json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      next(error);
    }
  };

  reorderContent = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized',
        });
      }

      const { moduleId } = req.params as { moduleId: string };
      const data = req.body as ReorderContentInput;
      const contents = await contentService.reorderContent(
        moduleId,
        data,
        req.user.id,
        req.user.role,
        req.user.organizationId
      );

      res.json({
        success: true,
        message: 'Content reordered successfully',
        data: contents,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Upload file (video or document) for content
   * Returns permanent URL that can be stored in database
   */
  uploadFile = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized',
        });
      }

      if (!req.file) {
        throw new BadRequestError('No file uploaded');
      }

      // Generate permanent URL
      // File is stored in: /uploads/videos/ or /uploads/documents/
      // Accessible via: http://localhost:5000/uploads/videos/filename.mp4
      const filePath = req.file.path;
      const relativePath = filePath.replace(path.join(__dirname, '../../'), '');
      
      // Return URL that will work with static file serving
      // Convert backslashes to forward slashes for URL (Windows compatibility)
      const urlPath = relativePath.replace(/\\/g, '/');
      const baseUrl = process.env.BACKEND_URL || 'http://localhost:5000';
      const fileUrl = `${baseUrl}/${urlPath}`;

      res.json({
        success: true,
        message: 'File uploaded successfully',
        data: {
          url: fileUrl,
          path: `/${urlPath}`, // Relative path: /uploads/videos/filename.mp4
          filename: req.file.filename,
          originalName: req.file.originalname,
          mimetype: req.file.mimetype,
          size: req.file.size,
        },
      });
    } catch (error) {
      // Clean up uploaded file on error
      if (req.file) {
        try {
          fs.unlinkSync(req.file.path);
        } catch (unlinkError) {
          console.error('Failed to delete uploaded file:', unlinkError);
        }
      }
      next(error);
    }
  };
}

export default new ContentsController();

// Export multer middleware for use in routes
export { contentUpload };
