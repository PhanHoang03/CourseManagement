import { Request, Response, NextFunction } from 'express';
import assignmentService from '../services/assignment.service';
import { AppError } from '../utils/errors';

export default {
  // Assignment CRUD
  async getAllAssignments(req: Request, res: Response, next: NextFunction) {
    try {
      const requestingUserId = (req as any).user.id;
      const requestingUserRole = (req as any).user.role;
      const requestingUserOrgId = (req as any).user.organizationId;

      const result = await assignmentService.getAllAssignments(
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

  async getAssignmentById(req: Request, res: Response, next: NextFunction) {
    try {
      const requestingUserId = (req as any).user.id;
      const requestingUserRole = (req as any).user.role;
      const requestingUserOrgId = (req as any).user.organizationId;

      const assignment = await assignmentService.getAssignmentById(
        req.params.id as string,
        requestingUserId,
        requestingUserRole,
        requestingUserOrgId
      );

      res.json({
        success: true,
        data: assignment,
      });
    } catch (error) {
      next(error);
    }
  },

  async createAssignment(req: Request, res: Response, next: NextFunction) {
    try {
      const requestingUserId = (req as any).user.id;
      const requestingUserRole = (req as any).user.role;
      const requestingUserOrgId = (req as any).user.organizationId;

      const assignment = await assignmentService.createAssignment(
        req.body,
        requestingUserId,
        requestingUserRole,
        requestingUserOrgId
      );

      res.status(201).json({
        success: true,
        data: assignment,
      });
    } catch (error) {
      next(error);
    }
  },

  async updateAssignment(req: Request, res: Response, next: NextFunction) {
    try {
      const requestingUserId = (req as any).user.id;
      const requestingUserRole = (req as any).user.role;
      const requestingUserOrgId = (req as any).user.organizationId;

      const assignment = await assignmentService.updateAssignment(
        req.params.id as string,
        req.body,
        requestingUserId,
        requestingUserRole,
        requestingUserOrgId
      );

      res.json({
        success: true,
        data: assignment,
      });
    } catch (error) {
      next(error);
    }
  },

  async deleteAssignment(req: Request, res: Response, next: NextFunction) {
    try {
      const requestingUserId = (req as any).user.id;
      const requestingUserRole = (req as any).user.role;
      const requestingUserOrgId = (req as any).user.organizationId;

      await assignmentService.deleteAssignment(
        req.params.id as string,
        requestingUserId,
        requestingUserRole,
        requestingUserOrgId
      );

      res.json({
        success: true,
        message: 'Assignment deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  },

  // Submission methods
  async submitAssignment(req: Request, res: Response, next: NextFunction) {
    try {
      const requestingUserId = (req as any).user.id;
      const requestingUserRole = (req as any).user.role;

      const submission = await assignmentService.submitAssignment(
        req.body,
        requestingUserId,
        requestingUserRole
      );

      res.status(201).json({
        success: true,
        data: submission,
      });
    } catch (error) {
      next(error);
    }
  },

  async getAllSubmissions(req: Request, res: Response, next: NextFunction) {
    try {
      const requestingUserId = (req as any).user.id;
      const requestingUserRole = (req as any).user.role;
      const requestingUserOrgId = (req as any).user.organizationId;

      const result = await assignmentService.getAllSubmissions(
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

  async getSubmissionById(req: Request, res: Response, next: NextFunction) {
    try {
      const requestingUserId = (req as any).user.id;
      const requestingUserRole = (req as any).user.role;
      const requestingUserOrgId = (req as any).user.organizationId;

      const submission = await assignmentService.getSubmissionById(
        req.params.id as string,
        requestingUserId,
        requestingUserRole,
        requestingUserOrgId
      );

      res.json({
        success: true,
        data: submission,
      });
    } catch (error) {
      next(error);
    }
  },

  async gradeAssignment(req: Request, res: Response, next: NextFunction) {
    try {
      const requestingUserId = (req as any).user.id;
      const requestingUserRole = (req as any).user.role;
      const requestingUserOrgId = (req as any).user.organizationId;

      const submission = await assignmentService.gradeAssignment(
        req.params.id as string,
        req.body,
        requestingUserId,
        requestingUserRole,
        requestingUserOrgId
      );

      res.json({
        success: true,
        data: submission,
      });
    } catch (error) {
      next(error);
    }
  },
};
