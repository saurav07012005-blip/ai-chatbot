import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * Pure AI Service Layer using Google Gemini API.
 * NO fake responses, templates, or rule-based fallbacks.
 */

// In-memory model availability cache (15-minute TTL per API key)
const modelCache = new Map();

/**
 * Helper to sanitize conversation history for Gemini API.
 * Ensures roles strictly alternate starting with 'user' and ending with 'model'.
 */
function sanitizeHistory(history) {
  if (!Array.isArray(history)) return [];
  const result = [];
  let expectedRole = 'user';

  for (const item of history) {
    const rawText = item.text || item.content;
    if (!rawText || typeof rawText !== 'string' || !rawText.trim()) continue;

    const role = item.role
      ? (item.role === 'user' ? 'user' : 'model')
      : (item.sender === 'user' ? 'user' : 'model');

    if (role === expectedRole) {
      result.push({
        role: role,
        parts: [{ text: rawText.trim() }]
      });
      expectedRole = role === 'user' ? 'model' : 'user';
    }
  }

  // Gemini chat history should end with 'model' so the new prompt comes from 'user'
  if (result.length > 0 && result[result.length - 1].role !== 'model') {
    result.pop();
  }

  return result;
}

/**
 * Helper to build Gemini prompt contents with text and optional multimodal attachments (image/PDF).
 */
function buildPromptContents(message, attachment) {
  const parts = [];

  if (attachment && attachment.data && attachment.mimeType) {
    const base64Data = attachment.data.includes(',') ? attachment.data.split(',')[1] : attachment.data;
    parts.push({
      inlineData: {
        mimeType: attachment.mimeType,
        data: base64Data
      }
    });
  }

  const promptText = (message || '').trim() || (
    attachment?.mimeType?.startsWith('image/')
      ? 'Analyze this image and explain what you see.'
      : 'Analyze this document and summarize its content.'
  );

  parts.push(promptText);
  return parts;
}

/**
 * Dynamically queries Google Gemini API to retrieve models actually available for the given API key.
 * Uses an in-memory cache to prevent extra network round-trips on every request.
 */
