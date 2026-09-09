const API_BASE_URL = '/api';

/**
 * Sends user message, attachment, and conversation context to backend Gemini API.
 */
export async function sendChatMessage(message, conversation = [], apiKey = null, attachment = null) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 sec reasonable timeout for AI generation

  try {
    const response = await fetch(`${API_BASE_URL}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message,
        conversation,
        history: conversation,
        apiKey,
        attachment
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const data = await response.json();

    if (!response.ok || !data.success) {
      const errorMsg = data?.error?.message || `Server error (${response.status})`;
      const errorCode = data?.error?.code || 'SERVER_ERROR';
      const error = new Error(errorMsg);
      error.code = errorCode;
      throw error;
    }

    return {
      reply: data.message || data.data?.reply,
      id: data.data?.id || `msg_${Date.now()}`,
      provider: data.data?.provider || 'Google Gemini AI',
      model: data.data?.model || 'gemini-3.6-flash',
      timestamp: data.data?.timestamp || new Date().toISOString()
    };
  } catch (err) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      const timeoutErr = new Error('Request timed out after 60 seconds. Please check your internet connection or Gemini API key and try again.');
      timeoutErr.code = 'TIMEOUT_ERROR';
      throw timeoutErr;
    }
    if (!err.code) {
      err.code = 'NETWORK_ERROR';
    }
    throw err;
  }
}

/**
 * Streams chat responses token-by-token using Server-Sent Events (SSE).
 */
export async function sendChatMessageStream(message, conversation = [], apiKey = null, attachment = null, onChunk = null) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 60000);

  try {
    const response = await fetch(`${API_BASE_URL}/chat/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'text/event-stream'
      },
      body: JSON.stringify({
        message,
        conversation,
        history: conversation,
        apiKey,
        attachment
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      clearTimeout(timeoutId);
      const data = await response.json().catch(() => ({}));
      const errorMsg = data?.error?.message || `Server error (${response.status})`;
      const error = new Error(errorMsg);
      error.code = data?.error?.code || 'SERVER_ERROR';
      throw error;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';
    let usedModel = 'gemini-3.6-flash';
    let usedProvider = 'Google Gemini AI';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const jsonStr = line.slice(6).trim();
          if (!jsonStr) continue;
          try {
            const data = JSON.parse(jsonStr);
            if (data.error) {
              const err = new Error(data.error.message);
              err.code = data.error.code;
              throw err;
            }
            if (data.chunk && onChunk) {
              if (data.model) usedModel = data.model;
              if (data.provider) usedProvider = data.provider;
              onChunk(data.chunk, { model: usedModel, provider: usedProvider });
            }
            if (data.done) {
              if (data.model) usedModel = data.model;
            }
          } catch (e) {
            if (e.code) throw e;
          }
        }
      }
    }

    clearTimeout(timeoutId);
    return {
      model: usedModel,
      provider: usedProvider,
      timestamp: new Date().toISOString()
    };
  } catch (err) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      const timeoutErr = new Error('Request timed out after 60 seconds. Please check your internet connection or Gemini API key.');
      timeoutErr.code = 'TIMEOUT_ERROR';
      throw timeoutErr;
    }
    if (!err.code) err.code = 'NETWORK_ERROR';
    throw err;
  }
}



/**
 * Checks backend API health state
 */
export async function checkBackendHealth() {
  try {
    const res = await fetch(`${API_BASE_URL}/health`);
    if (res.ok) {
      return await res.json();
    }
    return { status: 'unreachable' };
  } catch (err) {
    return { status: 'offline', error: err.message };
  }
}
