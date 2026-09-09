import React from 'react';
import { Sun, Moon, Plus, Settings, Zap, Menu } from 'lucide-react';

export default function Header({ 
  theme, 
  onToggleTheme, 
  onNewChat, 
  isConnected, 
  onOpenSettings, 
  hasApiKey,
  onToggleSidebar 
}) {
  return (
    <header className="header">
      <div className="brand">
        <button 
          className="icon-button" 
          onClick={onToggleSidebar} 
          title="Toggle Chat History Sidebar"
          style={{ marginRight: '0.25rem' }}
        >
          <Menu size={18} />
        </button>

        <div className="brand-icon">
          <Zap size={22} />
        </div>
        <div>
          <h1 className="brand-title">AI Chatbot Assistant</h1>
          <p className="brand-subtitle">ChatGPT-style Assistant • Powered by Google Gemini</p>
        </div>
      </div>

      <div className="header-actions">
        <button
          className="icon-button"
          onClick={onNewChat}
          title="Start a New Conversation"
          style={{
            background: 'var(--accent-gradient)',
            color: '#fff',
            border: 'none',
            padding: '0.45rem 0.85rem',
            fontWeight: 600,
            gap: '0.35rem',
            borderRadius: 'var(--radius-md)'
          }}
        >
          <Plus size={16} />
          <span>New Chat</span>
        </button>

        <div className="status-badge" title={hasApiKey ? "Gemini API Key Configured" : "Server API Ready (Set GEMINI_API_KEY for live responses)"}>
          <span className="status-dot" />
          <span>{hasApiKey ? 'Gemini Live' : isConnected ? 'API Connected' : 'Connecting...'}</span>
        </div>

        <button
          className="icon-button"
          onClick={onOpenSettings}
          title="Configure Gemini API Key Settings"
          aria-label="Settings"
        >
          <Settings size={18} />
        </button>

        <button
          className="icon-button"
          onClick={onToggleTheme}
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
          aria-label="Toggle Theme"
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </div>
    </header>
  );
}
