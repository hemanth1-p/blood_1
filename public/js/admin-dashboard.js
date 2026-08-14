let bloodGroupChartInstance = null;
let stockChartInstance = null;
let donorsList = [];

document.addEventListener('DOMContentLoaded', async () => {
  if (!auth.requireAuth('admin')) return;

  const alertId = 'admin-alert';
  const user = auth.getUser();
  if (user?.email) {
    document.getElementById('adminEmail').textContent = user.email;
  }

  // Load all data
  loadStatsAndCharts();
  loadStockGrid();
  loadRequests();
  loadAdminDonations();
  loadAuditHistory();
  loadDonorsForSelect();

  // Modals event listeners
  const addStockModal = document.getElementById('addStockModal');
  const recordDonationModal = document.getElementById('recordDonationModal');
  const statusModal = document.getElementById('statusModal');
  const editDonationModal = document.getElementById('editDonationModal');

  document.getElementById('openAddStockModal')?.addEventListener('click', () => addStockModal.classList.add('open'));
  document.getElementById('stockAddBtn')?.addEventListener('click', () => addStockModal.classList.add('open'));
  document.getElementById('closeStockModal')?.addEventListener('click', () => addStockModal.classList.remove('open'));

  document.getElementById('openRecordDonationModal')?.addEventListener('click', () => recordDonationModal.classList.add('open'));
  document.getElementById('btnOpenRecordDonation')?.addEventListener('click', () => recordDonationModal.classList.add('open'));
  document.getElementById('closeDonationModal')?.addEventListener('click', () => recordDonationModal.classList.remove('open'));

  document.getElementById('closeStatusModal')?.addEventListener('click', () => statusModal.classList.remove('open'));
  document.getElementById('closeEditDonationModal')?.addEventListener('click', () => editDonationModal.classList.remove('open'));

  // Interactive Quick Stats Cards navigation
  document.getElementById('dashCardDonors')?.addEventListener('click', () => {
    document.getElementById('overview')?.scrollIntoView({ behavior: 'smooth' });
  });

  document.getElementById('dashCardAvailable')?.addEventListener('click', () => {
    window.open('/find-donors.html?availability=true', '_blank');
  });

  document.getElementById('dashCardStock')?.addEventListener('click', () => {
    document.getElementById('stock')?.scrollIntoView({ behavior: 'smooth' });
  });

  document.getElementById('dashCardPending')?.addEventListener('click', () => {
    const filterEl = document.getElementById('filterRequestStatus');
    if (filterEl) filterEl.value = 'Pending';
    loadRequests('Pending');
    document.getElementById('requests')?.scrollIntoView({ behavior: 'smooth' });
  });

  // Delete all completed requests button
  document.getElementById('btnDeleteCompleted')?.addEventListener('click', async () => {
    try {
      const res = await api.get('/requests?status=Completed');
      const completedReqs = res.requests || [];
      if (completedReqs.length === 0) {
        showAlert(alertId, 'No completed requests found to delete.', 'info');
        return;
      }

      if (!confirm(`Are you sure you want to permanently delete all ${completedReqs.length} completed blood request(s)?`)) {
        return;
      }

      let deletedCount = 0;
      for (const req of completedReqs) {
        await api.delete(`/requests/${req._id}`);
        deletedCount++;
      }

      showAlert(alertId, `Successfully deleted ${deletedCount} completed request(s).`, 'success');
      loadRequests(document.getElementById('filterRequestStatus')?.value || '');
      loadStatsAndCharts();
    } catch (err) {
      showAlert(alertId, err.message || 'Failed to delete completed requests', 'error');
    }
  });

  // Delete request button inside status modal
  document.getElementById('btnDeleteCurrentRequest')?.addEventListener('click', async () => {
    const id = document.getElementById('statusRequestId').value;
    if (id) {
      statusModal.classList.remove('open');
      await deleteRequest(id, 'this record');
    }
  });

  // Request status filter
  document.getElementById('filterRequestStatus')?.addEventListener('change', (e) => {
    loadRequests(e.target.value);
  });

  // Handle Add Stock Form
  document.getElementById('addStockForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const bloodGroup = document.getElementById('stockGroup').value;
    const units = parseInt(document.getElementById('stockUnits').value, 10);

    try {
      const res = await api.post('/stock/add', { bloodGroup, units });
      showAlert(alertId, res.message || 'Stock updated successfully!', 'success');
      addStockModal.classList.remove('open');
      loadStockGrid();
      loadStatsAndCharts();
      loadAuditHistory();
    } catch (err) {
      showAlert(alertId, err.message || 'Failed to add stock', 'error');
    }
  });

  // Handle Record Donation Form
  document.getElementById('recordDonationForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const donorId = document.getElementById('donationDonor').value;
    const hospital = document.getElementById('donationHospital').value.trim();
    const location = document.getElementById('donationLocation').value.trim();
    const unitsDonated = parseInt(document.getElementById('donationUnits').value, 10);

    const selectedDonor = donorsList.find((d) => d._id === donorId);
    if (!selectedDonor) {
      showAlert(alertId, 'Please select a valid donor', 'error');
      return;
    }

    try {
      const res = await api.post('/donations', {
        donorId,
        hospital,
        location,
        bloodGroup: selectedDonor.bloodGroup,
        unitsDonated,
      });

      showAlert(alertId, res.message || 'Donation recorded and stock updated!', 'success');
      recordDonationModal.classList.remove('open');
      document.getElementById('recordDonationForm').reset();
      loadStockGrid();
      loadStatsAndCharts();
      loadAdminDonations();
      loadAuditHistory();
    } catch (err) {
      showAlert(alertId, err.message || 'Failed to record donation', 'error');
    }
  });

  // Handle Edit Donation Form
  document.getElementById('editDonationForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('editDonationId').value;
    const hospital = document.getElementById('editDonationHospital').value.trim();
    const location = document.getElementById('editDonationLocation').value.trim();
    const unitsDonated = parseInt(document.getElementById('editDonationUnits').value, 10);
    const status = document.getElementById('editDonationStatus').value;

    try {
      const res = await api.put(`/donations/${id}`, { hospital, location, unitsDonated, status });
      showAlert(alertId, res.message || 'Donation record updated successfully!', 'success');
      editDonationModal.classList.remove('open');
      loadAdminDonations();
      loadStockGrid();
      loadStatsAndCharts();
      loadAuditHistory();
    } catch (err) {
      showAlert(alertId, err.message || 'Failed to update donation record', 'error');
    }
  });

  // Delete Donation Record button inside edit donation modal
  document.getElementById('btnDeleteDonationRecord')?.addEventListener('click', async () => {
    const id = document.getElementById('editDonationId').value;
    const donorName = document.getElementById('editDonationDonorName').value || 'this donor';
    if (id) {
      editDonationModal.classList.remove('open');
      await deleteDonation(id, donorName);
    }
  });

  // Handle Status Update Form
  document.getElementById('statusForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('statusRequestId').value;
    const status = document.getElementById('requestStatusSelect').value;
    const submitBtn = document.getElementById('submitStatusBtn');

    if (!id) {
      showAlert(alertId, 'No request selected to update.', 'error');
      return;
    }

    try {
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Updating...';
      }

      const res = await api.put(`/requests/${id}/status`, { status });
      showAlert(alertId, res.message || `Request status updated to ${status}!`, 'success');
      statusModal.classList.remove('open');
      const currentFilter = document.getElementById('filterRequestStatus')?.value || '';
      loadRequests(currentFilter);
      loadStatsAndCharts();
    } catch (err) {
      showAlert(alertId, err.message || 'Failed to update request status', 'error');
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Update Status';
      }
    }
  });
});

