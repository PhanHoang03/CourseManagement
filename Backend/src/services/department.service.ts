import prisma from '../config/database';
import {
  NotFoundError,
  ConflictError,
  ForbiddenError,
  BadRequestError,
} from '../utils/errors';
import { CreateDepartmentInput, UpdateDepartmentInput, GetDepartmentsQuery } from '../schemas/department.schema';

class DepartmentService {
  async getAllDepartments(query: GetDepartmentsQuery, requestingUserRole: string, requestingUserOrgId?: string) {
    // Ensure page and limit are numbers
    const page = typeof query.page === 'number' ? query.page : Number(query.page) || 1;
    const limit = typeof query.limit === 'number' ? query.limit : Number(query.limit) || 10;
    const { organizationId, search, isActive } = query;
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};

    // Organization filtering
    if (organizationId) {
      where.organizationId = organizationId;
    } else if (requestingUserRole !== 'admin' && requestingUserOrgId) {
      // Non-admins can only see departments in their organization
      where.organizationId = requestingUserOrgId;
    }

    // Active status filtering
    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    // Search functionality
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Get departments and total count
    const [departments, total] = await Promise.all([
      prisma.department.findMany({
        where,
        skip,
        take: limit,
        select: {
          id: true,
          name: true,
          code: true,
          description: true,
          isActive: true,
          organizationId: true,
          managerId: true,
          createdAt: true,
          updatedAt: true,
          organization: {
            select: {
              id: true,
              name: true,
            },
          },
          manager: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          _count: {
            select: {
              users: true,
              courses: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      prisma.department.count({ where }),
    ]);

    return {
      departments,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getDepartmentById(departmentId: string, requestingUserRole: string, requestingUserOrgId?: string) {
    const department = await prisma.department.findUnique({
      where: { id: departmentId },
      select: {
        id: true,
        name: true,
        code: true,
        description: true,
        isActive: true,
        organizationId: true,
        managerId: true,
        createdAt: true,
        updatedAt: true,
        organization: {
          select: {
            id: true,
            name: true,
          },
        },
        manager: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            position: true,
          },
        },
        _count: {
          select: {
            users: true,
            courses: true,
            sessions: true,
          },
        },
      },
    });

    if (!department) {
      throw new NotFoundError('Department not found');
    }

    // Check access permissions
    if (requestingUserRole !== 'admin' && requestingUserOrgId !== department.organizationId) {
      throw new ForbiddenError('Access denied');
    }

    return department;
  }

  async createDepartment(data: CreateDepartmentInput, requestingUserRole: string, requestingUserOrgId?: string) {
    // Only admins can create departments
    if (requestingUserRole !== 'admin') {
      throw new ForbiddenError('Only admins can create departments');
    }

    // Check if user has access to the organization
    if (requestingUserRole !== 'admin' && requestingUserOrgId !== data.organizationId) {
      throw new ForbiddenError('Access denied to this organization');
    }

    // Verify organization exists
    const organization = await prisma.organization.findUnique({
      where: { id: data.organizationId },
    });

    if (!organization) {
      throw new NotFoundError('Organization not found');
    }

    // Check if department with same code exists in organization
    const existingDept = await prisma.department.findFirst({
      where: {
        organizationId: data.organizationId,
        code: data.code,
      },
    });

    if (existingDept) {
      throw new ConflictError('Department code already exists in this organization');
    }

    // Verify manager exists and belongs to organization (if provided)
    if (data.managerId) {
      const manager = await prisma.user.findUnique({
        where: { id: data.managerId },
        select: {
          organizationId: true,
          role: true,
        },
      });

      if (!manager) {
        throw new NotFoundError('Manager not found');
      }

      if (manager.organizationId !== data.organizationId) {
        throw new BadRequestError('Manager must belong to the same organization');
      }
    }

    // Create department
    const department = await prisma.department.create({
      data: {
        name: data.name,
        code: data.code,
        description: data.description,
        organizationId: data.organizationId,
        managerId: data.managerId,
      },
      select: {
        id: true,
        name: true,
        code: true,
        description: true,
        isActive: true,
        organizationId: true,
        managerId: true,
        createdAt: true,
        organization: {
          select: {
            id: true,
            name: true,
          },
        },
        manager: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    return department;
  }

  async updateDepartment(
    departmentId: string,
    data: UpdateDepartmentInput,
    requestingUserRole: string,
    requestingUserOrgId?: string
  ) {
    const department = await prisma.department.findUnique({
      where: { id: departmentId },
    });

    if (!department) {
      throw new NotFoundError('Department not found');
    }

    // Check access permissions
    if (requestingUserRole !== 'admin' && requestingUserOrgId !== department.organizationId) {
      throw new ForbiddenError('Access denied');
    }

    // Check for code conflicts if updating code
    if (data.code && data.code !== department.code) {
      const existingDept = await prisma.department.findFirst({
        where: {
          organizationId: department.organizationId,
          code: data.code,
          id: { not: departmentId },
        },
      });

      if (existingDept) {
        throw new ConflictError('Department code already exists in this organization');
      }
    }

    // Verify manager if updating
    if (data.managerId && data.managerId !== department.managerId) {
      const manager = await prisma.user.findUnique({
        where: { id: data.managerId },
        select: {
          organizationId: true,
        },
      });

      if (!manager) {
        throw new NotFoundError('Manager not found');
      }

      if (manager.organizationId !== department.organizationId) {
        throw new BadRequestError('Manager must belong to the same organization');
      }
    }

    // Update department
    const updatedDepartment = await prisma.department.update({
      where: { id: departmentId },
      data: {
        name: data.name,
        code: data.code,
        description: data.description,
        managerId: data.managerId,
        isActive: data.isActive,
      },
      select: {
        id: true,
        name: true,
        code: true,
        description: true,
        isActive: true,
        organizationId: true,
        managerId: true,
        updatedAt: true,
        organization: {
          select: {
            id: true,
            name: true,
          },
        },
        manager: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    return updatedDepartment;
  }

  async deleteDepartment(departmentId: string, requestingUserRole: string, requestingUserOrgId?: string) {
    if (requestingUserRole !== 'admin') {
      throw new ForbiddenError('Only admins can delete departments');
    }

    const department = await prisma.department.findUnique({
      where: { id: departmentId },
      include: {
        _count: {
          select: {
            users: true,
            courses: true,
          },
        },
      },
    });

    if (!department) {
      throw new NotFoundError('Department not found');
    }

    // Check access
    if (requestingUserRole !== 'admin' && requestingUserOrgId !== department.organizationId) {
      throw new ForbiddenError('Access denied');
    }

    // Prevent deletion if department has users or courses
    if (department._count.users > 0 || department._count.courses > 0) {
      throw new ConflictError('Cannot delete department with existing users or courses');
    }

    // Delete department
    await prisma.department.delete({
      where: { id: departmentId },
    });

    return { message: 'Department deleted successfully' };
  }

  async getDepartmentUsers(departmentId: string, requestingUserRole: string, requestingUserOrgId?: string) {
    const department = await prisma.department.findUnique({
      where: { id: departmentId },
      select: {
        id: true,
        organizationId: true,
      },
    });

    if (!department) {
      throw new NotFoundError('Department not found');
    }

    // Check access
    if (requestingUserRole !== 'admin' && requestingUserOrgId !== department.organizationId) {
      throw new ForbiddenError('Access denied');
    }

    const users = await prisma.user.findMany({
      where: {
        departmentId: departmentId,
      },
      select: {
        id: true,
        username: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        position: true,
        isActive: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return users;
  }

  async getDepartmentCourses(departmentId: string, requestingUserRole: string, requestingUserOrgId?: string) {
    const department = await prisma.department.findUnique({
      where: { id: departmentId },
      select: {
        id: true,
        organizationId: true,
      },
    });

    if (!department) {
      throw new NotFoundError('Department not found');
    }

    // Check access
    if (requestingUserRole !== 'admin' && requestingUserOrgId !== department.organizationId) {
      throw new ForbiddenError('Access denied');
    }

    const courses = await prisma.course.findMany({
      where: {
        departmentId: departmentId,
      },
      select: {
        id: true,
        title: true,
        courseCode: true,
        description: true,
        status: true,
        difficultyLevel: true,
        createdAt: true,
        instructor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return courses;
  }
}

export default new DepartmentService();
