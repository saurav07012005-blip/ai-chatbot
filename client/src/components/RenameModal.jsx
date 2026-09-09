import React, { useState, useEffect } from 'react';
import { X, Check } from 'lucide-react';

export default function RenameModal({ isOpen, onClose, currentTitle, onSave }) {
  const [title, setTitle] = useState(currentTitle || '');

  useEffect(() => {
    setTitle(currentTitle || '');
  }, [currentTitle]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (title.trim()) {
      onSave(title.trim());
      onClose();
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-container rename-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Rename Conversation</h3>
          <button className="icon-button" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="modal-body">
          <label className="input-label" htmlFor="chat-title-input">Conversation Title</label>
          <input
            id="chat-title-input"
            type="text"
            className="modal-input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter chat title..."
            autoFocus
            maxLength={60}
          />
          <div className="modal-actions">
            <button type="button" className="button secondary-btn" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="button primary-btn" disabled={!title.trim()}>
              <Check size={16} /> Save Title
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
