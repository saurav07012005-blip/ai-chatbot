import React, { useEffect, useRef } from 'react';
import MessageItem from './MessageItem';
import { Bot, Sparkles, MessageSquare, ShieldCheck } from 'lucide-react';

export default function MessageList({ messages, isLoading, onSelectPrompt }) {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  if (messages.length === 0) {
    return (
      <div className="messages-list">
        <div className="welcome-container">
          <span className="welcome-badge">
            <Sparkles size={13} style={{ display: 'inline', marginRight: '4px' }} />
            Google Gemini Powered AI Assistant
          </span>
          <h2 className="welcome-title">How can I help you today?</h2>
          <p className="welcome-desc">
            Ask any question in mathematics, programming, computer science, general knowledge, or writing.
          </p>

          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center', marginTop: '1rem' }}>
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--glass-border)', padding: '1rem', borderRadius: '12px', width: '180px', textAlign: 'center' }}>
              <MessageSquare size={24} style={{ color: '#818cf8', marginBottom: '0.5rem' }} />
              <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>Conversational Memory</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Follow-up questions supported</div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--glass-border)', padding: '1rem', borderRadius: '12px', width: '180px', textAlign: 'center' }}>
              <Bot size={24} style={{ color: '#ec4899', marginBottom: '0.5rem' }} />
              <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>Live LLM Responses</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Powered by Google Gemini</div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--glass-border)', padding: '1rem', borderRadius: '12px', width: '180px', textAlign: 'center' }}>
              <ShieldCheck size={24} style={{ color: '#10b981', marginBottom: '0.5rem' }} />
              <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>Secure Key Storage</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Server .env & UI settings</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="messages-list">
      {messages.map((msg) => (
        <MessageItem key={msg.id} message={msg} />
      ))}

      {isLoading && (
        <div className="message-row bot">
          <div className="avatar bot">
            <Bot size={18} />
          </div>
          <div className="message-bubble">
            <div className="typing-indicator">
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginRight: '0.5rem', fontWeight: 500 }}>
                Thinking...
              </span>
              <div className="typing-dot"></div>
              <div className="typing-dot"></div>
              <div className="typing-dot"></div>
            </div>
          </div>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  );
}
