document.addEventListener('DOMContentLoaded', async () => {
  if (!auth.requireAuth('donor')) return;

  const alertId = 'dash-alert';
  let currentUser = auth.getUser();

  // Load user details from server (fresh copy)
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
  document.getElementById('cardLivesImpacted').textContent =
    user.livesImpacted || (user.totalDonations ? user.totalDonations * 3 : 0);
}

// ─── Donation History ─────────────────────────────────────────────────────────

async function loadDonations() {
  const tbody = document.getElementById('donationHistoryBody');
  if (!tbody) return;

  try {
    const res = await api.get('/donations/my');
    const donations = res.donations || [];

    if (donations.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7" style="text-align:center; padding: 2.5rem 1rem;">
            <div style="display:flex; flex-direction:column; align-items:center; gap:0.75rem; color:var(--gray-400);">
              <span style="font-size:2.5rem;">🩸</span>
              <strong style="font-size:1rem; color:var(--gray-600);">No donation records yet</strong>
              <span style="font-size:0.875rem;">Your past donations will appear here once recorded by the admin.</span>
              <a href="/emergency.html" class="btn btn-primary btn-sm" style="margin-top:0.5rem;">View Urgent Requests &amp; Help Now</a>
            </div>
          </td>
        </tr>`;
      return;
    }

    // Compute next eligible donation date (90 days after last donation)
    tbody.innerHTML = donations.map((d) => {
      const nextEligible = d.donationDate
        ? (() => {
            const next = new Date(d.donationDate);
            next.setDate(next.getDate() + 90);
            const today = new Date();
            const diffDays = Math.ceil((next - today) / (1000 * 60 * 60 * 24));
            if (diffDays <= 0) return `<span class="badge badge-success">Eligible Now</span>`;
            return `<span class="badge badge-warning">In ${diffDays} day${diffDays !== 1 ? 's' : ''}</span>`;
          })()
        : '—';

      return `
        <tr>
          <td>${formatDate(d.donationDate)}</td>
          <td><strong>${d.hospital}</strong></td>
          <td><span class="badge badge-info">${d.bloodGroup}</span></td>
          <td>${d.unitsDonated} unit${d.unitsDonated !== 1 ? 's' : ''}</td>
          <td>${d.location}</td>
          <td>${getStatusBadge(d.status)}</td>
          <td>${nextEligible}</td>
        </tr>`;
    }).join('');
  } catch (err) {
    console.error('Failed to load donations:', err);
    tbody.innerHTML = `
      <tr>
        <td colspan="7" style="text-align:center; padding:2rem; color:var(--danger);">
          ❌ Failed to load donation history. Please refresh the page.
        </td>
      </tr>`;
  }
}

// ─── Urgent Blood Requests ────────────────────────────────────────────────────

async function loadUrgentRequests() {
  const tbody = document.getElementById('urgentRequestsBody');
  if (!tbody) return;

  try {
    const res = await api.get('/requests/urgent');
    const reqs = res.requests || [];

    if (reqs.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="8" style="text-align:center; padding:2.5rem 1rem;">
            <div style="display:flex; flex-direction:column; align-items:center; gap:0.75rem; color:var(--gray-400);">
              <span style="font-size:2.5rem;">✅</span>
              <strong style="font-size:1rem; color:var(--gray-600);">No active urgent requests right now</strong>
              <span style="font-size:0.875rem;">All current blood requests have been fulfilled or there are none at this moment.</span>
              <a href="/emergency.html" class="btn btn-outline btn-sm" style="margin-top:0.5rem;">Submit a Blood Request</a>
            </div>
          </td>
        </tr>`;
      return;
    }

    // Sort: Critical first, then by requiredDate ascending
    const sorted = [...reqs].sort((a, b) => {
      const levelOrder = { Critical: 0, High: 1, Medium: 2, Low: 3 };
      const la = levelOrder[a.emergencyLevel] ?? 99;
      const lb = levelOrder[b.emergencyLevel] ?? 99;
      if (la !== lb) return la - lb;
      return new Date(a.requiredDate) - new Date(b.requiredDate);
    });

    tbody.innerHTML = sorted.map((r) => {
      const reqDate = r.requiredDate ? formatDate(r.requiredDate) : 'ASAP';
      const isCritical = r.emergencyLevel === 'Critical';
      const rowStyle = isCritical
        ? 'background: rgba(220,38,38,0.04); border-left: 3px solid var(--danger);'
        : '';

      return `
        <tr style="${rowStyle}">
          <td>
            <strong>${r.patientName}</strong>
            ${r.additionalMessage ? `<br><small style="color:var(--gray-400); font-size:0.78rem;">📝 ${r.additionalMessage}</small>` : ''}
          </td>
          <td><span class="badge badge-danger">${r.bloodGroup}</span></td>
          <td><strong>${r.unitsRequired}</strong> unit${r.unitsRequired !== 1 ? 's' : ''}</td>
          <td>${getStatusBadge(r.emergencyLevel)}</td>
          <td>${r.hospitalName}</td>
          <td>${r.location}</td>
          <td style="white-space:nowrap; font-size:0.85rem;">${reqDate}</td>
          <td><a href="tel:${r.contactNumber}" class="btn btn-outline btn-sm">📞 ${r.contactNumber}</a></td>
        </tr>`;
    }).join('');
  } catch (err) {
    console.error('Failed to load urgent requests:', err);
    tbody.innerHTML = `
      <tr>
        <td colspan="8" style="text-align:center; padding:2rem; color:var(--danger);">
          ❌ Failed to load urgent requests. Please refresh the page.
        </td>
      </tr>`;
  }
}
