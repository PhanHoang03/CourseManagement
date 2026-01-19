import axios from 'axios';
import aiConfig from '../config/ai.config';
import { ParsedDocument, parseDocument } from '../utils/documentParser';
import { BadRequestError, InternalServerError } from '../utils/errors';

interface QuizGenerationOptions {
  numQuestions?: number;
  difficulty?: 'easy' | 'medium' | 'hard';
  questionTypes?: ('multiple-choice' | 'true-false' | 'multiple-select')[];
}

interface SummarizationOptions {
  length?: 'short' | 'medium' | 'long';
  focus?: 'key-points' | 'detailed' | 'bullet-points';
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

class AIService {
  /**
   * Call Ollama API
   */
  private async callOllama(prompt: string, systemPrompt?: string): Promise<string> {
    try {
      const response = await axios.post(
        `${aiConfig.baseUrl}/api/generate`,
        {
          model: aiConfig.model,
          prompt: systemPrompt ? `${systemPrompt}\n\n${prompt}` : prompt,
          stream: false,
        },
        {
          timeout: aiConfig.timeout,
        }
      );

      if (response.data && response.data.response) {
        return response.data.response;
      }

      throw new Error('Invalid response from Ollama');
    } catch (error: any) {
      if (error.code === 'ECONNREFUSED') {
        throw new InternalServerError('Ollama server is not running. Please start Ollama.');
      }
      if (error.code === 'ETIMEDOUT') {
        throw new InternalServerError('Request to Ollama timed out. The model may be too slow.');
      }
      throw new InternalServerError(`AI service error: ${error.message}`);
    }
  }

