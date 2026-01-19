import prisma from '../config/database';
import {
  NotFoundError,
  ForbiddenError,
  BadRequestError,
} from '../utils/errors';
import { UpdateProgressInput, CompleteContentInput } from '../schemas/progress.schema';
import enrollmentService from './enrollment.service';

class ProgressService {
  async getProgress(enrollmentId: string, moduleId?: string, contentId?: string, requestingUserRole?: string, requestingUserId?: string, requestingUserOrgId?: string) {
    // Verify enrollment exists
    const enrollment = await prisma.enrollment.findUnique({
      where: { id: enrollmentId },
      include: {
        course: {
          select: {
            id: true,
            organizationId: true,
            instructorId: true,
          },
        },
        trainee: {
          select: {
            id: true,
          },
        },
      },
    });

    if (!enrollment) {
      throw new NotFoundError('Enrollment not found');
    }

    // Check access permissions
    if (requestingUserRole === 'trainee' && enrollment.traineeId !== requestingUserId) {
      throw new ForbiddenError('You can only view your own progress');
    }

    if (requestingUserRole !== 'admin' && requestingUserOrgId && enrollment.course.organizationId !== requestingUserOrgId) {
      throw new ForbiddenError('Access denied');
    }

    // Build where clause
    const where: any = {
      enrollmentId,
    };

    if (moduleId) {
      where.moduleId = moduleId;
    }

    if (contentId) {
      where.contentId = contentId;
    }

    // Get progress records
    const progress = await prisma.progress.findMany({
      where,
      include: {
        module: {
          select: {
            id: true,
            title: true,
            order: true,
            isRequired: true,
          },
        },
        content: {
          select: {
            id: true,
            title: true,
            contentType: true,
            order: true,
            isRequired: true,
          },
        },
      },
      orderBy: [
        { module: { order: 'asc' } },
        { content: { order: 'asc' } },
      ],
    } as any); // Type assertion to include contentData field (added via migration)

    return progress;
  }

  async updateProgress(data: UpdateProgressInput, requestingUserId: string, requestingUserRole: string, requestingUserOrgId?: string) {
    // Verify enrollment exists
    const enrollment = await prisma.enrollment.findUnique({
      where: { id: data.enrollmentId },
      include: {
        course: {
          select: {
            id: true,
            organizationId: true,
          },
        },
        trainee: {
          select: {
            id: true,
          },
        },
      },
    });

    if (!enrollment) {
      throw new NotFoundError('Enrollment not found');
    }

    // Check permissions - only trainees can update their own progress
    if (enrollment.traineeId !== requestingUserId) {
      throw new ForbiddenError('You can only update your own progress');
    }

    if (requestingUserRole !== 'admin' && requestingUserOrgId && enrollment.course.organizationId !== requestingUserOrgId) {
      throw new ForbiddenError('Access denied');
    }

    // Verify module exists
    const module = await prisma.module.findUnique({
      where: { id: data.moduleId },
      select: {
        id: true,
        courseId: true,
      },
    });

    if (!module) {
      throw new NotFoundError('Module not found');
    }

    if (module.courseId !== enrollment.courseId) {
      throw new BadRequestError('Module does not belong to the enrolled course');
    }

    // Verify content if provided
    if (data.contentId) {
      const content = await prisma.content.findUnique({
        where: { id: data.contentId },
        select: {
          id: true,
          moduleId: true,
        },
      });

      if (!content) {
        throw new NotFoundError('Content not found');
      }

      if (content.moduleId !== data.moduleId) {
        throw new BadRequestError('Content does not belong to the specified module');
      }
    }

    // Find or create progress record
    const existingProgress = await prisma.progress.findFirst({
      where: {
        enrollmentId: data.enrollmentId,
        moduleId: data.moduleId,
        contentId: data.contentId || null,
      },
    });

    let progress;
    if (existingProgress) {
      // Update existing progress
      progress = await prisma.progress.update({
        where: { id: existingProgress.id },
        data: {
          status: data.status,
          progressPercentage: data.progressPercentage,
          timeSpent: data.timeSpent,
          lastAccessedAt: new Date(),
          ...(data.status === 'completed' && !existingProgress.completedAt ? { completedAt: new Date() } : {}),
          ...(data.status === 'in_progress' && !existingProgress.startedAt ? { startedAt: new Date() } : {}),
        },
        include: {
          module: {
            select: {
              id: true,
              title: true,
            },
          },
          content: {
            select: {
              id: true,
              title: true,
            },
          },
        },
      });
    } else {
      // Create new progress record
      progress = await prisma.progress.create({
        data: {
          enrollmentId: data.enrollmentId,
          moduleId: data.moduleId,
          contentId: data.contentId || null,
          traineeId: enrollment.traineeId,
          status: data.status || 'in_progress',
          progressPercentage: data.progressPercentage || 0,
          timeSpent: data.timeSpent || 0,
          startedAt: new Date(),
          lastAccessedAt: new Date(),
        },
        include: {
          module: {
            select: {
              id: true,
              title: true,
            },
          },
          content: {
            select: {
              id: true,
              title: true,
            },
          },
        },
      });
    }

    // Recalculate enrollment progress
    await enrollmentService.calculateEnrollmentProgress(data.enrollmentId);

    return progress;
  }

