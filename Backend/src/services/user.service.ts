import bcrypt from 'bcrypt';
import prisma from '../config/database';
import {
  NotFoundError,
  ConflictError,
  BadRequestError,
  ForbiddenError,
} from '../utils/errors';
import { CreateUserInput, UpdateUserInput, GetUsersQuery } from '../schemas/user.schema';

class UserService {
  async getAllUsers(query: GetUsersQuery, requestingUserId: string, requestingUserRole: string) {
    // Ensure page and limit are numbers
    const page = typeof query.page === 'number' ? query.page : Number(query.page) || 1;
    const limit = typeof query.limit === 'number' ? query.limit : Number(query.limit) || 10;
    const { role, organizationId, departmentId, search, isActive } = query;
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};

    // Role-based filtering
    if (role) {
      where.role = role;
    }

    // Organization filtering (for multi-tenant)
    if (organizationId) {
      where.organizationId = organizationId;
    } else if (requestingUserRole !== 'admin') {
      // Non-admins can only see users in their organization
      const requestingUser = await prisma.user.findUnique({
        where: { id: requestingUserId },
        select: { organizationId: true },
      });
      if (requestingUser?.organizationId) {
        where.organizationId = requestingUser.organizationId;
      }
    }

    // Department filtering
    if (departmentId) {
      where.departmentId = departmentId;
    }

    // Active status filtering
    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    // Search functionality
    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { username: { contains: search, mode: 'insensitive' } },
        { employeeId: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Get users and total count
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        select: {
          id: true,
          username: true,
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
          address: true,
          photoUrl: true,
          role: true,
          position: true,
          employeeId: true,
          organizationId: true,
          departmentId: true,
          isActive: true,
          lastLogin: true,
          createdAt: true,
          organization: {
            select: {
              id: true,
              name: true,
            },
          },
          department: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      prisma.user.count({ where }),
    ]);

