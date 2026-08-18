import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';
import api from '../services/api';
import StatsCard from '../components/StatsCard';
import SectionHeader from '../components/SectionHeader';

// Register Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

export const Home = () => {
  const [stats, setStats] = useState({
    totalDonors: 0,
    livesSaved: 0,
    registeredHospitals: 0,
    totalRequests: 0,
  });
  const [chartsData, setChartsData] = useState({
    donorsByBloodGroup: [],
    bloodStockLevels: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await api.get('/statistics');
        if (data.stats) {
          setStats(data.stats);
        }
        if (data.charts) {
          setChartsData(data.charts);
        }
      } catch (err) {
        console.error('Failed to load home page statistics:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  // Donor Blood Group Doughnut Chart Config
  const doughnutData = {
    labels: chartsData.donorsByBloodGroup?.map((d) => d.bloodGroup) || [],
    datasets: [
      {
        data: chartsData.donorsByBloodGroup?.map((d) => d.count) || [],
        backgroundColor: [
          '#c41e3a',
          '#e8354f',
          '#8b0000',
          '#ff6b6b',
          '#dc143c',
          '#b22222',
          '#cd5c5c',
          '#a52a2a',
        ],
        borderWidth: 0,
      },
    ],
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: { padding: 14, usePointStyle: true, font: { family: 'Inter', size: 12 } },
      },
      tooltip: {
        callbacks: {
          label: (context) => ` ${context.label}: ${context.raw} donors`,
        },
      },
    },
  };

  // Stock Level Bar Chart Config
  const barData = {
    labels: chartsData.bloodStockLevels?.map((s) => s.bloodGroup) || [],
    datasets: [
      {
        label: 'Available Units',
        data: chartsData.bloodStockLevels?.map((s) => s.available) || [],
        backgroundColor: chartsData.bloodStockLevels?.map((s) =>
          s.status === 'Critical' ? '#ef4444' : s.status === 'Low Stock' ? '#f59e0b' : '#c41e3a'
        ) || [],
        borderRadius: 8,
      },
    ],
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (context) => ` ${context.raw} units available`,
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: { color: '#f3f4f6' },
        ticks: { font: { family: 'Inter' } },
      },
      x: {
        grid: { display: false },
        ticks: { font: { family: 'Inter', weight: '600' } },
      },
    },
  };

  return (
    <div className="home-page">
      {/* Hero Section */}
      <section className="hero bg-pattern">
        <div className="floating-drops">
          <span className="floating-drop">🩸</span>
          <span className="floating-drop">❤️</span>
          <span className="floating-drop">🩸</span>
          <span className="floating-drop">💉</span>
        </div>

        <div className="container hero-content">
          <div className="hero-text">
            <h1>
              Donate Blood.
              <br />
              <span>Save Lives.</span>
            </h1>
            <p>
              A few minutes of your time can give someone a lifetime. Connect directly with patients and verified blood banks in seconds.
            </p>
            <div className="hero-buttons">
              <Link to="/find-donors" className="btn btn-primary btn-lg">
                🩸 Find a Donor
              </Link>
              <Link to="/register" className="btn btn-outline btn-lg">
                ❤️ Become a Donor
              </Link>
            </div>
          </div>

          <div className="hero-visual">
            <div className="hero-ring hero-ring-2"></div>
            <div className="hero-ring hero-ring-1"></div>
            <div className="hero-circle">
              <span className="hero-drop">🩸</span>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="stats-section">
        <div className="container">
          <div className="stats-grid">
            <StatsCard
              icon="🩸"
              value={stats.totalDonors}
              label="Registered Donors"
              suffix="+"
            />
            <StatsCard
              icon="❤️"
              value={stats.livesSaved}
              label="Lives Saved"
              suffix="+"
            />
            <StatsCard
              icon="🏥"
              value={stats.registeredHospitals}
              label="Partner Hospitals"
              suffix="+"
            />
            <StatsCard
              icon="🚨"
              value={stats.totalRequests}
              label="Emergency Requests"
              suffix="+"
            />
          </div>
        </div>
      </section>

      {/* Why Donate Section */}
      <section className="bg-pattern">
        <div className="container">
          <SectionHeader
            tag="Why Donate?"
            title="Why Donate Blood?"
            subtitle="Your voluntary blood donation is the vital bridge between life and death for patients in critical need."
          />

          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">🩸</div>
              <h3>Save Multiple Lives</h3>
              <p>
                A single whole-blood donation can be separated into red cells, plasma, and platelets to help up to 3 different patients.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">❤️</div>
              <h3>Be a Community Hero</h3>
              <p>
                There is no substitute for human blood. Your selfless gesture empowers trauma victims, surgery patients, and mothers in childbirth.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">🏥</div>
              <h3>Maintain Hospital Stock</h3>
              <p>
                Healthcare centers require constant replenished blood supply to be ready 24/7 for unexpected disasters and critical operations.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">🚨</div>
              <h3>Emergency Rapid Response</h3>
              <p>
                BloodConnect matches urgent requirements with nearby donors instantly to cut waiting times when minutes mean everything.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Live Data Visualizations */}
      <section style={{ background: 'var(--gray-50)' }}>
        <div className="container">
          <SectionHeader
            tag="Live Data"
            title="Real-Time Network Impact"
            subtitle="Every drop is accounted for. Track our community distribution and current bank reserve units live."
          />

          <div className="charts-grid">
            <div className="chart-card">
              <h3>📊 Donors by Blood Group</h3>
              <div className="chart-container">
                {chartsData.donorsByBloodGroup?.length > 0 ? (
                  <Doughnut data={doughnutData} options={doughnutOptions} />
                ) : (
                  <div className="empty-state">
                    <p>Loading blood group metrics...</p>
                  </div>
                )}
              </div>
            </div>

            <div className="chart-card">
              <h3>🩸 Blood Stock Reserves</h3>
              <div className="chart-container">
                {chartsData.bloodStockLevels?.length > 0 ? (
                  <Bar data={barData} options={barOptions} />
                ) : (
                  <div className="empty-state">
                    <p>Loading inventory levels...</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Emergency CTA Banner */}
      <section className="cta-section">
        <div className="container">
          <h2>Someone, Somewhere, Needs Your Blood Today.</h2>
          <p>Be Someone's Reason to Live. Your Blood. Their Hope.</p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/register" className="btn btn-white btn-lg">
              Donate Now ❤️
            </Link>
            <Link to="/emergency" className="btn btn-outline btn-lg" style={{ borderColor: 'var(--white)', color: 'var(--white)' }}>
              🚨 Emergency Request
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
