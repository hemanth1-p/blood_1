import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import api from '../services/api';
import DonorCard from '../components/DonorCard';
import Modal from '../components/Modal';
import Loader from '../components/Loader';
import AlertMessage from '../components/AlertMessage';

export const FindDonors = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const [bloodGroup, setBloodGroup] = useState(searchParams.get('bloodGroup') || '');
  const [location, setLocation] = useState(searchParams.get('location') || '');
  const [availability, setAvailability] = useState(searchParams.get('availability') || '');

  const [donors, setDonors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Selected donor for modal
  const [selectedDonor, setSelectedDonor] = useState(null);

  const fetchDonors = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (bloodGroup) params.append('bloodGroup', bloodGroup);
      if (location) params.append('location', location.trim());
      if (availability) params.append('availability', availability);

      const res = await api.get(`/donors/search?${params.toString()}`);
      setDonors(res.donors || []);
    } catch (err) {
      console.error('Error fetching donors:', err);
      setError(err.message || 'Failed to search donors');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDonors();
  }, []);

  const handleSearch = (e) => {
    if (e) e.preventDefault();
    const newParams = {};
    if (bloodGroup) newParams.bloodGroup = bloodGroup;
    if (location) newParams.location = location.trim();
    if (availability) newParams.availability = availability;
    setSearchParams(newParams);
    fetchDonors();
  };

  const handleReset = () => {
    setBloodGroup('');
    setLocation('');
    setAvailability('');
    setSearchParams({});
    setTimeout(() => {
      api.get('/donors/search').then((res) => setDonors(res.donors || []));
    }, 0);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <div className="find-donors-page" style={{ paddingTop: '90px', minHeight: '100vh', paddingBottom: '4rem' }}>
      <div className="container">
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <span className="section-tag">Directory</span>
          <h1 style={{ fontSize: '2.25rem', marginTop: '0.5rem' }}>Find Blood Donors</h1>
          <p style={{ color: 'var(--gray-500)', maxWidth: '600px', margin: '0.5rem auto 0' }}>
            Locate verified, available donors in your area and connect with them instantly.
          </p>
        </div>

        {error && <AlertMessage message={error} type="error" onClose={() => setError(null)} />}

        {/* Search Filters */}
        <form onSubmit={handleSearch} className="search-filters">
          <div className="form-group">
            <label>Blood Group</label>
            <select
              value={bloodGroup}
              onChange={(e) => setBloodGroup(e.target.value)}
            >
              <option value="">All Blood Groups</option>
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
            <label>Location / City</label>
            <input
              type="text"
              placeholder="e.g. Hyderabad, Mumbai, Delhi"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>Availability Status</label>
            <select
              value={availability}
              onChange={(e) => setAvailability(e.target.value)}
            >
              <option value="">All Donors</option>
              <option value="true">🟢 Available Only</option>
              <option value="false">🔴 Unavailable</option>
            </select>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
              🔍 Search
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="btn btn-outline"
              title="Reset filters"
            >
              🔄
            </button>
          </div>
        </form>

        {/* Results Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <p style={{ fontWeight: 600, color: 'var(--gray-700)' }}>
            Showing {donors.length} verified donor{donors.length === 1 ? '' : 's'}
          </p>
          <Link to="/emergency" className="btn btn-outline btn-sm">
            🚨 Need Urgent Blood?
          </Link>
        </div>

        {/* Donors Grid */}
        {loading ? (
          <Loader text="Searching verified blood donors..." />
        ) : donors.length === 0 ? (
          <div className="empty-state" style={{ background: 'var(--white)', borderRadius: 'var(--radius-lg)' }}>
            <div className="empty-icon">🩸</div>
            <h3>No Donors Found</h3>
            <p style={{ maxWidth: '400px', margin: '0.5rem auto 1.5rem' }}>
              We couldn't find any donors matching your criteria. Try loosening your search filters or broadcast an urgent emergency blood request.
            </p>
            <Link to="/emergency" className="btn btn-primary btn-sm">
              🚨 Broadcast Emergency Request
            </Link>
          </div>
        ) : (
          <div className="donors-grid">
            {donors.map((donor) => (
              <DonorCard
                key={donor._id}
                donor={donor}
                onSelect={(d) => setSelectedDonor(d)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Donor Details Modal */}
      <Modal
        isOpen={!!selectedDonor}
        onClose={() => setSelectedDonor(null)}
        title="Donor Profile"
      >
        {selectedDonor && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h4 style={{ fontSize: '1.25rem', color: 'var(--gray-900)' }}>
                {selectedDonor.fullName}
              </h4>
              <span className="donor-blood" style={{ margin: 0 }}>
                🩸 {selectedDonor.bloodGroup}
              </span>
            </div>

            <div style={{ padding: '0.75rem', background: 'var(--gray-50)', borderRadius: '8px' }}>
              <p style={{ fontSize: '0.85rem', color: 'var(--gray-600)' }}>
                <strong>Status:</strong>{' '}
                <span className={`badge ${selectedDonor.isAvailable ? 'badge-success' : 'badge-gray'}`}>
                  {selectedDonor.isAvailable ? '🟢 Available for donation' : '🔴 Currently unavailable'}
                </span>
              </p>
            </div>

            <p><strong>📍 City / Location:</strong> {selectedDonor.location || 'Not Specified'}</p>
            {selectedDonor.address && <p><strong>🏠 Address:</strong> {selectedDonor.address}</p>}
            <p><strong>📅 Last Donated:</strong> {formatDate(selectedDonor.lastDonationDate)}</p>
            <p><strong>🏆 Total Lifetime Donations:</strong> {selectedDonor.totalDonations || 0} times</p>
            {selectedDonor.livesImpacted > 0 && (
              <p><strong>❤️ Estimated Lives Saved:</strong> ~{selectedDonor.livesImpacted}</p>
            )}

            <div style={{ borderTop: '1px solid var(--gray-200)', paddingTop: '1rem', marginTop: '0.5rem' }}>
              <h5 style={{ marginBottom: '0.75rem', fontSize: '0.9rem', color: 'var(--gray-700)' }}>
                Contact this Donor:
              </h5>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                {selectedDonor.phone && (
                  <a
                    href={`tel:${selectedDonor.phone}`}
                    className="btn btn-primary btn-sm btn-block"
                  >
                    📞 Call {selectedDonor.phone}
                  </a>
                )}
                {selectedDonor.email && (
                  <a
                    href={`mailto:${selectedDonor.email}`}
                    className="btn btn-outline btn-sm btn-block"
                  >
                    ✉️ Send Email
                  </a>
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default FindDonors;
