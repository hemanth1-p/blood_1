import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const Footer = () => {
  const { isAuthenticated, isAdmin } = useAuth();
  const dashLink = isAdmin ? '/admin-dashboard' : '/donor-dashboard';

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div className="footer-brand">
            <div className="logo" style={{ color: 'var(--white)' }}>
              <span className="logo-icon">🩸</span> BloodConnect
            </div>
            <p>
              Connecting blood donors with patients and hospitals in real-time. Together, we save lives through the power of seamless voluntary donation.
            </p>
          </div>

          <div className="footer-links">
            <h4>Quick Links</h4>
            <Link to="/">Home</Link>
            <Link to="/find-donors">Find Donors</Link>
            <Link to="/emergency">Emergency Request</Link>
            <Link to="/register">Become a Donor</Link>
          </div>

          <div className="footer-links">
            <h4>Account</h4>
            {isAuthenticated ? (
              <>
                <Link to={dashLink}>Dashboard</Link>
                <Link to="/emergency">Post Blood Need</Link>
              </>
            ) : (
              <>
                <Link to="/login">Login</Link>
                <Link to="/register">Register</Link>
              </>
            )}
          </div>

          <div className="footer-links">
            <h4>24/7 Helpline</h4>
            <a href="mailto:help@bloodconnect.org">help@bloodconnect.org</a>
            <a href="tel:+9118001234567">📞 1800-123-4567</a>
            <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)', marginTop: '0.5rem' }}>
              Free 24x7 Emergency Blood Assistance
            </p>
          </div>
        </div>

        <div className="footer-bottom">
          <p>&copy; {new Date().getFullYear()} BloodConnect Platform (MERN Stack). All rights reserved.</p>
          <p className="footer-slogan">"A Drop of Blood Can Be a Drop of Hope."</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
