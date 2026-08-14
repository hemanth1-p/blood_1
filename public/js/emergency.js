document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('emergencyForm');
  const alertId = 'emergency-alert';
  const submitBtn = document.getElementById('submitBtn');
  const dateInput = document.getElementById('requiredDate');

  if (dateInput) {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    dateInput.value = now.toISOString().slice(0, 16);
  }

  loadUrgentRequests();

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      hideAlert(alertId);

      const formData = {
        patientName: form.patientName.value.trim(),
        bloodGroup: form.bloodGroup.value,
        unitsRequired: parseInt(form.unitsRequired.value, 10),
        emergencyLevel: form.emergencyLevel.value,
        hospitalName: form.hospitalName.value.trim(),
        location: form.location.value.trim(),
        contactNumber: form.contactNumber.value.trim(),
        requiredDate: form.requiredDate.value,
        additionalNotes: form.additionalNotes?.value.trim() || '',
      };

      try {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="loading-spinner"></span> Broadcasting...';

        const res = await api.post('/requests', formData);
        showAlert(alertId, res.message || 'Emergency request posted successfully!', 'success');
        form.reset();

        if (dateInput) {
          const now = new Date();
          now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
          dateInput.value = now.toISOString().slice(0, 16);
        }

        loadUrgentRequests();
      } catch (err) {
        showAlert(alertId, err.message || 'Failed to submit request', 'error');
      } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '🚨 Broadcast Emergency Request';
      }
    });
  }
});

async function loadUrgentRequests() {
  const container = document.getElementById('urgentRequestsList');
  if (!container) return;

  try {
    const data = await api.get('/requests/urgent');
    const requests = data.requests || [];

    if (requests.length === 0) {
      container.innerHTML = `
        <div class="urgent-card" style="text-align: center; color: rgba(255,255,255,0.8);">
          <p>✨ No critical emergencies pending right now. Blood supply is stable.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = requests.map((req) => `
      <div class="urgent-card">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.5rem;">
          <h4 style="margin: 0;">${req.patientName} (${req.bloodGroup})</h4>
          <span class="badge ${req.emergencyLevel === 'Critical' ? 'badge-danger' : 'badge-warning'}">
            ${req.emergencyLevel === 'Critical' ? '🚨' : '⚠️'} ${req.emergencyLevel}
          </span>
        </div>
        <p><strong>Units:</strong> ${req.unitsRequired} Unit(s) | <strong>Hospital:</strong> ${req.hospitalName}, ${req.location}</p>
        <p><strong>Required By:</strong> ${formatDate(req.requiredDate)} | <strong>Contact:</strong> <a href="tel:${req.contactNumber}" style="color: #ff8585; text-decoration: underline;">${req.contactNumber}</a></p>
      </div>
    `).join('');
  } catch (err) {
    console.error('Failed to load urgent requests:', err);
    container.innerHTML = `<div class="urgent-card"><p>Unable to load urgent requests</p></div>`;
  }
}