    return {
      users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getUserById(userId: string, requestingUserId: string, requestingUserRole: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        address: true,
        photoUrl: true,
        role: true,
        position: true,
        bio: true,
        expertise: true,
        employeeId: true,
        organizationId: true,
        departmentId: true,
        isActive: true,
        emailVerified: true,
        lastLogin: true,
        createdAt: true,
        updatedAt: true,
        organization: {
          select: {
            id: true,
            name: true,
          },
        },
        department: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Check access permissions
    if (requestingUserRole !== 'admin' && requestingUserId !== userId) {
      // Non-admins can only view their own profile or users in their organization
      const requestingUser = await prisma.user.findUnique({
        where: { id: requestingUserId },
        select: { organizationId: true },
      });

      if (
        requestingUser?.organizationId &&
        user.organizationId !== requestingUser.organizationId
      ) {
        throw new ForbiddenError('Access denied');
      }
    }

    return user;
  }

  async createUser(data: CreateUserInput, requestingUserRole: string) {
    // Only admins can create users
    if (requestingUserRole !== 'admin') {
      throw new ForbiddenError('Only admins can create users');
    }

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: data.email },
          { username: data.username },
        ],
      },
    });

    if (existingUser) {
      if (existingUser.email === data.email) {
        throw new ConflictError('Email already registered');
      }
      if (existingUser.username === data.username) {
        throw new ConflictError('Username already taken');
      }
    }

    // Check employeeId uniqueness within organization
    if (data.employeeId && data.organizationId) {
      const existingEmployee = await prisma.user.findFirst({
        where: {
          employeeId: data.employeeId,
          organizationId: data.organizationId,
        },
      });

      if (existingEmployee) {
        throw new ConflictError('Employee ID already exists in this organization');
      }
    }

    // Hash password
    const passwordHash = await bcrypt.hash(data.password, 10);

    // Generate employee ID if not provided
    const employeeId = data.employeeId || `EMP-${Date.now()}`;

    // Create user
    const user = await prisma.user.create({
      data: {
        username: data.username,
        email: data.email,
        passwordHash,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        address: data.address,
        role: data.role,
        employeeId,
        organizationId: data.organizationId,
        departmentId: data.departmentId,
        position: data.position,
        bio: data.bio,
        expertise: data.expertise || [],
      },
      select: {
        id: true,
        username: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        address: true,
        role: true,
        position: true,
        employeeId: true,
        organizationId: true,
        departmentId: true,
        isActive: true,
        createdAt: true,
        organization: {
          select: {
            id: true,
            name: true,
          },
        },
        department: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return user;
  }

  async updateUser(
    userId: string,
    data: UpdateUserInput,
    requestingUserId: string,
    requestingUserRole: string
  ) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Check permissions: users can update themselves, admins can update anyone
    if (requestingUserRole !== 'admin' && requestingUserId !== userId) {
      throw new ForbiddenError('You can only update your own profile');
    }

    // Role changes can only be done by admins
    if (data.role && data.role !== user.role && requestingUserRole !== 'admin') {
      throw new ForbiddenError('Only admins can change user roles');
    }

    // Prevent users from deactivating themselves
    if (requestingUserId === userId && 'isActive' in data) {
      throw new BadRequestError('You cannot change your own active status');
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        address: data.address,
        role: data.role,
        organizationId: data.organizationId,
        departmentId: data.departmentId,
        position: data.position,
        bio: data.bio,
        expertise: data.expertise,
        photoUrl: data.photoUrl,
      },
      select: {
        id: true,
        username: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        address: true,
        photoUrl: true,
        role: true,
        position: true,
        bio: true,
        expertise: true,
        employeeId: true,
        organizationId: true,
        departmentId: true,
        isActive: true,
        updatedAt: true,
        organization: {
          select: {
            id: true,
            name: true,
          },
        },
        department: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return updatedUser;
  }

  async deleteUser(userId: string, requestingUserId: string, requestingUserRole: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Only admins can delete users
    if (requestingUserRole !== 'admin') {
      throw new ForbiddenError('Only admins can delete users');
    }

    // Prevent self-deletion
    if (requestingUserId === userId) {
      throw new BadRequestError('You cannot delete your own account');
    }

    // Soft delete by deactivating (or hard delete if preferred)
    await prisma.user.update({
      where: { id: userId },
      data: { isActive: false },
    });

    return { message: 'User deactivated successfully' };
  }

  async activateUser(userId: string, requestingUserRole: string) {
    if (requestingUserRole !== 'admin') {
      throw new ForbiddenError('Only admins can activate users');
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { isActive: true },
      select: {
        id: true,
        username: true,
        email: true,
        isActive: true,
      },
    });

    return updatedUser;
  }

  async deactivateUser(userId: string, requestingUserId: string, requestingUserRole: string) {
    if (requestingUserRole !== 'admin') {
      throw new ForbiddenError('Only admins can deactivate users');
    }

    if (requestingUserId === userId) {
      throw new BadRequestError('You cannot deactivate your own account');
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { isActive: false },
      select: {
        id: true,
        username: true,
        email: true,
        isActive: true,
      },
    });

    return updatedUser;
  }

  async getUserCourses(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        enrollments: {
          include: {
            course: {
              select: {
                id: true,
                title: true,
                courseCode: true,
                description: true,
                status: true,
              },
            },
          },
        },
        instructorCourses: {
          select: {
            id: true,
            title: true,
            courseCode: true,
            description: true,
            status: true,
            createdAt: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    return {
      enrolledCourses: user.enrollments.map((e) => ({
        ...e.course,
        enrollmentStatus: e.status,
        progress: e.progressPercentage,
        startedAt: e.startedAt,
        completedAt: e.completedAt,
      })),
      instructorCourses: user.instructorCourses,
    };
  }

  async getUserProgress(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        enrollments: {
          include: {
            course: {
              select: {
                id: true,
                title: true,
              },
            },
            progress: {
              include: {
                module: {
                  select: {
                    id: true,
                    title: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    return user.enrollments.map((enrollment) => ({
      courseId: enrollment.courseId,
      courseTitle: enrollment.course.title,
      progress: enrollment.progressPercentage,
      status: enrollment.status,
      moduleProgress: enrollment.progress,
    }));
  }

  async getUserCertificates(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        enrollments: {
          where: {
            certificateIssued: true,
          },
          include: {
            certificate: {
              include: {
                template: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
            course: {
              select: {
                id: true,
                title: true,
                courseCode: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    return user.enrollments.map((enrollment) => ({
      certificate: enrollment.certificate,
      course: enrollment.course,
      issuedAt: enrollment.certificateIssuedAt,
    }));
  }
}

export default new UserService();
