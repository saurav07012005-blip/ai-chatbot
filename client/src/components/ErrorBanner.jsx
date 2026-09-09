import React from 'react';
import { AlertTriangle, X, RefreshCw } from 'lucide-react';

export default function ErrorBanner({ error, onDismiss, onRetry }) {
  if (!error) return null;

  return (
    <div className="error-banner">
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
        <AlertTriangle size={18} style={{ color: '#ef4444', flexShrink: 0 }} />
        <div>
          <strong>{error.code || 'Error'}:</strong> {error.message}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
        {onRetry && (
          <button className="error-banner-action" onClick={onRetry}>
            <RefreshCw size={12} style={{ display: 'inline', marginRight: '3px' }} />
            Retry
          </button>
        )}
        <button 
          onClick={onDismiss} 
          style={{ background: 'transparent', border: 'none', color: 'inherit', cursor: 'pointer', opacity: 0.7 }}
          aria-label="Dismiss error"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
