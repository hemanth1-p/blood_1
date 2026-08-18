import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AlertMessage from '../components/AlertMessage';

export const Register = () => {
  const { register, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    bloodGroup: 'O+',
    dateOfBirth: '',
    gender: 'Male',
    location: '',
    address: '',
    lastDonationDate: '',
    password: '',
    confirmPassword: '',
    isAvailable: true,
  });

  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState(null);

  useEffect(() => {
    if (isAuthenticated && user) {
      navigate(user.role === 'admin' ? '/admin-dashboard' : '/donor-dashboard', { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setAlert(null);

    if (formData.password !== formData.confirmPassword) {
      setAlert({ type: 'error', message: 'Passwords do not match. Please verify your passwords.' });
      return;
    }

    if (formData.password.length < 6) {
      setAlert({ type: 'error', message: 'Password must be at least 6 characters long.' });
      return;
    }

    setLoading(true);
    try {
      const res = await register(formData);
      setAlert({ type: 'success', message: res.message || 'Registration successful! Directing to dashboard...' });
      setTimeout(() => {
        navigate('/donor-dashboard', { replace: true });
      }, 800);
    } catch (err) {
      setAlert({ type: 'error', message: err.message || 'Registration failed. Please check your details.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form-page">
      <div className="container">
        <div className="form-card form-card-wide">
          <div className="form-header">
            <div className="form-icon">❤️</div>
            <h1>Register as a Life Saver</h1>
            <p>Join thousands of voluntary donors making a real impact every day</p>
          </div>

          {alert && (
            <AlertMessage
              message={alert.message}
              type={alert.type}
              onClose={() => setAlert(null)}
            />
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <div className="form-group">
                <label>Full Name *</label>
                <input
                  type="text"
                  name="fullName"
                  placeholder="e.g. Rahul Sharma"
                  value={formData.fullName}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Email Address *</label>
                <input
                  type="email"
                  name="email"
                  placeholder="rahul@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Phone Number *</label>
                <input
                  type="tel"
                  name="phone"
                  placeholder="10-digit mobile number"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Blood Group *</label>
                <select
                  name="bloodGroup"
                  value={formData.bloodGroup}
                  onChange={handleChange}
                  required
                >
                  <option value="A+">A+ (A Positive)</option>
                  <option value="A-">A- (A Negative)</option>
                  <option value="B+">B+ (B Positive)</option>
                  <option value="B-">B- (B Negative)</option>
                  <option value="AB+">AB+ (AB Positive)</option>
                  <option value="AB-">AB- (AB Negative)</option>
                  <option value="O+">O+ (O Positive)</option>
                  <option value="O-">O- (O Negative)</option>
                </select>
              </div>

              <div className="form-group">
                <label>Date of Birth *</label>
                <input
                  type="date"
                  name="dateOfBirth"
                  value={formData.dateOfBirth}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Gender *</label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  required
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="form-group">
                <label>City / Location *</label>
                <input
                  type="text"
                  name="location"
                  placeholder="e.g. Hyderabad, Bangalore, Mumbai"
                  value={formData.location}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Last Donation Date (if any)</label>
                <input
                  type="date"
                  name="lastDonationDate"
                  value={formData.lastDonationDate}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group full-width">
                <label>Street Address / Area</label>
                <input
                  type="text"
                  name="address"
                  placeholder="e.g. Flat 302, Green Valley Apartments, Madhapur"
                  value={formData.address}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label>Password * (min 6 chars)</label>
                <input
                  type="password"
                  name="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Confirm Password *</label>
                <input
                  type="password"
                  name="confirmPassword"
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group full-width">
                <div className="toggle-group">
                  <button
                    type="button"
                    className={`toggle-switch ${formData.isAvailable ? 'active' : ''}`}
                    onClick={() => setFormData((prev) => ({ ...prev, isAvailable: !prev.isAvailable }))}
                    aria-label="Toggle availability"
                  ></button>
                  <span style={{ fontSize: '0.9rem', fontWeight: 600, color: formData.isAvailable ? 'var(--success)' : 'var(--gray-500)' }}>
                    {formData.isAvailable ? '🟢 I am currently available for emergency donation' : '🔴 Currently unavailable'}
                  </span>
                </div>
              </div>
            </div>

            {/* Eligibility Info Box */}
            <div style={{ margin: '1.25rem 0', padding: '1rem', background: '#ecfdf5', borderRadius: '10px', border: '1px solid #a7f3d0' }}>
              <strong style={{ color: '#065f46', fontSize: '0.85rem' }}>✅ Donor Eligibility Criteria:</strong>
              <ul style={{ fontSize: '0.8rem', color: '#047857', marginTop: '0.35rem', paddingLeft: '1.2rem', listStyle: 'disc' }}>
                <li>Age must be between 18 and 65 years old.</li>
                <li>Weight should be at least 50 kg.</li>
                <li>Must have at least 90 days gap between whole-blood donations.</li>
              </ul>
            </div>

            <div style={{ marginTop: '1.5rem' }}>
              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary btn-lg btn-block"
              >
                {loading ? (
                  <>
                    <span className="loading-spinner"></span> Creating Account...
                  </>
                ) : (
                  '❤️ Register as Life Saver'
                )}
              </button>
            </div>
          </form>

          <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.9rem', color: 'var(--gray-600)' }}>
            Already registered?{' '}
            <Link to="/login" style={{ color: 'var(--primary)', fontWeight: 600 }}>
              Sign In here
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
