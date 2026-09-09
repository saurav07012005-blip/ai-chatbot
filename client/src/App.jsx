import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import MessageList from './components/MessageList';
import QuickPrompts from './components/QuickPrompts';
import ChatInput from './components/ChatInput';
import ErrorBanner from './components/ErrorBanner';
import SettingsModal from './components/SettingsModal';
import { chatStorage, generateChatTitle } from './services/chatStorage';
import { sendChatMessageStream, checkBackendHealth } from './services/api';
import './styles/global.css';

export default function App() {
  const [chats, setChats] = useState(() => chatStorage.getAllChats());
  const [activeChatId, setActiveChatId] = useState(() => chatStorage.getActiveChatId());
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const [messages, setMessages] = useState(() => {
    const savedId = chatStorage.getActiveChatId();
    if (savedId) {
      const activeChat = chatStorage.getChat(savedId);
      return activeChat ? activeChat.messages : [];
    }
    return [];
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [theme, setTheme] = useState(() => localStorage.getItem('app_theme') || 'dark');
  const [isConnected, setIsConnected] = useState(true);
  const [serverHasKey, setServerHasKey] = useState(false);
  const [lastFailedPayload, setLastFailedPayload] = useState(null);
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('gemini_user_api_key') || '');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Sync theme with document attribute
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('app_theme', theme);
  }, [theme]);

  // Check health on mount and periodically
  useEffect(() => {
    const verifyBackend = async () => {
      const health = await checkBackendHealth();
      setIsConnected(health.status === 'healthy');
      if (health.hasApiKeyConfigured) {
        setServerHasKey(true);
      }
    };
    verifyBackend();
    const interval = setInterval(verifyBackend, 15000);
    return () => clearInterval(interval);
  }, []);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  const handleSaveApiKey = (newKey) => {
    setApiKey(newKey);
    localStorage.setItem('gemini_user_api_key', newKey);
  };

  const handleNewChat = () => {
    setActiveChatId(null);
    chatStorage.setActiveChatId(null);
    setMessages([]);
    setError(null);
    setLastFailedPayload(null);
  };

  const handleSelectChat = (chatId) => {
    const targetChat = chatStorage.getChat(chatId);
    if (targetChat) {
      setActiveChatId(chatId);
      chatStorage.setActiveChatId(chatId);
      setMessages(targetChat.messages || []);
      setError(null);
      setLastFailedPayload(null);
    }
  };

  const handleRenameChat = (chatId, newTitle) => {
    const updatedChats = chatStorage.renameChat(chatId, newTitle);
    if (updatedChats) {
      setChats([...updatedChats]);
    }
  };

  const handleDeleteChat = (chatId) => {
    const remainingChats = chatStorage.deleteChat(chatId);
    setChats(remainingChats);
    if (activeChatId === chatId) {
      handleNewChat();
    }
  };

  const handleSendMessage = async (text, attachment = null) => {
    const trimmedText = (text || '').trim();
    if (!trimmedText && !attachment) return;

    setError(null);
    setLastFailedPayload({ text: trimmedText, attachment });

    const userMessage = {
      id: `msg_user_${Date.now()}`,
      sender: 'user',
      text: trimmedText || (attachment?.isImage ? 'Analyze this image and explain what you see.' : 'Analyze this document and summarize its content.'),
      attachment: attachment ? { ...attachment } : null,
      timestamp: new Date().toISOString()
    };

    let currentSessionId = activeChatId;
    let currentTitle = '';

    if (!currentSessionId) {
      currentSessionId = `chat_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
      currentTitle = generateChatTitle(userMessage.text);
      setActiveChatId(currentSessionId);
      chatStorage.setActiveChatId(currentSessionId);
    } else {
      const existing = chatStorage.getChat(currentSessionId);
      currentTitle = existing?.title || generateChatTitle(userMessage.text);
    }

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setIsLoading(true);

    const initialSession = {
      id: currentSessionId,
      title: currentTitle,
      messages: updatedMessages,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    chatStorage.saveChat(initialSession);
    setChats(chatStorage.getAllChats());

    const botMessageId = `msg_bot_${Date.now()}`;
    let streamedText = '';

    try {
      const historyContext = updatedMessages.slice(0, -1).map(m => ({
        role: m.sender === 'user' ? 'user' : 'model',
        text: m.text
      }));

      const streamingBotMsg = {
        id: botMessageId,
        sender: 'bot',
        text: '',
        provider: 'Google Gemini AI',
        model: 'gemini-3.6-flash',
        timestamp: new Date().toISOString()
      };

      setMessages(prev => [...prev, streamingBotMsg]);

      let rafId = null;
      let pendingMeta = null;

      const metaResult = await sendChatMessageStream(
        trimmedText,
        historyContext,
        apiKey,
        attachment,
        (chunk, meta) => {
          streamedText += chunk;
          pendingMeta = meta;

          if (!rafId) {
            rafId = requestAnimationFrame(() => {
              rafId = null;
              const currentText = streamedText;
              const metaInfo = pendingMeta;
              setMessages(prev =>
                prev.map(msg =>
                  msg.id === botMessageId
                    ? {
                        ...msg,
                        text: currentText,
                        model: metaInfo?.model || msg.model,
                        provider: metaInfo?.provider || msg.provider
                      }
                    : msg
                )
              );
            });
          }
        }
      );

      if (rafId) cancelAnimationFrame(rafId);

      const finalBotMsg = {
        id: botMessageId,
        sender: 'bot',
        text: streamedText || 'No response generated.',
        model: metaResult?.model || 'gemini-3.6-flash',
        provider: 'Google Gemini AI',
        timestamp: new Date().toISOString()
      };

      const finalMessages = [...updatedMessages, finalBotMsg];
      setMessages(finalMessages);

      chatStorage.saveChat({
        id: currentSessionId,
        title: currentTitle,
        messages: finalMessages,
        createdAt: initialSession.createdAt,
        updatedAt: new Date().toISOString()
      });
      setChats(chatStorage.getAllChats());

    } catch (err) {
      console.error("Failed to send message to Gemini API:", err);

      setMessages(prev => prev.filter(msg => msg.id !== botMessageId || msg.text.length > 0));

      setError({
        code: err.code || 'REQUEST_FAILED',
        message: err.message || 'Unable to receive response from Google Gemini API.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetry = () => {
    if (lastFailedPayload) {
      handleSendMessage(lastFailedPayload.text, lastFailedPayload.attachment);
    }
  };

  return (
    <div className="app-container">
      <Header 
        theme={theme} 
        onToggleTheme={toggleTheme} 
        onNewChat={handleNewChat} 
        isConnected={isConnected} 
        onOpenSettings={() => setIsSettingsOpen(true)}
        hasApiKey={Boolean(apiKey || serverHasKey)}
        onToggleSidebar={() => setIsSidebarOpen(prev => !prev)}
      />

      <div className="main-content-layout">
        <Sidebar 
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          chats={chats}
          activeChatId={activeChatId}
          onSelectChat={handleSelectChat}
          onNewChat={handleNewChat}
          onRenameChat={handleRenameChat}
          onDeleteChat={handleDeleteChat}
          onOpenSettings={() => setIsSettingsOpen(true)}
          theme={theme}
          onToggleTheme={toggleTheme}
          isConnected={isConnected}
          hasApiKey={Boolean(apiKey || serverHasKey)}
        />

        <main className="chat-window">
          <ErrorBanner 
            error={error} 
            onDismiss={() => setError(null)} 
            onRetry={lastFailedPayload ? handleRetry : null} 
          />

          <MessageList 
            messages={messages} 
            isLoading={isLoading} 
            onSelectPrompt={(promptText) => handleSendMessage(promptText)} 
          />

          {messages.length === 0 && (
            <QuickPrompts 
              onSelectPrompt={(promptText) => handleSendMessage(promptText)} 
              disabled={isLoading} 
            />
          )}

          <ChatInput 
            onSendMessage={handleSendMessage} 
            isLoading={isLoading} 
            disabled={!isConnected} 
          />
        </main>
      </div>

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        apiKey={apiKey}
        onSaveApiKey={handleSaveApiKey}
      />
    </div>
  );
}