async function loadStatsAndCharts() {
  try {
    const data = await api.get('/statistics');
    const stats = data.stats || {};
    const charts = data.charts || {};

    document.getElementById('statDonorsCount').textContent = stats.totalDonors || 0;
    document.getElementById('statAvailableCount').textContent = stats.availableDonors || 0;
    document.getElementById('statStockUnits').textContent = stats.totalBloodStock || 0;
    document.getElementById('statPendingReqs').textContent = stats.pendingRequests || 0;

    // Donor Distribution Chart
    if (charts.donorsByBloodGroup) {
      const ctx1 = document.getElementById('adminBloodGroupChart');
      if (bloodGroupChartInstance) bloodGroupChartInstance.destroy();

      bloodGroupChartInstance = new Chart(ctx1, {
        type: 'doughnut',
        data: {
          labels: charts.donorsByBloodGroup.map((d) => d.bloodGroup),
          datasets: [{
            data: charts.donorsByBloodGroup.map((d) => d.count),
            backgroundColor: ['#c41e3a', '#e8354f', '#8b0000', '#ff6b6b', '#dc143c', '#b22222', '#cd5c5c', '#a52a2a'],
            borderWidth: 0,
          }],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { position: 'bottom', labels: { padding: 12, usePointStyle: true } } },
        },
      });
    }

    // Stock Levels Chart
    if (charts.bloodStockLevels) {
      const ctx2 = document.getElementById('adminStockChart');
      if (stockChartInstance) stockChartInstance.destroy();

      stockChartInstance = new Chart(ctx2, {
        type: 'bar',
        data: {
          labels: charts.bloodStockLevels.map((s) => s.bloodGroup),
          datasets: [{
            label: 'Available Units',
            data: charts.bloodStockLevels.map((s) => s.available),
            backgroundColor: charts.bloodStockLevels.map((s) =>
              s.status === 'Critical' ? '#ef4444' : s.status === 'Low Stock' ? '#f59e0b' : '#c41e3a'
            ),
            borderRadius: 6,
          }],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            y: { beginAtZero: true, grid: { color: '#f3f4f6' } },
            x: { grid: { display: false } },
          },
        },
      });
    }
  } catch (err) {
    console.error('Failed to load stats & charts:', err);
  }
}

