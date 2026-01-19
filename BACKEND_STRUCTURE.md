# Backend Structure - Course Management System API

## Technology Stack
- **Runtime**: Node.js (v18+)
- **Framework**: Express.js
- **Database**: PostgreSQL
- **ORM**: Prisma or TypeORM (recommended: Prisma for type safety)
- **Authentication**: JWT + bcrypt
- **Validation**: Zod
- **File Upload**: Multer + Cloud Storage (AWS S3 / Cloudinary)
- **Email**: Nodemailer
- **PDF Generation**: PDFKit or Puppeteer (for certificates)
- **Testing**: Jest + Supertest

---

## Folder Structure

```
Backend/
├── src/
│   ├── config/
│   │   ├── database.ts          # Database connection config
│   │   ├── env.ts                # Environment variables validation
│   │   ├── cloudinary.ts         # Cloud storage config
│   │   └── email.ts              # Email service config
│   │
│   ├── middleware/
│   │   ├── auth.middleware.ts    # JWT authentication
│   │   ├── role.middleware.ts    # Role-based access control
│   │   ├── validation.middleware.ts  # Request validation
│   │   ├── error.middleware.ts   # Error handling
│   │   ├── upload.middleware.ts  # File upload handling
│   │   ├── rateLimit.middleware.ts  # Rate limiting
│   │   └── audit.middleware.ts   # Audit logging
│   │
│   ├── models/
│   │   ├── User.model.ts
│   │   ├── Organization.model.ts
│   │   ├── Department.model.ts
│   │   ├── Course.model.ts
│   │   ├── Module.model.ts
│   │   ├── Content.model.ts
│   │   ├── Assessment.model.ts
│   │   ├── Enrollment.model.ts
│   │   ├── Progress.model.ts
│   │   ├── Certificate.model.ts
│   │   ├── Assignment.model.ts
│   │   ├── TrainingSession.model.ts
│   │   ├── Announcement.model.ts
│   │   └── Message.model.ts
│   │
│   ├── schemas/
│   │   ├── user.schema.ts        # Zod validation schemas
│   │   ├── course.schema.ts
│   │   ├── enrollment.schema.ts
│   │   ├── assessment.schema.ts
│   │   └── ... (other schemas)
│   │
│   ├── controllers/
│   │   ├── auth.controller.ts
│   │   ├── users.controller.ts
│   │   ├── organizations.controller.ts
│   │   ├── departments.controller.ts
│   │   ├── courses.controller.ts
│   │   ├── modules.controller.ts
│   │   ├── content.controller.ts
│   │   ├── assessments.controller.ts
│   │   ├── enrollments.controller.ts
│   │   ├── progress.controller.ts
│   │   ├── certificates.controller.ts
│   │   ├── assignments.controller.ts
│   │   ├── trainingSessions.controller.ts
│   │   ├── announcements.controller.ts
│   │   └── messages.controller.ts
│   │
│   ├── services/
│   │   ├── auth.service.ts
│   │   ├── user.service.ts
│   │   ├── course.service.ts
│   │   ├── enrollment.service.ts
│   │   ├── progress.service.ts
│   │   ├── assessment.service.ts
│   │   ├── certificate.service.ts
│   │   ├── fileUpload.service.ts
│   │   ├── email.service.ts
│   │   ├── pdf.service.ts
│   │   └── analytics.service.ts
│   │
│   ├── repositories/
│   │   ├── user.repository.ts   # Data access layer
│   │   ├── course.repository.ts
│   │   ├── enrollment.repository.ts
│   │   └── ... (other repositories)
│   │
│   ├── routes/
│   │   ├── index.ts              # Route aggregator
│   │   ├── auth.routes.ts
│   │   ├── users.routes.ts
│   │   ├── organizations.routes.ts
│   │   ├── departments.routes.ts
│   │   ├── courses.routes.ts
│   │   ├── modules.routes.ts
│   │   ├── content.routes.ts
│   │   ├── assessments.routes.ts
│   │   ├── enrollments.routes.ts
│   │   ├── progress.routes.ts
│   │   ├── certificates.routes.ts
│   │   ├── assignments.routes.ts
│   │   ├── trainingSessions.routes.ts
│   │   ├── announcements.routes.ts
│   │   └── messages.routes.ts
│   │
│   ├── utils/
│   │   ├── logger.ts             # Winston or Pino logger
│   │   ├── errors.ts             # Custom error classes
│   │   ├── helpers.ts            # Helper functions
│   │   ├── constants.ts          # Constants
│   │   └── validators.ts         # Additional validators
│   │
│   ├── types/
│   │   ├── express.d.ts          # Express type extensions
│   │   ├── user.types.ts
│   │   ├── course.types.ts
│   │   └── ... (other types)
│   │
│   ├── app.ts                    # Express app setup
│   └── server.ts                 # Server entry point
│
├── prisma/                       # If using Prisma
│   ├── schema.prisma
│   └── migrations/
│
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
│
├── uploads/                      # Local file storage (dev only)
├── .env.example
├── .gitignore
├── package.json
├── tsconfig.json
├── jest.config.js
└── README.md
```

