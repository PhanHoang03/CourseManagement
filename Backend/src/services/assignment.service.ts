import prisma from '../config/database';
import { NotFoundError, ForbiddenError, BadRequestError } from '../utils/errors';
import {
  CreateAssignmentInput,
  UpdateAssignmentInput,
  GetAssignmentsQuery,
  SubmitAssignmentInput,
  GradeAssignmentInput,
  GetSubmissionsQuery,
} from '../schemas/assignment.schema';
import logger from '../utils/logger';

export default {
  // Assignment CRUD
  async getAllAssignments(query: GetAssignmentsQuery, requestingUserId: string, requestingUserRole: string, requestingUserOrgId?: string) {
    const page = typeof query.page === 'number' ? query.page : Number(query.page) || 1;
    const limit = typeof query.limit === 'number' ? query.limit : Number(query.limit) || 10;
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};

    // Organization-based filtering (multi-tenancy)
    if (requestingUserRole !== 'admin') {
      where.course = {
        organizationId: requestingUserOrgId,
      };
    }

    if (query.courseId) {
      where.courseId = query.courseId;
    }

    if (query.moduleId) {
      where.moduleId = query.moduleId;
    }

    if (query.search) {
      where.OR = [
        { title: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    // Get assignments and total count
    const [assignments, total] = await Promise.all([
      prisma.assignment.findMany({
        where,
        skip,
        take: limit,
        select: {
          id: true,
          courseId: true,
          moduleId: true,
          title: true,
          description: true,
          instructions: true,
          dueDate: true,
          maxScore: true,
          isRequired: true,
          createdBy: true,
          createdAt: true,
          updatedAt: true,
          course: {
            select: {
              id: true,
              title: true,
              courseCode: true,
              organizationId: true,
            },
          },
          _count: {
            select: {
              submissions: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      prisma.assignment.count({ where }),
    ]);

    return {
      data: assignments,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  async getAssignmentById(id: string, requestingUserId: string, requestingUserRole: string, requestingUserOrgId?: string) {
    const assignment = await prisma.assignment.findUnique({
      where: { id },
      select: {
        id: true,
        courseId: true,
        moduleId: true,
        title: true,
        description: true,
        instructions: true,
        dueDate: true,
        maxScore: true,
        isRequired: true,
        createdBy: true,
        createdAt: true,
        updatedAt: true,
        course: {
          select: {
            id: true,
            title: true,
            courseCode: true,
            organizationId: true,
            instructorId: true,
          },
        },
        _count: {
          select: {
            submissions: true,
          },
        },
      },
    });

    if (!assignment) {
      throw new NotFoundError('Assignment not found');
    }

    // Organization access check
    if (requestingUserRole !== 'admin' && assignment.course.organizationId !== requestingUserOrgId) {
      throw new ForbiddenError('Access denied to this assignment');
    }

    return assignment;
  },

  async createAssignment(data: CreateAssignmentInput, requestingUserId: string, requestingUserRole: string, requestingUserOrgId?: string) {
    // Permission check
    if (requestingUserRole !== 'admin' && requestingUserRole !== 'instructor') {
      throw new ForbiddenError('Only admins and instructors can create assignments');
    }

    // Verify course exists and user has access
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

    // Organization access check
    if (requestingUserRole !== 'admin' && course.organizationId !== requestingUserOrgId) {
      throw new ForbiddenError('Access denied to this course');
    }

    // Instructor can only create assignments for their own courses
    if (requestingUserRole === 'instructor' && course.instructorId !== requestingUserId) {
      throw new ForbiddenError('You can only create assignments for your own courses');
    }

    // Verify module if provided
    if (data.moduleId) {
      const module = await prisma.module.findUnique({
        where: { id: data.moduleId },
        select: { courseId: true },
      });

      if (!module) {
        throw new NotFoundError('Module not found');
      }

      if (module.courseId !== data.courseId) {
        throw new BadRequestError('Module does not belong to the specified course');
      }
    }

    // Parse dueDate if provided
    let dueDate: Date | null = null;
    if (data.dueDate && data.dueDate !== '') {
      dueDate = new Date(data.dueDate);
    }

    // Create assignment
    const assignment = await prisma.assignment.create({
      data: {
        courseId: data.courseId,
        moduleId: data.moduleId || null,
        title: data.title,
        description: data.description || null,
        instructions: data.instructions || null,
        dueDate,
        maxScore: data.maxScore || 100,
        isRequired: data.isRequired !== undefined ? data.isRequired : true,
        createdBy: requestingUserId,
      },
      select: {
        id: true,
        courseId: true,
        moduleId: true,
        title: true,
        description: true,
        instructions: true,
        dueDate: true,
        maxScore: true,
        isRequired: true,
        createdBy: true,
        createdAt: true,
        course: {
          select: {
            id: true,
            title: true,
            courseCode: true,
          },
        },
      },
    });

    logger.info(`Assignment created: ${assignment.id} by user ${requestingUserId}`);
    return assignment;
  },

  async updateAssignment(id: string, data: UpdateAssignmentInput, requestingUserId: string, requestingUserRole: string, requestingUserOrgId?: string) {
    // Get existing assignment
    const assignment = await prisma.assignment.findUnique({
      where: { id },
      select: {
        id: true,
        course: {
          select: {
            id: true,
            organizationId: true,
            instructorId: true,
          },
        },
      },
    });

    if (!assignment) {
      throw new NotFoundError('Assignment not found');
    }

    // Permission check
    if (requestingUserRole !== 'admin' && requestingUserRole !== 'instructor') {
      throw new ForbiddenError('Only admins and instructors can update assignments');
    }

    // Organization access check
    if (requestingUserRole !== 'admin' && assignment.course.organizationId !== requestingUserOrgId) {
      throw new ForbiddenError('Access denied to this assignment');
    }

    // Instructor can only update assignments for their own courses
    if (requestingUserRole === 'instructor' && assignment.course.instructorId !== requestingUserId) {
      throw new ForbiddenError('You can only update assignments for your own courses');
    }

    // Parse dueDate if provided
    let dueDate: Date | null | undefined = undefined;
    if (data.dueDate !== undefined) {
      dueDate = data.dueDate && data.dueDate !== '' ? new Date(data.dueDate) : null;
    }

    // Update assignment
    const updated = await prisma.assignment.update({
      where: { id },
      data: {
        title: data.title,
        description: data.description,
        instructions: data.instructions,
        dueDate,
        maxScore: data.maxScore,
        isRequired: data.isRequired,
      },
      select: {
        id: true,
        courseId: true,
        moduleId: true,
        title: true,
        description: true,
        instructions: true,
        dueDate: true,
        maxScore: true,
        isRequired: true,
        createdBy: true,
        updatedAt: true,
        course: {
          select: {
            id: true,
            title: true,
            courseCode: true,
          },
        },
      },
    });

    logger.info(`Assignment updated: ${id} by user ${requestingUserId}`);
    return updated;
  },

  async deleteAssignment(id: string, requestingUserId: string, requestingUserRole: string, requestingUserOrgId?: string) {
    // Get existing assignment
    const assignment = await prisma.assignment.findUnique({
      where: { id },
      select: {
        id: true,
        course: {
          select: {
            id: true,
            organizationId: true,
            instructorId: true,
          },
        },
      },
    });

    if (!assignment) {
      throw new NotFoundError('Assignment not found');
    }

    // Permission check
    if (requestingUserRole !== 'admin' && requestingUserRole !== 'instructor') {
      throw new ForbiddenError('Only admins and instructors can delete assignments');
    }

    // Organization access check
    if (requestingUserRole !== 'admin' && assignment.course.organizationId !== requestingUserOrgId) {
      throw new ForbiddenError('Access denied to this assignment');
    }

    // Instructor can only delete assignments for their own courses
    if (requestingUserRole === 'instructor' && assignment.course.instructorId !== requestingUserId) {
      throw new ForbiddenError('You can only delete assignments for your own courses');
    }

    await prisma.assignment.delete({
      where: { id },
    });

    logger.info(`Assignment deleted: ${id} by user ${requestingUserId}`);
  },

  // Assignment Submission methods
  async submitAssignment(data: SubmitAssignmentInput, requestingUserId: string, requestingUserRole: string) {
    // Only trainees can submit assignments
    if (requestingUserRole !== 'trainee') {
      throw new ForbiddenError('Only trainees can submit assignments');
    }

    // Verify assignment exists
    const assignment = await prisma.assignment.findUnique({
      where: { id: data.assignmentId },
      select: {
        id: true,
        courseId: true,
        dueDate: true,
      },
    });

    if (!assignment) {
      throw new NotFoundError('Assignment not found');
    }

    // Verify enrollment exists and belongs to the trainee
    const enrollment = await prisma.enrollment.findUnique({
      where: { id: data.enrollmentId },
      select: {
        id: true,
        traineeId: true,
        courseId: true,
      },
    });

    if (!enrollment) {
      throw new NotFoundError('Enrollment not found');
    }

    if (enrollment.traineeId !== requestingUserId) {
      throw new ForbiddenError('You can only submit assignments for your own enrollments');
    }

    if (enrollment.courseId !== assignment.courseId) {
      throw new BadRequestError('Enrollment does not match assignment course');
    }

    // Check if submission already exists
    const existingSubmission = await prisma.assignmentSubmission.findUnique({
      where: {
        assignmentId_enrollmentId: {
          assignmentId: data.assignmentId,
          enrollmentId: data.enrollmentId,
        },
      },
    });

    if (existingSubmission) {
      throw new BadRequestError('Assignment already submitted. Use update instead.');
    }

    // Check if due date has passed (warning only, allow submission)
    const now = new Date();
    if (assignment.dueDate && new Date(assignment.dueDate) < now) {
      logger.warn(`Assignment ${assignment.id} submitted after due date by user ${requestingUserId}`);
    }

    // Create submission
    const submission = await prisma.assignmentSubmission.create({
      data: {
        assignmentId: data.assignmentId,
        enrollmentId: data.enrollmentId,
        traineeId: requestingUserId,
        submissionText: data.submissionText || null,
        submissionFiles: data.submissionFiles || [],
        status: 'submitted',
      },
      select: {
        id: true,
        assignmentId: true,
        enrollmentId: true,
        traineeId: true,
        submissionText: true,
        submissionFiles: true,
        score: true,
        feedback: true,
        status: true,
        submittedAt: true,
        assignment: {
          select: {
            id: true,
            title: true,
            maxScore: true,
          },
        },
        enrollment: {
          select: {
            id: true,
            course: {
              select: {
                id: true,
                title: true,
              },
            },
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

    logger.info(`Assignment submitted: ${submission.id} by user ${requestingUserId}`);
    return submission;
  },

  async getAllSubmissions(query: GetSubmissionsQuery, requestingUserId: string, requestingUserRole: string, requestingUserOrgId?: string) {
    const page = typeof query.page === 'number' ? query.page : Number(query.page) || 1;
    const limit = typeof query.limit === 'number' ? query.limit : Number(query.limit) || 10;
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};

    // Trainees can only see their own submissions
    if (requestingUserRole === 'trainee') {
      where.traineeId = requestingUserId;
    } else {
      // Admins and instructors can see all submissions within their organization
      if (requestingUserOrgId) {
        where.enrollment = {
          course: {
            organizationId: requestingUserOrgId,
          },
        };
      }
    }

    if (query.assignmentId) {
      where.assignmentId = query.assignmentId;
    }

    if (query.enrollmentId) {
      where.enrollmentId = query.enrollmentId;
    }

    if (query.traineeId && (requestingUserRole === 'admin' || requestingUserRole === 'instructor')) {
      where.traineeId = query.traineeId;
    }

    if (query.status) {
      where.status = query.status;
    }

    // Get submissions and total count
    const [submissions, total] = await Promise.all([
      prisma.assignmentSubmission.findMany({
        where,
        skip,
        take: limit,
        select: {
          id: true,
          assignmentId: true,
          enrollmentId: true,
          traineeId: true,
          submissionText: true,
          submissionFiles: true,
          score: true,
          feedback: true,
          status: true,
          submittedAt: true,
          gradedAt: true,
          gradedBy: true,
          createdAt: true,
          assignment: {
            select: {
              id: true,
              title: true,
              maxScore: true,
              dueDate: true,
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
          grader: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: {
          submittedAt: 'desc',
        },
      }),
      prisma.assignmentSubmission.count({ where }),
    ]);

    return {
      data: submissions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  async getSubmissionById(id: string, requestingUserId: string, requestingUserRole: string, requestingUserOrgId?: string) {
    const submission = await prisma.assignmentSubmission.findUnique({
      where: { id },
      select: {
        id: true,
        assignmentId: true,
        enrollmentId: true,
        traineeId: true,
        submissionText: true,
        submissionFiles: true,
        score: true,
        feedback: true,
        status: true,
        submittedAt: true,
        gradedAt: true,
        gradedBy: true,
        createdAt: true,
        assignment: {
          select: {
            id: true,
            title: true,
            description: true,
            instructions: true,
            maxScore: true,
            dueDate: true,
            course: {
              select: {
                id: true,
                title: true,
                organizationId: true,
              },
            },
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
        grader: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        enrollment: {
          select: {
            id: true,
            courseId: true,
          },
        },
      },
    });

    if (!submission) {
      throw new NotFoundError('Submission not found');
    }

    // Access control
    if (requestingUserRole === 'trainee') {
      if (submission.traineeId !== requestingUserId) {
        throw new ForbiddenError('Access denied to this submission');
      }
    } else {
      // Admin and instructor access check
      if (requestingUserOrgId && submission.assignment.course.organizationId !== requestingUserOrgId) {
        throw new ForbiddenError('Access denied to this submission');
      }
    }

    return submission;
  },

  async gradeAssignment(id: string, data: GradeAssignmentInput, requestingUserId: string, requestingUserRole: string, requestingUserOrgId?: string) {
    // Only admins and instructors can grade assignments
    if (requestingUserRole !== 'admin' && requestingUserRole !== 'instructor') {
      throw new ForbiddenError('Only admins and instructors can grade assignments');
    }

    // Get submission
    const submission = await prisma.assignmentSubmission.findUnique({
      where: { id },
      select: {
        id: true,
        assignment: {
          select: {
            id: true,
            maxScore: true,
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

    if (!submission) {
      throw new NotFoundError('Submission not found');
    }

    // Organization access check
    if (requestingUserRole !== 'admin' && submission.assignment.course.organizationId !== requestingUserOrgId) {
      throw new ForbiddenError('Access denied to this submission');
    }

    // Instructor can only grade assignments for their own courses
    if (requestingUserRole === 'instructor' && submission.assignment.course.instructorId !== requestingUserId) {
      throw new ForbiddenError('You can only grade assignments for your own courses');
    }

    // Validate score
    if (data.score > submission.assignment.maxScore) {
      throw new BadRequestError(`Score cannot exceed maximum score of ${submission.assignment.maxScore}`);
    }

    // Update submission
    const updated = await prisma.assignmentSubmission.update({
      where: { id },
      data: {
        score: data.score,
        feedback: data.feedback || null,
        status: data.status || 'graded',
        gradedBy: requestingUserId,
        gradedAt: new Date(),
      },
      select: {
        id: true,
        assignmentId: true,
        enrollmentId: true,
        traineeId: true,
        submissionText: true,
        submissionFiles: true,
        score: true,
        feedback: true,
        status: true,
        submittedAt: true,
        gradedAt: true,
        gradedBy: true,
        assignment: {
          select: {
            id: true,
            title: true,
            maxScore: true,
          },
        },
        trainee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        grader: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    logger.info(`Assignment graded: ${id} by user ${requestingUserId} with score ${data.score}`);
    return updated;
  },
};
