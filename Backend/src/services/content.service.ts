import prisma from '../config/database';
import {
  NotFoundError,
  ConflictError,
  ForbiddenError,
  BadRequestError,
} from '../utils/errors';
import { CreateContentInput, UpdateContentInput, ReorderContentInput } from '../schemas/content.schema';

class ContentService {
  async getContentsByModule(moduleId: string, requestingUserRole: string, requestingUserOrgId?: string) {
    // Verify module exists and check access
    const module = await prisma.module.findUnique({
      where: { id: moduleId },
      include: {
        course: {
          select: {
            id: true,
            organizationId: true,
            status: true,
            instructorId: true,
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

    if (requestingUserRole !== 'admin' && requestingUserOrgId && module.course.organizationId !== requestingUserOrgId) {
      throw new ForbiddenError('Access denied');
    }

    // Get contents
    const contents = await prisma.content.findMany({
      where: { moduleId },
      select: {
        id: true,
        title: true,
        description: true,
        contentType: true,
        contentData: true,
        fileUrl: true,
        fileSize: true,
        order: true,
        duration: true,
        isRequired: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        order: 'asc',
      },
    });

    return contents;
  }

  async getContentById(contentId: string, requestingUserRole: string, requestingUserOrgId?: string) {
    const content = await prisma.content.findUnique({
      where: { id: contentId },
      include: {
        module: {
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
          },
        },
      },
    });

    if (!content) {
      throw new NotFoundError('Content not found');
    }

    // Check access permissions
    if (requestingUserRole === 'trainee' && content.module.course.status !== 'published') {
      throw new ForbiddenError('Course is not published');
    }

    if (requestingUserRole !== 'admin' && requestingUserOrgId && content.module.course.organizationId !== requestingUserOrgId) {
      throw new ForbiddenError('Access denied');
    }

    return content;
  }

  async createContent(data: CreateContentInput, requestingUserId: string, requestingUserRole: string, requestingUserOrgId?: string) {
    // Only admins and instructors can create content
    if (requestingUserRole !== 'admin' && requestingUserRole !== 'instructor') {
      throw new ForbiddenError('Only admins and instructors can create content');
    }

    // Verify module exists
    const module = await prisma.module.findUnique({
      where: { id: data.moduleId },
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

    // Check permissions: instructors can only create content for their own courses
    if (requestingUserRole !== 'admin' && module.course.instructorId !== requestingUserId) {
      throw new ForbiddenError('You can only create content for your own courses');
    }

    // Check organization access
    if (requestingUserRole !== 'admin' && requestingUserOrgId !== module.course.organizationId) {
      throw new ForbiddenError('Access denied');
    }

    // Validate content based on type
    if (data.contentType === 'video' || data.contentType === 'document') {
      if (!data.contentUrl && !data.fileUrl) {
        throw new BadRequestError(`${data.contentType} content requires a URL or file`);
      }
    }

    if (data.contentType === 'link') {
      if (!data.contentUrl) {
        throw new BadRequestError('Link content requires a URL');
      }
    }

    // Prepare contentData - store contentUrl and other metadata in JSON
    const contentData: any = data.contentData || {};
    if (data.contentUrl) {
      contentData.url = data.contentUrl;
    }

    // Get the highest order number if order is not provided
    let order = data.order;
    if (!order) {
      const maxOrder = await prisma.content.findFirst({
        where: { moduleId: data.moduleId },
        orderBy: { order: 'desc' },
        select: { order: true },
      });
      order = maxOrder ? maxOrder.order + 1 : 1;
    }

    // Create content
    const content = await prisma.content.create({
      data: {
        moduleId: data.moduleId,
        title: data.title,
        description: data.description,
        contentType: data.contentType,
        contentData: Object.keys(contentData).length > 0 ? contentData : null,
        fileUrl: data.fileUrl,
        fileSize: data.fileSize ? BigInt(data.fileSize) : null,
        order,
        duration: data.duration,
        isRequired: data.isRequired !== undefined ? data.isRequired : true,
      },
      select: {
        id: true,
        title: true,
        description: true,
        contentType: true,
        contentData: true,
        fileUrl: true,
        fileSize: true,
        order: true,
        duration: true,
        isRequired: true,
        createdAt: true,
        module: {
          select: {
            id: true,
            title: true,
            course: {
              select: {
                id: true,
                title: true,
              },
            },
          },
        },
      },
    });

    return content;
  }

  async updateContent(
    contentId: string,
    data: UpdateContentInput,
    requestingUserId: string,
    requestingUserRole: string,
    requestingUserOrgId?: string
  ) {
    const content = await prisma.content.findUnique({
      where: { id: contentId },
      include: {
        module: {
          include: {
            course: {
              select: {
                id: true,
                organizationId: true,
                instructorId: true,
              },
            },
          },
        },
      },
    });

    if (!content) {
      throw new NotFoundError('Content not found');
    }

    // Check permissions
    if (requestingUserRole !== 'admin' && content.module.course.instructorId !== requestingUserId) {
      throw new ForbiddenError('You can only update content for your own courses');
    }

    // Check organization access
    if (requestingUserRole !== 'admin' && requestingUserOrgId !== content.module.course.organizationId) {
      throw new ForbiddenError('Access denied');
    }

    // Validate content based on type if changing type
    if (data.contentType) {
      const existingContentData = content.contentData as any || {};
      const existingUrl = existingContentData.url;
      
      if (data.contentType === 'video' || data.contentType === 'document') {
        if (!data.contentUrl && !data.fileUrl && !existingUrl && !content.fileUrl) {
          throw new BadRequestError(`${data.contentType} content requires a URL or file`);
        }
      }

      if (data.contentType === 'link') {
        if (!data.contentUrl && !existingUrl) {
          throw new BadRequestError('Link content requires a URL');
        }
      }
    }

    // Prepare contentData - merge with existing or create new
    let contentData: any = data.contentData;
    if (data.contentUrl) {
      contentData = contentData || {};
      contentData.url = data.contentUrl;
    } else if (content.contentData) {
      contentData = { ...(content.contentData as any), ...(data.contentData || {}) };
    }

    // Update content
    const updatedContent = await prisma.content.update({
      where: { id: contentId },
      data: {
        title: data.title,
        description: data.description,
        contentType: data.contentType,
        contentData: contentData ? contentData : undefined,
        fileUrl: data.fileUrl,
        fileSize: data.fileSize ? BigInt(data.fileSize) : undefined,
        order: data.order,
        duration: data.duration,
        isRequired: data.isRequired,
      },
      select: {
        id: true,
        title: true,
        description: true,
        contentType: true,
        contentData: true,
        fileUrl: true,
        fileSize: true,
        order: true,
        duration: true,
        isRequired: true,
        updatedAt: true,
        module: {
          select: {
            id: true,
            title: true,
            course: {
              select: {
                id: true,
                title: true,
              },
            },
          },
        },
      },
    });

    return updatedContent;
  }

  async deleteContent(contentId: string, requestingUserId: string, requestingUserRole: string, requestingUserOrgId?: string) {
    const content = await prisma.content.findUnique({
      where: { id: contentId },
      include: {
        module: {
          include: {
            course: {
              select: {
                id: true,
                organizationId: true,
                instructorId: true,
              },
            },
          },
        },
      },
    });

    if (!content) {
      throw new NotFoundError('Content not found');
    }

    // Check permissions
    if (requestingUserRole !== 'admin' && content.module.course.instructorId !== requestingUserId) {
      throw new ForbiddenError('You can only delete content for your own courses');
    }

    // Check organization access
    if (requestingUserRole !== 'admin' && requestingUserOrgId !== content.module.course.organizationId) {
      throw new ForbiddenError('Access denied');
    }

    // Delete content
    await prisma.content.delete({
      where: { id: contentId },
    });

    return { message: 'Content deleted successfully' };
  }

  async reorderContent(
    moduleId: string,
    data: ReorderContentInput,
    requestingUserId: string,
    requestingUserRole: string,
    requestingUserOrgId?: string
  ) {
    // Verify module exists
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
      throw new ForbiddenError('You can only reorder content for your own courses');
    }

    // Check organization access
    if (requestingUserRole !== 'admin' && requestingUserOrgId !== module.course.organizationId) {
      throw new ForbiddenError('Access denied');
    }

    // Verify all content belongs to the module
    const contentIds = data.contentOrders.map(co => co.contentId);
    const contents = await prisma.content.findMany({
      where: {
        id: { in: contentIds },
        moduleId,
      },
      select: {
        id: true,
      },
    });

    if (contents.length !== contentIds.length) {
      throw new BadRequestError('Some content does not belong to this module');
    }

    // Update content orders
    const updatePromises = data.contentOrders.map(({ contentId, order }) =>
      prisma.content.update({
        where: { id: contentId },
        data: { order },
      })
    );

    await Promise.all(updatePromises);

    // Return updated contents
    const updatedContents = await prisma.content.findMany({
      where: { moduleId },
      select: {
        id: true,
        title: true,
        contentType: true,
        order: true,
      },
      orderBy: {
        order: 'asc',
      },
    });

    return updatedContents;
  }
}

export default new ContentService();