---

## API Endpoints Structure

### Base URL: `/api/v1`

### 1. Authentication Routes (`/api/v1/auth`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/register` | Register new user | No |
| POST | `/login` | User login | No |
| POST | `/refresh` | Refresh access token | No (refresh token) |
| POST | `/logout` | Logout user | Yes |
| POST | `/forgot-password` | Request password reset | No |
| POST | `/reset-password` | Reset password with token | No |
| GET | `/me` | Get current user | Yes |
| PUT | `/me` | Update current user | Yes |
| POST | `/change-password` | Change password | Yes |

---

### 2. Users Routes (`/api/v1/users`)

| Method | Endpoint | Description | Auth | Role |
|--------|----------|-------------|------|------|
| GET | `/` | Get all users | Yes | admin |
| GET | `/:id` | Get user by ID | Yes | admin, instructor |
| POST | `/` | Create user | Yes | admin |
| PUT | `/:id` | Update user | Yes | admin, self |
| DELETE | `/:id` | Delete user | Yes | admin |
| GET | `/:id/courses` | Get user's courses | Yes | admin, instructor, self |
| GET | `/:id/progress` | Get user's progress | Yes | admin, instructor, self |
| GET | `/:id/certificates` | Get user's certificates | Yes | admin, instructor, self |
| PUT | `/:id/activate` | Activate user | Yes | admin |
| PUT | `/:id/deactivate` | Deactivate user | Yes | admin |

---

### 3. Organizations Routes (`/api/v1/organizations`)

| Method | Endpoint | Description | Auth | Role |
|--------|----------|-------------|------|------|
| GET | `/` | Get all organizations | Yes | admin (super) |
| GET | `/:id` | Get organization | Yes | admin |
| POST | `/` | Create organization | Yes | admin (super) |
| PUT | `/:id` | Update organization | Yes | admin (org) |
| DELETE | `/:id` | Delete organization | Yes | admin (super) |
| GET | `/:id/settings` | Get org settings | Yes | admin (org) |
| PUT | `/:id/settings` | Update org settings | Yes | admin (org) |
| GET | `/:id/stats` | Get org statistics | Yes | admin (org) |

---

### 4. Departments Routes (`/api/v1/departments`)

| Method | Endpoint | Description | Auth | Role |
|--------|----------|-------------|------|------|
| GET | `/` | Get all departments | Yes | admin, instructor |
| GET | `/:id` | Get department | Yes | admin, instructor |
| POST | `/` | Create department | Yes | admin |
| PUT | `/:id` | Update department | Yes | admin |
| DELETE | `/:id` | Delete department | Yes | admin |
| GET | `/:id/users` | Get department users | Yes | admin, instructor |
| GET | `/:id/courses` | Get department courses | Yes | admin, instructor |

---

### 5. Courses Routes (`/api/v1/courses`)

