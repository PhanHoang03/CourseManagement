import { Request, Response, NextFunction } from 'express';
import assessmentService from '../services/assessment.service';
import { AppError } from '../utils/errors';

export default {
  // Assessment CRUD
  async getAllAssessments(req: Request, res: Response, next: NextFunction) {
    try {
      const requestingUserId = (req as any).user.id;
      const requestingUserRole = (req as any).user.role;
      const requestingUserOrgId = (req as any).user.organizationId;

      const result = await assessmentService.getAllAssessments(
        req.query as any,
        requestingUserId,
        requestingUserRole,
        requestingUserOrgId
      );

      res.json({
        success: true,
        data: result.data,
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  },

  async getAssessmentById(req: Request, res: Response, next: NextFunction) {
    try {
      const requestingUserId = (req as any).user.id;
      const requestingUserRole = (req as any).user.role;
      const requestingUserOrgId = (req as any).user.organizationId;

      const assessment = await assessmentService.getAssessmentById(
        req.params.id as string,
        requestingUserId,
        requestingUserRole,
        requestingUserOrgId
      );

      res.json({
        success: true,
        data: assessment,
      });
    } catch (error) {
      next(error);
    }
  },

  async createAssessment(req: Request, res: Response, next: NextFunction) {
    try {
      const requestingUserId = (req as any).user.id;
      const requestingUserRole = (req as any).user.role;
      const requestingUserOrgId = (req as any).user.organizationId;

      const assessment = await assessmentService.createAssessment(
        req.body,
        requestingUserId,
        requestingUserRole,
        requestingUserOrgId
      );

      res.status(201).json({
        success: true,
        data: assessment,
      });
    } catch (error) {
      next(error);
    }
  },

  async updateAssessment(req: Request, res: Response, next: NextFunction) {
    try {
      const requestingUserId = (req as any).user.id;
      const requestingUserRole = (req as any).user.role;
      const requestingUserOrgId = (req as any).user.organizationId;

      const assessment = await assessmentService.updateAssessment(
        req.params.id as string,
        req.body,
        requestingUserId,
        requestingUserRole,
        requestingUserOrgId
      );

      res.json({
        success: true,
        data: assessment,
      });
    } catch (error) {
      next(error);
    }
  },

  async deleteAssessment(req: Request, res: Response, next: NextFunction) {
    try {
      const requestingUserId = (req as any).user.id;
      const requestingUserRole = (req as any).user.role;
      const requestingUserOrgId = (req as any).user.organizationId;

      await assessmentService.deleteAssessment(
        req.params.id as string,
        requestingUserId,
        requestingUserRole,
        requestingUserOrgId
      );

      res.json({
        success: true,
        message: 'Assessment deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  },

  // Assessment submission
  async submitAssessment(req: Request, res: Response, next: NextFunction) {
    try {
      const requestingUserId = (req as any).user.id;
      const requestingUserRole = (req as any).user.role;

      const attempt = await assessmentService.submitAssessment(
        req.body,
        requestingUserId,
        requestingUserRole
      );

      res.status(201).json({
        success: true,
        data: attempt,
      });
    } catch (error) {
      next(error);
    }
  },

  // Get attempts
  async getAttempts(req: Request, res: Response, next: NextFunction) {
    try {
      const requestingUserId = (req as any).user.id;
      const requestingUserRole = (req as any).user.role;
      const requestingUserOrgId = (req as any).user.organizationId;

      const result = await assessmentService.getAttempts(
        req.query as any,
        requestingUserId,
        requestingUserRole,
        requestingUserOrgId
      );

      res.json({
        success: true,
        data: result.data,
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  },

  async getAttemptById(req: Request, res: Response, next: NextFunction) {
    try {
      const requestingUserId = (req as any).user.id;
      const requestingUserRole = (req as any).user.role;
      const requestingUserOrgId = (req as any).user.organizationId;

      const attempt = await assessmentService.getAttemptById(
        req.params.id as string,
        requestingUserId,
        requestingUserRole,
        requestingUserOrgId
      );

      res.json({
        success: true,
        data: attempt,
      });
    } catch (error) {
      next(error);
    }
  },
};
