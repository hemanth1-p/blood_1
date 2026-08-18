import React, { useState, useEffect } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const Navbar = () => {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = () => {
    logout();
    setMobileMenuOpen(false);
    navigate('/login');
  };

  const closeMenu = () => setMobileMenuOpen(false);

  const dashLink = isAdmin ? '/admin-dashboard' : '/donor-dashboard';

  return (
    <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
      <div className="nav-container">
        <Link to="/" className="logo" onClick={closeMenu}>
          <span className="logo-icon">🩸</span> BloodConnect
        </Link>

        <div className="nav-links">
          <NavLink to="/" end className={({ isActive }) => (isActive ? 'active' : '')}>
            Home
          </NavLink>
          <NavLink to="/find-donors" className={({ isActive }) => (isActive ? 'active' : '')}>
            Find Donors
          </NavLink>
          <NavLink to="/emergency" className={({ isActive }) => (isActive ? 'active' : '')}>
            Emergency
          </NavLink>
          {isAuthenticated ? (
            <NavLink to={dashLink} className={({ isActive }) => (isActive ? 'active' : '')}>
              Dashboard
            </NavLink>
          ) : (
            <>
              <NavLink to="/register" className={({ isActive }) => (isActive ? 'active' : '')}>
                Register
              </NavLink>
              <NavLink to="/login" className={({ isActive }) => (isActive ? 'active' : '')}>
                Login
              </NavLink>
            </>
          )}
        </div>

        <div className="nav-actions">
          {isAuthenticated ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span className={`badge ${isAdmin ? 'badge-danger' : 'badge-info'}`}>
                {isAdmin ? '🛡️ Admin' : `❤️ ${user?.fullName?.split(' ')[0] || 'Donor'}`}
              </span>
              <button onClick={handleLogout} className="btn btn-outline btn-sm">
                Logout
              </button>
            </div>
          ) : (
            <Link to="/register" className="btn btn-primary btn-sm">
              Become a Donor ❤️
            </Link>
          )}
        </div>

        <button
          className={`hamburger ${mobileMenuOpen ? 'active' : ''}`}
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle menu"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>
      </div>

      <div className={`mobile-menu ${mobileMenuOpen ? 'open' : ''}`}>
        <Link to="/" onClick={closeMenu}>
          Home
        </Link>
        <Link to="/find-donors" onClick={closeMenu}>
          Find Donors
        </Link>
        <Link to="/emergency" onClick={closeMenu}>
          Emergency
        </Link>
        {isAuthenticated ? (
          <>
            <Link to={dashLink} onClick={closeMenu}>
              Dashboard ({isAdmin ? 'Admin' : user?.fullName || 'Donor'})
            </Link>
            <a
              href="#logout"
              onClick={(e) => {
                e.preventDefault();
                handleLogout();
              }}
              style={{ color: 'var(--primary)', fontWeight: 600 }}
            >
              Logout
            </a>
          </>
        ) : (
          <>
            <Link to="/register" onClick={closeMenu}>
              Register
            </Link>
            <Link to="/login" onClick={closeMenu}>
              Login
            </Link>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
