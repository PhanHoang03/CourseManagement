import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import organizationService from '../services/organization.service';
import { CreateOrganizationInput, UpdateOrganizationInput, GetOrganizationsQuery } from '../schemas/organization.schema';

class OrganizationsController {
  getAllOrganizations = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized',
        });
      }

      const query = req.query as unknown as GetOrganizationsQuery;
      const result = await organizationService.getAllOrganizations(
        query, 
        req.user.role,
        req.user.organizationId
      );

      res.json({
        success: true,
        data: result.organizations,
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  };

  getOrganizationById = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized',
        });
      }

      const { id } = req.params as { id: string };
      const organization = await organizationService.getOrganizationById(
        id,
        req.user.role,
        req.user.organizationId
      );

      res.json({
        success: true,
        data: organization,
      });
    } catch (error) {
      next(error);
    }
  };

  createOrganization = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized',
        });
      }

      const data = req.body as CreateOrganizationInput;
      const organization = await organizationService.createOrganization(data, req.user.role);

      res.status(201).json({
        success: true,
        message: 'Organization created successfully',
        data: organization,
      });
    } catch (error) {
      next(error);
    }
  };

  updateOrganization = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized',
        });
      }

      const { id } = req.params as { id: string };
      const data = req.body as UpdateOrganizationInput;
      const organization = await organizationService.updateOrganization(
        id,
        data,
        req.user.role,
        req.user.organizationId
      );

      res.json({
        success: true,
        message: 'Organization updated successfully',
        data: organization,
      });
    } catch (error) {
      next(error);
    }
  };

  deleteOrganization = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized',
        });
      }

      const { id } = req.params as { id: string };
      const result = await organizationService.deleteOrganization(id, req.user.role);

      res.json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      next(error);
    }
  };

  getOrganizationStats = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized',
        });
      }

      const { id } = req.params as { id: string };
      const stats = await organizationService.getOrganizationStats(
        id,
        req.user.role,
        req.user.organizationId
      );

      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  };

  getOrganizationSettings = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized',
        });
      }

      const { id } = req.params as { id: string };
      const settings = await organizationService.getOrganizationSettings(
        id,
        req.user.role,
        req.user.organizationId
      );

      res.json({
        success: true,
        data: settings,
      });
    } catch (error) {
      next(error);
    }
  };

  updateOrganizationSettings = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized',
        });
      }

      const { id } = req.params as { id: string };
      const settings = req.body as Record<string, any>;
      const result = await organizationService.updateOrganizationSettings(
        id,
        settings,
        req.user.role,
        req.user.organizationId
      );

      res.json({
        success: true,
        message: 'Settings updated successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };
}

export default new OrganizationsController();
