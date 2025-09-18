# Secure Backend Architecture

## Overview
The positioning visualizer now uses a secure backend proxy for OpenAI API calls, eliminating the security risk of exposing API keys in the browser.

## Architecture
```
Frontend (React) → Backend (Express.js) → OpenAI API
```

## Security Features
- ✅ **API Key Protection**: OpenAI key stored securely on backend
- ✅ **Rate Limiting**: 20 AI requests per 15 minutes per IP
- ✅ **CORS Protection**: Configurable origins
- ✅ **Request Validation**: Input sanitization
- ✅ **Error Handling**: Graceful fallbacks

## Getting Started

### 1. Environment Setup
Create `.env` file in project root:
```bash
OPENAI_API_KEY=your_openai_api_key_here
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```

### 2. Start Development
```bash
# Start both frontend and backend together
npm start

# Or start separately:
npm run server:dev  # Backend on :3001
npm run dev         # Frontend on :5173
```

### 3. Backend Endpoints

**Health Check**
```
GET /health
Response: { status: 'healthy', hasOpenAI: true, timestamp: '...' }
```

**Generate Positioning**
```
POST /api/generate-positioning
Body: { prompt: string, context: string }
Response: { success: true, content: string, usage: {...} }
```

**GraphRAG Status**
```
GET /api/graphrag-status
Response: { isInitialized: true, hasOpenAI: true, graphSize: 7 }
```

## Fallback System
If backend is unavailable or API key is missing:
1. Frontend automatically detects backend issues
2. Falls back to enhanced rule-based generation
3. Still produces high-quality positioning copy
4. No user interruption

## Production Deployment
1. Deploy backend to secure server (Railway, Heroku, etc.)
2. Set `VITE_API_URL` to your backend URL
3. Configure CORS with your frontend domain
4. Enable HTTPS for all API calls

## Rate Limits
- **General API**: 100 requests per 15 minutes
- **AI Generation**: 20 requests per 15 minutes
- **Per IP basis**: Prevents abuse

## Error Handling
- Invalid requests → 400 with clear error message
- Rate limits → 429 with retry guidance  
- API failures → Automatic fallback to rule-based generation
- Network issues → Graceful degradation

The system is designed to always work, even if ChatGPT is unavailable!