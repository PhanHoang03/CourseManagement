import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import courseService from '../services/course.service';
import { CreateCourseInput, UpdateCourseInput, GetCoursesQuery, AddPrerequisiteInput } from '../schemas/course.schema';

class CoursesController {
  getAllCourses = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized',
        });
      }

      const query = req.query as unknown as GetCoursesQuery;
      const result = await courseService.getAllCourses(
        query,
        req.user.role,
        req.user.organizationId,
        req.user.id
      );

      res.json({
        success: true,
        data: result.courses,
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  };

  getPublicCourses = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized',
        });
      }

      const query = req.query as unknown as GetCoursesQuery;
      const result = await courseService.getPublicCourses(
        query,
        req.user.role,
        req.user.organizationId
      );

      res.json({
        success: true,
        data: result.courses,
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  };

  getCourseById = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized',
        });
      }

      const { id } = req.params as { id: string };
      const course = await courseService.getCourseById(
        id,
        req.user.role,
        req.user.organizationId,
        req.user.id
      );

      res.json({
        success: true,
        data: course,
      });
    } catch (error) {
      next(error);
    }
  };

  createCourse = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized',
        });
      }

      const data = req.body as CreateCourseInput;
      const course = await courseService.createCourse(
        data,
        req.user.id,
        req.user.role,
        req.user.organizationId
      );

      res.status(201).json({
        success: true,
        message: 'Course created successfully',
        data: course,
      });
    } catch (error) {
      next(error);
    }
  };

  updateCourse = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized',
        });
      }

      const { id } = req.params as { id: string };
      const data = req.body as UpdateCourseInput;
      const course = await courseService.updateCourse(
        id,
        data,
        req.user.id,
        req.user.role,
        req.user.organizationId
      );

      res.json({
        success: true,
        message: 'Course updated successfully',
        data: course,
      });
    } catch (error) {
      next(error);
    }
  };

  deleteCourse = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized',
        });
      }

      const { id } = req.params as { id: string };
      const result = await courseService.deleteCourse(
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

  publishCourse = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized',
        });
      }

      const { id } = req.params as { id: string };
      const course = await courseService.publishCourse(
        id,
        req.user.id,
        req.user.role,
        req.user.organizationId
      );

      res.json({
        success: true,
        message: 'Course published successfully',
        data: course,
      });
    } catch (error) {
      next(error);
    }
  };

  unpublishCourse = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized',
        });
      }

      const { id } = req.params as { id: string };
      const course = await courseService.unpublishCourse(
        id,
        req.user.id,
        req.user.role,
        req.user.organizationId
      );

      res.json({
        success: true,
        message: 'Course unpublished successfully',
        data: course,
      });
    } catch (error) {
      next(error);
    }
  };

  getCourseModules = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized',
        });
      }

      const { id } = req.params as { id: string };
      const modules = await courseService.getCourseModules(
        id,
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

  getCourseEnrollments = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized',
        });
      }

      const { id } = req.params as { id: string };
      const enrollments = await courseService.getCourseEnrollments(
        id,
        req.user.id,
        req.user.role,
        req.user.organizationId
      );

      res.json({
        success: true,
        data: enrollments,
      });
    } catch (error) {
      next(error);
    }
  };

  getCourseStats = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized',
        });
      }

      const { id } = req.params as { id: string };
      const stats = await courseService.getCourseStats(
        id,
        req.user.id,
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

  getCoursePrerequisites = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized',
        });
      }

      const { id } = req.params as { id: string };
      const prerequisites = await courseService.getCoursePrerequisites(id);

      res.json({
        success: true,
        data: prerequisites,
      });
    } catch (error) {
      next(error);
    }
  };

  addPrerequisite = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized',
        });
      }

      const { id } = req.params as { id: string };
      const data = req.body as AddPrerequisiteInput;
      const prerequisite = await courseService.addPrerequisite(
        id,
        data,
        req.user.id,
        req.user.role,
        req.user.organizationId
      );

      res.status(201).json({
        success: true,
        message: 'Prerequisite added successfully',
        data: prerequisite,
      });
    } catch (error) {
      next(error);
    }
  };

  removePrerequisite = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized',
        });
      }

      const { id, prerequisiteId } = req.params as { id: string; prerequisiteId: string };
      const result = await courseService.removePrerequisite(
        id,
        prerequisiteId,
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

  enrollInCourse = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized',
        });
      }

      // Only trainees can enroll (or admins enrolling others)
      if (req.user.role !== 'trainee' && req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Only trainees can enroll in courses',
        });
      }

      const { id } = req.params as { id: string };
      const { dueDate } = req.body as { dueDate?: string };
      
      const traineeId = req.user.id; // For now, users enroll themselves
      const enrollment = await courseService.enrollInCourse(
        id,
        traineeId,
        dueDate ? new Date(dueDate) : undefined,
        req.user.role
      );

      res.status(201).json({
        success: true,
        message: 'Enrolled in course successfully',
        data: enrollment,
      });
    } catch (error) {
      next(error);
    }
  };

  unenrollFromCourse = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized',
        });
      }

      const { id } = req.params as { id: string };
      const result = await courseService.unenrollFromCourse(id, req.user.id);

      res.json({
        success: true,
        message: 'Unenrolled from course successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };
}

export default new CoursesController();
