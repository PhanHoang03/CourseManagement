import prisma from '../config/database';
import {
  NotFoundError,
  ConflictError,
  ForbiddenError,
  BadRequestError,
} from '../utils/errors';
import { CreateEnrollmentInput, UpdateEnrollmentInput, GetEnrollmentsQuery } from '../schemas/enrollment.schema';

class EnrollmentService {
  async getAllEnrollments(query: GetEnrollmentsQuery, requestingUserRole: string, requestingUserId?: string, requestingUserOrgId?: string) {
    // Ensure page and limit are numbers
    const page = typeof query.page === 'number' ? query.page : Number(query.page) || 1;
    const limit = typeof query.limit === 'number' ? query.limit : Number(query.limit) || 10;
    const { courseId, traineeId, status, search } = query;
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};

    // Course filtering
    if (courseId) {
      where.courseId = courseId;
    }

    // Trainee filtering
    if (traineeId) {
      where.traineeId = traineeId;
    } else if (requestingUserRole === 'trainee' && requestingUserId) {
      // Trainees can only see their own enrollments
      where.traineeId = requestingUserId;
    }

    // Status filtering
    if (status) {
      where.status = status;
    }

    // Search functionality
    if (search) {
      where.OR = [
        { trainee: { firstName: { contains: search, mode: 'insensitive' } } },
        { trainee: { lastName: { contains: search, mode: 'insensitive' } } },
        { trainee: { email: { contains: search, mode: 'insensitive' } } },
        { course: { title: { contains: search, mode: 'insensitive' } } },
        { course: { courseCode: { contains: search, mode: 'insensitive' } } },
      ];
    }

    // Organization filtering for non-admins (but not for trainees - they can see all their enrollments)
    // Trainees can enroll in public courses from any organization, so they should see all their enrollments
    if (requestingUserRole !== 'admin' && requestingUserRole !== 'trainee' && requestingUserOrgId) {
      where.course = {
        organizationId: requestingUserOrgId,
      };
    }

