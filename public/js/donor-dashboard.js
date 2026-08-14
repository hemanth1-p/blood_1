document.addEventListener('DOMContentLoaded', async () => {
  if (!auth.requireAuth('donor')) return;

  const alertId = 'dash-alert';
  let currentUser = auth.getUser();

  // Load user details
  try {
    const meRes = await api.get('/auth/me');
    if (meRes.user) {
      currentUser = meRes.user;
      auth.setSession(auth.getToken(), currentUser);
    }
  } catch (e) {
    console.warn('Could not refresh profile:', e);
  }

  renderUserProfile(currentUser);
  loadDonations();
  loadUrgentRequests();

  // Availability Switch Toggle
  const toggle = document.getElementById('availabilityToggle');
  const toggleLabel = document.getElementById('availabilityLabel');

  function updateToggleUI(isAvailable) {
    if (isAvailable) {
      toggle.classList.add('active');
      toggleLabel.textContent = '🟢 Available';
      toggleLabel.style.color = 'var(--success)';
    } else {
      toggle.classList.remove('active');
      toggleLabel.textContent = '🔴 Unavailable';
      toggleLabel.style.color = 'var(--danger)';
    }
  }

  updateToggleUI(currentUser.isAvailable);

  toggle?.addEventListener('click', async () => {
    const newState = !currentUser.isAvailable;
    try {
      const res = await api.put('/auth/availability', { isAvailable: newState });
      currentUser.isAvailable = res.user.isAvailable;
      auth.setSession(auth.getToken(), currentUser);
      updateToggleUI(currentUser.isAvailable);
      showAlert(alertId, res.message, 'success');
    } catch (err) {
      showAlert(alertId, err.message || 'Failed to update availability', 'error');
    }
  });

  // Profile Form
  const profileForm = document.getElementById('profileForm');
  if (profileForm) {
    profileForm.profName.value = currentUser.fullName || '';
    profileForm.profPhone.value = currentUser.phone || '';
    profileForm.profLocation.value = currentUser.location || '';
    profileForm.profBlood.value = currentUser.bloodGroup || 'O+';
    profileForm.profAddress.value = currentUser.address || '';

    profileForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      try {
        const btn = document.getElementById('profSubmitBtn');
        btn.disabled = true;
        btn.innerHTML = '<span class="loading-spinner"></span> Saving...';

        const updateData = {
          fullName: profileForm.profName.value.trim(),
          phone: profileForm.profPhone.value.trim(),
          location: profileForm.profLocation.value.trim(),
          bloodGroup: profileForm.profBlood.value,
          address: profileForm.profAddress.value.trim(),
        };

        const res = await api.put('/auth/profile', updateData);
        currentUser = res.user;
        auth.setSession(auth.getToken(), currentUser);
        renderUserProfile(currentUser);
        showAlert(alertId, 'Profile updated successfully!', 'success');
      } catch (err) {
        showAlert(alertId, err.message || 'Failed to update profile', 'error');
      } finally {
        const btn = document.getElementById('profSubmitBtn');
        btn.disabled = false;
        btn.textContent = 'Save Profile Changes';
      }
    });
  }
});

function renderUserProfile(user) {
  if (!user) return;
  document.getElementById('sidebarDonorName').textContent = user.fullName || 'Donor';
  document.getElementById('sidebarDonorEmail').textContent = user.email || '';
  document.getElementById('welcomeGreeting').textContent = `Welcome Back, ${user.fullName?.split(' ')[0] || 'Life Saver'}!`;
  document.getElementById('cardBloodGroup').textContent = user.bloodGroup || '—';
  document.getElementById('cardTotalDonations').textContent = user.totalDonations || 0;
  document.getElementById('cardLivesImpacted').textContent = user.livesImpacted || (user.totalDonations ? user.totalDonations * 3 : 0);
}

async function loadDonations() {
  const tbody = document.getElementById('donationHistoryBody');
  if (!tbody) return;

  try {
    const res = await api.get('/donations/my');
    const donations = res.donations || [];

    if (donations.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--gray-400); padding: 2rem;">No donation records found yet. Donate soon to save lives!</td></tr>`;
      return;
    }

    tbody.innerHTML = donations.map((d) => `
      <tr>
        <td>${formatDate(d.donationDate)}</td>
        <td><strong>${d.hospital}</strong></td>
        <td><span class="badge badge-info">${d.bloodGroup}</span></td>
        <td>${d.unitsDonated} unit(s)</td>
        <td>${d.location}</td>
        <td>${getStatusBadge(d.status)}</td>
      </tr>
    `).join('');
  } catch (err) {
    console.error('Failed to load donations:', err);
    tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--danger);">Failed to load history</td></tr>`;
  }
}

async function loadUrgentRequests() {
  const tbody = document.getElementById('urgentRequestsBody');
  if (!tbody) return;

  try {
    const res = await api.get('/requests/urgent');
    const reqs = res.requests || [];

    if (reqs.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--gray-400); padding: 2rem;">No critical requests at this moment.</td></tr>`;
      return;
    }

    tbody.innerHTML = reqs.map((r) => `
      <tr>
        <td><strong>${r.patientName}</strong></td>
        <td><span class="badge badge-danger">${r.bloodGroup}</span></td>
        <td>${r.unitsRequired} Unit(s)</td>
        <td>${getStatusBadge(r.emergencyLevel)}</td>
        <td>${r.hospitalName}</td>
        <td>${r.location}</td>
        <td><a href="tel:${r.contactNumber}" class="btn btn-outline btn-sm">📞 ${r.contactNumber}</a></td>
      </tr>
    `).join('');
  } catch (err) {
    console.error('Failed to load urgent requests:', err);
    tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--danger);">Failed to load urgent requests</td></tr>`;
  }
}
