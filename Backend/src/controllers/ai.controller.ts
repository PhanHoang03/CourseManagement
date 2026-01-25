import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import aiService from '../services/ai.service';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { isValidFileType, getFileSize } from '../utils/documentParser';
import aiConfig from '../config/ai.config';
import { BadRequestError } from '../utils/errors';

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/temp');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  limits: { fileSize: aiConfig.maxFileSize },
  fileFilter: (req, file, cb) => {
    if (isValidFileType(file.originalname)) {
      cb(null, true);
    } else {
      cb(new BadRequestError('Invalid file type. Only PDF, DOCX, and TXT files are supported.'));
    }
  },
});

class AIController {
  testConnection = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const isConnected = await aiService.testConnection();
      const modelAvailable = await aiService.checkModel();

      res.json({
        success: true,
        data: {
          connected: isConnected,
          modelAvailable,
          model: aiConfig.model,
          baseUrl: aiConfig.baseUrl,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  generateQuiz = [
    upload.single('file'),
    async (req: AuthRequest, res: Response, next: NextFunction) => {
      try {
        if (!req.file) {
          return res.status(400).json({
            success: false,
            error: 'No file uploaded',
          });
        }

        const filePath = req.file.path;
        const fileName = req.file.originalname;
        const options = {
          numQuestions: req.body.numQuestions ? parseInt(req.body.numQuestions) : 10,
          difficulty: req.body.difficulty || 'medium',
          questionTypes: req.body.questionTypes
            ? JSON.parse(req.body.questionTypes)
            : ['multiple-choice', 'true-false'],
        };

        // Validate options
        if (options.numQuestions < 1 || options.numQuestions > 50) {
          return res.status(400).json({
            success: false,
            error: 'Number of questions must be between 1 and 50',
          });
        }

        const quizData = await aiService.generateQuizFromDocument(filePath, fileName, options);

        // Clean up uploaded file
        try {
          fs.unlinkSync(filePath);
        } catch (error) {
          console.error('Failed to delete temp file:', error);
        }

        res.json({
          success: true,
          message: 'Quiz generated successfully',
          data: quizData,
        });
      } catch (error) {
        // Clean up uploaded file on error
        if (req.file) {
          try {
            fs.unlinkSync(req.file.path);
          } catch (cleanupError) {
            console.error('Failed to delete temp file:', cleanupError);
          }
        }
        next(error);
      }
    },
  ];

  /**
   * Summarize text
   */
  summarize = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { text, length, focus } = req.body;

      if (!text || typeof text !== 'string') {
        return res.status(400).json({
          success: false,
          error: 'Text is required',
        });
      }

      const options = {
        length: length || 'medium',
        focus: focus || 'key-points',
      };

      const summary = await aiService.summarizeText(text, options);

      res.json({
        success: true,
        message: 'Text summarized successfully',
        data: { summary },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Chat about course
   */
  chat = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { question, courseId, courseTitle, courseDescription, modules, history } = req.body;

      if (!question || typeof question !== 'string') {
        return res.status(400).json({
          success: false,
          error: 'Question is required',
        });
      }

      if (!courseId || !courseTitle) {
        return res.status(400).json({
          success: false,
          error: 'Course ID and title are required',
        });
      }

      const courseContext = {
        courseId,
        courseTitle,
        courseDescription,
        modules: modules || [],
      };

      const previousMessages = history || [];

      const answer = await aiService.chatAboutCourse(question, courseContext, previousMessages);

      res.json({
        success: true,
        message: 'Chat response generated',
        data: { answer },
      });
    } catch (error) {
      next(error);
    }
  };
}

export default new AIController();