| Method | Endpoint | Description | Auth | Role |
|--------|----------|-------------|------|------|
| GET | `/` | Get all courses | Yes | all |
| GET | `/public` | Get public courses | Yes | all |
| GET | `/:id` | Get course by ID | Yes | all |
| POST | `/` | Create course | Yes | admin, instructor |
| PUT | `/:id` | Update course | Yes | admin, instructor (owner) |
| DELETE | `/:id` | Delete course | Yes | admin, instructor (owner) |
| PUT | `/:id/publish` | Publish course | Yes | admin, instructor (owner) |
| PUT | `/:id/unpublish` | Unpublish course | Yes | admin, instructor (owner) |
| GET | `/:id/modules` | Get course modules | Yes | all |
| GET | `/:id/enrollments` | Get course enrollments | Yes | admin, instructor (owner) |
| GET | `/:id/stats` | Get course statistics | Yes | admin, instructor (owner) |
| POST | `/:id/enroll` | Enroll in course | Yes | trainee |
| POST | `/:id/unenroll` | Unenroll from course | Yes | trainee |
| GET | `/:id/prerequisites` | Get prerequisites | Yes | all |
| POST | `/:id/prerequisites` | Add prerequisite | Yes | admin, instructor (owner) |

---

### 6. Modules Routes (`/api/v1/modules`)

| Method | Endpoint | Description | Auth | Role |
|--------|----------|-------------|------|------|
| GET | `/course/:courseId` | Get modules by course | Yes | all |
| GET | `/:id` | Get module by ID | Yes | all |
| POST | `/` | Create module | Yes | admin, instructor |
| PUT | `/:id` | Update module | Yes | admin, instructor (owner) |
| DELETE | `/:id` | Delete module | Yes | admin, instructor (owner) |
| PUT | `/:id/reorder` | Reorder modules | Yes | admin, instructor (owner) |
| GET | `/:id/content` | Get module content | Yes | all |
| GET | `/:id/progress` | Get module progress | Yes | trainee, instructor |

---

### 7. Content Routes (`/api/v1/content`)

| Method | Endpoint | Description | Auth | Role |
|--------|----------|-------------|------|------|
| GET | `/module/:moduleId` | Get content by module | Yes | all |
| GET | `/:id` | Get content by ID | Yes | all |
| POST | `/` | Create content | Yes | admin, instructor |
| PUT | `/:id` | Update content | Yes | admin, instructor (owner) |
| DELETE | `/:id` | Delete content | Yes | admin, instructor (owner) |
| POST | `/:id/upload` | Upload content file | Yes | admin, instructor |
| GET | `/:id/download` | Download content | Yes | all (enrolled) |
| POST | `/:id/complete` | Mark content complete | Yes | trainee |

---

### 8. Assessments Routes (`/api/v1/assessments`)

| Method | Endpoint | Description | Auth | Role |
|--------|----------|-------------|------|------|
| GET | `/course/:courseId` | Get assessments by course | Yes | all |
| GET | `/module/:moduleId` | Get assessments by module | Yes | all |
| GET | `/:id` | Get assessment by ID | Yes | all |
| POST | `/` | Create assessment | Yes | admin, instructor |
| PUT | `/:id` | Update assessment | Yes | admin, instructor (owner) |
| DELETE | `/:id` | Delete assessment | Yes | admin, instructor (owner) |
| POST | `/:id/start` | Start assessment attempt | Yes | trainee |
| POST | `/:id/submit` | Submit assessment | Yes | trainee |
| GET | `/:id/attempts` | Get assessment attempts | Yes | admin, instructor, self |
| GET | `/:id/attempts/:attemptId` | Get attempt details | Yes | admin, instructor, self |
| POST | `/:id/grade` | Grade assessment (manual) | Yes | admin, instructor |

---

### 9. Enrollments Routes (`/api/v1/enrollments`)

| Method | Endpoint | Description | Auth | Role |
|--------|----------|-------------|------|------|
| GET | `/` | Get all enrollments | Yes | admin, instructor |
| GET | `/my-enrollments` | Get my enrollments | Yes | trainee |
| GET | `/:id` | Get enrollment by ID | Yes | admin, instructor, self |
| POST | `/` | Create enrollment | Yes | admin, instructor |
| PUT | `/:id` | Update enrollment | Yes | admin, instructor |
| DELETE | `/:id` | Delete enrollment | Yes | admin, instructor |
| GET | `/:id/progress` | Get enrollment progress | Yes | admin, instructor, self |
| POST | `/:id/complete` | Mark enrollment complete | Yes | admin, instructor |
| GET | `/:id/certificate` | Get enrollment certificate | Yes | admin, instructor, self |

