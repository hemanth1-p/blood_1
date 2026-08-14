document.addEventListener('DOMContentLoaded', async () => {
  try {
    const data = await api.get('/statistics');
    const stats = data.stats;

    animateCounter(document.getElementById('stat-donors'), stats.totalDonors || 0);
    animateCounter(document.getElementById('stat-lives'), stats.livesSaved || 0);
    animateCounter(document.getElementById('stat-hospitals'), stats.registeredHospitals || 0);
    animateCounter(document.getElementById('stat-requests'), stats.totalRequests || 0);

    const charts = data.charts;

    if (charts.donorsByBloodGroup?.length) {
      new Chart(document.getElementById('bloodGroupChart'), {
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
          plugins: { legend: { position: 'bottom', labels: { padding: 15, usePointStyle: true } } },
        },
      });
    }

    if (charts.bloodStockLevels?.length) {
      new Chart(document.getElementById('stockChart'), {
        type: 'bar',
        data: {
          labels: charts.bloodStockLevels.map((s) => s.bloodGroup),
          datasets: [{
            label: 'Available Units',
            data: charts.bloodStockLevels.map((s) => s.available),
            backgroundColor: charts.bloodStockLevels.map((s) =>
              s.status === 'Critical' ? '#ef4444' : s.status === 'Low Stock' ? '#f59e0b' : '#c41e3a'
            ),
            borderRadius: 8,
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
    console.error('Failed to load statistics:', err);
    ['stat-donors', 'stat-lives', 'stat-hospitals', 'stat-requests'].forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.textContent = '—';
    });
  }
});
