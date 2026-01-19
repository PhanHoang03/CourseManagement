import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import departmentService from '../services/department.service';
import { CreateDepartmentInput, UpdateDepartmentInput, GetDepartmentsQuery } from '../schemas/department.schema';

class DepartmentsController {
  getAllDepartments = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized',
        });
      }

      const query = req.query as unknown as GetDepartmentsQuery;
      const result = await departmentService.getAllDepartments(
        query,
        req.user.role,
        req.user.organizationId
      );

      res.json({
        success: true,
        data: result.departments,
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  };

  getDepartmentById = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized',
        });
      }

      const { id } = req.params as { id: string };
      const department = await departmentService.getDepartmentById(
        id,
        req.user.role,
        req.user.organizationId
      );

      res.json({
        success: true,
        data: department,
      });
    } catch (error) {
      next(error);
    }
  };

  createDepartment = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized',
        });
      }

      const data = req.body as CreateDepartmentInput;
      const department = await departmentService.createDepartment(
        data,
        req.user.role,
        req.user.organizationId
      );

      res.status(201).json({
        success: true,
        message: 'Department created successfully',
        data: department,
      });
    } catch (error) {
      next(error);
    }
  };

  updateDepartment = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized',
        });
      }

      const { id } = req.params as { id: string };
      const data = req.body as UpdateDepartmentInput;
      const department = await departmentService.updateDepartment(
        id,
        data,
        req.user.role,
        req.user.organizationId
      );

      res.json({
        success: true,
        message: 'Department updated successfully',
        data: department,
      });
    } catch (error) {
      next(error);
    }
  };

  deleteDepartment = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized',
        });
      }

      const { id } = req.params as { id: string };
      const result = await departmentService.deleteDepartment(
        id,
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

  getDepartmentUsers = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized',
        });
      }

      const { id } = req.params as { id: string };
      const users = await departmentService.getDepartmentUsers(
        id,
        req.user.role,
        req.user.organizationId
      );

      res.json({
        success: true,
        data: users,
      });
    } catch (error) {
      next(error);
    }
  };

  getDepartmentCourses = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized',
        });
      }

      const { id } = req.params as { id: string };
      const courses = await departmentService.getDepartmentCourses(
        id,
        req.user.role,
        req.user.organizationId
      );

      res.json({
        success: true,
        data: courses,
      });
    } catch (error) {
      next(error);
    }
  };
}

export default new DepartmentsController();