---

### 10. Progress Routes (`/api/v1/progress`)

| Method | Endpoint | Description | Auth | Role |
|--------|----------|-------------|------|------|
| GET | `/enrollment/:enrollmentId` | Get progress by enrollment | Yes | admin, instructor, self |
| GET | `/module/:moduleId` | Get progress by module | Yes | admin, instructor, self |
| POST | `/` | Update progress | Yes | trainee (auto) |
| PUT | `/:id` | Update progress manually | Yes | admin, instructor |
| GET | `/dashboard` | Get progress dashboard | Yes | trainee |

---

### 11. Certificates Routes (`/api/v1/certificates`)

| Method | Endpoint | Description | Auth | Role |
|--------|----------|-------------|------|------|
| GET | `/` | Get all certificates | Yes | admin, instructor |
| GET | `/my-certificates` | Get my certificates | Yes | trainee |
| GET | `/:id` | Get certificate by ID | Yes | admin, instructor, self |
| GET | `/:id/download` | Download certificate PDF | Yes | admin, instructor, self |
| GET | `/:id/verify` | Verify certificate | No | Public |
| POST | `/:id/revoke` | Revoke certificate | Yes | admin |
| GET | `/templates` | Get certificate templates | Yes | admin |
| POST | `/templates` | Create template | Yes | admin |
| PUT | `/templates/:id` | Update template | Yes | admin |
| DELETE | `/templates/:id` | Delete template | Yes | admin |

---

### 12. Assignments Routes (`/api/v1/assignments`)

| Method | Endpoint | Description | Auth | Role |
|--------|----------|-------------|------|------|
| GET | `/course/:courseId` | Get assignments by course | Yes | all |
| GET | `/:id` | Get assignment by ID | Yes | all |
| POST | `/` | Create assignment | Yes | admin, instructor |
| PUT | `/:id` | Update assignment | Yes | admin, instructor (owner) |
| DELETE | `/:id` | Delete assignment | Yes | admin, instructor (owner) |
| GET | `/:id/submissions` | Get submissions | Yes | admin, instructor |
| POST | `/:id/submit` | Submit assignment | Yes | trainee |
| GET | `/:id/submissions/:submissionId` | Get submission | Yes | admin, instructor, self |
| PUT | `/:id/submissions/:submissionId/grade` | Grade submission | Yes | admin, instructor |

---

### 13. Training Sessions Routes (`/api/v1/training-sessions`)

| Method | Endpoint | Description | Auth | Role |
|--------|----------|-------------|------|------|
| GET | `/` | Get all sessions | Yes | all |
| GET | `/upcoming` | Get upcoming sessions | Yes | all |
| GET | `/:id` | Get session by ID | Yes | all |
| POST | `/` | Create session | Yes | admin, instructor |
| PUT | `/:id` | Update session | Yes | admin, instructor (owner) |
| DELETE | `/:id` | Delete session | Yes | admin, instructor (owner) |
| POST | `/:id/register` | Register for session | Yes | trainee |
| POST | `/:id/check-in` | Check in to session | Yes | trainee, instructor |
| GET | `/:id/attendance` | Get session attendance | Yes | admin, instructor |
| GET | `/:id/attendees` | Get session attendees | Yes | admin, instructor |

---

### 14. Announcements Routes (`/api/v1/announcements`)

| Method | Endpoint | Description | Auth | Role |
|--------|----------|-------------|------|------|
| GET | `/` | Get all announcements | Yes | all |
| GET | `/course/:courseId` | Get course announcements | Yes | all |
| GET | `/:id` | Get announcement by ID | Yes | all |
| POST | `/` | Create announcement | Yes | admin, instructor |
| PUT | `/:id` | Update announcement | Yes | admin, instructor (owner) |
| DELETE | `/:id` | Delete announcement | Yes | admin, instructor (owner) |
| PUT | `/:id/pin` | Pin announcement | Yes | admin, instructor |
| PUT | `/:id/unpin` | Unpin announcement | Yes | admin, instructor |