async function loadStockGrid() {
  const container = document.getElementById('stockCardsGrid');
  if (!container) return;

  try {
    const res = await api.get('/stock');
    const stocks = res.stocks || [];

    container.innerHTML = stocks.map((s) => `
      <div class="stock-card">
        <div class="stock-card-header">
          <span class="stock-blood-type">${s.bloodGroup}</span>
          ${getStatusBadge(s.stockStatus)}
        </div>
        <div class="stock-details">
          <div class="stock-detail">
            <span>Available:</span>
            <span>${s.availableUnits} units</span>
          </div>
          <div class="stock-detail">
            <span>Reserved:</span>
            <span>${s.reservedUnits || 0} units</span>
          </div>
          <div class="stock-detail">
            <span>Expired:</span>
            <span>${s.expiredUnits || 0} units</span>
          </div>
        </div>
      </div>
    `).join('');
  } catch (err) {
    console.error('Failed to load stock grid:', err);
    container.innerHTML = `<div style="grid-column: 1 / -1; color: var(--danger);">Failed to load stock inventory</div>`;
  }
}

async function loadRequests(status = '') {
  const tbody = document.getElementById('adminRequestsBody');
  const btnDeleteCompleted = document.getElementById('btnDeleteCompleted');
  if (!tbody) return;

  try {
    const query = status ? `?status=${encodeURIComponent(status)}` : '';
    const res = await api.get(`/requests${query}`);
    const reqs = res.requests || [];

    const hasCompleted = reqs.some((r) => r.status === 'Completed');
    if (btnDeleteCompleted) {
      btnDeleteCompleted.style.display = hasCompleted ? 'inline-flex' : 'none';
    }

    if (reqs.length === 0) {
      tbody.innerHTML = `<tr><td colspan="8" style="text-align: center; color: var(--gray-400); padding: 2rem;">No requests found.</td></tr>`;
      return;
    }

    tbody.innerHTML = reqs.map((r) => {
      const isCompleted = r.status === 'Completed';
      const safeName = (r.patientName || 'Patient').replace(/'/g, "\\'");
      return `
        <tr style="${isCompleted ? 'background-color: rgba(16, 185, 129, 0.05);' : ''}">
          <td><strong>${r.patientName}</strong></td>
          <td><span class="badge badge-info">${r.bloodGroup}</span></td>
          <td>${r.unitsRequired}</td>
          <td>${getStatusBadge(r.emergencyLevel)}</td>
          <td>${r.hospitalName}, ${r.location}</td>
          <td><a href="tel:${r.contactNumber}" style="color: var(--primary); text-decoration: underline;">${r.contactNumber}</a></td>
          <td>
            <select class="status-quick-select" onchange="quickUpdateStatus('${r._id}', this.value)" style="padding: 0.3rem 0.5rem; border-radius: 6px; font-weight: 600; font-size: 0.8rem; border: 1px solid var(--gray-300); background: var(--white); cursor: pointer;">
              <option value="Pending" ${r.status === 'Pending' ? 'selected' : ''}>⏳ Pending</option>
              <option value="In Progress" ${r.status === 'In Progress' ? 'selected' : ''}>🔄 In Progress</option>
              <option value="Completed" ${r.status === 'Completed' ? 'selected' : ''}>✅ Completed</option>
              <option value="Cancelled" ${r.status === 'Cancelled' ? 'selected' : ''}>❌ Cancelled</option>
            </select>
          </td>
          <td>
            <div style="display: flex; gap: 0.4rem; align-items: center;">
              <button class="btn btn-outline btn-sm" onclick="openStatusModal('${r._id}', '${r.status}')" title="Update status in modal">
                ✏️ Status
              </button>
              <button class="btn btn-danger btn-sm" onclick="deleteRequest('${r._id}', '${safeName}', '${r.status}')" title="Delete request record">
                🗑️ Delete
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  } catch (err) {
    console.error('Failed to load admin requests:', err);
    tbody.innerHTML = `<tr><td colspan="8" style="text-align: center; color: var(--danger);">Failed to load requests</td></tr>`;
  }
}

window.quickUpdateStatus = async function(id, newStatus) {
  try {
    const res = await api.put(`/requests/${id}/status`, { status: newStatus });
    showAlert('admin-alert', res.message || `Request status updated to "${newStatus}"!`, 'success');
    const filterEl = document.getElementById('filterRequestStatus');
    loadRequests(filterEl ? filterEl.value : '');
    loadStatsAndCharts();
  } catch (err) {
    showAlert('admin-alert', err.message || 'Failed to update request status', 'error');
    loadRequests(document.getElementById('filterRequestStatus')?.value || '');
  }
};

window.openStatusModal = function(id, currentStatus) {
  document.getElementById('statusRequestId').value = id;
  const select = document.getElementById('requestStatusSelect');
  if (select) {
    select.value = currentStatus;
  }
  document.getElementById('statusModal').classList.add('open');
};

window.deleteRequest = async function(id, patientName = 'this record', status = '') {
  const statusNote = status === 'Completed' ? ' (Completed)' : '';
  if (!confirm(`Are you sure you want to permanently delete the blood request${statusNote} for "${patientName}"? This action cannot be undone.`)) {
    return;
  }

  try {
    const res = await api.delete(`/requests/${id}`);
    showAlert('admin-alert', res.message || 'Blood request deleted successfully!', 'success');
    const filterEl = document.getElementById('filterRequestStatus');
    loadRequests(filterEl ? filterEl.value : '');
    loadStatsAndCharts();
  } catch (err) {
    showAlert('admin-alert', err.message || 'Failed to delete blood request', 'error');
  }
};

let adminDonationsList = [];

async function loadAdminDonations() {
  const tbody = document.getElementById('adminDonationsBody');
  if (!tbody) return;

  try {
    const res = await api.get('/donations');
    adminDonationsList = res.donations || [];

    if (adminDonationsList.length === 0) {
      tbody.innerHTML = `<tr><td colspan="8" style="text-align: center; color: var(--gray-400); padding: 2rem;">No donation records found.</td></tr>`;
      return;
    }

    tbody.innerHTML = adminDonationsList.map((d) => {
      const donorName = d.donor?.fullName || 'Anonymous / Walk-in';
      const safeDonorName = donorName.replace(/'/g, "\\'");
      return `
        <tr>
          <td>${formatDate(d.donationDate)}</td>
          <td>
            <strong>${donorName}</strong>
            ${d.donor?.email ? `<br><small style="color: var(--gray-500);">${d.donor.email}</small>` : ''}
          </td>
          <td><span class="badge badge-info">${d.bloodGroup}</span></td>
          <td><strong>${d.unitsDonated}</strong> unit(s)</td>
          <td>${d.hospital}</td>
          <td>${d.location}</td>
          <td>${getStatusBadge(d.status)}</td>
          <td>
            <div style="display: flex; gap: 0.4rem; align-items: center;">
              <button class="btn btn-outline btn-sm" onclick="openEditDonationModal('${d._id}')" title="Edit donation record">
                ✏️ Edit
              </button>
              <button class="btn btn-danger btn-sm" onclick="deleteDonation('${d._id}', '${safeDonorName}')" title="Delete donation record">
                🗑️ Delete
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  } catch (err) {
    console.error('Failed to load donations list:', err);
    tbody.innerHTML = `<tr><td colspan="8" style="text-align: center; color: var(--danger);">Failed to load donation records</td></tr>`;
  }
}

window.openEditDonationModal = function(id) {
  const donation = adminDonationsList.find((d) => d._id === id);
  if (!donation) return;

  document.getElementById('editDonationId').value = donation._id;
  document.getElementById('editDonationDonorName').value = donation.donor?.fullName || 'Anonymous';
  document.getElementById('editDonationHospital').value = donation.hospital || '';
  document.getElementById('editDonationLocation').value = donation.location || '';
  document.getElementById('editDonationUnits').value = donation.unitsDonated || 1;
  document.getElementById('editDonationStatus').value = donation.status || 'Completed';

  document.getElementById('editDonationModal').classList.add('open');
};

window.deleteDonation = async function(id, donorName = 'this donor') {
  if (!confirm(`Are you sure you want to delete the donation record for "${donorName}"? Donor statistics and stock will be recalculated.`)) {
    return;
  }

  try {
    const res = await api.delete(`/donations/${id}`);
    showAlert('admin-alert', res.message || 'Donation record deleted successfully!', 'success');
    loadAdminDonations();
    loadStockGrid();
    loadStatsAndCharts();
    loadAuditHistory();
  } catch (err) {
    showAlert('admin-alert', err.message || 'Failed to delete donation record', 'error');
  }
};

async function loadAuditHistory() {
  const tbody = document.getElementById('adminHistoryBody');
  if (!tbody) return;

  try {
    const res = await api.get('/stock/history');
    const logs = res.history || [];

    if (logs.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--gray-400); padding: 2rem;">No stock transactions recorded yet.</td></tr>`;
      return;
    }

    tbody.innerHTML = logs.map((h) => {
      const actionBadgeCls = h.action === 'Add' ? 'badge-success' : h.action === 'Delete' ? 'badge-danger' : 'badge-warning';
      const actionIcon = h.action === 'Add' ? '➕' : h.action === 'Delete' ? '🗑️' : '🔄';
      return `
        <tr>
          <td>${formatDate(h.createdAt)}</td>
          <td><span class="badge badge-info">${h.bloodGroup}</span></td>
          <td><span class="badge ${actionBadgeCls}">${actionIcon} ${h.action || 'Update'}</span></td>
          <td><strong>${h.units > 0 ? '+' : ''}${h.units}</strong></td>
          <td>${h.previousUnits} units</td>
          <td><strong>${h.newUnits} units</strong></td>
          <td>${h.notes || h.updatedBy?.fullName || 'Admin / System'}</td>
        </tr>
      `;
    }).join('');
  } catch (err) {
    console.error('Failed to load audit history:', err);
    tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--danger);">Failed to load history</td></tr>`;
  }
}

async function loadDonorsForSelect() {
  const select = document.getElementById('donationDonor');
  if (!select) return;

  try {
    const res = await api.get('/donors/search');
    donorsList = res.donors || [];

    select.innerHTML = '<option value="">Select Donor...</option>' + donorsList.map((d) => `
      <option value="${d._id}">${d.fullName} (${d.bloodGroup}) - ${d.location}</option>
    `).join('');
  } catch (err) {
    console.error('Failed to populate donors:', err);
  }
}
