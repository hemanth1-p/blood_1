import React from 'react';

export const DonorCard = ({ donor, onSelect }) => {
  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <div className="donor-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <span className="donor-blood">🩸 {donor.bloodGroup}</span>
        <span className={`badge ${donor.isAvailable ? 'badge-success' : 'badge-gray'}`}>
          {donor.isAvailable ? '🟢 Available' : '🔴 Unavailable'}
        </span>
      </div>

      <h3
        className="donor-name"
        style={{ cursor: onSelect ? 'pointer' : 'default', color: 'var(--gray-900)' }}
        onClick={() => onSelect && onSelect(donor)}
      >
        {donor.fullName}
      </h3>

      <div className="donor-info">
        <span>📍 {donor.location || 'Location Not Specified'}</span>
        <span>📅 Last Donated: {formatDate(donor.lastDonationDate)}</span>
        <span>🏆 Total Donations: {donor.totalDonations || 0} times</span>
        {donor.livesImpacted > 0 && (
          <span>❤️ Lives Saved: ~{donor.livesImpacted}</span>
        )}
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
        {donor.phone ? (
          <a href={`tel:${donor.phone}`} className="btn btn-primary btn-sm btn-block">
            📞 Call
          </a>
        ) : null}
        {donor.email ? (
          <a href={`mailto:${donor.email}`} className="btn btn-outline btn-sm btn-block">
            ✉️ Email
          </a>
        ) : null}
        {onSelect && (
          <button
            onClick={() => onSelect(donor)}
            className="btn btn-white btn-sm"
            title="View Details"
            style={{ padding: '0.5rem 0.75rem' }}
          >
            ℹ️
          </button>
        )}
      </div>
    </div>
  );
};

export default DonorCard;
