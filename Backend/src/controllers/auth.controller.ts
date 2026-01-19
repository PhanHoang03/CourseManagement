import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import authService from '../services/auth.service';
import {
  RegisterInput,
  LoginInput,
  RefreshTokenInput,
  ChangePasswordInput,
} from '../schemas/auth.schema';

class AuthController {
  register = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const data = req.body as RegisterInput;
      const result = await authService.register(data);
      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  login = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const data = req.body as LoginInput;
      const result = await authService.login(data);
      res.json({
        success: true,
        message: 'Login successful',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  refreshToken = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const data = req.body as RefreshTokenInput;
      const tokens = await authService.refreshToken(data);
      res.json({
        success: true,
        message: 'Token refreshed successfully',
        data: tokens,
      });
    } catch (error) {
      next(error);
    }
  };

  getMe = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized',
        });
      }

      const user = await authService.getCurrentUser(req.user.id);
      res.json({
        success: true,
        data: user,
      });
    } catch (error) {
      next(error);
    }
  };

  changePassword = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized',
        });
      }

      const data = req.body as ChangePasswordInput;
      const result = await authService.changePassword(req.user.id, data);
      res.json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      next(error);
    }
  };

  logout = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      // In a stateless JWT system, logout is handled client-side
      // You could implement token blacklisting here if needed
      res.json({
        success: true,
        message: 'Logout successful',
      });
    } catch (error) {
      next(error);
    }
  };
}

export default new AuthController();
