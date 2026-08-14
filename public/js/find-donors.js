document.addEventListener('DOMContentLoaded', () => {
  const bloodGroupFilter = document.getElementById('filterBloodGroup');
  const locationFilter = document.getElementById('filterLocation');
  const availabilityFilter = document.getElementById('filterAvailability');
  const searchBtn = document.getElementById('searchBtn');

  // Check URL query parameters (e.g. ?group=O+)
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('bloodGroup')) {
    bloodGroupFilter.value = urlParams.get('bloodGroup');
  }

  loadDonors();

  searchBtn.addEventListener('click', loadDonors);
  [bloodGroupFilter, availabilityFilter].forEach((el) => {
    el.addEventListener('change', loadDonors);
  });
  locationFilter.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') loadDonors();
  });

  // Modal logic
  const modal = document.getElementById('donorDetailsModal');
  document.getElementById('closeDonorDetailsBtn')?.addEventListener('click', () => {
    if (modal) modal.classList.remove('open');
  });

  window.openDonorDetails = function(index) {
    const d = window.donorsData[index];
    if (!d) return;
    const content = document.getElementById('donorDetailsContent');
    content.innerHTML = `
      <p><strong>Name:</strong> ${d.fullName}</p>
      <p><strong>Blood Group:</strong> <span class="badge badge-danger">${d.bloodGroup}</span></p>
      <p><strong>Availability:</strong> ${getAvailabilityBadge(d.isAvailable)}</p>
      <p><strong>Location:</strong> ${d.location || 'Not Specified'}</p>
      <p><strong>Email:</strong> ${d.email}</p>
      <p><strong>Phone:</strong> ${d.phone ? `<a href="tel:${d.phone}" style="color: var(--primary);">${d.phone}</a>` : 'Not Specified'}</p>
      <p><strong>Last Donated:</strong> ${formatDate(d.lastDonationDate)}</p>
      <p><strong>Total Donations:</strong> ${d.totalDonations || 0} times</p>
    `;
    if (modal) modal.classList.add('open');
  };
});

async function loadDonors() {
  const grid = document.getElementById('donorsGrid');
  const countEl = document.getElementById('resultsCount');
  const bloodGroup = document.getElementById('filterBloodGroup').value;
  const location = document.getElementById('filterLocation').value.trim();
  const availability = document.getElementById('filterAvailability').value;

  grid.innerHTML = `
    <div class="empty-state" style="grid-column: 1 / -1;">
      <div class="empty-icon">⏳</div>
      <h3>Searching for donors...</h3>
    </div>
  `;

  try {
    const params = new URLSearchParams();
    if (bloodGroup) params.append('bloodGroup', bloodGroup);
    if (location) params.append('location', location);
    if (availability) params.append('availability', availability);

    const data = await api.get(`/donors/search?${params.toString()}`);
    const donors = data.donors || [];

    countEl.textContent = `Showing ${donors.length} donor${donors.length === 1 ? '' : 's'}`;

    if (donors.length === 0) {
      grid.innerHTML = `
        <div class="empty-state" style="grid-column: 1 / -1;">
          <div class="empty-icon">🩸</div>
          <h3>No Donors Found</h3>
          <p>Try adjusting your search filters or <a href="/emergency.html" style="color: var(--primary); text-decoration: underline;">post an emergency request</a>.</p>
        </div>
      `;
      return;
    }

    window.donorsData = donors;

    grid.innerHTML = donors.map((d, index) => `
      <div class="donor-card">
        <div style="display: flex; justify-content: space-between; align-items: flex-start;">
          <span class="donor-blood">🩸 ${d.bloodGroup}</span>
          ${getAvailabilityBadge(d.isAvailable)}
        </div>
        <h3 class="donor-name" style="cursor: pointer; color: var(--primary); text-decoration: underline;" onclick="openDonorDetails(${index})">
          ${d.fullName}
        </h3>
        <div class="donor-info">
          <span>📍 ${d.location || 'Location Not Specified'}</span>
          <span>📅 Last Donated: ${formatDate(d.lastDonationDate)}</span>
          <span>🏆 Total Donations: ${d.totalDonations || 0} times</span>
        </div>
        <div style="display: flex; gap: 0.5rem; margin-top: 1rem;">
          ${d.phone ? `<a href="tel:${d.phone}" class="btn btn-primary btn-sm btn-block">📞 Call Donor</a>` : ''}
          ${d.email ? `<a href="mailto:${d.email}" class="btn btn-outline btn-sm btn-block">✉️ Email</a>` : ''}
        </div>
      </div>
    `).join('');
  } catch (err) {
    console.error('Failed to load donors:', err);
    grid.innerHTML = `
      <div class="empty-state" style="grid-column: 1 / -1;">
        <div class="empty-icon">⚠️</div>
        <h3>Failed to load donors</h3>
        <p>${err.message}</p>
      </div>
    `;
  }
}
