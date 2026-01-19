import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import userService from '../services/user.service';
import { CreateUserInput, UpdateUserInput, GetUsersQuery } from '../schemas/user.schema';

class UsersController {
  getAllUsers = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized',
        });
      }

      const query = req.query as unknown as GetUsersQuery;
      const result = await userService.getAllUsers(
        query,
        req.user.id,
        req.user.role
      );

      res.json({
        success: true,
        data: result.users,
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  };

  getUserById = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized',
        });
      }

      const { id } = req.params as { id: string };
      const user = await userService.getUserById(id, req.user.id, req.user.role);

      res.json({
        success: true,
        data: user,
      });
    } catch (error) {
      next(error);
    }
  };

  createUser = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized',
        });
      }

      const data = req.body as CreateUserInput;
      const user = await userService.createUser(data, req.user.role);

      res.status(201).json({
        success: true,
        message: 'User created successfully',
        data: user,
      });
    } catch (error) {
      next(error);
    }
  };

  updateUser = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized',
        });
      }

      const { id } = req.params as { id: string };
      const data = req.body as UpdateUserInput;
      const user = await userService.updateUser(id, data, req.user.id, req.user.role);

      res.json({
        success: true,
        message: 'User updated successfully',
        data: user,
      });
    } catch (error) {
      next(error);
    }
  };

  deleteUser = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized',
        });
      }

      const { id } = req.params as { id: string };
      const result = await userService.deleteUser(id, req.user.id, req.user.role);

      res.json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      next(error);
    }
  };

  activateUser = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized',
        });
      }

      const { id } = req.params as { id: string };
      const user = await userService.activateUser(id, req.user.role);

      res.json({
        success: true,
        message: 'User activated successfully',
        data: user,
      });
    } catch (error) {
      next(error);
    }
  };

  deactivateUser = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized',
        });
      }

      const { id } = req.params as { id: string };
      const user = await userService.deactivateUser(id, req.user.id, req.user.role);

      res.json({
        success: true,
        message: 'User deactivated successfully',
        data: user,
      });
    } catch (error) {
      next(error);
    }
  };

  getUserCourses = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized',
        });
      }

      const { id } = req.params as { id: string };
      
      // Users can only view their own courses unless they're admin/instructor
      if (req.user.role !== 'admin' && req.user.role !== 'instructor' && req.user.id !== id) {
        return res.status(403).json({
          success: false,
          message: 'Access denied',
        });
      }

      const courses = await userService.getUserCourses(id);

      res.json({
        success: true,
        data: courses,
      });
    } catch (error) {
      next(error);
    }
  };

  getUserProgress = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized',
        });
      }

      const { id } = req.params as { id: string };
      
      // Users can only view their own progress unless they're admin/instructor
      if (req.user.role !== 'admin' && req.user.role !== 'instructor' && req.user.id !== id) {
        return res.status(403).json({
          success: false,
          message: 'Access denied',
        });
      }

      const progress = await userService.getUserProgress(id);

      res.json({
        success: true,
        data: progress,
      });
    } catch (error) {
      next(error);
    }
  };

  getUserCertificates = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized',
        });
      }

      const { id } = req.params as { id: string };
      
      // Users can only view their own certificates unless they're admin/instructor
      if (req.user.role !== 'admin' && req.user.role !== 'instructor' && req.user.id !== id) {
        return res.status(403).json({
          success: false,
          message: 'Access denied',
        });
      }

      const certificates = await userService.getUserCertificates(id);

      res.json({
        success: true,
        data: certificates,
      });
    } catch (error) {
      next(error);
    }
  };
}

export default new UsersController();
