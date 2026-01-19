import prisma from '../config/database';
import {
  NotFoundError,
  ConflictError,
  ForbiddenError,
  BadRequestError,
} from '../utils/errors';
import { CreateCourseInput, UpdateCourseInput, GetCoursesQuery, AddPrerequisiteInput } from '../schemas/course.schema';

class CourseService {
  async getAllCourses(
    query: GetCoursesQuery,
    requestingUserRole: string,
    requestingUserOrgId?: string,
    requestingUserId?: string
  ) {
    // Ensure page and limit are numbers
    const page = typeof query.page === 'number' ? query.page : Number(query.page) || 1;
    const limit = typeof query.limit === 'number' ? query.limit : Number(query.limit) || 10;
    const { organizationId, departmentId, instructorId, status, difficultyLevel, isPublic, search, tags } = query;
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};

    // Organization filtering
    if (organizationId) {
      where.organizationId = organizationId;
    } else if (requestingUserRole !== 'admin' && requestingUserOrgId) {
      // Non-admins can only see courses in their organization
      where.organizationId = requestingUserOrgId;
    }

    // Department filtering
    if (departmentId) {
      where.departmentId = departmentId;
    }

    // Instructor filtering
    // Instructors should only see their own courses unless they're an admin
    if (requestingUserRole === 'instructor' && requestingUserId) {
      where.instructorId = requestingUserId;
    } else if (instructorId) {
      where.instructorId = instructorId;
    }

    // Status filtering
    if (status) {
      where.status = status;
    } else if (requestingUserRole === 'trainee') {
      // Trainees can only see published courses by default
      where.status = 'published';
    }

    // Difficulty level filtering
    if (difficultyLevel) {
      where.difficultyLevel = difficultyLevel;
    }

    // Public/Private filtering
    if (isPublic !== undefined) {
      where.isPublic = isPublic;
    }

    // Tags filtering
    if (tags) {
      const tagArray = tags.split(',').map(tag => tag.trim());
      where.tags = {
        hasEvery: tagArray,
      };
    }

