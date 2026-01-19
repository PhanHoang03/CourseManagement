import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import moduleService from '../services/module.service';
import { CreateModuleInput, UpdateModuleInput, ReorderModulesInput } from '../schemas/module.schema';

class ModulesController {
  getModulesByCourse = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized',
        });
      }

      const { courseId } = req.query as { courseId: string };
      if (!courseId) {
        return res.status(400).json({
          success: false,
          message: 'courseId is required',
        });
      }

      const modules = await moduleService.getModulesByCourse(
        courseId,
        req.user.role,
        req.user.organizationId
      );

      res.json({
        success: true,
        data: modules,
      });
    } catch (error) {
      next(error);
    }
  };

  getModuleById = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized',
        });
      }

      const { id } = req.params as { id: string };
      const module = await moduleService.getModuleById(
        id,
        req.user.role,
        req.user.organizationId
      );

      res.json({
        success: true,
        data: module,
      });
    } catch (error) {
      next(error);
    }
  };

  createModule = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized',
        });
      }

      const data = req.body as CreateModuleInput;
      const module = await moduleService.createModule(
        data,
        req.user.id,
        req.user.role,
        req.user.organizationId
      );

      res.status(201).json({
        success: true,
        message: 'Module created successfully',
        data: module,
      });
    } catch (error) {
      next(error);
    }
  };

  updateModule = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized',
        });
      }

      const { id } = req.params as { id: string };
      const data = req.body as UpdateModuleInput;
      const module = await moduleService.updateModule(
        id,
        data,
        req.user.id,
        req.user.role,
        req.user.organizationId
      );

      res.json({
        success: true,
        message: 'Module updated successfully',
        data: module,
      });
    } catch (error) {
      next(error);
    }
  };

  deleteModule = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized',
        });
      }

      const { id } = req.params as { id: string };
      const result = await moduleService.deleteModule(
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

  reorderModules = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized',
        });
      }

      const { courseId } = req.params as { courseId: string };
      const data = req.body as ReorderModulesInput;
      const modules = await moduleService.reorderModules(
        courseId,
        data,
        req.user.id,
        req.user.role,
        req.user.organizationId
      );

      res.json({
        success: true,
        message: 'Modules reordered successfully',
        data: modules,
      });
    } catch (error) {
      next(error);
    }
  };
}

export default new ModulesController();
