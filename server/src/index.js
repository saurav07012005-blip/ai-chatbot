import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { fileURLToPath } from 'url';
import chatRoutes from './routes/chatRoutes.js';
import { errorHandler } from './middleware/errorHandler.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const clientDistPath = path.join(__dirname, '../../client/dist');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: '*', // Allow same-origin and dev requests
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-api-key']
}));

app.use(express.json({ limit: '10mb' }));

// Rate Limiting to prevent API abuse (60 requests per minute)
const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests sent. Please wait a moment before asking again.'
    }
  }
});
app.use('/api/', limiter);

// Register API Routes
app.use('/api', chatRoutes);

// Serve static React frontend production build
app.use(express.static(clientDistPath));

// Fallback to React index.html for client-side routing
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) {
    return next();
  }
  res.sendFile(path.join(clientDistPath, 'index.html'));
});

// Global Error Handler
app.use(errorHandler);

// Start Server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`==================================================`);
  console.log(`🚀 Chatbot Single-Service Production Server running on port ${PORT}`);
  console.log(`📡 Health Check: http://localhost:${PORT}/api/health`);
  console.log(`💬 Chat Endpoint: http://localhost:${PORT}/api/chat`);
  console.log(`==================================================`);
});
