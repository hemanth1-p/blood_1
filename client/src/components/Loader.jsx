import React from 'react';

export const Loader = ({ fullPage = false, text = 'Loading...' }) => {
  if (fullPage) {
    return (
      <div className="page-loader">
        <div style={{ textAlign: 'center' }}>
          <div className="loader-drop">🩸</div>
          <p style={{ marginTop: '1rem', color: 'var(--primary)', fontWeight: 600 }}>{text}</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem', gap: '0.75rem' }}>
      <span className="loading-spinner loading-spinner-dark"></span>
      <span style={{ color: 'var(--gray-600)', fontSize: '0.9rem' }}>{text}</span>
    </div>
  );
};

export default Loader;
