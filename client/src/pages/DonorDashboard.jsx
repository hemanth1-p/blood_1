import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import AlertMessage from '../components/AlertMessage';
import Loader from '../components/Loader';

export const DonorDashboard = () => {
  const { user, updateUser, refreshProfile } = useAuth();

  const [activeTab, setActiveTab] = useState('overview');
  const [donations, setDonations] = useState([]);
  const [urgentRequests, setUrgentRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState(null);

  // Profile Form state
  const [profileForm, setProfileForm] = useState({
    fullName: user?.fullName || '',
    phone: user?.phone || '',
    bloodGroup: user?.bloodGroup || 'O+',
    location: user?.location || '',
    address: user?.address || '',
  });
  const [savingProfile, setSavingProfile] = useState(false);

  // Sidebar toggle state for mobile
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (user) {
      setProfileForm({
        fullName: user.fullName || '',
        phone: user.phone || '',
        bloodGroup: user.bloodGroup || 'O+',
        location: user.location || '',
        address: user.address || '',
      });
    }
  }, [user]);

  const loadData = async () => {
    setLoading(true);
    try {
      await refreshProfile();
      const [donRes, reqRes] = await Promise.all([
        api.get('/donations/my').catch(() => ({ donations: [] })),
        api.get('/requests/urgent').catch(() => ({ requests: [] })),
      ]);
      setDonations(donRes.donations || []);
      setUrgentRequests(reqRes.requests || []);
    } catch (err) {
      console.error('Error loading donor dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleToggleAvailability = async () => {
    try {
      const newState = !user.isAvailable;
      const res = await api.put('/auth/availability', { isAvailable: newState });
      updateUser(res.user);
      setAlert({ type: 'success', message: res.message || 'Availability status updated!' });
    } catch (err) {
      setAlert({ type: 'error', message: err.message || 'Failed to update availability.' });
    }
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    setAlert(null);
    try {
      const res = await api.put('/auth/profile', profileForm);
      updateUser(res.user);
      setAlert({ type: 'success', message: 'Profile updated successfully!' });
    } catch (err) {
      setAlert({ type: 'error', message: err.message || 'Failed to update profile.' });
    } finally {
      setSavingProfile(false);
    }
  };



  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const calculateNextEligibility = (lastDate) => {
    if (!lastDate) return { text: 'Eligible Now', isEligible: true };
    const next = new Date(lastDate);
    next.setDate(next.getDate() + 90);
    const today = new Date();
    const diffDays = Math.ceil((next - today) / (1000 * 60 * 60 * 24));
    if (diffDays <= 0) return { text: 'Eligible Now', isEligible: true };
    return { text: `In ${diffDays} day${diffDays !== 1 ? 's' : ''}`, isEligible: false };
  };

  const eligibility = calculateNextEligibility(user?.lastDonationDate);

  return (
    <div className="dashboard-layout">
      {/* Mobile Sidebar Backdrop */}
      {sidebarOpen && (
        <div
          className="sidebar-backdrop visible"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}

      {/* Sidebar Navigation */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <h3>❤️ Donor Portal</h3>
          <p>{user?.fullName || 'Life Saver'}</p>
          <small style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.75rem' }}>{user?.email}</small>
          <button
            className="sidebar-close-btn"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close sidebar"
          >
            &times;
          </button>
        </div>

        <nav className="sidebar-nav">
          <button
            className={activeTab === 'overview' ? 'active' : ''}
            onClick={() => {
              setActiveTab('overview');
              setSidebarOpen(false);
            }}
          >
            <span className="nav-icon">📊</span> Overview
          </button>
          <button
            className={activeTab === 'donations' ? 'active' : ''}
            onClick={() => {
              setActiveTab('donations');
              setSidebarOpen(false);
            }}
          >
            <span className="nav-icon">🩸</span> Donation History
          </button>
          <button
            className={activeTab === 'urgent' ? 'active' : ''}
            onClick={() => {
              setActiveTab('urgent');
              setSidebarOpen(false);
            }}
          >
            <span className="nav-icon">🚨</span> Urgent Requests
          </button>
          <button
            className={activeTab === 'profile' ? 'active' : ''}
            onClick={() => {
              setActiveTab('profile');
              setSidebarOpen(false);
            }}
          >
            <span className="nav-icon">👤</span> My Profile
          </button>
          <Link to="/emergency" onClick={() => setSidebarOpen(false)}>
            <span className="nav-icon">➕</span> Post Blood Need
          </Link>
        </nav>
      </aside>

      {/* Mobile Toggle Button */}
      <button
        className="sidebar-toggle"
        onClick={() => setSidebarOpen(!sidebarOpen)}
        aria-label="Toggle Dashboard Menu"
      >
        {sidebarOpen ? '✕' : '☰'}
      </button>

      {/* Main Dashboard Content */}
      <main className="dashboard-main">
        <div className="dashboard-header">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h1>Welcome Back, {user?.fullName?.split(' ')[0] || 'Life Saver'}!</h1>
              <p>Your selfless contributions give hope and second chances to families in need.</p>
            </div>

            {/* Quick Availability Toggle Switch */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: 'var(--white)', padding: '0.6rem 1.2rem', borderRadius: '50px', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--gray-200)' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: user?.isAvailable ? 'var(--success)' : 'var(--danger)' }}>
                {user?.isAvailable ? '🟢 Available' : '🔴 Unavailable'}
              </span>
              <button
                type="button"
                className={`toggle-switch ${user?.isAvailable ? 'active' : ''}`}
                onClick={handleToggleAvailability}
                aria-label="Toggle donor availability"
              ></button>
            </div>
          </div>
        </div>

        {alert && (
          <AlertMessage
            message={alert.message}
            type={alert.type}
            onClose={() => setAlert(null)}
          />
        )}

        {/* Overview Stats Cards */}
        <div className="dashboard-cards">
          <div className="dash-card">
            <div className="dash-card-icon">🩸</div>
            <div className="dash-card-value">{user?.bloodGroup || 'O+'}</div>
            <div className="dash-card-label">Blood Group</div>
          </div>

          <div className="dash-card">
            <div className="dash-card-icon">🏆</div>
            <div className="dash-card-value">{user?.totalDonations || donations.length || 0}</div>
            <div className="dash-card-label">Total Donations</div>
          </div>

          <div className="dash-card">
            <div className="dash-card-icon">❤️</div>
            <div className="dash-card-value">
              {user?.livesImpacted || ((user?.totalDonations || donations.length || 1) * 3)}
            </div>
            <div className="dash-card-label">Estimated Lives Saved</div>
          </div>

          <div className="dash-card">
            <div className="dash-card-icon">📅</div>
            <div className="dash-card-value" style={{ fontSize: '1.25rem' }}>
              <span className={`badge ${eligibility.isEligible ? 'badge-success' : 'badge-warning'}`} style={{ fontSize: '0.85rem' }}>
                {eligibility.text}
              </span>
            </div>
            <div className="dash-card-label">Next Donation Eligibility</div>
          </div>
        </div>

        {/* TAB 1: OVERVIEW & DONATION HISTORY */}
        {(activeTab === 'overview' || activeTab === 'donations') && (
          <div className="table-wrapper">
            <div className="table-header">
              <h3>🩸 My Blood Donation History ({donations.length})</h3>
              <button onClick={loadData} className="btn btn-outline btn-sm">
                🔄 Refresh
              </button>
            </div>

            <div className="table-scroll">
              {loading ? (
                <Loader text="Loading your donation logs..." />
              ) : donations.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">🩸</div>
                  <strong style={{ fontSize: '1rem', color: 'var(--gray-700)' }}>
                    No recorded donation history yet
                  </strong>
                  <p style={{ fontSize: '0.85rem', maxWidth: '400px', margin: '0.5rem auto 1rem' }}>
                    When you donate blood at partner hospitals, the clinic administration records your contribution here.
                  </p>
                  <Link to="/emergency" className="btn btn-primary btn-sm">
                    View Emergency Needs
                  </Link>
                </div>
              ) : (
                <table>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Hospital / Center</th>
                      <th>Blood Group</th>
                      <th>Units</th>
                      <th>Location</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {donations.map((d) => (
                      <tr key={d._id}>
                        <td>{formatDate(d.donationDate)}</td>
                        <td><strong>{d.hospital}</strong></td>
                        <td><span className="badge badge-info">{d.bloodGroup}</span></td>
                        <td>{d.unitsDonated} unit(s)</td>
                        <td>{d.location}</td>
                        <td>
                          <span className={`badge ${d.status === 'Completed' ? 'badge-success' : 'badge-warning'}`}>
                            {d.status === 'Completed' ? '✅ Completed' : '⏳ In Progress'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: URGENT REQUESTS ALERT */}
        {(activeTab === 'overview' || activeTab === 'urgent') && (
          <div className="table-wrapper" style={{ marginTop: activeTab === 'overview' ? '2rem' : 0 }}>
            <div className="table-header">
              <h3>🚨 Active Emergency Blood Requests In Need</h3>
              <Link to="/emergency" className="btn btn-danger btn-sm">
                + Broadcast Urgent Need
              </Link>
            </div>

            <div className="table-scroll">
              {urgentRequests.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">✅</div>
                  <p>No active emergencies currently pending!</p>
                </div>
              ) : (
                <table>
                  <thead>
                    <tr>
                      <th>Patient Name</th>
                      <th>Blood Needed</th>
                      <th>Units</th>
                      <th>Urgency</th>
                      <th>Hospital & City</th>
                      <th>Required By</th>
                      <th>Direct Contact</th>
                    </tr>
                  </thead>
                  <tbody>
                    {urgentRequests.slice(0, 8).map((r) => {
                      const isCritical = r.emergencyLevel === 'Critical';
                      return (
                        <tr
                          key={r._id}
                          style={{
                            background: isCritical ? 'rgba(239, 68, 68, 0.04)' : 'transparent',
                          }}
                        >
                          <td>
                            <strong>{r.patientName}</strong>
                            {r.additionalMessage && (
                              <>
                                <br />
                                <small style={{ color: 'var(--gray-400)', fontSize: '0.75rem' }}>
                                  {r.additionalMessage}
                                </small>
                              </>
                            )}
                          </td>
                          <td><span className="badge badge-danger">{r.bloodGroup}</span></td>
                          <td>{r.unitsRequired}</td>
                          <td>
                            <span className={`badge ${isCritical ? 'badge-danger' : 'badge-warning'}`}>
                              {isCritical ? '🚨 Critical' : '⚠️ High'}
                            </span>
                          </td>
                          <td>{r.hospitalName}, {r.location}</td>
                          <td>{formatDate(r.requiredDate)}</td>
                          <td>
                            <a
                              href={`tel:${r.contactNumber}`}
                              className="btn btn-outline btn-sm"
                              style={{ padding: '0.25rem 0.6rem', fontSize: '0.8rem' }}
                            >
                              📞 {r.contactNumber}
                            </a>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: PROFILE SETTINGS */}
        {activeTab === 'profile' && (
          <div className="form-card" style={{ margin: '0 0 2rem 0', maxWidth: '720px' }}>
            <h3 style={{ marginBottom: '1.25rem', fontSize: '1.25rem', color: 'var(--gray-900)' }}>
              👤 Update Donor Profile
            </h3>

            <form onSubmit={handleProfileSubmit}>
              <div className="form-grid">
                <div className="form-group">
                  <label>Full Name</label>
                  <input
                    type="text"
                    value={profileForm.fullName}
                    onChange={(e) => setProfileForm({ ...profileForm, fullName: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Phone Number</label>
                  <input
                    type="tel"
                    value={profileForm.phone}
                    onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Blood Group</label>
                  <select
                    value={profileForm.bloodGroup}
                    onChange={(e) => setProfileForm({ ...profileForm, bloodGroup: e.target.value })}
                    required
                  >
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>City / Location</label>
                  <input
                    type="text"
                    value={profileForm.location}
                    onChange={(e) => setProfileForm({ ...profileForm, location: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group full-width">
                  <label>Street Address</label>
                  <input
                    type="text"
                    value={profileForm.address}
                    onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ marginTop: '1.5rem' }}>
                <button
                  type="submit"
                  disabled={savingProfile}
                  className="btn btn-primary"
                >
                  {savingProfile ? (
                    <>
                      <span className="loading-spinner"></span> Saving Changes...
                    </>
                  ) : (
                    '💾 Save Profile Changes'
                  )}
                </button>
              </div>
            </form>
          </div>
        )}


      </main>
    </div>
  );
};

export default DonorDashboard;