---

### 15. Messages Routes (`/api/v1/messages`)

| Method | Endpoint | Description | Auth | Role |
|--------|----------|-------------|------|------|
| GET | `/inbox` | Get inbox messages | Yes | all |
| GET | `/sent` | Get sent messages | Yes | all |
| GET | `/:id` | Get message by ID | Yes | all |
| POST | `/` | Send message | Yes | all |
| PUT | `/:id/read` | Mark as read | Yes | all |
| PUT | `/:id/archive` | Archive message | Yes | all |
| DELETE | `/:id` | Delete message | Yes | all |
| GET | `/unread-count` | Get unread count | Yes | all |

---

## Implementation Files

### Key File Examples

#### 1. `src/app.ts` - Express App Setup
```typescript
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { errorHandler } from './middleware/error.middleware';
import routes from './routes';

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/v1', routes);

// Error handling
app.use(errorHandler);

export default app;
```

#### 2. `src/middleware/auth.middleware.ts`
```typescript
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UnauthorizedError } from '../utils/errors';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    role: string;
    organizationId?: string;
  };
}

export const authenticate = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    throw new UnauthorizedError('No token provided');
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!);
    req.user = decoded as AuthRequest['user'];
    next();
  } catch (error) {
    throw new UnauthorizedError('Invalid token');
  }
};
```

#### 3. `src/middleware/role.middleware.ts`
```typescript
import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth.middleware';
import { ForbiddenError } from '../utils/errors';

export const requireRole = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      throw new ForbiddenError('Authentication required');
    }
    
    if (!roles.includes(req.user.role)) {
      throw new ForbiddenError('Insufficient permissions');
    }
    
    next();
  };
};
```

#### 4. `src/controllers/courses.controller.ts` (Example)
```typescript
import { Request, Response } from 'express';
import { CourseService } from '../services/course.service';
import { AuthRequest } from '../middleware/auth.middleware';

export class CourseController {
  private courseService: CourseService;

  constructor() {
    this.courseService = new CourseService();
  }

  getAllCourses = async (req: AuthRequest, res: Response) => {
    const { organizationId } = req.user!;
    const { page = 1, limit = 10, status, departmentId } = req.query;
    
    const courses = await this.courseService.getAllCourses({
      organizationId,
      page: Number(page),
      limit: Number(limit),
      status: status as string,
      departmentId: departmentId as string,
    });
    
    res.json(courses);
  };

  getCourseById = async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const course = await this.courseService.getCourseById(id);
    res.json(course);
  };

  createCourse = async (req: AuthRequest, res: Response) => {
    const { organizationId, id: userId } = req.user!;
    const courseData = { ...req.body, organizationId, instructorId: userId };
    
    const course = await this.courseService.createCourse(courseData);
    res.status(201).json(course);
  };

  updateCourse = async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const course = await this.courseService.updateCourse(id, req.body);
    res.json(course);
  };

  deleteCourse = async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    await this.courseService.deleteCourse(id);
    res.status(204).send();
  };
}
```

#### 5. `src/routes/courses.routes.ts`
```typescript
import { Router } from 'express';
import { CourseController } from '../controllers/courses.controller';
import { authenticate } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/role.middleware';
import { validateRequest } from '../middleware/validation.middleware';
import { createCourseSchema, updateCourseSchema } from '../schemas/course.schema';

const router = Router();
const courseController = new CourseController();

router.get('/', authenticate, courseController.getAllCourses);
router.get('/public', authenticate, courseController.getPublicCourses);
router.get('/:id', authenticate, courseController.getCourseById);
router.post(
  '/',
  authenticate,
  requireRole('admin', 'instructor'),
  validateRequest(createCourseSchema),
  courseController.createCourse
);
router.put(
  '/:id',
  authenticate,
  requireRole('admin', 'instructor'),
  validateRequest(updateCourseSchema),
  courseController.updateCourse
);
router.delete(
  '/:id',
  authenticate,
  requireRole('admin', 'instructor'),
  courseController.deleteCourse
);

export default router;
```