    // Search functionality
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { courseCode: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Get courses and total count
    const [courses, total] = await Promise.all([
      prisma.course.findMany({
        where,
        skip,
        take: limit,
        select: {
          id: true,
          courseCode: true,
          title: true,
          description: true,
          thumbnailUrl: true,
          difficultyLevel: true,
          estimatedDuration: true,
          maxEnrollments: true,
          isCertified: true,
          status: true,
          isPublic: true,
          tags: true,
          createdAt: true,
          publishedAt: true,
          organization: {
            select: {
              id: true,
              name: true,
            },
          },
          instructor: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          department: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
          _count: {
            select: {
              enrollments: true,
              modules: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      prisma.course.count({ where }),
    ]);

    return {
      courses,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getPublicCourses(query: GetCoursesQuery, requestingUserRole?: string, requestingUserOrgId?: string) {
    // Ensure page and limit are numbers
    const page = typeof query.page === 'number' ? query.page : Number(query.page) || 1;
    const limit = typeof query.limit === 'number' ? query.limit : Number(query.limit) || 10;
    const { departmentId, instructorId, difficultyLevel, search, tags } = query;
    const skip = (page - 1) * limit;

    // Build where clause - only public, published courses
    const where: any = {
      isPublic: true,
      status: 'published',
    };

    // Organization filtering: trainees can only see courses from their own organization
    if (requestingUserRole === 'trainee' && requestingUserOrgId) {
      where.organizationId = requestingUserOrgId;
    }

    // Department filtering
    if (departmentId) {
      where.departmentId = departmentId;
    }

    // Instructor filtering
    if (instructorId) {
      where.instructorId = instructorId;
    }

    // Difficulty level filtering
    if (difficultyLevel) {
      where.difficultyLevel = difficultyLevel;
    }

    // Tags filtering
    if (tags) {
      const tagArray = tags.split(',').map(tag => tag.trim());
      where.tags = {
        hasEvery: tagArray,
      };
    }

    // Search functionality
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { courseCode: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Get courses and total count
    const [courses, total] = await Promise.all([
      prisma.course.findMany({
        where,
        skip,
        take: limit,
        select: {
          id: true,
          courseCode: true,
          title: true,
          description: true,
          thumbnailUrl: true,
          difficultyLevel: true,
          estimatedDuration: true,
          maxEnrollments: true,
          isCertified: true,
          status: true,
          isPublic: true,
          tags: true,
          createdAt: true,
          publishedAt: true,
          organization: {
            select: {
              id: true,
              name: true,
            },
          },
          instructor: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          department: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
          _count: {
            select: {
              enrollments: true,
              modules: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      prisma.course.count({ where }),
    ]);

    return {
      courses,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getCourseById(
    courseId: string,
    requestingUserRole: string,
    requestingUserOrgId?: string,
    requestingUserId?: string
  ) {
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: {
        id: true,
        courseCode: true,
        title: true,
        description: true,
        instructorId: true,
        departmentId: true,
        thumbnailUrl: true,
        difficultyLevel: true,
        estimatedDuration: true,
        maxEnrollments: true,
        isCertified: true,
        certificateTemplateId: true,
        status: true,
        isPublic: true,
        tags: true,
        metadata: true,
        createdAt: true,
        updatedAt: true,
        publishedAt: true,
        organization: {
          select: {
            id: true,
            name: true,
          },
        },
        instructor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            photoUrl: true,
          },
        },
        department: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        prerequisites: {
          include: {
            prerequisite: {
              select: {
                id: true,
                title: true,
                courseCode: true,
                status: true,
              },
            },
          },
        },
        requiredBy: {
          include: {
            course: {
              select: {
                id: true,
                title: true,
                courseCode: true,
                status: true,
              },
            },
          },
        },
        _count: {
          select: {
            enrollments: true,
            modules: true,
            assessments: true,
            assignments: true,
          },
        },
      },
    });

    if (!course) {
      throw new NotFoundError('Course not found');
    }

    // Check access permissions
    if (requestingUserRole === 'trainee' && course.status !== 'published') {
      throw new ForbiddenError('Course is not published');
    }

    // Instructors can only access courses they created
    if (requestingUserRole === 'instructor' && requestingUserId && course.instructorId !== requestingUserId) {
      throw new ForbiddenError('Access denied');
    }

    // Organization restriction: non-admins can only access courses from their own organization
    if (requestingUserRole !== 'admin' && requestingUserOrgId && course.organization.id !== requestingUserOrgId) {
      throw new ForbiddenError('Access denied');
    }

    return course;
  }

  async createCourse(data: CreateCourseInput, requestingUserId: string, requestingUserRole: string, requestingUserOrgId?: string) {
    // Only admins and instructors can create courses
    if (requestingUserRole !== 'admin' && requestingUserRole !== 'instructor') {
      throw new ForbiddenError('Only admins and instructors can create courses');
    }

    // Check organization access
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

    // Verify instructor exists and belongs to organization
    const instructor = await prisma.user.findUnique({
      where: { id: data.instructorId },
      select: {
        organizationId: true,
        role: true,
      },
    });

    if (!instructor) {
      throw new NotFoundError('Instructor not found');
    }

    if (instructor.role !== 'instructor' && instructor.role !== 'admin') {
      throw new BadRequestError('User must be an instructor or admin');
    }

    if (instructor.organizationId !== data.organizationId) {
      throw new BadRequestError('Instructor must belong to the same organization');
    }

    // Verify department if provided
    if (data.departmentId) {
      const department = await prisma.department.findUnique({
        where: { id: data.departmentId },
      });

      if (!department) {
        throw new NotFoundError('Department not found');
      }

      if (department.organizationId !== data.organizationId) {
        throw new BadRequestError('Department must belong to the same organization');
      }
    }

    // Check if course code already exists in organization
    const existingCourse = await prisma.course.findFirst({
      where: {
        organizationId: data.organizationId,
        courseCode: data.courseCode,
      },
    });

    if (existingCourse) {
      throw new ConflictError('Course code already exists in this organization');
    }

    // Use requesting user as instructor if not specified and they're an instructor
    const finalInstructorId = data.instructorId || (requestingUserRole === 'instructor' ? requestingUserId : data.instructorId);

    // Create course
    const course = await prisma.course.create({
      data: {
        organizationId: data.organizationId,
        courseCode: data.courseCode,
        title: data.title,
        description: data.description,
        instructorId: finalInstructorId,
        departmentId: data.departmentId,
        thumbnailUrl: data.thumbnailUrl,
        difficultyLevel: data.difficultyLevel || 'beginner',
        estimatedDuration: data.estimatedDuration,
        maxEnrollments: data.maxEnrollments,
        isCertified: data.isCertified || false,
        certificateTemplateId: data.certificateTemplateId,
        status: data.status || 'draft',
        isPublic: data.isPublic || false,
        tags: data.tags || [],
        metadata: data.metadata || {},
      },
      select: {
        id: true,
        courseCode: true,
        title: true,
        description: true,
        instructorId: true,
        departmentId: true,
        thumbnailUrl: true,
        difficultyLevel: true,
        estimatedDuration: true,
        status: true,
        isPublic: true,
        tags: true,
        createdAt: true,
        organization: {
          select: {
            id: true,
            name: true,
          },
        },
        instructor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        department: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
    });

    return course;
  }

  async updateCourse(
    courseId: string,
    data: UpdateCourseInput,
    requestingUserId: string,
    requestingUserRole: string,
    requestingUserOrgId?: string
  ) {
    const course = await prisma.course.findUnique({
      where: { id: courseId },
    });

    if (!course) {
      throw new NotFoundError('Course not found');
    }

    // Check permissions: instructors can only update their own courses, admins can update any
    if (requestingUserRole !== 'admin' && course.instructorId !== requestingUserId) {
      throw new ForbiddenError('You can only update your own courses');
    }

    // Check organization access
    if (requestingUserRole !== 'admin' && requestingUserOrgId !== course.organizationId) {
      throw new ForbiddenError('Access denied');
    }

    // Verify instructor if updating
    if (data.instructorId && data.instructorId !== course.instructorId) {
      const instructor = await prisma.user.findUnique({
        where: { id: data.instructorId },
        select: {
          organizationId: true,
          role: true,
        },
      });

      if (!instructor) {
        throw new NotFoundError('Instructor not found');
      }

      if (instructor.organizationId !== course.organizationId) {
        throw new BadRequestError('Instructor must belong to the same organization');
      }
    }

    // Verify department if updating
    if (data.departmentId && data.departmentId !== course.departmentId) {
      const department = await prisma.department.findUnique({
        where: { id: data.departmentId },
      });

      if (!department) {
        throw new NotFoundError('Department not found');
      }

      if (department.organizationId !== course.organizationId) {
        throw new BadRequestError('Department must belong to the same organization');
      }
    }

    // Check course code conflict if updating
    if (data.courseCode && data.courseCode !== course.courseCode) {
      const existingCourse = await prisma.course.findFirst({
        where: {
          organizationId: course.organizationId,
          courseCode: data.courseCode,
          id: { not: courseId },
        },
      });

      if (existingCourse) {
        throw new ConflictError('Course code already exists in this organization');
      }
    }

    // Update course
    const updatedCourse = await prisma.course.update({
      where: { id: courseId },
      data: {
        courseCode: data.courseCode,
        title: data.title,
        description: data.description,
        instructorId: data.instructorId,
        departmentId: data.departmentId,
        thumbnailUrl: data.thumbnailUrl,
        difficultyLevel: data.difficultyLevel,
        estimatedDuration: data.estimatedDuration,
        maxEnrollments: data.maxEnrollments,
        isCertified: data.isCertified,
        certificateTemplateId: data.certificateTemplateId,
        status: data.status,
        isPublic: data.isPublic,
        tags: data.tags,
        metadata: data.metadata,
        ...(data.status === 'published' && !course.publishedAt ? { publishedAt: new Date() } : {}),
      },
      select: {
        id: true,
        courseCode: true,
        title: true,
        description: true,
        instructorId: true,
        departmentId: true,
        thumbnailUrl: true,
        difficultyLevel: true,
        estimatedDuration: true,
        status: true,
        isPublic: true,
        tags: true,
        updatedAt: true,
        publishedAt: true,
        organization: {
          select: {
            id: true,
            name: true,
          },
        },
        instructor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        department: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
    });

    return updatedCourse;
  }

  async deleteCourse(courseId: string, requestingUserId: string, requestingUserRole: string, requestingUserOrgId?: string) {
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: {
        _count: {
          select: {
            enrollments: true,
            modules: true,
          },
        },
      },
    });

    if (!course) {
      throw new NotFoundError('Course not found');
    }

    // Check permissions
    if (requestingUserRole !== 'admin' && course.instructorId !== requestingUserId) {
      throw new ForbiddenError('You can only delete your own courses');
    }

    // Check organization access
    if (requestingUserRole !== 'admin' && requestingUserOrgId !== course.organizationId) {
      throw new ForbiddenError('Access denied');
    }

    // Prevent deletion if course has enrollments or modules
    if (course._count.enrollments > 0) {
      throw new ConflictError('Cannot delete course with existing enrollments');
    }

    if (course._count.modules > 0) {
      throw new ConflictError('Cannot delete course with existing modules');
    }

    // Delete course
    await prisma.course.delete({
      where: { id: courseId },
    });

    return { message: 'Course deleted successfully' };
  }

  async publishCourse(courseId: string, requestingUserId: string, requestingUserRole: string, requestingUserOrgId?: string) {
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: {
        _count: {
          select: {
            modules: true,
          },
        },
      },
    });

    if (!course) {
      throw new NotFoundError('Course not found');
    }

    // Check permissions
    if (requestingUserRole !== 'admin' && course.instructorId !== requestingUserId) {
      throw new ForbiddenError('You can only publish your own courses');
    }

    // Check organization access
    if (requestingUserRole !== 'admin' && requestingUserOrgId !== course.organizationId) {
      throw new ForbiddenError('Access denied');
    }

    // Require at least one module to publish
    if (course._count.modules === 0) {
      throw new BadRequestError('Course must have at least one module before publishing');
    }

    const updatedCourse = await prisma.course.update({
      where: { id: courseId },
      data: {
        status: 'published',
        publishedAt: course.publishedAt || new Date(),
      },
      select: {
        id: true,
        title: true,
        status: true,
        publishedAt: true,
      },
    });

    return updatedCourse;
  }

  async unpublishCourse(courseId: string, requestingUserId: string, requestingUserRole: string, requestingUserOrgId?: string) {
    const course = await prisma.course.findUnique({
      where: { id: courseId },
    });

    if (!course) {
      throw new NotFoundError('Course not found');
    }

    // Check permissions
    if (requestingUserRole !== 'admin' && course.instructorId !== requestingUserId) {
      throw new ForbiddenError('You can only unpublish your own courses');
    }

    // Check organization access
    if (requestingUserRole !== 'admin' && requestingUserOrgId !== course.organizationId) {
      throw new ForbiddenError('Access denied');
    }

    const updatedCourse = await prisma.course.update({
      where: { id: courseId },
      data: {
        status: 'draft',
      },
      select: {
        id: true,
        title: true,
        status: true,
      },
    });

    return updatedCourse;
  }

  async getCourseModules(courseId: string, requestingUserRole: string, requestingUserOrgId?: string) {
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: {
        id: true,
        organizationId: true,
        status: true,
      },
    });

    if (!course) {
      throw new NotFoundError('Course not found');
    }

    // Check access
    if (requestingUserRole === 'trainee' && course.status !== 'published') {
      throw new ForbiddenError('Course is not published');
    }

    if (requestingUserRole !== 'admin' && requestingUserOrgId && course.organizationId !== requestingUserOrgId) {
      throw new ForbiddenError('Access denied');
    }

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

  async getCourseEnrollments(courseId: string, requestingUserId: string, requestingUserRole: string, requestingUserOrgId?: string) {
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

    // Only course instructor or admin can view enrollments
    if (requestingUserRole !== 'admin' && course.instructorId !== requestingUserId) {
      throw new ForbiddenError('Only course instructor or admin can view enrollments');
    }

    // Check organization access
    if (requestingUserRole !== 'admin' && requestingUserOrgId !== course.organizationId) {
      throw new ForbiddenError('Access denied');
    }

    const enrollments = await prisma.enrollment.findMany({
      where: { courseId },
      select: {
        id: true,
        status: true,
        progressPercentage: true,
        startedAt: true,
        completedAt: true,
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
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return enrollments;
  }

  async getCourseStats(courseId: string, requestingUserId: string, requestingUserRole: string, requestingUserOrgId?: string) {
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

    // Only course instructor or admin can view stats
    if (requestingUserRole !== 'admin' && course.instructorId !== requestingUserId) {
      throw new ForbiddenError('Only course instructor or admin can view statistics');
    }

    // Check organization access
    if (requestingUserRole !== 'admin' && requestingUserOrgId !== course.organizationId) {
      throw new ForbiddenError('Access denied');
    }

    const [enrollmentCount, completedCount, moduleCount, averageProgress] = await Promise.all([
      prisma.enrollment.count({ where: { courseId } }),
      prisma.enrollment.count({ where: { courseId, status: 'completed' } }),
      prisma.module.count({ where: { courseId } }),
      prisma.enrollment.aggregate({
        where: { courseId },
        _avg: {
          progressPercentage: true,
        },
      }),
    ]);

    return {
      course: {
        id: course.id,
      },
      stats: {
        totalEnrollments: enrollmentCount,
        completedEnrollments: completedCount,
        completionRate: enrollmentCount > 0 ? (completedCount / enrollmentCount) * 100 : 0,
        totalModules: moduleCount,
        averageProgress: averageProgress._avg.progressPercentage || 0,
      },
    };
  }

  async getCoursePrerequisites(courseId: string) {
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: {
        prerequisites: {
          include: {
            prerequisite: {
              select: {
                id: true,
                title: true,
                courseCode: true,
                status: true,
                difficultyLevel: true,
              },
            },
          },
        },
      },
    });

    if (!course) {
      throw new NotFoundError('Course not found');
    }

    return course.prerequisites.map((prereq) => ({
      id: prereq.id,
      prerequisiteCourse: prereq.prerequisite,
      isMandatory: prereq.isMandatory,
      createdAt: prereq.createdAt,
    }));
  }

  async addPrerequisite(
    courseId: string,
    data: AddPrerequisiteInput,
    requestingUserId: string,
    requestingUserRole: string,
    requestingUserOrgId?: string
  ) {
    const course = await prisma.course.findUnique({
      where: { id: courseId },
    });

    if (!course) {
      throw new NotFoundError('Course not found');
    }

    // Check permissions
    if (requestingUserRole !== 'admin' && course.instructorId !== requestingUserId) {
      throw new ForbiddenError('You can only modify prerequisites for your own courses');
    }

    // Check organization access
    if (requestingUserRole !== 'admin' && requestingUserOrgId !== course.organizationId) {
      throw new ForbiddenError('Access denied');
    }

    // Verify prerequisite course exists and is in same organization
    const prerequisiteCourse = await prisma.course.findUnique({
      where: { id: data.prerequisiteCourseId },
    });

    if (!prerequisiteCourse) {
      throw new NotFoundError('Prerequisite course not found');
    }

    if (prerequisiteCourse.organizationId !== course.organizationId) {
      throw new BadRequestError('Prerequisite course must be in the same organization');
    }

    // Prevent self-prerequisite
    if (courseId === data.prerequisiteCourseId) {
      throw new BadRequestError('Course cannot be a prerequisite of itself');
    }

    // Check if prerequisite already exists
    const existingPrereq = await prisma.coursePrerequisite.findFirst({
      where: {
        courseId,
        prerequisiteCourseId: data.prerequisiteCourseId,
      },
    });

    if (existingPrereq) {
      throw new ConflictError('Prerequisite already exists');
    }

    // Create prerequisite
    const prerequisite = await prisma.coursePrerequisite.create({
      data: {
        courseId,
        prerequisiteCourseId: data.prerequisiteCourseId,
        isMandatory: data.isMandatory !== undefined ? data.isMandatory : true,
      },
      include: {
        prerequisite: {
          select: {
            id: true,
            title: true,
            courseCode: true,
            status: true,
          },
        },
      },
    });

    return prerequisite;
  }

  async removePrerequisite(
    courseId: string,
    prerequisiteId: string,
    requestingUserId: string,
    requestingUserRole: string,
    requestingUserOrgId?: string
  ) {
    const prerequisite = await prisma.coursePrerequisite.findUnique({
      where: { id: prerequisiteId },
      include: {
        course: {
          select: {
            id: true,
            instructorId: true,
            organizationId: true,
          },
        },
      },
    });

    if (!prerequisite) {
      throw new NotFoundError('Prerequisite not found');
    }

    if (prerequisite.courseId !== courseId) {
      throw new BadRequestError('Prerequisite does not belong to this course');
    }

    // Check permissions
    if (requestingUserRole !== 'admin' && prerequisite.course.instructorId !== requestingUserId) {
      throw new ForbiddenError('You can only modify prerequisites for your own courses');
    }

    // Check organization access
    if (requestingUserRole !== 'admin' && requestingUserOrgId !== prerequisite.course.organizationId) {
      throw new ForbiddenError('Access denied');
    }

    await prisma.coursePrerequisite.delete({
      where: { id: prerequisiteId },
    });

    return { message: 'Prerequisite removed successfully' };
  }

  async enrollInCourse(
    courseId: string,
    traineeId: string,
    dueDate?: Date,
    requestingUserRole?: string
  ) {
    const course = await prisma.course.findUnique({
      where: { id: courseId },
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

    // Check if course is published
    if (course.status !== 'published') {
      throw new BadRequestError('Course is not published');
    }

    // Check enrollment limit
    if (course.maxEnrollments) {
      const currentEnrollments = await prisma.enrollment.count({
        where: { courseId, status: { not: 'dropped' } },
      });

      if (currentEnrollments >= course.maxEnrollments) {
        throw new ConflictError('Course enrollment limit reached');
      }
    }

    // Check if already enrolled
    const existingEnrollment = await prisma.enrollment.findFirst({
      where: {
        courseId,
        traineeId,
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
          },
        });
        return reEnrollment;
      }
      throw new ConflictError('Already enrolled in this course');
    }

    // Check prerequisites
    if (course.prerequisites.length > 0) {
      const traineeCompletedCourses = await prisma.enrollment.findMany({
        where: {
          traineeId,
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

    // Create enrollment
    const enrollment = await prisma.enrollment.create({
      data: {
        traineeId,
        courseId,
        dueDate,
        status: 'enrolled',
        startedAt: new Date(),
      },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            courseCode: true,
          },
        },
        trainee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    return enrollment;
  }

  async unenrollFromCourse(courseId: string, traineeId: string) {
    const enrollment = await prisma.enrollment.findFirst({
      where: {
        courseId,
        traineeId,
      },
    });

    if (!enrollment) {
      throw new NotFoundError('Enrollment not found');
    }

    if (enrollment.status === 'dropped') {
      throw new BadRequestError('Already unenrolled from this course');
    }

    // Update enrollment status to dropped
    const updatedEnrollment = await prisma.enrollment.update({
      where: { id: enrollment.id },
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
}

export default new CourseService();
