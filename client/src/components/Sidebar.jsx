import React, { useState, useEffect, useRef } from 'react';
import { 
  Plus, 
  MessageSquare, 
  MoreVertical, 
  Edit3, 
  Trash2, 
  Settings, 
  Moon, 
  Sun, 
  X,
  Bot
} from 'lucide-react';
import { chatStorage } from '../services/chatStorage';
import RenameModal from './RenameModal';

export default function Sidebar({
  isOpen,
  onClose,
  chats,
  activeChatId,
  onSelectChat,
  onNewChat,
  onRenameChat,
  onDeleteChat,
  onOpenSettings,
  theme,
  onToggleTheme,
  isConnected,
  hasApiKey
}) {
  const [activeMenuId, setActiveMenuId] = useState(null);
  const [renameTarget, setRenameTarget] = useState(null);
  const menuRef = useRef(null);

  // Close three-dot menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setActiveMenuId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const groupedChats = chatStorage.groupChatsByDate(chats || []);

  const handleToggleMenu = (e, chatId) => {
    e.stopPropagation();
    setActiveMenuId(prev => (prev === chatId ? null : chatId));
  };

  const handleStartRename = (e, chat) => {
    e.stopPropagation();
    setActiveMenuId(null);
    setRenameTarget(chat);
  };

  const handleConfirmRename = (newTitle) => {
    if (renameTarget) {
      onRenameChat(renameTarget.id, newTitle);
      setRenameTarget(null);
    }
  };

  const handleDelete = (e, chatId) => {
    e.stopPropagation();
    setActiveMenuId(null);
    if (window.confirm('Are you sure you want to delete this conversation?')) {
      onDeleteChat(chatId);
    }
  };

  const renderCategoryGroup = (title, items) => {
    if (!items || items.length === 0) return null;

    return (
      <div className="sidebar-group" key={title}>
        <div className="sidebar-group-title">{title}</div>
        <div className="sidebar-group-list">
          {items.map((chat) => {
            const isActive = chat.id === activeChatId;
            const isMenuOpen = activeMenuId === chat.id;

            return (
              <div
                key={chat.id}
                className={`sidebar-chat-item ${isActive ? 'active' : ''}`}
                onClick={() => {
                  onSelectChat(chat.id);
                  if (window.innerWidth <= 768) onClose();
                }}
              >
                <MessageSquare size={16} className="sidebar-chat-icon" />
                <span className="sidebar-chat-title" title={chat.title}>
                  {chat.title || 'Untitled Chat'}
                </span>

                <button
                  className="sidebar-menu-btn"
                  onClick={(e) => handleToggleMenu(e, chat.id)}
                  title="Options"
                  aria-label="Conversation options"
                >
                  <MoreVertical size={16} />
                </button>

                {isMenuOpen && (
                  <div className="sidebar-dropdown-menu" ref={menuRef}>
                    <button
                      className="dropdown-item"
                      onClick={(e) => handleStartRename(e, chat)}
                    >
                      <Edit3 size={14} />
                      <span>Rename</span>
                    </button>
                    <button
                      className="dropdown-item delete"
                      onClick={(e) => handleDelete(e, chat.id)}
                    >
                      <Trash2 size={14} />
                      <span>Delete</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <>
      {/* Backdrop for mobile view */}
      {isOpen && <div className="sidebar-backdrop" onClick={onClose} />}

      <aside className={`sidebar-container ${isOpen ? 'open' : ''}`}>
        {/* Top Header */}
        <div className="sidebar-header">
          <button className="new-chat-btn" onClick={() => { onNewChat(); if (window.innerWidth <= 768) onClose(); }}>
            <Plus size={18} />
            <span>New Chat</span>
          </button>
          <button className="sidebar-close-btn icon-button" onClick={onClose} aria-label="Close sidebar">
            <X size={18} />
          </button>
        </div>

        {/* Conversation List */}
        <div className="sidebar-content">
          {chats.length === 0 ? (
            <div className="sidebar-empty">
              <Bot size={28} className="empty-icon" />
              <p>No past conversations</p>
              <span>Start a new chat to begin</span>
            </div>
          ) : (
            <>
              {renderCategoryGroup('Today', groupedChats.TODAY)}
              {renderCategoryGroup('Yesterday', groupedChats.YESTERDAY)}
              {renderCategoryGroup('Previous 7 Days', groupedChats.PREVIOUS_7_DAYS)}
              {renderCategoryGroup('Older', groupedChats.OLDER)}
            </>
          )}
        </div>

        {/* Footer Controls */}
        <div className="sidebar-footer">
          <div className="sidebar-status-row">
            <div className={`status-indicator ${isConnected ? 'online' : 'offline'}`}>
              <span className="status-dot-inner" />
              <span className="status-label">
                {hasApiKey ? 'Gemini Live' : isConnected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
          </div>

          <div className="sidebar-footer-actions">
            <button className="sidebar-footer-btn" onClick={onOpenSettings} title="Settings">
              <Settings size={18} />
              <span>Settings</span>
            </button>
            <button className="sidebar-footer-btn" onClick={onToggleTheme} title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}>
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
              <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Rename Modal */}
      {renameTarget && (
        <RenameModal
          isOpen={Boolean(renameTarget)}
          onClose={() => setRenameTarget(null)}
          currentTitle={renameTarget.title}
          onSave={handleConfirmRename}
        />
      )}
    </>
  );
}