---

## Environment Variables

Create `.env` file:
```env
# Server
NODE_ENV=development
PORT=5000
API_VERSION=v1

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/course_management
DATABASE_POOL_MIN=2
DATABASE_POOL_MAX=10

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=your-refresh-token-secret
JWT_REFRESH_EXPIRES_IN=30d

# Cloud Storage (AWS S3 or Cloudinary)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
EMAIL_FROM=noreply@yourdomain.com

# Frontend
FRONTEND_URL=http://localhost:3000

# File Upload
MAX_FILE_SIZE=10485760  # 10MB
ALLOWED_FILE_TYPES=image/jpeg,image/png,image/gif,application/pdf,video/mp4

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000  # 15 minutes
RATE_LIMIT_MAX_REQUESTS=100
```

---

## Package.json Dependencies

```json
{
  "name": "course-management-api",
  "version": "1.0.0",
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "helmet": "^7.0.0",
    "morgan": "^1.10.0",
    "dotenv": "^16.3.1",
    "bcrypt": "^5.1.1",
    "jsonwebtoken": "^9.0.2",
    "zod": "^3.22.4",
    "prisma": "^5.6.0",
    "@prisma/client": "^5.6.0",
    "multer": "^1.4.5-lts.1",
    "cloudinary": "^1.41.0",
    "nodemailer": "^6.9.7",
    "pdfkit": "^0.13.0",
    "express-rate-limit": "^7.1.3",
    "winston": "^3.11.0",
    "uuid": "^9.0.1"
  },
  "devDependencies": {
    "@types/express": "^4.17.21",
    "@types/node": "^20.10.0",
    "@types/bcrypt": "^5.0.2",
    "@types/jsonwebtoken": "^9.0.5",
    "@types/multer": "^1.4.11",
    "@types/nodemailer": "^6.4.14",
    "@types/uuid": "^9.0.7",
    "typescript": "^5.3.2",
    "ts-node": "^10.9.1",
    "nodemon": "^3.0.2",
    "jest": "^29.7.0",
    "@types/jest": "^29.5.8",
    "ts-jest": "^29.1.1",
    "supertest": "^6.3.3",
    "@types/supertest": "^6.0.2"
  }
}
```

---

## Next Steps

1. **Initialize Backend Project**
   ```bash
   mkdir Backend
   cd Backend
   npm init -y
   npm install [dependencies from above]
   ```

2. **Set Up TypeScript**
   ```bash
   npm install -D typescript ts-node @types/node
   npx tsc --init
   ```

3. **Set Up Prisma**
   ```bash
   npm install prisma @prisma/client
   npx prisma init
   # Copy schema from DATABASE_SCHEMA.md to prisma/schema.prisma
   npx prisma migrate dev
   ```

4. **Create Folder Structure**
   - Create all folders as outlined above
   - Start with config files, then middleware, then routes

5. **Implement Core Features**
   - Authentication first
   - Then CRUD operations
   - Then complex features (progress tracking, certificates)

6. **Testing**
   - Write unit tests for services
   - Write integration tests for API endpoints
   - Set up CI/CD pipeline

---

## Security Checklist

- [ ] JWT token expiration and refresh mechanism
- [ ] Password hashing with bcrypt (salt rounds ≥ 10)
- [ ] Input validation on all endpoints
- [ ] SQL injection prevention (use ORM)
- [ ] XSS protection (helmet.js)
- [ ] CORS configuration
- [ ] Rate limiting
- [ ] File upload validation
- [ ] Role-based access control
- [ ] Audit logging
- [ ] Environment variables for secrets
- [ ] HTTPS in production
- [ ] Database connection pooling
- [ ] Error handling (don't expose stack traces)

---

This structure provides a solid foundation for your course management backend API. Start with authentication and basic CRUD, then build up to more complex features.
