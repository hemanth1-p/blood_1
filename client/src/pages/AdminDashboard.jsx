import React, { useState, useEffect } from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement } from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import BloodStockGrid from '../components/BloodStockGrid';
import Modal from '../components/Modal';
import AlertMessage from '../components/AlertMessage';
import Loader from '../components/Loader';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

export const AdminDashboard = () => {
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [alert, setAlert] = useState(null);
  const [loading, setLoading] = useState(true);

  // Stats & Charts
  const [stats, setStats] = useState({
    totalDonors: 0,
    availableDonors: 0,
    totalBloodStock: 0,
    pendingRequests: 0,
  });
  const [charts, setCharts] = useState({
    donorsByBloodGroup: [],
    bloodStockLevels: [],
  });

  // Data states
  const [stocks, setStocks] = useState([]);
  const [requests, setRequests] = useState([]);
  const [requestFilter, setRequestFilter] = useState('');
  const [donations, setDonations] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [donorsList, setDonorsList] = useState([]);

  // Donor Search Filters
  const [donorSearch, setDonorSearch] = useState('');
  const [donorBloodFilter, setDonorBloodFilter] = useState('');
  const [donorAvailFilter, setDonorAvailFilter] = useState('');

  // Modals state
  const [stockModalOpen, setStockModalOpen] = useState(false);
  const [stockForm, setStockForm] = useState({ bloodGroup: 'A+', units: 5, action: 'Add' });

  const [recordDonationModalOpen, setRecordDonationModalOpen] = useState(false);
  const [recordDonationForm, setRecordDonationForm] = useState({
    donorId: '',
    hospital: '',
    location: '',
    unitsDonated: 1,
  });

  const [editDonationModalOpen, setEditDonationModalOpen] = useState(false);
  const [editingDonation, setEditingDonation] = useState(null);

  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [editingRequest, setEditingRequest] = useState(null);
  const [newStatus, setNewStatus] = useState('Pending');

  // Load all dashboard data
  const loadAllData = async () => {
    setLoading(true);
    try {
      const [statsRes, stockRes, reqRes, donRes, histRes, donorsRes] = await Promise.all([
        api.get('/statistics').catch(() => ({})),
        api.get('/stock').catch(() => ({})),
        api.get(`/requests${requestFilter ? `?status=${encodeURIComponent(requestFilter)}` : ''}`).catch(() => ({})),
        api.get('/donations').catch(() => ({})),
        api.get('/stock/history').catch(() => ({})),
        api.get('/donors/search').catch(() => ({})),
      ]);

      if (statsRes.stats) setStats(statsRes.stats);
      if (statsRes.charts) setCharts(statsRes.charts);
      setStocks(stockRes.stocks || []);
      setRequests(reqRes.requests || []);
      setDonations(donRes.donations || []);
      setAuditLogs(histRes.history || []);
      setDonorsList(donorsRes.donors || []);
    } catch (err) {
      console.error('Error loading admin dashboard data:', err);
      setAlert({ type: 'error', message: 'Failed to load some dashboard records.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  const handleRequestFilterChange = async (status) => {
    setRequestFilter(status);
    try {
      const query = status ? `?status=${encodeURIComponent(status)}` : '';
      const res = await api.get(`/requests${query}`);
      setRequests(res.requests || []);
    } catch (err) {
      setAlert({ type: 'error', message: 'Failed to filter requests.' });
    }
  };

  // Stock update handler
  const handleStockSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/stock/add', {
        bloodGroup: stockForm.bloodGroup,
        units: parseInt(stockForm.units, 10),
      });
      setAlert({ type: 'success', message: res.message || 'Stock updated successfully!' });
      setStockModalOpen(false);
      loadAllData();
    } catch (err) {
      setAlert({ type: 'error', message: err.message || 'Failed to update stock' });
    }
  };

  // Quick Request Status Changer
  const handleQuickStatusChange = async (id, updatedStatus) => {
    try {
      const res = await api.put(`/requests/${id}/status`, { status: updatedStatus });
      setAlert({ type: 'success', message: res.message || `Status updated to ${updatedStatus}!` });
      handleRequestFilterChange(requestFilter);
      api.get('/statistics').then((s) => {
        if (s.stats) setStats(s.stats);
        if (s.charts) setCharts(s.charts);
      });
    } catch (err) {
      setAlert({ type: 'error', message: err.message || 'Failed to update request status' });
    }
  };

  // Delete Request
  const handleDeleteRequest = async (id, patientName) => {
    if (!window.confirm(`Are you sure you want to permanently delete the blood request for "${patientName}"?`)) {
      return;
    }
    try {
      const res = await api.delete(`/requests/${id}`);
      setAlert({ type: 'success', message: res.message || 'Blood request deleted successfully!' });
      setStatusModalOpen(false);
      handleRequestFilterChange(requestFilter);
      api.get('/statistics').then((s) => {
        if (s.stats) setStats(s.stats);
        if (s.charts) setCharts(s.charts);
      });
    } catch (err) {
      setAlert({ type: 'error', message: err.message || 'Failed to delete blood request' });
    }
  };

  // Delete All Completed Requests
  const handleDeleteAllCompletedRequests = async () => {
    const completed = requests.filter((r) => r.status === 'Completed');
    if (completed.length === 0) {
      setAlert({ type: 'info', message: 'No completed requests found to delete.' });
      return;
    }
    if (!window.confirm(`Delete all ${completed.length} completed blood request records permanently?`)) {
      return;
    }
    try {
      for (const req of completed) {
        await api.delete(`/requests/${req._id}`);
      }
      setAlert({ type: 'success', message: `Deleted ${completed.length} completed requests.` });
      handleRequestFilterChange(requestFilter);
      api.get('/statistics').then((s) => {
        if (s.stats) setStats(s.stats);
        if (s.charts) setCharts(s.charts);
      });
    } catch (err) {
      setAlert({ type: 'error', message: err.message || 'Error deleting completed requests.' });
    }
  };

  // Record Donation Submit
  const handleRecordDonationSubmit = async (e) => {
    e.preventDefault();
    const donor = donorsList.find((d) => d._id === recordDonationForm.donorId);
    if (!donor) {
      setAlert({ type: 'error', message: 'Please select a valid donor from the list.' });
      return;
    }

    try {
      const res = await api.post('/donations', {
        donorId: donor._id,
        bloodGroup: donor.bloodGroup,
        hospital: recordDonationForm.hospital.trim(),
        location: recordDonationForm.location.trim(),
        unitsDonated: parseInt(recordDonationForm.unitsDonated, 10) || 1,
      });

      setAlert({ type: 'success', message: res.message || 'Donation logged and inventory updated!' });
      setRecordDonationModalOpen(false);
      setRecordDonationForm({ donorId: '', hospital: '', location: '', unitsDonated: 1 });
      loadAllData();
    } catch (err) {
      setAlert({ type: 'error', message: err.message || 'Failed to record donation' });
    }
  };

  // Edit Donation Submit
  const handleEditDonationSubmit = async (e) => {
    e.preventDefault();
    if (!editingDonation) return;

    try {
      const res = await api.put(`/donations/${editingDonation._id}`, {
        hospital: editingDonation.hospital,
        location: editingDonation.location,
        unitsDonated: parseInt(editingDonation.unitsDonated, 10),
        status: editingDonation.status,
      });

      setAlert({ type: 'success', message: res.message || 'Donation record updated!' });
      setEditDonationModalOpen(false);
      loadAllData();
    } catch (err) {
      setAlert({ type: 'error', message: err.message || 'Failed to update donation' });
    }
  };

  // Delete Donation
  const handleDeleteDonation = async (id, donorName) => {
    if (!window.confirm(`Delete donation record for "${donorName}"? Stock and stats will adjust automatically.`)) {
      return;
    }
    try {
      const res = await api.delete(`/donations/${id}`);
      setAlert({ type: 'success', message: res.message || 'Donation record deleted!' });
      setEditDonationModalOpen(false);
      loadAllData();
    } catch (err) {
      setAlert({ type: 'error', message: err.message || 'Failed to delete donation' });
    }
  };

  // Filtered Donors Table
  const filteredDonors = donorsList.filter((d) => {
    const matchSearch =
      !donorSearch ||
      (d.fullName + d.email + d.location).toLowerCase().includes(donorSearch.toLowerCase());
    const matchBlood = !donorBloodFilter || d.bloodGroup === donorBloodFilter;
    const matchAvail =
      donorAvailFilter === '' || String(d.isAvailable) === donorAvailFilter;
    return matchSearch && matchBlood && matchAvail;
  });

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <div className="dashboard-layout">
      {sidebarOpen && (
        <div className="sidebar-backdrop visible" onClick={() => setSidebarOpen(false)}></div>
      )}

      {/* Admin Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <h3>🛡️ Admin Command</h3>
          <p>{user?.email || 'admin@bloodconnect.com'}</p>
          <button className="sidebar-close-btn" onClick={() => setSidebarOpen(false)}>
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
            <span className="nav-icon">📊</span> Overview &amp; Analytics
          </button>
          <button
            className={activeTab === 'stock' ? 'active' : ''}
            onClick={() => {
              setActiveTab('stock');
              setSidebarOpen(false);
            }}
          >
            <span className="nav-icon">🩸</span> Blood Stock Inventory
          </button>
          <button
            className={activeTab === 'requests' ? 'active' : ''}
            onClick={() => {
              setActiveTab('requests');
              setSidebarOpen(false);
            }}
          >
            <span className="nav-icon">📋</span> Blood Requests ({requests.length})
          </button>
          <button
            className={activeTab === 'donations' ? 'active' : ''}
            onClick={() => {
              setActiveTab('donations');
              setSidebarOpen(false);
            }}
          >
            <span className="nav-icon">💉</span> Manage Donations
          </button>
          <button
            className={activeTab === 'donors' ? 'active' : ''}
            onClick={() => {
              setActiveTab('donors');
              setSidebarOpen(false);
            }}
          >
            <span className="nav-icon">👥</span> Donor Directory ({donorsList.length})
          </button>
          <button
            className={activeTab === 'audit' ? 'active' : ''}
            onClick={() => {
              setActiveTab('audit');
              setSidebarOpen(false);
            }}
          >
            <span className="nav-icon">📜</span> Inventory Audit Trail
          </button>
        </nav>
      </aside>

      <button
        className="sidebar-toggle"
        onClick={() => setSidebarOpen(!sidebarOpen)}
        aria-label="Toggle Menu"
      >
        {sidebarOpen ? '✕' : '☰'}
      </button>

      <main className="dashboard-main">
        <div className="dashboard-header">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h1>Hospital &amp; Blood Bank Control Hub</h1>
              <p>Manage real-time blood stock, donor networks, urgent requests, and transfusion records.</p>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                onClick={() => setStockModalOpen(true)}
                className="btn btn-primary btn-sm"
              >
                ➕ Add Stock Units
              </button>
              <button
                onClick={() => setRecordDonationModalOpen(true)}
                className="btn btn-outline btn-sm"
              >
                💉 Record New Donation
              </button>
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
          <div className="dash-card" style={{ cursor: 'pointer' }} onClick={() => setActiveTab('donors')}>
            <div className="dash-card-icon">👥</div>
            <div className="dash-card-value">{stats.totalDonors}</div>
            <div className="dash-card-label">Total Registered Donors</div>
          </div>

          <div className="dash-card" style={{ cursor: 'pointer' }} onClick={() => setActiveTab('donors')}>
            <div className="dash-card-icon">🟢</div>
            <div className="dash-card-value" style={{ color: 'var(--success)' }}>
              {stats.availableDonors}
            </div>
            <div className="dash-card-label">Currently Available Donors</div>
          </div>

          <div className="dash-card" style={{ cursor: 'pointer' }} onClick={() => setActiveTab('stock')}>
            <div className="dash-card-icon">🩸</div>
            <div className="dash-card-value" style={{ color: 'var(--primary)' }}>
              {stats.totalBloodStock}
            </div>
            <div className="dash-card-label">Total Blood Units In Reserve</div>
          </div>

          <div className="dash-card" style={{ cursor: 'pointer' }} onClick={() => setActiveTab('requests')}>
            <div className="dash-card-icon">⏳</div>
            <div className="dash-card-value" style={{ color: 'var(--warning)' }}>
              {stats.pendingRequests}
            </div>
            <div className="dash-card-label">Pending Blood Requests</div>
          </div>
        </div>

        {/* TAB: OVERVIEW & ANALYTICS CHARTS */}
        {activeTab === 'overview' && (
          <>
            <div className="charts-grid">
              <div className="chart-card">
                <h3>📊 Donor Blood Group Distribution</h3>
                <div className="chart-container">
                  {charts.donorsByBloodGroup?.length > 0 ? (
                    <Doughnut
                      data={{
                        labels: charts.donorsByBloodGroup.map((d) => d.bloodGroup),
                        datasets: [
                          {
                            data: charts.donorsByBloodGroup.map((d) => d.count),
                            backgroundColor: [
                              '#c41e3a',
                              '#e8354f',
                              '#8b0000',
                              '#ff6b6b',
                              '#dc143c',
                              '#b22222',
                              '#cd5c5c',
                              '#a52a2a',
                            ],
                            borderWidth: 0,
                          },
                        ],
                      }}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: { legend: { position: 'bottom', labels: { padding: 12, usePointStyle: true } } },
                      }}
                    />
                  ) : (
                    <p style={{ textAlign: 'center', padding: '3rem', color: 'var(--gray-400)' }}>
                      No donor distribution data
                    </p>
                  )}
                </div>
              </div>

              <div className="chart-card">
                <h3>🩸 Stock Level Breakdown</h3>
                <div className="chart-container">
                  {charts.bloodStockLevels?.length > 0 ? (
                    <Bar
                      data={{
                        labels: charts.bloodStockLevels.map((s) => s.bloodGroup),
                        datasets: [
                          {
                            label: 'Available Units',
                            data: charts.bloodStockLevels.map((s) => s.available),
                            backgroundColor: charts.bloodStockLevels.map((s) =>
                              s.status === 'Critical' ? '#ef4444' : s.status === 'Low Stock' ? '#f59e0b' : '#c41e3a'
                            ),
                            borderRadius: 6,
                          },
                        ],
                      }}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: { legend: { display: false } },
                        scales: {
                          y: { beginAtZero: true, grid: { color: '#f3f4f6' } },
                          x: { grid: { display: false } },
                        },
                      }}
                    />
                  ) : (
                    <p style={{ textAlign: 'center', padding: '3rem', color: 'var(--gray-400)' }}>
                      No inventory data
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Actions Shortcuts */}
            <div className="quick-actions">
              <div className="quick-action-btn" onClick={() => setStockModalOpen(true)}>
                <span className="qa-icon">➕</span>
                <span>Add Inventory</span>
              </div>
              <div className="quick-action-btn" onClick={() => setRecordDonationModalOpen(true)}>
                <span className="qa-icon">💉</span>
                <span>Record Donation</span>
              </div>
              <div className="quick-action-btn" onClick={() => setActiveTab('requests')}>
                <span className="qa-icon">📋</span>
                <span>Review Requests ({stats.pendingRequests})</span>
              </div>
              <div className="quick-action-btn" onClick={() => setActiveTab('donors')}>
                <span className="qa-icon">🔍</span>
                <span>Search Donors</span>
              </div>
            </div>
          </>
        )}

        {/* TAB: BLOOD STOCK INVENTORY */}
        {(activeTab === 'overview' || activeTab === 'stock') && (
          <div style={{ marginBottom: '2.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h2 style={{ fontSize: '1.25rem', color: 'var(--gray-900)' }}>
                🩸 Blood Reserve Stock Levels (8 Groups)
              </h2>
              <button onClick={() => setStockModalOpen(true)} className="btn btn-primary btn-sm">
                ➕ Adjust / Add Units
              </button>
            </div>
            <BloodStockGrid
              stocks={stocks}
              isAdmin={true}
              onManageStock={(s) => {
                setStockForm({ bloodGroup: s.bloodGroup, units: 5, action: 'Add' });
                setStockModalOpen(true);
              }}
            />
          </div>
        )}

        {/* TAB: BLOOD REQUESTS */}
        {(activeTab === 'overview' || activeTab === 'requests') && (
          <div className="table-wrapper">
            <div className="table-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                <h3>📋 Blood Requests ({requests.length})</h3>
                <select
                  value={requestFilter}
                  onChange={(e) => handleRequestFilterChange(e.target.value)}
                  style={{ padding: '0.35rem 0.75rem', borderRadius: '8px', border: '1px solid var(--gray-300)', fontSize: '0.85rem' }}
                >
                  <option value="">All Statuses</option>
                  <option value="Pending">⏳ Pending Only</option>
                  <option value="In Progress">🔄 In Progress</option>
                  <option value="Completed">✅ Completed</option>
                  <option value="Cancelled">❌ Cancelled</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  onClick={handleDeleteAllCompletedRequests}
                  className="btn btn-danger btn-sm"
                  title="Purge fulfilled completed requests"
                >
                  🗑️ Delete Completed
                </button>
                <button onClick={() => handleRequestFilterChange(requestFilter)} className="btn btn-outline btn-sm">
                  🔄 Refresh
                </button>
              </div>
            </div>

            <div className="table-scroll">
              {requests.length === 0 ? (
                <div className="empty-state">
                  <p>No blood requests found for this filter.</p>
                </div>
              ) : (
                <table>
                  <thead>
                    <tr>
                      <th>Patient Name</th>
                      <th>Group</th>
                      <th>Units</th>
                      <th>Urgency</th>
                      <th>Hospital &amp; City</th>
                      <th>Contact</th>
                      <th>Quick Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {requests.map((r) => {
                      const isCompleted = r.status === 'Completed';
                      return (
                        <tr
                          key={r._id}
                          style={{
                            background: isCompleted ? 'rgba(16, 185, 129, 0.05)' : 'transparent',
                          }}
                        >
                          <td>
                            <strong>{r.patientName}</strong>
                            {r.additionalMessage && (
                              <>
                                <br />
                                <small style={{ color: 'var(--gray-500)', fontSize: '0.75rem' }}>
                                  {r.additionalMessage}
                                </small>
                              </>
                            )}
                          </td>
                          <td><span className="badge badge-info">{r.bloodGroup}</span></td>
                          <td>{r.unitsRequired}</td>
                          <td>
                            <span className={`badge ${r.emergencyLevel === 'Critical' ? 'badge-danger' : 'badge-warning'}`}>
                              {r.emergencyLevel}
                            </span>
                          </td>
                          <td>{r.hospitalName}, {r.location}</td>
                          <td>
                            <a href={`tel:${r.contactNumber}`} style={{ color: 'var(--primary)', fontWeight: 600 }}>
                              {r.contactNumber}
                            </a>
                          </td>
                          <td>
                            <select
                              value={r.status}
                              onChange={(e) => handleQuickStatusChange(r._id, e.target.value)}
                              style={{
                                padding: '0.3rem 0.5rem',
                                borderRadius: '6px',
                                fontWeight: 600,
                                fontSize: '0.8rem',
                                border: '1px solid var(--gray-300)',
                                background: 'var(--white)',
                                cursor: 'pointer',
                              }}
                            >
                              <option value="Pending">⏳ Pending</option>
                              <option value="In Progress">🔄 In Progress</option>
                              <option value="Completed">✅ Completed</option>
                              <option value="Cancelled">❌ Cancelled</option>
                            </select>
                          </td>
                          <td>
                            <div style={{ display: 'flex', gap: '0.35rem' }}>
                              <button
                                className="btn btn-outline btn-sm"
                                onClick={() => {
                                  setEditingRequest(r);
                                  setNewStatus(r.status);
                                  setStatusModalOpen(true);
                                }}
                                style={{ padding: '0.3rem 0.6rem' }}
                              >
                                ✏️
                              </button>
                              <button
                                className="btn btn-danger btn-sm"
                                onClick={() => handleDeleteRequest(r._id, r.patientName)}
                                style={{ padding: '0.3rem 0.6rem' }}
                              >
                                🗑️
                              </button>
                            </div>
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

        {/* TAB: DONATION LOGS */}
        {activeTab === 'donations' && (
          <div className="table-wrapper">
            <div className="table-header">
              <h3>💉 All Recorded Donations ({donations.length})</h3>
              <button
                onClick={() => setRecordDonationModalOpen(true)}
                className="btn btn-primary btn-sm"
              >
                ➕ Record New Donation
              </button>
            </div>

            <div className="table-scroll">
              {donations.length === 0 ? (
                <div className="empty-state">
                  <p>No donation records found.</p>
                </div>
              ) : (
                <table>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Donor Name</th>
                      <th>Blood Group</th>
                      <th>Units Donated</th>
                      <th>Hospital</th>
                      <th>Location</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {donations.map((d) => {
                      const donorName = d.donor?.fullName || 'Walk-in / External';
                      return (
                        <tr key={d._id}>
                          <td>{formatDate(d.donationDate)}</td>
                          <td>
                            <strong>{donorName}</strong>
                            {d.donor?.email && (
                              <>
                                <br />
                                <small style={{ color: 'var(--gray-500)', fontSize: '0.75rem' }}>
                                  {d.donor.email}
                                </small>
                              </>
                            )}
                          </td>
                          <td><span className="badge badge-info">{d.bloodGroup}</span></td>
                          <td><strong>{d.unitsDonated}</strong> unit(s)</td>
                          <td>{d.hospital}</td>
                          <td>{d.location}</td>
                          <td>
                            <span className={`badge ${d.status === 'Completed' ? 'badge-success' : 'badge-warning'}`}>
                              {d.status}
                            </span>
                          </td>
                          <td>
                            <div style={{ display: 'flex', gap: '0.35rem' }}>
                              <button
                                className="btn btn-outline btn-sm"
                                onClick={() => {
                                  setEditingDonation({ ...d, donorName });
                                  setEditDonationModalOpen(true);
                                }}
                                style={{ padding: '0.3rem 0.6rem' }}
                              >
                                ✏️ Edit
                              </button>
                              <button
                                className="btn btn-danger btn-sm"
                                onClick={() => handleDeleteDonation(d._id, donorName)}
                                style={{ padding: '0.3rem 0.6rem' }}
                              >
                                🗑️ Delete
                              </button>
                            </div>
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

        {/* TAB: DONOR DIRECTORY */}
        {activeTab === 'donors' && (
          <div className="table-wrapper">
            <div className="table-header">
              <h3>👥 Donor Network Database ({filteredDonors.length})</h3>
            </div>

            {/* Filter controls */}
            <div style={{ padding: '1rem 1.5rem', background: 'var(--gray-50)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', borderBottom: '1px solid var(--gray-200)' }}>
              <input
                type="text"
                placeholder="Search name, email, location..."
                value={donorSearch}
                onChange={(e) => setDonorSearch(e.target.value)}
                style={{ padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid var(--gray-300)' }}
              />
              <select
                value={donorBloodFilter}
                onChange={(e) => setDonorBloodFilter(e.target.value)}
                style={{ padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid var(--gray-300)' }}
              >
                <option value="">All Blood Groups</option>
                <option value="A+">A+</option>
                <option value="A-">A-</option>
                <option value="B+">B+</option>
                <option value="B-">B-</option>
                <option value="AB+">AB+</option>
                <option value="AB-">AB-</option>
                <option value="O+">O+</option>
                <option value="O-">O-</option>
              </select>
              <select
                value={donorAvailFilter}
                onChange={(e) => setDonorAvailFilter(e.target.value)}
                style={{ padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid var(--gray-300)' }}
              >
                <option value="">All Availability</option>
                <option value="true">🟢 Available Only</option>
                <option value="false">🔴 Unavailable</option>
              </select>
            </div>

            <div className="table-scroll">
              {filteredDonors.length === 0 ? (
                <div className="empty-state">
                  <p>No donors found matching criteria.</p>
                </div>
              ) : (
                <table>
                  <thead>
                    <tr>
                      <th>Full Name</th>
                      <th>Email</th>
                      <th>Group</th>
                      <th>Phone</th>
                      <th>City</th>
                      <th>Donations</th>
                      <th>Status</th>
                      <th>Last Donated</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredDonors.map((d) => (
                      <tr key={d._id}>
                        <td><strong>{d.fullName}</strong></td>
                        <td style={{ color: 'var(--gray-500)', fontSize: '0.82rem' }}>{d.email}</td>
                        <td><span className="badge badge-danger">{d.bloodGroup}</span></td>
                        <td>
                          {d.phone ? (
                            <a href={`tel:${d.phone}`} style={{ color: 'var(--primary)' }}>
                              {d.phone}
                            </a>
                          ) : (
                            '—'
                          )}
                        </td>
                        <td>{d.location || '—'}</td>
                        <td><strong>{d.totalDonations || 0}</strong> time(s)</td>
                        <td>
                          <span className={`badge ${d.isAvailable ? 'badge-success' : 'badge-gray'}`}>
                            {d.isAvailable ? '🟢 Available' : '🔴 Unavailable'}
                          </span>
                        </td>
                        <td>{formatDate(d.lastDonationDate)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* TAB: AUDIT HISTORY */}
        {activeTab === 'audit' && (
          <div className="table-wrapper">
            <div className="table-header">
              <h3>📜 Inventory Stock Audit Log ({auditLogs.length})</h3>
            </div>

            <div className="table-scroll">
              {auditLogs.length === 0 ? (
                <div className="empty-state">
                  <p>No inventory transaction history recorded yet.</p>
                </div>
              ) : (
                <table>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Blood Group</th>
                      <th>Action</th>
                      <th>Units Changed</th>
                      <th>Previous Units</th>
                      <th>New Balance</th>
                      <th>Notes / Author</th>
                    </tr>
                  </thead>
                  <tbody>
                    {auditLogs.map((h) => {
                      const actionBadge =
                        h.action === 'Add'
                          ? 'badge-success'
                          : h.action === 'Delete'
                          ? 'badge-danger'
                          : 'badge-warning';
                      return (
                        <tr key={h._id}>
                          <td>{formatDate(h.createdAt)}</td>
                          <td><span className="badge badge-info">{h.bloodGroup}</span></td>
                          <td><span className={`badge ${actionBadge}`}>{h.action || 'Update'}</span></td>
                          <td><strong>{h.units > 0 ? `+${h.units}` : h.units}</strong></td>
                          <td>{h.previousUnits} units</td>
                          <td><strong>{h.newUnits} units</strong></td>
                          <td style={{ color: 'var(--gray-600)', fontSize: '0.85rem' }}>
                            {h.notes || 'System transaction'}
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
      </main>

      {/* MODAL: ADD / UPDATE STOCK */}
      <Modal
        isOpen={stockModalOpen}
        onClose={() => setStockModalOpen(false)}
        title="➕ Add Blood Stock Reserve"
      >
        <form onSubmit={handleStockSubmit}>
          <div className="form-group">
            <label>Blood Group</label>
            <select
              value={stockForm.bloodGroup}
              onChange={(e) => setStockForm({ ...stockForm, bloodGroup: e.target.value })}
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
            <label>Units to Add to Bank</label>
            <input
              type="number"
              min="1"
              max="100"
              value={stockForm.units}
              onChange={(e) => setStockForm({ ...stockForm, units: e.target.value })}
              required
            />
          </div>

          <div className="modal-actions">
            <button type="button" onClick={() => setStockModalOpen(false)} className="btn btn-outline">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              💾 Confirm &amp; Add Stock
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL: RECORD DONATION */}
      <Modal
        isOpen={recordDonationModalOpen}
        onClose={() => setRecordDonationModalOpen(false)}
        title="💉 Record Donor Transfusion"
      >
        <form onSubmit={handleRecordDonationSubmit}>
          <div className="form-group">
            <label>Select Registered Donor *</label>
            <select
              value={recordDonationForm.donorId}
              onChange={(e) => setRecordDonationForm({ ...recordDonationForm, donorId: e.target.value })}
              required
            >
              <option value="">-- Choose a donor --</option>
              {donorsList.map((d) => (
                <option key={d._id} value={d._id}>
                  {d.fullName} ({d.bloodGroup}) - {d.location}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Hospital / Clinic Name *</label>
            <input
              type="text"
              placeholder="e.g. Fortis Healthcare"
              value={recordDonationForm.hospital}
              onChange={(e) => setRecordDonationForm({ ...recordDonationForm, hospital: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label>Location / City *</label>
            <input
              type="text"
              placeholder="e.g. Bangalore, Bannerghatta"
              value={recordDonationForm.location}
              onChange={(e) => setRecordDonationForm({ ...recordDonationForm, location: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label>Units Donated</label>
            <input
              type="number"
              min="1"
              max="5"
              value={recordDonationForm.unitsDonated}
              onChange={(e) => setRecordDonationForm({ ...recordDonationForm, unitsDonated: e.target.value })}
              required
            />
          </div>

          <div className="modal-actions">
            <button type="button" onClick={() => setRecordDonationModalOpen(false)} className="btn btn-outline">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              💾 Record &amp; Credit Inventory
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL: EDIT DONATION */}
      <Modal
        isOpen={editDonationModalOpen}
        onClose={() => setEditDonationModalOpen(false)}
        title="✏️ Edit Donation Record"
      >
        {editingDonation && (
          <form onSubmit={handleEditDonationSubmit}>
            <p style={{ marginBottom: '1rem', fontSize: '0.9rem' }}>
              <strong>Donor:</strong> {editingDonation.donorName} ({editingDonation.bloodGroup})
            </p>

            <div className="form-group">
              <label>Hospital</label>
              <input
                type="text"
                value={editingDonation.hospital}
                onChange={(e) => setEditingDonation({ ...editingDonation, hospital: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label>Location</label>
              <input
                type="text"
                value={editingDonation.location}
                onChange={(e) => setEditingDonation({ ...editingDonation, location: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label>Units Donated</label>
              <input
                type="number"
                min="1"
                max="5"
                value={editingDonation.unitsDonated}
                onChange={(e) => setEditingDonation({ ...editingDonation, unitsDonated: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label>Status</label>
              <select
                value={editingDonation.status}
                onChange={(e) => setEditingDonation({ ...editingDonation, status: e.target.value })}
              >
                <option value="Completed">Completed</option>
                <option value="Pending">Pending</option>
              </select>
            </div>

            <div className="modal-actions">
              <button
                type="button"
                className="btn btn-danger"
                onClick={() => handleDeleteDonation(editingDonation._id, editingDonation.donorName)}
              >
                🗑️ Delete
              </button>
              <button type="submit" className="btn btn-primary">
                Save Changes
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* MODAL: UPDATE REQUEST STATUS */}
      <Modal
        isOpen={statusModalOpen}
        onClose={() => setStatusModalOpen(false)}
        title="✏️ Update Blood Request Status"
      >
        {editingRequest && (
          <div>
            <p style={{ marginBottom: '0.5rem' }}>
              <strong>Patient:</strong> {editingRequest.patientName} (🩸 {editingRequest.bloodGroup})
            </p>
            <p style={{ marginBottom: '1rem', fontSize: '0.85rem', color: 'var(--gray-600)' }}>
              Hospital: {editingRequest.hospitalName}, {editingRequest.location}
            </p>

            <div className="form-group">
              <label>Current Status</label>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px' }}
              >
                <option value="Pending">⏳ Pending</option>
                <option value="In Progress">🔄 In Progress</option>
                <option value="Completed">✅ Completed</option>
                <option value="Cancelled">❌ Cancelled</option>
              </select>
            </div>

            <div className="modal-actions">
              <button
                type="button"
                className="btn btn-danger"
                onClick={() => handleDeleteRequest(editingRequest._id, editingRequest.patientName)}
              >
                🗑️ Delete Record
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  handleQuickStatusChange(editingRequest._id, newStatus);
                  setStatusModalOpen(false);
                }}
              >
                Update Status
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default AdminDashboard;
