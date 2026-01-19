import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import enrollmentService from '../services/enrollment.service';
import { CreateEnrollmentInput, UpdateEnrollmentInput, GetEnrollmentsQuery } from '../schemas/enrollment.schema';

class EnrollmentsController {
  getAllEnrollments = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized',
        });
      }

      const query = req.query as unknown as GetEnrollmentsQuery;
      const result = await enrollmentService.getAllEnrollments(
        query,
        req.user.role,
        req.user.id,
        req.user.organizationId
      );

      res.json({
        success: true,
        data: result.enrollments,
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  };

  getEnrollmentById = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized',
        });
      }

      const { id } = req.params as { id: string };
      const enrollment = await enrollmentService.getEnrollmentById(
        id,
        req.user.role,
        req.user.id,
        req.user.organizationId
      );

      res.json({
        success: true,
        data: enrollment,
      });
    } catch (error) {
      next(error);
    }
  };

  createEnrollment = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized',
        });
      }

      const data = req.body as CreateEnrollmentInput;
      const enrollment = await enrollmentService.createEnrollment(
        data,
        req.user.id,
        req.user.role,
        req.user.organizationId
      );

      res.status(201).json({
        success: true,
        message: 'Enrollment created successfully',
        data: enrollment,
      });
    } catch (error) {
      next(error);
    }
  };

  updateEnrollment = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized',
        });
      }

      const { id } = req.params as { id: string };
      const data = req.body as UpdateEnrollmentInput;
      const enrollment = await enrollmentService.updateEnrollment(
        id,
        data,
        req.user.role,
        req.user.id,
        req.user.organizationId
      );

      res.json({
        success: true,
        message: 'Enrollment updated successfully',
        data: enrollment,
      });
    } catch (error) {
      next(error);
    }
  };

  completeEnrollment = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized',
        });
      }

      const { id } = req.params as { id: string };
      const enrollment = await enrollmentService.completeEnrollment(
        id,
        req.user.role,
        req.user.id,
        req.user.organizationId
      );

      res.json({
        success: true,
        message: 'Enrollment completed successfully',
        data: enrollment,
      });
    } catch (error) {
      next(error);
    }
  };

  dropEnrollment = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized',
        });
      }

      const { id } = req.params as { id: string };
      const result = await enrollmentService.dropEnrollment(
        id,
        req.user.role,
        req.user.id,
        req.user.organizationId
      );

      res.json({
        success: true,
        message: 'Enrollment dropped successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  calculateProgress = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized',
        });
      }

      const { id } = req.params as { id: string };
      const progress = await enrollmentService.calculateEnrollmentProgress(id);

      res.json({
        success: true,
        data: progress,
      });
    } catch (error) {
      next(error);
    }
  };
}

export default new EnrollmentsController();
