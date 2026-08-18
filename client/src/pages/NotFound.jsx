import React from 'react';
import { Link } from 'react-router-dom';

export const NotFound = () => {
  return (
    <div
      style={{
        minHeight: '70vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: '2rem',
      }}
    >
      <span style={{ fontSize: '4rem', marginBottom: '1rem' }}>🩸 404</span>
      <h1 style={{ fontSize: '2rem', color: 'var(--gray-900)', marginBottom: '0.5rem' }}>
        Page Not Found
      </h1>
      <p style={{ color: 'var(--gray-500)', maxWidth: '450px', marginBottom: '1.5rem' }}>
        The page you are looking for does not exist or may have been moved.
      </p>
      <Link to="/" className="btn btn-primary">
        Return to Home
      </Link>
    </div>
  );
};

export default NotFound;
