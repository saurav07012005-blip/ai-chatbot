import { Router } from 'express';
import { handleChatMessage, checkHealth } from '../controllers/chatController.js';

const router = Router();

// API Health Check
router.get('/health', checkHealth);

// Chat Message Processing Endpoint
router.post('/chat', handleChatMessage);
router.post('/chat/stream', handleChatMessage);

export default router;