export async function getAvailableModels(apiKey) {
  const cached = modelCache.get(apiKey);
  if (cached && (Date.now() - cached.timestamp < 15 * 60 * 1000)) {
    return cached.models;
  }

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(apiKey)}`;
    const res = await fetch(url);
    if (!res.ok) {
      if (res.status === 400 || res.status === 401 || res.status === 403) {
        const error = new Error('Invalid Gemini API key. Please check your API key in server .env or UI Settings (⚙️).');
        error.code = 'INVALID_API_KEY';
        error.status = 401;
        throw error;
      }
      return [];
    }
    const data = await res.json();
    if (!data.models || !Array.isArray(data.models)) return [];

    // Filter models that explicitly support text generation ('generateContent')
    const validModels = data.models
      .filter(m => m.supportedGenerationMethods && m.supportedGenerationMethods.includes('generateContent'))
      .map(m => m.name.replace(/^models\//, ''));

    // Sort to prioritize flash and pro models
    validModels.sort((a, b) => {
      if (a.includes('flash') && !b.includes('flash')) return -1;
      if (!a.includes('flash') && b.includes('flash')) return 1;
      return 0;
    });

    modelCache.set(apiKey, { models: validModels, timestamp: Date.now() });
    return validModels;
  } catch (err) {
    if (err.code === 'INVALID_API_KEY') throw err;
    return [];
  }
}

/**
 * Streams Gemini AI response token-by-token via chunk callback.
 */
export async function generateChatResponseStream(message, history = [], customApiKey = null, attachment = null, onChunk = null) {
  const apiKey = (customApiKey || process.env.GEMINI_API_KEY)?.trim();

  if (!apiKey || apiKey === 'your_gemini_api_key_here') {
    const error = new Error('API Key Missing: Please set your GEMINI_API_KEY in the server .env file or enter your key in the UI Settings (⚙️).');
    error.code = 'API_KEY_MISSING';
    error.status = 401;
    throw error;
  }

  let candidateModels = [];
  const envModel = process.env.AI_MODEL?.trim();
  if (envModel) {
    candidateModels.push(envModel);
  }

  const discoveredModels = await getAvailableModels(apiKey);
  if (discoveredModels.length > 0) {
    for (const m of discoveredModels) {
      if (!candidateModels.includes(m)) candidateModels.push(m);
    }
  }

  const fallbackDefaults = ['gemini-3.6-flash', 'gemini-2.5-flash', 'gemini-1.5-flash', 'gemini-2.0-flash', 'gemini-1.5-pro'];
  for (const m of fallbackDefaults) {
    if (!candidateModels.includes(m)) candidateModels.push(m);
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    let lastError = null;

    // Smart Adaptive Context Windowing:
    // Standalone / image prompts use 0 history turns to minimize input tokens; follow-ups send last 4 turns max.
    const isFollowup = history.length > 0 && !attachment && (
      message.length < 45 || 
      /^(give|show|what|how|why|it|this|that|code|example|complexity)/i.test(message.trim())
    );
    const trimmedHistory = isFollowup ? history.slice(-4) : [];
    const sanitizedHist = sanitizeHistory(trimmedHistory);
    const promptParts = buildPromptContents(message, attachment);

    const sdkStartTime = Date.now();
    console.log(`[PERF] Gemini SDK request initiated (Context turns: ${sanitizedHist.length})`);

    for (const modelName of candidateModels) {
      try {
        const model = genAI.getGenerativeModel({
          model: modelName,
          generationConfig: {
            temperature: 0.7,
            topP: 0.95,
            topK: 40
          },
          systemInstruction: 'You are a helpful, direct, and intelligent AI assistant (like ChatGPT). You answer user questions accurately and concisely without unnecessary introductory boilerplate. For direct questions or simple calculations (e.g., "2+3 equals to?"), answer directly (e.g., "2 + 3 = 5"). For programming queries, provide complete working code enclosed in properly formatted markdown code blocks with language tags. For image or document analysis requests, analyze the provided input thoroughly and directly answer the question. Maintain conversation history context for follow-up questions.'
        });

        let fullText = '';
        let firstTokenTime = null;

        const handleChunk = (text) => {
          if (firstTokenTime === null) {
            firstTokenTime = Date.now();
            console.log(`[PERF] First token/chunk received from Gemini (TTFB = ${firstTokenTime - sdkStartTime}ms)`);
          }
          fullText += text;
          if (onChunk) onChunk(text, { model: modelName, provider: 'Google Gemini AI' });
        };

        if (sanitizedHist.length > 0 && !attachment) {
          const chat = model.startChat({ history: sanitizedHist });
          const resultStream = await chat.sendMessageStream(promptParts.length === 1 ? promptParts[0] : promptParts);
          for await (const chunk of resultStream.stream) {
            handleChunk(chunk.text());
          }
        } else {
          const resultStream = await model.generateContentStream(promptParts);
          for await (const chunk of resultStream.stream) {
            handleChunk(chunk.text());
          }
        }

        if (fullText) {
          console.log(`[PERF] Gemini generation completed (Total Gen Time = ${Date.now() - sdkStartTime}ms)`);
          return {
            text: fullText,
            provider: 'Google Gemini AI',
            model: modelName,
            timestamp: new Date().toISOString()
          };
        }
      } catch (err) {
        console.warn(`Attempt with model ${modelName} failed:`, err.message);
        lastError = err;

        const isAuthErr = err.status === 401 || err.status === 403 || err.message?.includes('API_KEY_INVALID') || err.message?.includes('API key not valid');
        const isQuotaErr = err.status === 429 || err.message?.includes('RESOURCE_EXHAUSTED');

        if (isAuthErr || isQuotaErr) break;
      }
    }

    if (lastError) throw lastError;

  } catch (err) {
    console.error('Gemini API execution error:', err);

    let friendlyMessage = err.message || 'Failed to generate response from Google Gemini API.';
    let errorCode = 'API_GENERATION_FAILED';
    let statusCode = err.status || 500;

    if (err.message?.includes('API_KEY_INVALID') || err.message?.includes('API key not valid') || err.status === 401) {
      friendlyMessage = 'Invalid Gemini API key. Please check your API key in server .env or UI Settings (⚙️).';
      errorCode = 'INVALID_API_KEY';
      statusCode = 401;
    } else if (err.status === 429 || err.message?.includes('RESOURCE_EXHAUSTED') || err.message?.includes('Quota exceeded')) {
      friendlyMessage = 'Gemini API quota exceeded or rate limited. Please wait a moment or check your API key quota.';
      errorCode = 'RATE_LIMIT_EXHAUSTED';
      statusCode = 429;
    } else if (err.status === 404 || err.message?.includes('not found')) {
      friendlyMessage = 'The requested Gemini AI model was not found or is not supported for your API key/region.';
      errorCode = 'MODEL_NOT_FOUND';
      statusCode = 404;
    }

    const apiError = new Error(friendlyMessage);
    apiError.code = errorCode;
    apiError.status = statusCode;
    throw apiError;
  }
}

export async function generateChatResponse(message, history = [], customApiKey = null, attachment = null) {
  let fullResponse = '';
  let metaInfo = {};
  const result = await generateChatResponseStream(message, history, customApiKey, attachment, (chunk, meta) => {
    fullResponse += chunk;
    metaInfo = meta;
  });
  return result || { text: fullResponse, ...metaInfo, timestamp: new Date().toISOString() };
}




