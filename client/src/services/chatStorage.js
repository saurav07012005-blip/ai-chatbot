/**
 * Persistent Chat Storage Manager for AI Chatbot
 * Manages chat sessions, messages, and titles in localStorage.
 */

const STORAGE_KEY = 'gemini_ai_chat_sessions_v1';
const ACTIVE_CHAT_KEY = 'gemini_ai_active_chat_id';

/**
 * Cleanly generate a concise title (30-50 chars) from first user message
 */
export function generateChatTitle(firstMessageText) {
  if (!firstMessageText || typeof firstMessageText !== 'string') {
    return 'New Conversation';
  }

  let cleaned = firstMessageText.trim().replace(/\s+/g, ' ');
  
  // Remove common prefix questions for cleaner title titles
  cleaned = cleaned.replace(/^(can you|please|help me|explain|what is|how to|write a|code a|tell me about)\s+/i, '');
  
  // Capitalize first letter
  if (cleaned.length > 0) {
    cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
  }

  // Truncate to max 45 characters
  if (cleaned.length > 45) {
    cleaned = cleaned.substring(0, 42).trim() + '...';
  }

  return cleaned || 'New Conversation';
}

/**
 * Compress attachment data before saving to localStorage to avoid QuotaExceededError
 */
function sanitizeAttachmentForStorage(attachment) {
  if (!attachment) return null;
  
  // Return lightweight representation without massive base64 strings
  return {
    name: attachment.name,
    type: attachment.type,
    size: attachment.size,
    isImage: attachment.isImage,
    isDocument: attachment.isDocument,
    // Keep a mini preview if available, but strip huge data URLs
    previewUrl: attachment.isImage && attachment.previewUrl && attachment.previewUrl.length < 50000 
      ? attachment.previewUrl 
      : null
  };
}

/**
 * Sanitize message object for local storage
 */
function sanitizeMessageForStorage(msg) {
  return {
    ...msg,
    attachment: sanitizeAttachmentForStorage(msg.attachment)
  };
}

export const chatStorage = {
  /**
   * Get all saved chats sorted by updatedAt descending
   */
  getAllChats() {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (!data) return [];
      const chats = JSON.parse(data);
      return Array.isArray(chats) ? chats.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)) : [];
    } catch (err) {
      console.error('Failed to load chat history from localStorage:', err);
      return [];
    }
  },

  /**
   * Get a specific chat session by ID
   */
  getChat(id) {
    const chats = this.getAllChats();
    return chats.find(c => c.id === id) || null;
  },

  /**
   * Save or update a chat session
   */
  saveChat(chatSession) {
    if (!chatSession || !chatSession.id) return;
    try {
      const chats = this.getAllChats();
      const sanitizedMessages = (chatSession.messages || []).map(sanitizeMessageForStorage);
      
      const updatedSession = {
        ...chatSession,
        messages: sanitizedMessages,
        updatedAt: new Date().toISOString()
      };

      const existingIndex = chats.findIndex(c => c.id === chatSession.id);
      if (existingIndex >= 0) {
        chats[existingIndex] = updatedSession;
      } else {
        chats.unshift(updatedSession);
      }

      localStorage.setItem(STORAGE_KEY, JSON.stringify(chats));
      return updatedSession;
    } catch (err) {
      console.error('Failed to save chat session:', err);
    }
  },

  /**
   * Delete a chat session by ID
   */
  deleteChat(id) {
    try {
      const chats = this.getAllChats();
      const filtered = chats.filter(c => c.id !== id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
      
      if (this.getActiveChatId() === id) {
        this.setActiveChatId(null);
      }
      return filtered;
    } catch (err) {
      console.error('Failed to delete chat session:', err);
      return [];
    }
  },

  /**
   * Rename a chat session
   */
  renameChat(id, newTitle) {
    try {
      const chats = this.getAllChats();
      const chat = chats.find(c => c.id === id);
      if (chat) {
        chat.title = newTitle.trim() || 'Untitled Chat';
        chat.updatedAt = new Date().toISOString();
        localStorage.setItem(STORAGE_KEY, JSON.stringify(chats));
      }
      return chats;
    } catch (err) {
      console.error('Failed to rename chat session:', err);
    }
  },

  /**
   * Active chat ID management
   */
  getActiveChatId() {
    return localStorage.getItem(ACTIVE_CHAT_KEY) || null;
  },

  setActiveChatId(id) {
    if (id) {
      localStorage.setItem(ACTIVE_CHAT_KEY, id);
    } else {
      localStorage.removeItem(ACTIVE_CHAT_KEY);
    }
  },

  /**
   * Group chats by date categories
   */
  groupChatsByDate(chats) {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const yesterdayStart = todayStart - 86400000;
    const sevenDaysAgoStart = todayStart - (6 * 86400000);

    const grouped = {
      TODAY: [],
      YESTERDAY: [],
      PREVIOUS_7_DAYS: [],
      OLDER: []
    };

    chats.forEach(chat => {
      const time = new Date(chat.updatedAt || chat.createdAt).getTime();
      if (time >= todayStart) {
        grouped.TODAY.push(chat);
      } else if (time >= yesterdayStart) {
        grouped.YESTERDAY.push(chat);
      } else if (time >= sevenDaysAgoStart) {
        grouped.PREVIOUS_7_DAYS.push(chat);
      } else {
        grouped.OLDER.push(chat);
      }
    });

    return grouped;
  }
};
