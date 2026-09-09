import React, { useState, useRef, useEffect } from 'react';
import { Send, Paperclip, X, FileText, Image as ImageIcon } from 'lucide-react';

const MAX_CHARS = 4000;
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB limit

export default function ChatInput({ onSendMessage, isLoading, disabled }) {
  const [text, setText] = useState('');
  const [attachment, setAttachment] = useState(null);
  const [fileError, setFileError] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [text]);

  const handleFileSelect = (file) => {
    if (!file) return;
    setFileError(null);

    if (file.size > MAX_FILE_SIZE) {
      setFileError('File size exceeds 10MB limit. Please upload a smaller file.');
      return;
    }

    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/webp', 'image/gif',
      'application/pdf', 'text/plain'
    ];

    if (!allowedTypes.includes(file.type)) {
      setFileError('Unsupported file type. Supported formats: JPG, PNG, WEBP, GIF, PDF, TXT.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target.result;
      const isImage = file.type.startsWith('image/');
      setAttachment({
        name: file.name,
        mimeType: file.type,
        data: dataUrl,
        isImage,
        sizeFormatted: `${(file.size / 1024).toFixed(1)} KB`
      });
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) handleFileSelect(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDragging) setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileSelect(file);
  };

  const handleSubmit = (e) => {
    e?.preventDefault();
    const hasText = Boolean(text.trim());
    const hasAttachment = Boolean(attachment);

    if ((!hasText && !hasAttachment) || isLoading || disabled || text.length > MAX_CHARS) return;

    onSendMessage(text.trim(), attachment);
    setText('');
    setAttachment(null);
    setFileError(null);

    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const charCount = text.length;
  const isNearLimit = charCount > MAX_CHARS * 0.85;
  const isOverLimit = charCount > MAX_CHARS;
  const canSend = (Boolean(text.trim()) || Boolean(attachment)) && !isLoading && !disabled && !isOverLimit;

  return (
    <div 
      className={`chat-input-container ${isDragging ? 'drag-over' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      style={{ position: 'relative' }}
    >
      {/* File Validation Error Banner */}
      {fileError && (
        <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#ef4444', padding: '0.4rem 0.75rem', borderRadius: '8px', fontSize: '0.78rem', marginBottom: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>{fileError}</span>
          <button onClick={() => setFileError(null)} style={{ background: 'transparent', border: 'none', color: 'inherit', cursor: 'pointer' }}>
            <X size={14} />
          </button>
        </div>
      )}

      {/* Attachment Preview Container */}
      {attachment && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: 'var(--bg-tertiary)', border: '1px solid var(--glass-border)', padding: '0.5rem 0.75rem', borderRadius: '10px', marginBottom: '0.5rem', width: 'fit-content', maxWidth: '100%' }}>
          {attachment.isImage ? (
            <img 
              src={attachment.data} 
              alt="Attachment preview" 
              style={{ width: '44px', height: '44px', objectFit: 'cover', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.1)' }} 
            />
          ) : (
            <div style={{ background: 'rgba(99, 102, 241, 0.15)', padding: '0.5rem', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FileText size={24} style={{ color: '#818cf8' }} />
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', maxWidth: '220px' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {attachment.name}
            </span>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
              {attachment.sizeFormatted} • {attachment.isImage ? 'Image' : 'Document'}
            </span>
          </div>

          <button
            onClick={() => setAttachment(null)}
            style={{ background: 'rgba(255,255,255,0.08)', border: 'none', color: 'var(--text-muted)', borderRadius: '50%', padding: '3px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', marginLeft: '0.25rem' }}
            title="Remove attachment"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Input Form Wrapper */}
      <form onSubmit={handleSubmit} className="input-box-wrapper">
        <input 
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/jpeg,image/png,image/webp,image/gif,application/pdf,text/plain"
          style={{ display: 'none' }}
        />

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          style={{ background: 'transparent', border: 'none', color: attachment ? '#818cf8' : 'var(--text-muted)', cursor: 'pointer', padding: '0.4rem', display: 'flex', alignItems: 'center', borderRadius: '6px' }}
          title="Attach Image or Document (JPG, PNG, WEBP, GIF, PDF, TXT)"
          disabled={isLoading || disabled}
        >
          <Paperclip size={19} />
        </button>

        <textarea
          ref={textareaRef}
          className="chat-textarea"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={attachment ? "Ask a question about this attachment..." : "Ask a question or enter a query... (Press Enter to send)"}
          rows={1}
          disabled={isLoading || disabled}
        />

        <div className="input-controls">
          <button
            type="submit"
            className="send-button"
            disabled={!canSend}
            title={isOverLimit ? "Message too long" : "Send message"}
            aria-label="Send message"
          >
            <Send size={18} />
          </button>
        </div>
      </form>

      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0 0.5rem' }}>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          Tip: Press <kbd style={{ background: 'rgba(255,255,255,0.1)', padding: '1px 5px', borderRadius: '4px' }}>Shift + Enter</kbd> for new line • Drag & drop images supported
        </span>
        <span className={`char-counter ${isOverLimit ? 'error' : isNearLimit ? 'warning' : ''}`}>
          {charCount} / {MAX_CHARS}
        </span>
      </div>
    </div>
  );
}

