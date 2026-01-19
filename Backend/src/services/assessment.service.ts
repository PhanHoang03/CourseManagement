import prisma from '../config/database';
import { NotFoundError, ForbiddenError, BadRequestError } from '../utils/errors';
import {
  CreateAssessmentInput,
  UpdateAssessmentInput,
  GetAssessmentsQuery,
  SubmitAssessmentInput,
  GetAttemptsQuery,
} from '../schemas/assessment.schema';
import logger from '../utils/logger';

class AssessmentService {
  // Get all assessments
  async getAllAssessments(query: GetAssessmentsQuery, requestingUserId: string, requestingUserRole: string, requestingUserOrgId?: string) {
    const page = typeof query.page === 'number' ? query.page : Number(query.page) || 1;
    const limit = typeof query.limit === 'number' ? query.limit : Number(query.limit) || 10;
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};

    // Organization-based filtering
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

    if (query.type) {
      where.type = query.type;
    }

    if (query.search) {
      where.OR = [
        { title: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    // Get assessments and total count
    const [assessments, total] = await Promise.all([
      prisma.assessment.findMany({
        where,
        skip,
        take: limit,
        select: {
          id: true,
          courseId: true,
          moduleId: true,
          title: true,
          description: true,
          type: true,
          passingScore: true,
          maxAttempts: true,
          timeLimit: true,
          isRequired: true,
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
          module: {
            select: {
              id: true,
              title: true,
            },
          },
          _count: {
            select: {
              attempts: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      prisma.assessment.count({ where }),
    ]);

    return {
      data: assessments,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // Get assessment by ID
  async getAssessmentById(id: string, requestingUserId: string, requestingUserRole: string, requestingUserOrgId?: string) {
    const assessment = await prisma.assessment.findUnique({
      where: { id },
      select: {
        id: true,
        courseId: true,
        moduleId: true,
        title: true,
        description: true,
        type: true,
        passingScore: true,
        maxAttempts: true,
        timeLimit: true,
        isRequired: true,
        questions: true,
        settings: true,
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
        module: {
          select: {
            id: true,
            title: true,
          },
        },
        _count: {
          select: {
            attempts: true,
          },
        },
      },
    });

    if (!assessment) {
      throw new NotFoundError('Assessment not found');
    }

    // Access control: For trainees, check enrollment; for instructors/admins, check organization
    if (requestingUserRole === 'trainee') {
      // Check if trainee is enrolled in the course (status: 'enrolled', 'in_progress', or 'completed')
      const enrollment = await prisma.enrollment.findFirst({
        where: {
          courseId: assessment.courseId,
          traineeId: requestingUserId,
          status: {
            in: ['enrolled', 'in_progress', 'completed'],
          },
        },
      });

      if (!enrollment) {
        throw new ForbiddenError('Access denied to this assessment. You must be enrolled in the course.');
      }
    } else if (requestingUserRole !== 'admin' && assessment.course.organizationId !== requestingUserOrgId) {
      // For instructors/admins, check organization access
      throw new ForbiddenError('Access denied to this assessment');
    }

    // For trainees, don't show correct answers until after submission
    if (requestingUserRole === 'trainee') {
      const assessmentCopy = { ...assessment };
      if (assessmentCopy.questions && Array.isArray(assessmentCopy.questions)) {
        assessmentCopy.questions = (assessmentCopy.questions as any[]).map((q: any) => ({
          ...q,
          correctAnswers: undefined, // Hide correct answers
        }));
      }
      return assessmentCopy;
    }

    return assessment;
  }

  // Create assessment
  async createAssessment(data: CreateAssessmentInput, requestingUserId: string, requestingUserRole: string, requestingUserOrgId?: string) {
    // Permission check
    if (requestingUserRole !== 'admin' && requestingUserRole !== 'instructor') {
      throw new ForbiddenError('Only admins and instructors can create assessments');
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

    // Instructor can only create assessments for their own courses
    if (requestingUserRole === 'instructor' && course.instructorId !== requestingUserId) {
      throw new ForbiddenError('You can only create assessments for your own courses');
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

    // Convert timeLimit from minutes to seconds if provided
    const timeLimitSeconds = data.timeLimit ? data.timeLimit * 60 : null;

    // Prepare settings
    const settings = data.settings || {
      passingScore: data.passingScore || 70,
      allowRetake: true,
      randomizeQuestions: false,
      showResultsImmediately: true,
    };

    // Create assessment
    const assessment = await prisma.assessment.create({
      data: {
        courseId: data.courseId,
        moduleId: data.moduleId || null,
        title: data.title,
        description: data.description || null,
        type: data.type || 'quiz',
        passingScore: data.passingScore || 70,
        maxAttempts: data.maxAttempts || null,
        timeLimit: timeLimitSeconds,
        isRequired: data.isRequired !== undefined ? data.isRequired : true,
        questions: data.questions as any,
        settings: settings as any,
      },
      select: {
        id: true,
        courseId: true,
        moduleId: true,
        title: true,
        description: true,
        type: true,
        passingScore: true,
        maxAttempts: true,
        timeLimit: true,
        isRequired: true,
        questions: true,
        settings: true,
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

    logger.info(`Assessment created: ${assessment.id} by user ${requestingUserId}`);
    return assessment;
  }

  // Update assessment
  async updateAssessment(id: string, data: UpdateAssessmentInput, requestingUserId: string, requestingUserRole: string, requestingUserOrgId?: string) {
    // Get existing assessment
    const assessment = await prisma.assessment.findUnique({
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

    if (!assessment) {
      throw new NotFoundError('Assessment not found');
    }

    // Permission check
    if (requestingUserRole !== 'admin' && requestingUserRole !== 'instructor') {
      throw new ForbiddenError('Only admins and instructors can update assessments');
    }

    // Organization access check
    if (requestingUserRole !== 'admin' && assessment.course.organizationId !== requestingUserOrgId) {
      throw new ForbiddenError('Access denied to this assessment');
    }

    // Instructor can only update assessments for their own courses
    if (requestingUserRole === 'instructor' && assessment.course.instructorId !== requestingUserId) {
      throw new ForbiddenError('You can only update assessments for your own courses');
    }

    // Convert timeLimit from minutes to seconds if provided
    let timeLimitSeconds: number | null | undefined = undefined;
    if (data.timeLimit !== undefined) {
      timeLimitSeconds = data.timeLimit ? data.timeLimit * 60 : null;
    }

    // Update assessment
    const updated = await prisma.assessment.update({
      where: { id },
      data: {
        title: data.title,
        description: data.description,
        type: data.type,
        passingScore: data.passingScore,
        maxAttempts: data.maxAttempts,
        timeLimit: timeLimitSeconds,
        isRequired: data.isRequired,
        questions: data.questions as any,
        settings: data.settings as any,
      },
      select: {
        id: true,
        courseId: true,
        moduleId: true,
        title: true,
        description: true,
        type: true,
        passingScore: true,
        maxAttempts: true,
        timeLimit: true,
        isRequired: true,
        questions: true,
        settings: true,
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

    logger.info(`Assessment updated: ${id} by user ${requestingUserId}`);
    return updated;
  }

  // Delete assessment
  async deleteAssessment(id: string, requestingUserId: string, requestingUserRole: string, requestingUserOrgId?: string) {
    // Get existing assessment
    const assessment = await prisma.assessment.findUnique({
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
        _count: {
          select: {
            attempts: true,
          },
        },
      },
    });

    if (!assessment) {
      throw new NotFoundError('Assessment not found');
    }

    // Permission check
    if (requestingUserRole !== 'admin' && requestingUserRole !== 'instructor') {
      throw new ForbiddenError('Only admins and instructors can delete assessments');
    }

    // Organization access check
    if (requestingUserRole !== 'admin' && assessment.course.organizationId !== requestingUserOrgId) {
      throw new ForbiddenError('Access denied to this assessment');
    }

    // Instructor can only delete assessments for their own courses
    if (requestingUserRole === 'instructor' && assessment.course.instructorId !== requestingUserId) {
      throw new ForbiddenError('You can only delete assessments for your own courses');
    }

    // Check if there are attempts (warn but allow deletion)
    if (assessment._count.attempts > 0) {
      logger.warn(`Deleting assessment ${id} with ${assessment._count.attempts} attempts`);
    }

    await prisma.assessment.delete({
      where: { id },
    });

    logger.info(`Assessment deleted: ${id} by user ${requestingUserId}`);
    return { success: true };
  }

  // Submit assessment attempt
  async submitAssessment(data: SubmitAssessmentInput, requestingUserId: string, requestingUserRole: string) {
    // Only trainees can submit assessments
    if (requestingUserRole !== 'trainee') {
      throw new ForbiddenError('Only trainees can submit assessments');
    }

    // Verify assessment exists
    const assessment = await prisma.assessment.findUnique({
      where: { id: data.assessmentId },
      select: {
        id: true,
        courseId: true,
        questions: true,
        passingScore: true,
        maxAttempts: true,
        timeLimit: true,
        settings: true,
      },
    });

    if (!assessment) {
      throw new NotFoundError('Assessment not found');
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
      throw new ForbiddenError('You can only submit assessments for your own enrollments');
    }

    if (enrollment.courseId !== assessment.courseId) {
      throw new BadRequestError('Enrollment does not match assessment course');
    }

    // Check max attempts
    if (assessment.maxAttempts) {
      const existingAttempts = await prisma.assessmentAttempt.count({
        where: {
          assessmentId: data.assessmentId,
          enrollmentId: data.enrollmentId,
        },
      });

      if (existingAttempts >= assessment.maxAttempts) {
        throw new BadRequestError(`Maximum attempts (${assessment.maxAttempts}) reached for this assessment`);
      }
    }

    // Calculate score
    const questions = assessment.questions as any[];
    let totalPoints = 0;
    let earnedPoints = 0;

    questions.forEach((question: any) => {
      totalPoints += question.points || 10;
      const userAnswer = data.answers[question.id];
      const correctAnswer = question.correctAnswers;

      if (question.type === 'multiple-choice' || question.type === 'true-false') {
        // Single answer
        if (userAnswer === correctAnswer || userAnswer === (Array.isArray(correctAnswer) ? correctAnswer[0] : correctAnswer)) {
          earnedPoints += question.points || 10;
        }
      } else if (question.type === 'multiple-select') {
        // Multiple answers - check if arrays match
        const userAnswersArray = Array.isArray(userAnswer) ? userAnswer : [userAnswer];
        const correctAnswersArray = Array.isArray(correctAnswer) ? correctAnswer : [correctAnswer];
        
        // Sort arrays for comparison
        const sortedUser = [...userAnswersArray].sort((a, b) => a - b);
        const sortedCorrect = [...correctAnswersArray].sort((a, b) => a - b);
        
        if (sortedUser.length === sortedCorrect.length && 
            sortedUser.every((val, idx) => val === sortedCorrect[idx])) {
          earnedPoints += question.points || 10;
        }
      }
    });

    const scorePercentage = totalPoints > 0 ? (earnedPoints / totalPoints) * 100 : 0;
    const isPassed = scorePercentage >= assessment.passingScore;

    // Get next attempt number
    const attemptNumber = await prisma.assessmentAttempt.count({
      where: {
        assessmentId: data.assessmentId,
        enrollmentId: data.enrollmentId,
      },
    }) + 1;

    // Create attempt
    const attempt = await prisma.assessmentAttempt.create({
      data: {
        assessmentId: data.assessmentId,
        enrollmentId: data.enrollmentId,
        traineeId: requestingUserId,
        attemptNumber,
        answers: data.answers as any,
        score: scorePercentage,
        isPassed,
        timeTaken: data.timeTaken || null,
        submittedAt: new Date(),
      },
      select: {
        id: true,
        assessmentId: true,
        enrollmentId: true,
        attemptNumber: true,
        score: true,
        isPassed: true,
        timeTaken: true,
        submittedAt: true,
        assessment: {
          select: {
            id: true,
            title: true,
            passingScore: true,
          },
        },
      },
    });

    logger.info(`Assessment submitted: ${data.assessmentId} by user ${requestingUserId}, attempt ${attemptNumber}, score: ${scorePercentage.toFixed(2)}%`);
    return attempt;
  }

  // Get assessment attempts
  async getAttempts(query: GetAttemptsQuery, requestingUserId: string, requestingUserRole: string, requestingUserOrgId?: string) {
    const page = typeof query.page === 'number' ? query.page : Number(query.page) || 1;
    const limit = typeof query.limit === 'number' ? query.limit : Number(query.limit) || 10;
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};

    if (query.assessmentId) {
      where.assessmentId = query.assessmentId;
    }

    if (query.enrollmentId) {
      where.enrollmentId = query.enrollmentId;
    }

    if (query.traineeId) {
      where.traineeId = query.traineeId;
    }

    // Access control
    if (requestingUserRole === 'trainee') {
      where.traineeId = requestingUserId;
    } else if (requestingUserRole !== 'admin' && requestingUserOrgId) {
      where.assessment = {
        course: {
          organizationId: requestingUserOrgId,
        },
      };
    }

    // Get attempts and total count
    const [attempts, total] = await Promise.all([
      prisma.assessmentAttempt.findMany({
        where,
        skip,
        take: limit,
        select: {
          id: true,
          assessmentId: true,
          enrollmentId: true,
          traineeId: true,
          attemptNumber: true,
          score: true,
          isPassed: true,
          timeTaken: true,
          startedAt: true,
          submittedAt: true,
          gradedAt: true,
          feedback: true,
          assessment: {
            select: {
              id: true,
              title: true,
              type: true,
              passingScore: true,
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
        },
        orderBy: {
          submittedAt: 'desc',
        },
      }),
      prisma.assessmentAttempt.count({ where }),
    ]);

    return {
      data: attempts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // Get attempt by ID
  async getAttemptById(id: string, requestingUserId: string, requestingUserRole: string, requestingUserOrgId?: string) {
    const attempt = await prisma.assessmentAttempt.findUnique({
      where: { id },
      select: {
        id: true,
        assessmentId: true,
        enrollmentId: true,
        traineeId: true,
        attemptNumber: true,
        answers: true,
        score: true,
        isPassed: true,
        timeTaken: true,
        startedAt: true,
        submittedAt: true,
        gradedAt: true,
        gradedBy: true,
        feedback: true,
        createdAt: true,
        assessment: {
          select: {
            id: true,
            title: true,
            type: true,
            questions: true,
            passingScore: true,
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
      },
    });

    if (!attempt) {
      throw new NotFoundError('Attempt not found');
    }

    // Access control
    if (requestingUserRole === 'trainee') {
      if (attempt.traineeId !== requestingUserId) {
        throw new ForbiddenError('Access denied to this attempt');
      }
    } else {
      if (requestingUserOrgId && attempt.assessment.course.organizationId !== requestingUserOrgId) {
        throw new ForbiddenError('Access denied to this attempt');
      }
    }

    return attempt;
  }
}

export default new AssessmentService();
