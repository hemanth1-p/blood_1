import React from 'react';

export const BloodStockGrid = ({ stocks = [], onManageStock, isAdmin = false }) => {
  if (!stocks || stocks.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-icon">⏳</div>
        <p>Loading blood stock levels...</p>
      </div>
    );
  }

  return (
    <div className="stock-grid">
      {stocks.map((s) => {
        const available = s.availableUnits || 0;
        const reserved = s.reservedUnits || 0;
        const expired = s.expiredUnits || 0;

        const isCritical = available <= 5;
        const isLow = available <= 15 && !isCritical;
        const statusClass = isCritical ? 'badge-danger' : isLow ? 'badge-warning' : 'badge-success';
        const statusText = isCritical ? '🚨 Critical' : isLow ? '⚠️ Low Stock' : '✅ Available';

        return (
          <div key={s.bloodGroup} className="stock-card">
            <div className="stock-card-header">
              <span className="stock-blood-type">{s.bloodGroup}</span>
              <span className={`badge ${statusClass}`}>{statusText}</span>
            </div>

            <div className="stock-details">
              <div className="stock-detail">
                <span>Available:</span>
                <span>{available} unit(s)</span>
              </div>
              <div className="stock-detail">
                <span>Reserved:</span>
                <span>{reserved} unit(s)</span>
              </div>
              <div className="stock-detail">
                <span>Expired / Discarded:</span>
                <span>{expired} unit(s)</span>
              </div>
            </div>

            {isAdmin && onManageStock && (
              <button
                onClick={() => onManageStock(s)}
                className="btn btn-outline btn-sm btn-block"
                style={{ marginTop: '1rem' }}
              >
                ✏️ Update Stock
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default BloodStockGrid;
