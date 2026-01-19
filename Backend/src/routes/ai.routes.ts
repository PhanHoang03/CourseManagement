import { Router } from 'express';
import aiController from '../controllers/ai.controller';
import { authenticate } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/role.middleware';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Test Ollama connection (all authenticated users)
router.get('/test', aiController.testConnection);

// Generate quiz from document (all authenticated users)
router.post('/generate-quiz', aiController.generateQuiz);

// Summarize text (all authenticated users)
router.post('/summarize', aiController.summarize);

// Chat about course (all authenticated users)
router.post('/chat', aiController.chat);

export default router;
