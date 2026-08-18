import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AlertMessage from '../components/AlertMessage';

export const Login = () => {
  const { login, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [role, setRole] = useState('donor');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState(null);

  // If already logged in, redirect to dashboard
  useEffect(() => {
    if (isAuthenticated && user) {
      const from = location.state?.from?.pathname;
      if (from) {
        navigate(from, { replace: true });
      } else {
        navigate(user.role === 'admin' ? '/admin-dashboard' : '/donor-dashboard', { replace: true });
      }
    }
  }, [isAuthenticated, user, navigate, location]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setAlert(null);

    if (!email.trim() || !password) {
      setAlert({ type: 'error', message: 'Please enter both email and password.' });
      return;
    }

    setLoading(true);
    try {
      const res = await login(email.trim(), password, role);
      setAlert({ type: 'success', message: res.message || 'Login successful! Redirecting...' });
      setTimeout(() => {
        const dest = res.user.role === 'admin' ? '/admin-dashboard' : '/donor-dashboard';
        navigate(dest, { replace: true });
      }, 500);
    } catch (err) {
      setAlert({ type: 'error', message: err.message || 'Invalid credentials. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form-page">
      <div className="container">
        <div className="form-card">
          <div className="form-header">
            <div className="form-icon">🩸</div>
            <h1>Welcome Back</h1>
            <p>Access your BloodConnect profile and portal</p>
          </div>

          {alert && (
            <AlertMessage
              message={alert.message}
              type={alert.type}
              onClose={() => setAlert(null)}
            />
          )}

          {/* Role Tabs */}
          <div className="login-tabs">
            <button
              type="button"
              className={`login-tab ${role === 'donor' ? 'active' : ''}`}
              onClick={() => setRole('donor')}
            >
              ❤️ Life Saver / Donor
            </button>
            <button
              type="button"
              className={`login-tab ${role === 'admin' ? 'active' : ''}`}
              onClick={() => setRole('admin')}
            >
              🛡️ Admin / Hospital
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Email Address</label>
              <input
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

              <div style={{ marginTop: '1.5rem' }}>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn btn-primary btn-lg btn-block"
                >
                  {loading ? (
                    <>
                      <span className="loading-spinner"></span> Authenticating...
                    </>
                  ) : (
                    `Sign In as ${role === 'admin' ? 'Admin' : 'Donor'}`
                  )}
                </button>
              </div>
            </form>

          <div style={{ textAlign: 'center', marginTop: '1.75rem', fontSize: '0.9rem', color: 'var(--gray-600)' }}>
            Don't have an account yet?{' '}
            <Link to="/register" style={{ color: 'var(--primary)', fontWeight: 600 }}>
              Register as Donor
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
