# AI Integration Setup Guide

## ✅ What's Been Set Up

1. **AI Configuration** (`src/config/ai.config.ts`)
   - Ollama base URL: `http://localhost:11434`
   - Model: `qwen2.5:3b`
   - File size limits and rate limiting configured

2. **Document Parser** (`src/utils/documentParser.ts`)
   - Supports PDF, DOCX, and TXT files
   - Extracts text content from documents

3. **AI Service** (`src/services/ai.service.ts`)
   - Quiz generation from documents
   - Text summarization
   - Course chatbot

4. **AI Controller** (`src/controllers/ai.controller.ts`)
   - File upload handling
   - API endpoint handlers

5. **AI Routes** (`src/routes/ai.routes.ts`)
   - Registered at `/api/v1/ai`
   - All routes require authentication

6. **Dependencies Installed**
   - `axios` - For Ollama API calls
   - `pdf-parse` - For PDF parsing
   - `mammoth` - For DOCX parsing

## 🧪 Testing Ollama Connection

### Step 1: Make sure Ollama is running
```bash
# Check if Ollama is running
ollama serve
```

### Step 2: Verify model is installed
```bash
# List installed models
ollama list

# If qwen2.5:3b is not listed, install it:
ollama pull qwen2.5:3b
```

### Step 3: Test the connection
```bash
# From Backend directory
npx ts-node test-ollama.ts
```

This will test:
- ✅ Ollama server connection
- ✅ Model availability
- ✅ AI generation capability

## 📡 API Endpoints

All endpoints require authentication (JWT token).

### 1. Test Connection
```
GET /api/v1/ai/test
```
Response:
```json
{
  "success": true,
  "data": {
    "connected": true,
    "modelAvailable": true,
    "model": "qwen2.5:3b",
    "baseUrl": "http://localhost:11434"
  }
}
```

### 2. Generate Quiz from Document
```
POST /api/v1/ai/generate-quiz
Content-Type: multipart/form-data

Body:
- file: (PDF/DOCX/TXT file)
- numQuestions: (number, optional, default: 10)
- difficulty: (easy|medium|hard, optional, default: medium)
- questionTypes: (JSON array, optional, default: ["multiple-choice", "true-false"])
```

### 3. Summarize Text
```
POST /api/v1/ai/summarize
Content-Type: application/json

Body:
{
  "text": "Text to summarize...",
  "length": "short|medium|long",  // optional
  "focus": "key-points|detailed|bullet-points"  // optional
}
```

### 4. Chat About Course
```
POST /api/v1/ai/chat
Content-Type: application/json

Body:
{
  "question": "What is this course about?",
  "courseId": "course-uuid",
  "courseTitle": "Course Title",
  "courseDescription": "Course description...",  // optional
  "modules": [  // optional
    {
      "title": "Module 1",
      "description": "Module description"
    }
  ],
  "history": [  // optional
    {
      "role": "user",
      "content": "Previous question"
    },
    {
      "role": "assistant",
      "content": "Previous answer"
    }
  ]
}
```

## 🚀 Next Steps

1. **Test the connection**:
   ```bash
   cd Backend
   npx ts-node test-ollama.ts
   ```

2. **Start your backend server**:
   ```bash
   npm run dev
   ```

3. **Test API endpoints** using Postman or curl:
   ```bash
   # Test connection (replace YOUR_TOKEN with actual JWT token)
   curl -X GET http://localhost:5000/api/v1/ai/test \
     -H "Authorization: Bearer YOUR_TOKEN"
   ```

4. **Frontend Integration** (Next Phase):
   - Create Quiz Maker page
   - Add file upload component
   - Integrate with ContentForm

## ⚠️ Troubleshooting

### Ollama Connection Refused
- Make sure Ollama is running: `ollama serve`
- Check if port 11434 is accessible
- Verify `OLLAMA_BASE_URL` in environment variables

### Model Not Found
- Install the model: `ollama pull qwen2.5:3b`
- Verify model name matches in `ai.config.ts`

### File Parsing Errors
- Ensure `pdf-parse` and `mammoth` are installed
- Check file format (PDF, DOCX, or TXT only)
- Verify file size is under 10MB

### Timeout Errors
- Increase timeout in `ai.config.ts`
- Check Ollama server performance
- Consider using a faster model or server

## 📝 Environment Variables (Optional)

Add to `.env` file:
```env
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=qwen2.5:3b
AI_MAX_FILE_SIZE=10485760
AI_RATE_LIMIT=10
AI_TIMEOUT=120000
```

## ✅ Verification Checklist

- [ ] Ollama is running (`ollama serve`)
- [ ] Model is installed (`ollama list` shows qwen2.5:3b)
- [ ] Test script passes (`npx ts-node test-ollama.ts`)
- [ ] Backend server starts without errors
- [ ] API test endpoint returns success
- [ ] Dependencies are installed (`npm install` completed)

---

**Ready for Frontend Integration!** 🎉
