import React, { useState } from 'react';
import { User, Bot, Copy, Check, FileText } from 'lucide-react';


function CodeBlock({ rawCode }) {
  const [codeCopied, setCodeCopied] = useState(false);
  const firstLineEnd = rawCode.indexOf('\n');
  let language = '';
  let codeContent = rawCode;

  if (firstLineEnd !== -1) {
    const firstLine = rawCode.substring(0, firstLineEnd).trim();
    if (firstLine && /^[a-zA-Z0-9_+#-]+$/.test(firstLine)) {
      language = firstLine;
      codeContent = rawCode.substring(firstLineEnd + 1);
    }
  }

  const handleCopyCode = () => {
    navigator.clipboard.writeText(codeContent.trim());
    setCodeCopied(true);
    setTimeout(() => setCodeCopied(false), 2000);
  };

  return (
    <div className="code-block-container" style={{ margin: '0.75rem 0', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--glass-border)', background: '#1e1e2e' }}>
      <div className="code-block-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.06)', padding: '0.35rem 0.75rem', fontSize: '0.75rem', color: '#94a3b8', fontFamily: 'monospace' }}>
        <span style={{ fontWeight: 600 }}>{language ? language.toUpperCase() : 'CODE'}</span>
        <button 
          onClick={handleCopyCode} 
          style={{ background: 'transparent', border: 'none', color: codeCopied ? '#10b981' : '#94a3b8', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem' }}
          title="Copy code to clipboard"
        >
          {codeCopied ? <Check size={13} /> : <Copy size={13} />}
          <span>{codeCopied ? 'Copied!' : 'Copy Code'}</span>
        </button>
      </div>
      <pre style={{ margin: 0, padding: '0.75rem 1rem', overflowX: 'auto', fontSize: '0.85rem', lineHeight: '1.45', fontFamily: 'Consolas, Monaco, "Andale Mono", "Ubuntu Mono", monospace' }}>
        <code>{codeContent.trim()}</code>
      </pre>
    </div>
  );
}

export default function MessageItem({ message }) {
  const isUser = message.sender === 'user';
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(message.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Helper to parse markdown bold, italics, code blocks, lists cleanly
  const renderFormattedText = (text) => {
    if (!text) return null;

    // Split text by markdown code blocks ```
    const codeBlockRegex = /```([\s\S]*?)```/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = codeBlockRegex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push({ type: 'text', content: text.substring(lastIndex, match.index) });
      }
      parts.push({ type: 'code', content: match[1] });
      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < text.length) {
      parts.push({ type: 'text', content: text.substring(lastIndex) });
    }

    return parts.map((part, i) => {
      if (part.type === 'code') {
        return <CodeBlock key={i} rawCode={part.content} />;
      }

      const lines = part.content.split('\n');
      return (
        <div key={i}>
          {lines.map((line, lIdx) => {
            const trimmed = line.trim();
            if (!trimmed) {
              return <div key={lIdx} style={{ height: '0.4rem' }} />;
            }

            // Headings
            if (trimmed.startsWith('# ')) {
              return <h1 key={lIdx} style={{ fontSize: '1.25rem', fontWeight: 700, margin: '0.6rem 0 0.3rem 0' }}>{parseInlineMarkdown(trimmed.slice(2))}</h1>;
            }
            if (trimmed.startsWith('## ')) {
              return <h2 key={lIdx} style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0.5rem 0 0.3rem 0' }}>{parseInlineMarkdown(trimmed.slice(3))}</h2>;
            }
            if (trimmed.startsWith('### ')) {
              return <h3 key={lIdx} style={{ fontSize: '0.98rem', fontWeight: 600, margin: '0.4rem 0 0.2rem 0' }}>{parseInlineMarkdown(trimmed.slice(4))}</h3>;
            }

            // Bullet points
            if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
              return (
                <div key={lIdx} style={{ display: 'flex', gap: '0.4rem', marginLeft: '0.5rem', marginBottom: '0.25rem' }}>
                  <span>•</span>
                  <div>{parseInlineMarkdown(trimmed.slice(2))}</div>
                </div>
              );
            }

            // Numbered list (e.g. "1. ")
            const numMatch = trimmed.match(/^(\d+)\.\s+(.*)/);
            if (numMatch) {
              return (
                <div key={lIdx} style={{ display: 'flex', gap: '0.4rem', marginLeft: '0.5rem', marginBottom: '0.25rem' }}>
                  <span style={{ fontWeight: 600 }}>{numMatch[1]}.</span>
                  <div>{parseInlineMarkdown(numMatch[2])}</div>
                </div>
              );
            }

            return (
              <p key={lIdx} style={{ marginBottom: '0.35rem', lineHeight: 1.5 }}>
                {parseInlineMarkdown(line)}
              </p>
            );
          })}
        </div>
      );
    });
  };

  // Inline markdown parser for **bold**, *italic*, and `code`
  const parseInlineMarkdown = (textLine) => {
    if (!textLine) return '';
    const tokens = textLine.split(/(\*\*.*?\*\*|\*.*?\*|`.*?`)/g);

    return tokens.map((token, index) => {
      if (token.startsWith('**') && token.endsWith('**') && token.length > 4) {
        return <strong key={index}>{token.slice(2, -2)}</strong>;
      }
      if (token.startsWith('*') && token.endsWith('*') && token.length > 2) {
        return <em key={index}>{token.slice(1, -1)}</em>;
      }
      if (token.startsWith('`') && token.endsWith('`') && token.length > 2) {
        return <code key={index} style={{ background: 'rgba(255,255,255,0.1)', padding: '2px 5px', borderRadius: '4px', fontSize: '0.85em', fontFamily: 'monospace' }}>{token.slice(1, -1)}</code>;
      }
      return token;
    });
  };

  const formattedTime = new Date(message.timestamp || Date.now()).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit'
  });

  const attachment = message.attachment;
  const isImageAttachment = attachment && (attachment.isImage || attachment.mimeType?.startsWith('image/'));

  return (
    <div className={`message-row ${isUser ? 'user' : 'bot'}`}>
      <div className={`avatar ${isUser ? 'user' : 'bot'}`}>
        {isUser ? <User size={18} /> : <Bot size={18} />}
      </div>

      <div className="message-bubble">
        {/* Render Attachment if present */}
        {attachment && (
          <div style={{ marginBottom: '0.6rem' }}>
            {isImageAttachment ? (
              <img 
                src={attachment.data} 
                alt={attachment.name || 'Uploaded image'} 
                style={{ maxWidth: '100%', maxHeight: '240px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.12)', objectFit: 'contain', background: '#000' }} 
              />
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.06)', padding: '0.45rem 0.75rem', borderRadius: '8px', border: '1px solid var(--glass-border)', fontSize: '0.8rem', width: 'fit-content' }}>
                <FileText size={18} style={{ color: '#818cf8' }} />
                <span>{attachment.name}</span>
              </div>
            )}
          </div>
        )}

        <div className="message-content">
          {renderFormattedText(message.text)}
        </div>

        <div className="message-meta">
          <span>{formattedTime} {message.provider ? `• ${message.provider}` : ''}</span>
          
          <div className="message-actions">
            <button 
              className="copy-btn" 
              onClick={handleCopy} 
              title="Copy message content"
              aria-label="Copy message"
            >
              {copied ? <Check size={13} style={{ color: '#10b981' }} /> : <Copy size={13} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}