  async completeContent(data: CompleteContentInput, requestingUserId: string, requestingUserRole: string, requestingUserOrgId?: string) {
    // Verify enrollment exists
    const enrollment = await prisma.enrollment.findUnique({
      where: { id: data.enrollmentId },
      include: {
        course: {
          select: {
            id: true,
            organizationId: true,
          },
        },
        trainee: {
          select: {
            id: true,
          },
        },
      },
    });

    if (!enrollment) {
      throw new NotFoundError('Enrollment not found');
    }

    // Check permissions
    if (enrollment.traineeId !== requestingUserId) {
      throw new ForbiddenError('You can only update your own progress');
    }

    if (requestingUserRole !== 'admin' && requestingUserOrgId && enrollment.course.organizationId !== requestingUserOrgId) {
      throw new ForbiddenError('Access denied');
    }

    // Verify content exists and belongs to module
    const content = await prisma.content.findUnique({
      where: { id: data.contentId },
      include: {
        module: {
          select: {
            id: true,
            courseId: true,
          },
        },
      },
    });

    if (!content) {
      throw new NotFoundError('Content not found');
    }

    if (content.moduleId !== data.moduleId) {
      throw new BadRequestError('Content does not belong to the specified module');
    }

    if (content.module.courseId !== enrollment.courseId) {
      throw new BadRequestError('Content does not belong to the enrolled course');
    }

    // Find or create progress record
    const existingProgress = await prisma.progress.findFirst({
      where: {
        enrollmentId: data.enrollmentId,
        moduleId: data.moduleId,
        contentId: data.contentId,
      },
    });

    let progress;
    if (existingProgress) {
      // Update to completed
      // Store quiz submission data in contentData field if provided
      progress = await prisma.progress.update({
        where: { id: existingProgress.id },
        data: {
          status: 'completed',
          progressPercentage: 100,
          timeSpent: data.timeSpent ? existingProgress.timeSpent + data.timeSpent : existingProgress.timeSpent,
          completedAt: existingProgress.completedAt || new Date(),
          lastAccessedAt: new Date(),
          // Store quiz submission data if provided
          contentData: data.contentData ? { quizSubmission: data.contentData } : (existingProgress as any).contentData,
        } as any,
        include: {
          module: {
            select: {
              id: true,
              title: true,
            },
          },
          content: {
            select: {
              id: true,
              title: true,
              contentType: true,
            },
          },
        },
      });
    } else {
      // Create new progress record as completed
      // Store quiz submission data in contentData field if provided
      progress = await prisma.progress.create({
        data: {
          enrollmentId: data.enrollmentId,
          moduleId: data.moduleId,
          contentId: data.contentId,
          traineeId: enrollment.traineeId,
          status: 'completed',
          progressPercentage: 100,
          timeSpent: data.timeSpent || 0,
          startedAt: new Date(),
          completedAt: new Date(),
          lastAccessedAt: new Date(),
          // Store quiz submission data if provided
          contentData: data.contentData ? { quizSubmission: data.contentData } : undefined,
        } as any,
        include: {
          module: {
            select: {
              id: true,
              title: true,
            },
          },
          content: {
            select: {
              id: true,
              title: true,
              contentType: true,
            },
          },
        },
      });
    }

    // Check if module is completed (all required content completed)
    await this.checkAndCompleteModule(data.enrollmentId, data.moduleId);

    // Recalculate enrollment progress
    await enrollmentService.calculateEnrollmentProgress(data.enrollmentId);

    return progress;
  }

