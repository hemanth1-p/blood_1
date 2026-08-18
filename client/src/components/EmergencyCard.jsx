import React from 'react';

export const EmergencyCard = ({ request, onClick }) => {
  const isCritical = request.emergencyLevel === 'Critical';
  const isHigh = request.emergencyLevel === 'High';

  const badgeClass = isCritical ? 'badge-danger' : isHigh ? 'badge-warning' : 'badge-info';
  const badgeIcon = isCritical ? '🚨' : isHigh ? '⚠️' : 'ℹ️';

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
    <div
      className="urgent-card"
      onClick={() => onClick && onClick(request)}
      style={{
        cursor: onClick ? 'pointer' : 'default',
        transition: 'var(--transition)',
        borderLeft: isCritical ? '4px solid var(--danger)' : isHigh ? '4px solid var(--warning)' : '1px solid rgba(255,255,255,0.15)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.6rem' }}>
        <div>
          <h4 style={{ margin: 0, fontSize: '1.1rem' }}>
            {request.patientName} <span style={{ color: '#ff8585' }}>({request.bloodGroup})</span>
          </h4>
          <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)' }}>
            🏥 {request.hospitalName}, {request.location}
          </span>
        </div>
        <span className={`badge ${badgeClass}`}>
          {badgeIcon} {request.emergencyLevel}
        </span>
      </div>

      <p style={{ margin: '0.4rem 0', color: 'rgba(255,255,255,0.9)' }}>
        <strong>Units Needed:</strong> {request.unitsRequired} unit(s) &nbsp;|&nbsp;{' '}
        <strong>Required By:</strong> {formatDate(request.requiredDate)}
      </p>

      {request.additionalMessage && (
        <p style={{ fontStyle: 'italic', fontSize: '0.82rem', color: 'rgba(255,255,255,0.75)', margin: '0.4rem 0' }}>
          📝 "{request.additionalMessage}"
        </p>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.75rem' }}>
        <a
          href={`tel:${request.contactNumber}`}
          onClick={(e) => e.stopPropagation()}
          className="btn btn-white btn-sm"
          style={{ padding: '0.35rem 0.85rem', fontSize: '0.82rem' }}
        >
          📞 Call {request.contactNumber}
        </a>

        {onClick && (
          <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)' }}>
            Click for details →
          </span>
        )}
      </div>
    </div>
  );
};

export default EmergencyCard;
