export const aiConfig = {
  // Support both local and remote Ollama
  // Local: http://localhost:11434
  // Remote VPS: http://your-vps-ip:11434 or https://ollama.yourdomain.com
  baseUrl: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
  model: process.env.OLLAMA_MODEL || 'qwen2.5:3b',
  maxFileSize: parseInt(process.env.AI_MAX_FILE_SIZE || '10485760'), // 10MB
  rateLimit: parseInt(process.env.AI_RATE_LIMIT || '10'), // requests per minute
  timeout: parseInt(process.env.AI_TIMEOUT || '120000'), // 2 minutes
  // Enable/disable AI features (useful for production without Ollama)
  enabled: process.env.AI_ENABLED !== 'false', // Default: true
};

export default aiConfig;
