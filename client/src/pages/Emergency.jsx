import React, { useState, useEffect } from 'react';
import api from '../services/api';
import EmergencyCard from '../components/EmergencyCard';
import Modal from '../components/Modal';
import AlertMessage from '../components/AlertMessage';
import Loader from '../components/Loader';

export const Emergency = () => {
  const getDefaultDateTime = () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    return now.toISOString().slice(0, 16);
  };

  const [formData, setFormData] = useState({
    patientName: '',
    bloodGroup: 'O+',
    unitsRequired: 1,
    emergencyLevel: 'Critical',
    hospitalName: '',
    location: '',
    contactNumber: '',
    requiredDate: getDefaultDateTime(),
    additionalMessage: '',
  });

  const [submitting, setSubmitting] = useState(false);
  const [alert, setAlert] = useState(null);
  const [urgentRequests, setUrgentRequests] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState(null);

  const fetchUrgentRequests = async () => {
    try {
      const data = await api.get('/requests/urgent');
      setUrgentRequests(data.requests || []);
    } catch (err) {
      console.error('Error fetching urgent requests:', err);
    } finally {
      setLoadingRequests(false);
    }
  };

  useEffect(() => {
    fetchUrgentRequests();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setAlert(null);

    if (!formData.patientName || !formData.hospitalName || !formData.contactNumber || !formData.location) {
      setAlert({ type: 'error', message: 'Please fill in all mandatory fields.' });
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.post('/requests', {
        ...formData,
        unitsRequired: parseInt(formData.unitsRequired, 10) || 1,
      });

      setAlert({ type: 'success', message: res.message || 'Emergency blood request broadcasted successfully!' });

      // Reset form
      setFormData({
        patientName: '',
        bloodGroup: 'O+',
        unitsRequired: 1,
        emergencyLevel: 'Critical',
        hospitalName: '',
        location: '',
        contactNumber: '',
        requiredDate: getDefaultDateTime(),
        additionalMessage: '',
      });

      fetchUrgentRequests();
    } catch (err) {
      setAlert({ type: 'error', message: err.message || 'Failed to broadcast emergency request.' });
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'ASAP';
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="emergency-page" style={{ minHeight: '100vh', paddingBottom: '5rem' }}>
      <div className="container">
        {/* Header */}
        <div className="emergency-header">
          <span className="emergency-pulse" style={{ fontSize: '3rem' }}>
            🚨
          </span>
          <h1>Emergency Blood Broadcaster</h1>
          <p>
            Submit an urgent blood request to notify donors and healthcare centers immediately.
          </p>
        </div>

        {alert && (
          <div style={{ maxWidth: '800px', margin: '0 auto 1.5rem' }}>
            <AlertMessage
              message={alert.message}
              type={alert.type}
              onClose={() => setAlert(null)}
            />
          </div>
        )}

        {/* Emergency Form Card */}
        <div className="emergency-form-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
            <span style={{ fontSize: '1.75rem' }}>🩸</span>
            <div>
              <h2 style={{ fontSize: '1.5rem', color: 'var(--gray-900)' }}>
                Broadcast Urgent Blood Need
              </h2>
              <p style={{ color: 'var(--gray-500)', fontSize: '0.85rem' }}>
                All fields marked with * are required for rapid verification.
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <div className="form-group">
                <label>Patient Full Name *</label>
                <input
                  type="text"
                  name="patientName"
                  value={formData.patientName}
                  onChange={handleChange}
                  placeholder="e.g. Ramesh Chandra"
                  required
                />
              </div>

              <div className="form-group">
                <label>Required Blood Group *</label>
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
                <label>Units Required *</label>
                <input
                  type="number"
                  name="unitsRequired"
                  min="1"
                  max="50"
                  value={formData.unitsRequired}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Emergency Urgency Level *</label>
                <select
                  name="emergencyLevel"
                  value={formData.emergencyLevel}
                  onChange={handleChange}
                  required
                >
                  <option value="Critical">🚨 Critical (Immediate Transfusion)</option>
                  <option value="High">⚠️ High (Within 24 Hours)</option>
                  <option value="Medium">ℹ️ Medium (Scheduled Surgery)</option>
                  <option value="Low">Low (Future Procedure)</option>
                </select>
              </div>

              <div className="form-group">
                <label>Hospital / Clinic Name *</label>
                <input
                  type="text"
                  name="hospitalName"
                  value={formData.hospitalName}
                  onChange={handleChange}
                  placeholder="e.g. Apollo Hospital, Jubilee Hills"
                  required
                />
              </div>

              <div className="form-group">
                <label>City / Location *</label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  placeholder="e.g. Hyderabad, Banjara Hills"
                  required
                />
              </div>

              <div className="form-group">
                <label>Emergency Contact Phone *</label>
                <input
                  type="tel"
                  name="contactNumber"
                  value={formData.contactNumber}
                  onChange={handleChange}
                  placeholder="10-digit mobile number"
                  required
                />
              </div>

              <div className="form-group">
                <label>Required Date & Time *</label>
                <input
                  type="datetime-local"
                  name="requiredDate"
                  value={formData.requiredDate}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group full-width">
                <label>Doctor's Note / Patient Condition</label>
                <textarea
                  name="additionalMessage"
                  value={formData.additionalMessage}
                  onChange={handleChange}
                  placeholder="Provide any critical case details (e.g. Dengue low platelet, cardiac bypass surgery, road accident victim)..."
                  rows="3"
                ></textarea>
              </div>
            </div>

            <div style={{ marginTop: '1.5rem' }}>
              <button
                type="submit"
                disabled={submitting}
                className="btn btn-danger btn-lg btn-block"
              >
                {submitting ? (
                  <>
                    <span className="loading-spinner"></span> Broadcasting Alert...
                  </>
                ) : (
                  '🚨 Broadcast Emergency Request'
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Live Urgent Requests Feed */}
        <div className="urgent-requests">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h3 style={{ color: 'var(--white)', fontSize: '1.35rem' }}>
              ⚡ Live Urgent Requests Feed ({urgentRequests.length})
            </h3>
            <button
              onClick={fetchUrgentRequests}
              className="btn btn-white btn-sm"
              title="Refresh requests"
            >
              🔄 Refresh Feed
            </button>
          </div>

          {loadingRequests ? (
            <div style={{ textAlign: 'center', color: 'var(--white)', padding: '2rem' }}>
              <span className="loading-spinner"></span>
              <p style={{ marginTop: '0.5rem' }}>Loading live emergency requests...</p>
            </div>
          ) : urgentRequests.length === 0 ? (
            <div className="urgent-card" style={{ textAlign: 'center', color: 'rgba(255,255,255,0.8)', padding: '2rem' }}>
              <p style={{ fontSize: '1.1rem' }}>✨ No critical emergencies pending right now.</p>
              <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)', marginTop: '0.25rem' }}>
                All current community blood requests have been fulfilled.
              </p>
            </div>
          ) : (
            <div>
              {urgentRequests.map((req) => (
                <EmergencyCard
                  key={req._id}
                  request={req}
                  onClick={(r) => setSelectedRequest(r)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Emergency Request Details Modal */}
      <Modal
        isOpen={!!selectedRequest}
        onClose={() => setSelectedRequest(null)}
        title="Emergency Request Details"
      >
        {selectedRequest && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h4 style={{ fontSize: '1.25rem', color: 'var(--gray-900)' }}>
                {selectedRequest.patientName}
              </h4>
              <span className="donor-blood" style={{ margin: 0 }}>
                🩸 {selectedRequest.bloodGroup}
              </span>
            </div>

            <div style={{ padding: '0.75rem', background: '#fef2f2', borderRadius: '8px', border: '1px solid #fecaca' }}>
              <p style={{ fontSize: '0.9rem', color: '#991b1b', fontWeight: 600 }}>
                🚨 Urgency: {selectedRequest.emergencyLevel} ({selectedRequest.unitsRequired} Unit(s) Needed)
              </p>
            </div>

            <p><strong>🏥 Hospital:</strong> {selectedRequest.hospitalName}</p>
            <p><strong>📍 City / Location:</strong> {selectedRequest.location}</p>
            <p><strong>📅 Needed By:</strong> {formatDate(selectedRequest.requiredDate)}</p>
            <p>
              <strong>📞 Contact:</strong>{' '}
              <a href={`tel:${selectedRequest.contactNumber}`} style={{ color: 'var(--primary)', fontWeight: 600 }}>
                {selectedRequest.contactNumber}
              </a>
            </p>

            {selectedRequest.additionalMessage && (
              <div style={{ padding: '0.75rem', background: 'var(--gray-50)', borderRadius: '8px' }}>
                <strong style={{ fontSize: '0.85rem', color: 'var(--gray-700)' }}>Case Notes:</strong>
                <p style={{ fontSize: '0.85rem', color: 'var(--gray-600)', marginTop: '0.25rem' }}>
                  {selectedRequest.additionalMessage}
                </p>
              </div>
            )}

            <div style={{ marginTop: '1rem', display: 'flex', gap: '0.75rem' }}>
              <a
                href={`tel:${selectedRequest.contactNumber}`}
                className="btn btn-danger btn-block"
              >
                📞 Dial Emergency Contact Now
              </a>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Emergency;
