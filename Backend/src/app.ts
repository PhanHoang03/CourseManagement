import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import path from 'path';
import authRoutes from './routes/auth.routes';
import usersRoutes from './routes/users.routes';
import organizationsRoutes from './routes/organizations.routes';
import departmentsRoutes from './routes/departments.routes';
import coursesRoutes from './routes/courses.routes';
import modulesRoutes from './routes/modules.routes';
import contentsRoutes from './routes/contents.routes';
import enrollmentsRoutes from './routes/enrollments.routes';
import progressRoutes from './routes/progress.routes';
import assignmentsRoutes from './routes/assignments.routes';
import assessmentsRoutes from './routes/assessments.routes';
import aiRoutes from './routes/ai.routes';
import { bigIntSerializer } from './middleware/bigint.middleware';

// Load environment variables
dotenv.config();

const app = express();

// Middleware
// Configure Helmet to allow cross-origin requests for media files
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  crossOriginEmbedderPolicy: false, // Allow embedding media from different origins
}));
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  exposedHeaders: ['Content-Range', 'Content-Length', 'Accept-Ranges'],
}));
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(bigIntSerializer); // Convert BigInt to Number for JSON serialization

// Static file serving for uploaded files with CORS support
// This allows access to uploaded files via: http://localhost:5000/uploads/videos/filename.mp4
// Add CORS headers for video files using middleware
app.use('/uploads', (req, res, next) => {
  // Set CORS headers for all requests to /uploads
  res.setHeader('Access-Control-Allow-Origin', process.env.FRONTEND_URL || 'http://localhost:3000');
  res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Range');
  res.setHeader('Access-Control-Expose-Headers', 'Content-Range, Content-Length, Accept-Ranges');
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  
  // Handle OPTIONS preflight requests
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  
  next();
}, express.static(path.join(__dirname, '../uploads'), {
  setHeaders: (res, filePath) => {
    // Ensure CORS headers are also set when static files are served
    res.setHeader('Access-Control-Allow-Origin', process.env.FRONTEND_URL || 'http://localhost:3000');
    res.setHeader('Access-Control-Expose-Headers', 'Content-Range, Content-Length, Accept-Ranges');
  }
}));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// API routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', usersRoutes);
app.use('/api/v1/organizations', organizationsRoutes);
app.use('/api/v1/departments', departmentsRoutes);
app.use('/api/v1/courses', coursesRoutes);
app.use('/api/v1/modules', modulesRoutes);
app.use('/api/v1/contents', contentsRoutes);
app.use('/api/v1/enrollments', enrollmentsRoutes);
app.use('/api/v1/progress', progressRoutes);
app.use('/api/v1/assignments', assignmentsRoutes);
app.use('/api/v1/assessments', assessmentsRoutes);
app.use('/api/v1/ai', aiRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Not Found',
    message: `Cannot ${req.method} ${req.path}`
  });
});

// Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  // If error is already handled (has statusCode), use it
  if (err.statusCode) {
    return res.status(err.statusCode).json({
      success: false,
      error: err.message,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    });
  }

  // Log unexpected errors
  console.error('Unexpected error:', err);
  
  // Return generic error
  res.status(500).json({
    success: false,
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong',
  });
});

export default app;