    // Get enrollments and total count
    const [enrollments, total] = await Promise.all([
      prisma.enrollment.findMany({
        where,
        skip,
        take: limit,
        select: {
          id: true,
          status: true,
          progressPercentage: true,
          enrollmentType: true,
          startedAt: true,
          completedAt: true,
          dueDate: true,
          certificateIssued: true,
          createdAt: true,
          trainee: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              employeeId: true,
            },
          },
          course: {
            select: {
              id: true,
              title: true,
              courseCode: true,
              description: true,
              status: true,
              thumbnailUrl: true,
              difficultyLevel: true,
              estimatedDuration: true,
              instructor: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                  photoUrl: true,
                },
              },
              organization: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      prisma.enrollment.count({ where }),
    ]);

    return {
      enrollments,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getEnrollmentById(enrollmentId: string, requestingUserRole: string, requestingUserId?: string, requestingUserOrgId?: string) {
    const enrollment = await prisma.enrollment.findUnique({
      where: { id: enrollmentId },
      include: {
        trainee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            employeeId: true,
            photoUrl: true,
          },
        },
        course: {
          select: {
            id: true,
            title: true,
            courseCode: true,
            status: true,
            instructor: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
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
              },
            },
          },
          orderBy: [
            { module: { order: 'asc' } },
            { content: { order: 'asc' } },
          ],
        },
        certificate: {
          select: {
            id: true,
            certificateNumber: true,
            issuedAt: true,
            pdfUrl: true,
          },
        },
      },
    });

    if (!enrollment) {
      throw new NotFoundError('Enrollment not found');
    }

    // Check access permissions
    if (requestingUserRole === 'trainee' && enrollment.traineeId !== requestingUserId) {
      throw new ForbiddenError('You can only view your own enrollments');
    }

    // If not admin, and organization context is present, check org membership
    // Note: course in 'enrollment' may not include organizationId, so fetch it
    if (requestingUserRole !== 'admin' && requestingUserOrgId) {
      const course = await prisma.course.findUnique({
        where: { id: enrollment.course.id },
        select: { organizationId: true },
      });
      if (!course || course.organizationId !== requestingUserOrgId) {
        throw new ForbiddenError('Access denied');
      }
    }

    return enrollment;
  }

  async createEnrollment(data: CreateEnrollmentInput, requestingUserId: string, requestingUserRole: string, requestingUserOrgId?: string) {
    // Only admins and instructors can create enrollments for others
    if (requestingUserRole !== 'admin' && requestingUserRole !== 'instructor') {
      throw new ForbiddenError('Only admins and instructors can create enrollments');
    }

    // Verify course exists
    const course = await prisma.course.findUnique({
      where: { id: data.courseId },
      include: {
        prerequisites: {
          where: {
            isMandatory: true,
          },
          include: {
            prerequisite: true,
          },
        },
      },
    });

    if (!course) {
      throw new NotFoundError('Course not found');
    }

    // Check organization access
    if (requestingUserRole !== 'admin' && requestingUserOrgId !== course.organizationId) {
      throw new ForbiddenError('Access denied');
    }

    // Check if course is published
    if (course.status !== 'published') {
      throw new BadRequestError('Cannot enroll in unpublished course');
    }

    // Verify trainee exists
    const trainee = await prisma.user.findUnique({
      where: { id: data.traineeId },
      select: {
        id: true,
        role: true,
        organizationId: true,
      },
    });

    if (!trainee) {
      throw new NotFoundError('Trainee not found');
    }

    if (trainee.role !== 'trainee') {
      throw new BadRequestError('User must be a trainee');
    }

    // Check organization match
    if (trainee.organizationId !== course.organizationId) {
      throw new BadRequestError('Trainee must belong to the same organization as the course');
    }

    // Check enrollment limit
    if (course.maxEnrollments) {
      const currentEnrollments = await prisma.enrollment.count({
        where: {
          courseId: data.courseId,
          status: { not: 'dropped' },
        },
      });

      if (currentEnrollments >= course.maxEnrollments) {
        throw new ConflictError('Course enrollment limit reached');
      }
    }

    // Check prerequisites
    if (course.prerequisites.length > 0) {
      const traineeCompletedCourses = await prisma.enrollment.findMany({
        where: {
          traineeId: data.traineeId,
          status: 'completed',
          courseId: {
            in: course.prerequisites.map(p => p.prerequisiteCourseId),
          },
        },
        select: {
          courseId: true,
        },
      });

      const completedCourseIds = traineeCompletedCourses.map(e => e.courseId);
      const missingPrerequisites = course.prerequisites.filter(
        p => !completedCourseIds.includes(p.prerequisiteCourseId)
      );

      if (missingPrerequisites.length > 0) {
        throw new BadRequestError(
          `Missing prerequisites: ${missingPrerequisites.map(p => p.prerequisite.title).join(', ')}`
        );
      }
    }

    // Check if already enrolled
    const existingEnrollment = await prisma.enrollment.findFirst({
      where: {
        courseId: data.courseId,
        traineeId: data.traineeId,
      },
    });

    if (existingEnrollment) {
      if (existingEnrollment.status === 'dropped') {
        // Re-enroll
        const reEnrollment = await prisma.enrollment.update({
          where: { id: existingEnrollment.id },
          data: {
            status: 'enrolled',
            startedAt: new Date(),
            enrollmentType: data.enrollmentType || 'assigned',
            enrolledBy: requestingUserId,
          },
        });
        return reEnrollment;
      }
      throw new ConflictError('Trainee is already enrolled in this course');
    }

    // Create enrollment
    const enrollment = await prisma.enrollment.create({
      data: {
        traineeId: data.traineeId,
        courseId: data.courseId,
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        enrollmentType: data.enrollmentType || 'assigned',
        enrolledBy: requestingUserId,
        status: 'enrolled',
        startedAt: new Date(),
      },
      include: {
        trainee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
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
    });

    return enrollment;
  }

  async updateEnrollment(
    enrollmentId: string,
    data: UpdateEnrollmentInput,
    requestingUserRole: string,
    requestingUserId?: string,
    requestingUserOrgId?: string
  ) {
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
      },
    });

    if (!enrollment) {
      throw new NotFoundError('Enrollment not found');
    }

    // Check permissions
    if (requestingUserRole === 'trainee' && enrollment.traineeId !== requestingUserId) {
      throw new ForbiddenError('You can only update your own enrollments');
    }

    if (requestingUserRole !== 'admin' && requestingUserOrgId && enrollment.course.organizationId !== requestingUserOrgId) {
      throw new ForbiddenError('Access denied');
    }

    // Update enrollment
    const updatedEnrollment = await prisma.enrollment.update({
      where: { id: enrollmentId },
      data: {
        status: data.status,
        progressPercentage: data.progressPercentage,
        dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
        ...(data.status === 'completed' && !enrollment.completedAt ? { completedAt: new Date() } : {}),
      },
      include: {
        trainee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
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
    });

    return updatedEnrollment;
  }

  async completeEnrollment(enrollmentId: string, requestingUserRole: string, requestingUserId?: string, requestingUserOrgId?: string) {
    const enrollment = await prisma.enrollment.findUnique({
      where: { id: enrollmentId },
      include: {
        course: {
          select: {
            id: true,
            organizationId: true,
            isCertified: true,
            certificateTemplateId: true,
          },
        },
      },
    });

    if (!enrollment) {
      throw new NotFoundError('Enrollment not found');
    }

    // Check permissions
    if (requestingUserRole === 'trainee' && enrollment.traineeId !== requestingUserId) {
      throw new ForbiddenError('You can only complete your own enrollments');
    }

    if (requestingUserRole !== 'admin' && requestingUserOrgId && enrollment.course.organizationId !== requestingUserOrgId) {
      throw new ForbiddenError('Access denied');
    }

    // Update enrollment to completed
    const updatedEnrollment = await prisma.enrollment.update({
      where: { id: enrollmentId },
      data: {
        status: 'completed',
        progressPercentage: 100,
        completedAt: enrollment.completedAt || new Date(),
      },
      include: {
        trainee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        course: {
          select: {
            id: true,
            title: true,
            courseCode: true,
            isCertified: true,
          },
        },
      },
    });

    return updatedEnrollment;
  }

  async dropEnrollment(enrollmentId: string, requestingUserRole: string, requestingUserId?: string, requestingUserOrgId?: string) {
    const enrollment = await prisma.enrollment.findUnique({
      where: { id: enrollmentId },
      include: {
        course: {
          select: {
            id: true,
            organizationId: true,
          },
        },
      },
    });

    if (!enrollment) {
      throw new NotFoundError('Enrollment not found');
    }

    // Check permissions
    if (requestingUserRole === 'trainee' && enrollment.traineeId !== requestingUserId) {
      throw new ForbiddenError('You can only drop your own enrollments');
    }

    if (requestingUserRole !== 'admin' && requestingUserOrgId && enrollment.course.organizationId !== requestingUserOrgId) {
      throw new ForbiddenError('Access denied');
    }

    if (enrollment.status === 'dropped') {
      throw new BadRequestError('Enrollment is already dropped');
    }

    // Update enrollment status to dropped
    const updatedEnrollment = await prisma.enrollment.update({
      where: { id: enrollmentId },
      data: {
        status: 'dropped',
      },
      select: {
        id: true,
        status: true,
      },
    });

    return updatedEnrollment;
  }

  async calculateEnrollmentProgress(enrollmentId: string) {
    const enrollment = await prisma.enrollment.findUnique({
      where: { id: enrollmentId },
      include: {
        course: {
          include: {
            modules: {
              include: {
                content: true,
                assessments: true,
              },
              orderBy: {
                order: 'asc',
              },
            },
          },
        },
        progress: true,
      },
    });

    if (!enrollment) {
      throw new NotFoundError('Enrollment not found');
    }

    const totalModules = enrollment.course.modules.length;
    if (totalModules === 0) {
      return { progressPercentage: 0 };
    }

    // Calculate progress based on completed modules and content
    let completedModules = 0;
    let totalContent = 0;
    let completedContent = 0;

    for (const module of enrollment.course.modules) {
      const moduleProgress = enrollment.progress.find(p => p.moduleId === module.id && !p.contentId);
      const isModuleCompleted = moduleProgress?.status === 'completed';

      if (isModuleCompleted) {
        completedModules++;
      }

      // Count content items
      const requiredContent = module.content.filter(c => c.isRequired);
      totalContent += requiredContent.length;

      // Count completed required content
      for (const content of requiredContent) {
        const contentProgress = enrollment.progress.find(
          p => p.moduleId === module.id && p.contentId === content.id
        );
        if (contentProgress?.status === 'completed') {
          completedContent++;
        }
      }
    }

    // Calculate overall progress (weighted: 70% modules, 30% content)
    const moduleProgress = totalModules > 0 ? (completedModules / totalModules) * 100 : 0;
    const contentProgress = totalContent > 0 ? (completedContent / totalContent) * 100 : 0;
    const overallProgress = (moduleProgress * 0.7) + (contentProgress * 0.3);

    // Update enrollment progress
    await prisma.enrollment.update({
      where: { id: enrollmentId },
      data: {
        progressPercentage: overallProgress,
        status: overallProgress === 100 ? 'completed' : overallProgress > 0 ? 'in_progress' : 'enrolled',
        ...(overallProgress === 100 && !enrollment.completedAt ? { completedAt: new Date() } : {}),
      },
    });

    return {
      progressPercentage: overallProgress,
      completedModules,
      totalModules,
      completedContent,
      totalContent,
    };
  }
}

export default new EnrollmentService();
