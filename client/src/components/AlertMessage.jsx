import React, { useEffect } from 'react';

export const AlertMessage = ({ message, type = 'success', onClose, autoDismiss = 5000 }) => {
  useEffect(() => {
    if (!message || !autoDismiss || !onClose) return;
    const timer = setTimeout(() => {
      onClose();
    }, autoDismiss);
    return () => clearTimeout(timer);
  }, [message, autoDismiss, onClose]);

  if (!message) return null;

  const icon =
    type === 'success' ? '✅' : type === 'error' ? '❌' : type === 'warning' ? '⚠️' : 'ℹ️';

  const alertClass =
    type === 'success'
      ? 'alert-success'
      : type === 'error'
      ? 'alert-error'
      : type === 'warning'
      ? 'alert-warning'
      : 'alert-info';

  return (
    <div className={`alert ${alertClass}`} role="alert">
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
        <span>{icon}</span>
        <span>{message}</span>
      </div>
      {onClose && (
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontSize: '1.2rem',
            color: 'inherit',
            opacity: 0.7,
            padding: '0 0.25rem',
            lineHeight: 1,
          }}
          aria-label="Close notification"
        >
          &times;
        </button>
      )}
    </div>
  );
};

export default AlertMessage;
