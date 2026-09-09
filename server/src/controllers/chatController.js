import { generateChatResponse, generateChatResponseStream } from '../services/aiService.js';

/**
 * Controller for POST /api/chat
 * Connects frontend to Google Gemini API with Streaming & Multimodal Attachment support
 */
export async function handleChatMessage(req, res, next) {
  const startTime = Date.now();
  try {
    const { message = '', conversation, history, apiKey, attachment } = req.body;
    const isStream = req.headers.accept === 'text/event-stream' || req.path?.endsWith('/stream');

    const trimmedMsg = (typeof message === 'string' ? message : '').trim();

    // Validate that either message or attachment is provided
    if (!trimmedMsg && (!attachment || !attachment.data)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'EMPTY_MESSAGE',
          message: 'Please enter a message or upload an image/document.'
        }
      });
    }

    // Max character validation
    if (trimmedMsg.length > 8000) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MESSAGE_TOO_LONG',
          message: 'Message exceeds maximum allowed length of 8000 characters.'
        }
      });
    }

    const contextHistory = Array.isArray(conversation) ? conversation : (Array.isArray(history) ? history : []);
    const previewMsg = trimmedMsg.length > 50 ? `${trimmedMsg.substring(0, 50)}...` : (trimmedMsg || `[Attachment: ${attachment?.name || 'file'}]`);

    console.log(`[PERF] [CHAT] Request received: "${previewMsg}"`);

    if (isStream) {
      // Set headers for Server-Sent Events (SSE)
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.flushHeaders?.();

      let usedModel = 'gemini-3.6-flash';

      await generateChatResponseStream(trimmedMsg, contextHistory, apiKey, attachment, (chunk, meta) => {
        if (meta?.model) usedModel = meta.model;
        res.write(`data: ${JSON.stringify({ chunk, model: meta?.model, provider: meta?.provider })}\n\n`);
      });

      res.write(`data: ${JSON.stringify({ done: true, model: usedModel, latencyMs: Date.now() - startTime })}\n\n`);
      res.end();
      console.log(`[PERF] Stream finished using model ${usedModel} in ${Date.now() - startTime}ms`);
      return;
    }

    // Standard JSON response
    const aiResult = await generateChatResponse(trimmedMsg, contextHistory, apiKey, attachment);
    console.log(`[PERF] Response generated using model ${aiResult.model} in ${Date.now() - startTime}ms`);

    return res.status(200).json({
      success: true,
      message: aiResult.text,
      data: {
        id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        reply: aiResult.text,
        provider: aiResult.provider,
        model: aiResult.model,
        timestamp: aiResult.timestamp,
        latencyMs: Date.now() - startTime
      }
    });

  } catch (error) {
    console.error("Chat Controller Error:", error.message);
    const statusCode = error.status || (error.code === 'API_KEY_MISSING' ? 401 : 500);

    if (res.headersSent) {
      res.write(`data: ${JSON.stringify({ error: { code: error.code || 'API_ERROR', message: error.message } })}\n\n`);
      return res.end();
    }

    return res.status(statusCode).json({
      success: false,
      error: {
        code: error.code || 'API_ERROR',
        message: error.message || "Sorry, I couldn't generate a response right now. Please check your API key or try again."
      }
    });
  }
}

/**
 * Health check endpoint
 */
export function checkHealth(req, res) {
  res.status(200).json({
    status: 'healthy',
    service: 'AI Chatbot API Server',
    timestamp: new Date().toISOString(),
    hasApiKeyConfigured: Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'your_gemini_api_key_here')
  });
}

