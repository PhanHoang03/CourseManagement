import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import progressService from '../services/progress.service';
import { UpdateProgressInput, CompleteContentInput } from '../schemas/progress.schema';

class ProgressController {
  getProgress = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized',
        });
      }

      const { enrollmentId } = req.params as { enrollmentId: string };
      const { moduleId, contentId } = req.query as { moduleId?: string; contentId?: string };
      
      const progress = await progressService.getProgress(
        enrollmentId,
        moduleId,
        contentId,
        req.user.role,
        req.user.id,
        req.user.organizationId
      );

      res.json({
        success: true,
        data: progress,
      });
    } catch (error) {
      next(error);
    }
  };

  updateProgress = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized',
        });
      }

      const data = req.body as UpdateProgressInput;
      const progress = await progressService.updateProgress(
        data,
        req.user.id,
        req.user.role,
        req.user.organizationId
      );

      res.json({
        success: true,
        message: 'Progress updated successfully',
        data: progress,
      });
    } catch (error) {
      next(error);
    }
  };

  completeContent = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized',
        });
      }

      const data = req.body as CompleteContentInput;
      const progress = await progressService.completeContent(
        data,
        req.user.id,
        req.user.role,
        req.user.organizationId
      );

      res.json({
        success: true,
        message: 'Content completed successfully',
        data: progress,
      });
    } catch (error) {
      next(error);
    }
  };

  getUserCourseProgress = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized',
        });
      }

      const { courseId } = req.params as { courseId: string };
      const progress = await progressService.getUserCourseProgress(
        courseId,
        req.user.id,
        req.user.role,
        req.user.organizationId
      );

      res.json({
        success: true,
        data: progress,
      });
    } catch (error) {
      next(error);
    }
  };
}

export default new ProgressController();
