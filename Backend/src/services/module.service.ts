import prisma from '../config/database';
import {
  NotFoundError,
  ConflictError,
  ForbiddenError,
  BadRequestError,
} from '../utils/errors';
import { CreateModuleInput, UpdateModuleInput, ReorderModulesInput } from '../schemas/module.schema';

class ModuleService {
  async getModulesByCourse(courseId: string, requestingUserRole: string, requestingUserOrgId?: string) {
    // Verify course exists and check access
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: {
        id: true,
        organizationId: true,
        status: true,
        instructorId: true,
      },
    });

    if (!course) {
      throw new NotFoundError('Course not found');
    }

    // Check access permissions
    if (requestingUserRole === 'trainee' && course.status !== 'published') {
      throw new ForbiddenError('Course is not published');
    }

    // Organization restriction: non-admins can only access courses from their own organization
    if (requestingUserRole !== 'admin' && requestingUserOrgId && course.organizationId !== requestingUserOrgId) {
      throw new ForbiddenError('Access denied');
    }

    // Get modules
    const modules = await prisma.module.findMany({
      where: { courseId },
      select: {
        id: true,
        title: true,
        description: true,
        order: true,
        estimatedDuration: true,
        isRequired: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            content: true,
            assessments: true,
          },
        },
      },
      orderBy: {
        order: 'asc',
      },
    });

    return modules;
  }

  async getModuleById(moduleId: string, requestingUserRole: string, requestingUserOrgId?: string) {
    const module = await prisma.module.findUnique({
      where: { id: moduleId },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            organizationId: true,
            status: true,
            instructorId: true,
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
          orderBy: {
            order: 'asc',
          },
        },
        _count: {
          select: {
            content: true,
            assessments: true,
          },
        },
      },
    });

    if (!module) {
      throw new NotFoundError('Module not found');
    }

    // Check access permissions
    if (requestingUserRole === 'trainee' && module.course.status !== 'published') {
      throw new ForbiddenError('Course is not published');
    }

    // Organization restriction: non-admins can only access modules from courses in their own organization
    if (requestingUserRole !== 'admin' && requestingUserOrgId && module.course.organizationId !== requestingUserOrgId) {
      throw new ForbiddenError('Access denied');
    }

    return module;
  }

  async createModule(data: CreateModuleInput, requestingUserId: string, requestingUserRole: string, requestingUserOrgId?: string) {
    // Only admins and instructors can create modules
    if (requestingUserRole !== 'admin' && requestingUserRole !== 'instructor') {
      throw new ForbiddenError('Only admins and instructors can create modules');
    }

    // Verify course exists
    const course = await prisma.course.findUnique({
      where: { id: data.courseId },
      select: {
        id: true,
        organizationId: true,
        instructorId: true,
      },
    });

    if (!course) {
      throw new NotFoundError('Course not found');
    }

    // Check permissions: instructors can only create modules for their own courses
    if (requestingUserRole !== 'admin' && course.instructorId !== requestingUserId) {
      throw new ForbiddenError('You can only create modules for your own courses');
    }

    // Check organization access
    if (requestingUserRole !== 'admin' && requestingUserOrgId !== course.organizationId) {
      throw new ForbiddenError('Access denied');
    }

    // Get the highest order number if order is not provided
    let order = data.order;
    if (!order) {
      const maxOrder = await prisma.module.findFirst({
        where: { courseId: data.courseId },
        orderBy: { order: 'desc' },
        select: { order: true },
      });
      order = maxOrder ? maxOrder.order + 1 : 1;
    } else {
      // Check if the provided order already exists for this course
      const existingModule = await prisma.module.findFirst({
        where: {
          courseId: data.courseId,
          order: order,
        },
        select: { id: true },
      });

      if (existingModule) {
        // If order exists, shift all modules with order >= this order by 1
        // Fetch modules that need to be shifted (in descending order to avoid conflicts)
        const modulesToShift = await prisma.module.findMany({
          where: {
            courseId: data.courseId,
            order: { gte: order },
          },
          select: { id: true, order: true },
          orderBy: { order: 'desc' },
        });

        // Update each module's order (increment by 1)
        for (const module of modulesToShift) {
          await prisma.module.update({
            where: { id: module.id },
            data: { order: module.order + 1 },
          });
        }
      }
    }

    // Create module
    const module = await prisma.module.create({
      data: {
        courseId: data.courseId,
        title: data.title,
        description: data.description,
        order,
        estimatedDuration: data.estimatedDuration,
        isRequired: data.isRequired !== undefined ? data.isRequired : true,
      },
      select: {
        id: true,
        title: true,
        description: true,
        order: true,
        estimatedDuration: true,
        isRequired: true,
        createdAt: true,
        course: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    return module;
  }

  async updateModule(
    moduleId: string,
    data: UpdateModuleInput,
    requestingUserId: string,
    requestingUserRole: string,
    requestingUserOrgId?: string
  ) {
    const module = await prisma.module.findUnique({
      where: { id: moduleId },
      include: {
        course: {
          select: {
            id: true,
            organizationId: true,
            instructorId: true,
          },
        },
      },
    });

    if (!module) {
      throw new NotFoundError('Module not found');
    }

    // Check permissions
    if (requestingUserRole !== 'admin' && module.course.instructorId !== requestingUserId) {
      throw new ForbiddenError('You can only update modules for your own courses');
    }

    // Check organization access
    if (requestingUserRole !== 'admin' && requestingUserOrgId !== module.course.organizationId) {
      throw new ForbiddenError('Access denied');
    }

    // Update module
    const updatedModule = await prisma.module.update({
      where: { id: moduleId },
      data: {
        title: data.title,
        description: data.description,
        order: data.order,
        estimatedDuration: data.estimatedDuration,
        isRequired: data.isRequired,
      },
      select: {
        id: true,
        title: true,
        description: true,
        order: true,
        estimatedDuration: true,
        isRequired: true,
        updatedAt: true,
        course: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    return updatedModule;
  }

  async deleteModule(moduleId: string, requestingUserId: string, requestingUserRole: string, requestingUserOrgId?: string) {
    const module = await prisma.module.findUnique({
      where: { id: moduleId },
      include: {
        course: {
          select: {
            id: true,
            organizationId: true,
            instructorId: true,
          },
        },
        _count: {
          select: {
            content: true,
            assessments: true,
          },
        },
      },
    });

    if (!module) {
      throw new NotFoundError('Module not found');
    }

    // Check permissions
    if (requestingUserRole !== 'admin' && module.course.instructorId !== requestingUserId) {
      throw new ForbiddenError('You can only delete modules for your own courses');
    }

    // Check organization access
    if (requestingUserRole !== 'admin' && requestingUserOrgId !== module.course.organizationId) {
      throw new ForbiddenError('Access denied');
    }

    // Prevent deletion if module has content or assessments
    if (module._count.content > 0 || module._count.assessments > 0) {
      throw new ConflictError('Cannot delete module with existing content or assessments');
    }

    // Delete module
    await prisma.module.delete({
      where: { id: moduleId },
    });

    return { message: 'Module deleted successfully' };
  }

  async reorderModules(
    courseId: string,
    data: ReorderModulesInput,
    requestingUserId: string,
    requestingUserRole: string,
    requestingUserOrgId?: string
  ) {
    // Verify course exists
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: {
        id: true,
        organizationId: true,
        instructorId: true,
      },
    });

    if (!course) {
      throw new NotFoundError('Course not found');
    }

    // Check permissions
    if (requestingUserRole !== 'admin' && course.instructorId !== requestingUserId) {
      throw new ForbiddenError('You can only reorder modules for your own courses');
    }

    // Check organization access
    if (requestingUserRole !== 'admin' && requestingUserOrgId !== course.organizationId) {
      throw new ForbiddenError('Access denied');
    }

    // Verify all modules belong to the course
    const moduleIds = data.moduleOrders.map(mo => mo.moduleId);
    const modules = await prisma.module.findMany({
      where: {
        id: { in: moduleIds },
        courseId,
      },
      select: {
        id: true,
      },
    });

    if (modules.length !== moduleIds.length) {
      throw new BadRequestError('Some modules do not belong to this course');
    }

    // Update module orders
    const updatePromises = data.moduleOrders.map(({ moduleId, order }) =>
      prisma.module.update({
        where: { id: moduleId },
        data: { order },
      })
    );

    await Promise.all(updatePromises);

    // Return updated modules
    const updatedModules = await prisma.module.findMany({
      where: { courseId },
      select: {
        id: true,
        title: true,
        order: true,
      },
      orderBy: {
        order: 'asc',
      },
    });

    return updatedModules;
  }
}

export default new ModuleService();
