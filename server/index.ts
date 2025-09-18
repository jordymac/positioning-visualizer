import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import OpenAI from 'openai';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Initialize OpenAI with server-side API key
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? process.env.FRONTEND_URL 
    : ['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173']
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false
});

// More restrictive rate limiting for AI endpoints
const aiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Limit each IP to 20 AI requests per windowMs
  message: 'Too many AI requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false
});

app.use(limiter);
app.use(express.json({ limit: '10mb' }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    hasOpenAI: !!process.env.OPENAI_API_KEY
  });
});

// Positioning generation endpoint
app.post('/api/generate-positioning', aiLimiter, async (req, res) => {
  try {
    const { prompt, context } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    if (!process.env.OPENAI_API_KEY) {
      return res.status(503).json({ 
        error: 'OpenAI API key not configured on server',
        fallback: true
      });
    }

    console.log('Generating positioning with ChatGPT...');

    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are an expert positioning strategist. Generate compelling, professional positioning copy based on successful examples and patterns. Always format your response exactly as requested.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 800,
      temperature: 0.7
    });

    const generatedText = response.choices[0]?.message?.content || '';
    
    res.json({
      success: true,
      content: generatedText,
      usage: {
        promptTokens: response.usage?.prompt_tokens,
        completionTokens: response.usage?.completion_tokens,
        totalTokens: response.usage?.total_tokens
      }
    });

  } catch (error) {
    console.error('OpenAI API Error:', error);
    
    if (error instanceof Error) {
      // OpenAI API errors
      if ('status' in error && error.status === 429) {
        return res.status(429).json({ 
          error: 'Rate limit exceeded. Please try again later.',
          fallback: true
        });
      }
      
      if ('status' in error && error.status === 401) {
        return res.status(401).json({ 
          error: 'Invalid API key configuration.',
          fallback: true
        });
      }
    }

    res.status(500).json({ 
      error: 'Failed to generate positioning content.',
      fallback: true
    });
  }
});

// GraphRAG status endpoint
app.get('/api/graphrag-status', (req, res) => {
  res.json({
    isInitialized: true,
    hasOpenAI: !!process.env.OPENAI_API_KEY,
    graphSize: 7, // Number of examples in knowledge graph
    endpoints: {
      generatePositioning: '/api/generate-positioning'
    }
  });
});

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Server Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

app.listen(PORT, () => {
  console.log(`🚀 Positioning Visualizer API server running on port ${PORT}`);
  console.log(`🔒 Security: CORS, Helmet, Rate Limiting enabled`);
  console.log(`🤖 OpenAI: ${process.env.OPENAI_API_KEY ? '✅ Configured' : '❌ Not configured'}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
});

export default app;