  /**
   * Generate quiz from document
   */
  async generateQuizFromDocument(
    filePath: string,
    fileName: string,
    options: QuizGenerationOptions = {}
  ): Promise<any> {
    // Parse document
    const parsedDoc: ParsedDocument = await parseDocument(filePath, fileName);

    if (!parsedDoc.text || parsedDoc.text.trim().length < 100) {
      throw new BadRequestError('Document content is too short. Please provide a document with more content.');
    }

    // Set defaults
    const numQuestions = options.numQuestions || 10;
    const difficulty = options.difficulty || 'medium';
    const questionTypes = options.questionTypes || ['multiple-choice', 'true-false'];

    // Build prompt
    const systemPrompt = `You are an expert educational quiz generator. Generate quizzes in valid JSON format only.`;
    
    const prompt = `Based on the following document content, generate a quiz with exactly ${numQuestions} questions.

Document Content:
${parsedDoc.text.substring(0, 8000)} ${parsedDoc.text.length > 8000 ? '... (truncated)' : ''}

Requirements:
- Generate exactly ${numQuestions} questions
- Mix of question types: ${questionTypes.join(', ')}
- Difficulty level: ${difficulty}
- Each question must have clear, distinct options
- Include explanations for correct answers

Return ONLY valid JSON in this exact structure (no markdown, no code blocks, just JSON):
{
  "questions": [
    {
      "id": "q1",
      "type": "multiple-choice",
      "question": "Question text here",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswers": 0,
      "points": 10,
      "explanation": "Explanation of why this is correct"
    }
  ],
  "settings": {
    "passingScore": 70,
    "allowRetake": true,
    "timeLimit": null,
    "randomizeQuestions": false,
    "showResultsImmediately": true
  }
}

Important: Return ONLY the JSON object, no other text.`;

    try {
      const response = await this.callOllama(prompt, systemPrompt);
      
      // Extract JSON from response (handle cases where AI adds extra text)
      let jsonString = response.trim();
      
      // Remove markdown code blocks if present
      if (jsonString.startsWith('```json')) {
        jsonString = jsonString.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      } else if (jsonString.startsWith('```')) {
        jsonString = jsonString.replace(/```\n?/g, '');
      }
      
      // Find JSON object
      const jsonMatch = jsonString.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        jsonString = jsonMatch[0];
      }
      
      const quizData = JSON.parse(jsonString);
      
      // Validate structure
      if (!quizData.questions || !Array.isArray(quizData.questions)) {
        throw new Error('Invalid quiz structure: missing questions array');
      }
      
      // Ensure all questions have required fields
      quizData.questions = quizData.questions.map((q: any, index: number) => ({
        id: q.id || `q${index + 1}`,
        type: q.type || 'multiple-choice',
        question: q.question || '',
        options: q.options || [],
        correctAnswers: q.correctAnswers !== undefined ? q.correctAnswers : 0,
        points: q.points || 10,
        explanation: q.explanation || '',
      }));
      
      return quizData;
    } catch (error: any) {
      if (error instanceof SyntaxError) {
        throw new BadRequestError('Failed to parse AI response. The generated quiz may be malformed. Please try again.');
      }
      throw error;
    }
  }

  /**
   * Summarize text
   */
  async summarizeText(text: string, options: SummarizationOptions = {}): Promise<string> {
    if (!text || text.trim().length < 50) {
      throw new BadRequestError('Text is too short to summarize.');
    }

    const length = options.length || 'medium';
    const focus = options.focus || 'key-points';

    const lengthMap = {
      short: '2-3 sentences',
      medium: 'a paragraph (4-6 sentences)',
      long: 'multiple paragraphs',
    };

    const focusMap = {
      'key-points': 'focus on the main key points',
      detailed: 'provide a detailed summary',
      'bullet-points': 'use bullet points format',
    };

    const prompt = `Summarize the following text in ${lengthMap[length]} format. ${focusMap[focus]}:

${text.substring(0, 10000)} ${text.length > 10000 ? '... (truncated)' : ''}

Provide a clear, concise summary that captures the main points.`;

    const response = await this.callOllama(prompt);
    return response.trim();
  }

  /**
   * Chat about course
   */
  async chatAboutCourse(
    question: string,
    courseContext: {
      courseId: string;
      courseTitle: string;
      courseDescription?: string;
      modules?: Array<{ title: string; description?: string }>;
    },
    previousMessages: ChatMessage[] = []
  ): Promise<string> {
    if (!question || question.trim().length === 0) {
      throw new BadRequestError('Question cannot be empty.');
    }

    // Build context
    let context = `You are a helpful teaching assistant for the course: "${courseContext.courseTitle}"\n\n`;
    
    if (courseContext.courseDescription) {
      context += `Course Description: ${courseContext.courseDescription}\n\n`;
    }
    
    if (courseContext.modules && courseContext.modules.length > 0) {
      context += `Available Modules:\n`;
      courseContext.modules.forEach((module, index) => {
        context += `${index + 1}. ${module.title}`;
        if (module.description) {
          context += ` - ${module.description}`;
        }
        context += '\n';
      });
      context += '\n';
    }

    // Add conversation history
    if (previousMessages.length > 0) {
      context += 'Previous Conversation:\n';
      previousMessages.slice(-5).forEach((msg) => {
        context += `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}\n`;
      });
      context += '\n';
    }

    const prompt = `${context}User Question: ${question}\n\nProvide a helpful, accurate answer based on the course content. If the question is outside the course scope, politely indicate that and suggest asking about course-related topics.`;

    const response = await this.callOllama(prompt);
    return response.trim();
  }

  /**
   * Test Ollama connection
   */
  async testConnection(): Promise<boolean> {
    try {
      const response = await axios.get(`${aiConfig.baseUrl}/api/tags`, {
        timeout: 5000,
      });
      return response.status === 200;
    } catch (error) {
      return false;
    }
  }

  /**
   * Check if model is available
   */
  async checkModel(): Promise<boolean> {
    try {
      const response = await axios.get(`${aiConfig.baseUrl}/api/tags`, {
        timeout: 5000,
      });
      const models = response.data.models || [];
      return models.some((model: any) => model.name.includes(aiConfig.model));
    } catch (error) {
      return false;
    }
  }
}

export default new AIService();