  async checkAndCompleteModule(enrollmentId: string, moduleId: string) {
    // Get module with all required content
    const module = await prisma.module.findUnique({
      where: { id: moduleId },
      include: {
        content: {
          where: {
            isRequired: true,
          },
        },
      },
    });

    if (!module) {
      return;
    }

    // Get all progress for this module
    const moduleProgress = await prisma.progress.findFirst({
      where: {
        enrollmentId,
        moduleId,
        contentId: null, // Module-level progress
      },
    });

    // Check if all required content is completed
    const requiredContentIds = module.content.map(c => c.id);
    if (requiredContentIds.length === 0) {
      // No required content, mark module as completed
      if (moduleProgress) {
        await prisma.progress.update({
          where: { id: moduleProgress.id },
          data: {
            status: 'completed',
            progressPercentage: 100,
            completedAt: moduleProgress.completedAt || new Date(),
          },
        });
      } else {
        const enrollment = await prisma.enrollment.findUnique({
          where: { id: enrollmentId },
          select: { traineeId: true },
        });
        await prisma.progress.create({
          data: {
            enrollmentId,
            moduleId,
            traineeId: enrollment!.traineeId,
            status: 'completed',
            progressPercentage: 100,
            startedAt: new Date(),
            completedAt: new Date(),
          },
        });
      }
      return;
    }

    const completedContent = await prisma.progress.findMany({
      where: {
        enrollmentId,
        moduleId,
        contentId: { in: requiredContentIds },
        status: 'completed',
      },
      select: {
        contentId: true,
      },
    });

    const completedContentIds = completedContent.map(p => p.contentId).filter(Boolean);
    const allRequiredCompleted = requiredContentIds.every(id => completedContentIds.includes(id));

    if (allRequiredCompleted) {
      // Mark module as completed
      if (moduleProgress) {
        await prisma.progress.update({
          where: { id: moduleProgress.id },
          data: {
            status: 'completed',
            progressPercentage: 100,
            completedAt: moduleProgress.completedAt || new Date(),
          },
        });
      } else {
        const enrollment = await prisma.enrollment.findUnique({
          where: { id: enrollmentId },
          select: { traineeId: true },
        });
        await prisma.progress.create({
          data: {
            enrollmentId,
            moduleId,
            traineeId: enrollment!.traineeId,
            status: 'completed',
            progressPercentage: 100,
            startedAt: new Date(),
            completedAt: new Date(),
          },
        });
      }
    }
  }

  async getUserCourseProgress(courseId: string, requestingUserId: string, requestingUserRole: string, requestingUserOrgId?: string) {
    // Verify course exists
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: {
        id: true,
        title: true,
        organizationId: true,
      },
    });

    if (!course) {
      throw new NotFoundError('Course not found');
    }

    // Check access
    if (requestingUserRole !== 'admin' && requestingUserOrgId && course.organizationId !== requestingUserOrgId) {
      throw new ForbiddenError('Access denied');
    }

    // Get enrollment
    const enrollment = await prisma.enrollment.findFirst({
      where: {
        courseId,
        traineeId: requestingUserId,
        status: { not: 'dropped' },
      },
      include: {
        progress: {
          include: {
            module: {
              select: {
                id: true,
                title: true,
                order: true,
              },
            },
            content: {
              select: {
                id: true,
                title: true,
                contentType: true,
                order: true,
              },
            },
          },
          orderBy: [
            { module: { order: 'asc' } },
            { content: { order: 'asc' } },
          ],
        },
      },
    });

    if (!enrollment) {
      throw new NotFoundError('You are not enrolled in this course');
    }

    return {
      enrollment: {
        id: enrollment.id,
        status: enrollment.status,
        progressPercentage: enrollment.progressPercentage,
        startedAt: enrollment.startedAt,
        completedAt: enrollment.completedAt,
      },
      progress: enrollment.progress,
    };
  }
}

export default new ProgressService();
