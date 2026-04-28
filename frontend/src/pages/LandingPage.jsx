import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function LandingPage() {
  const navigate = useNavigate();
  const [leaving, setLeaving] = useState(false);

  const handleProceed = () => {
    setLeaving(true);
    setTimeout(() => navigate('/dashboard'), 700);
  };

  return (
    <div className={`landing-page ${leaving ? 'landing-leave' : ''}`}>
      {/* Dot grid background */}
      <div className="landing-grid" />

      {/* Floating orbs */}
      <div className="landing-orb landing-orb-1" />
      <div className="landing-orb landing-orb-2" />
      <div className="landing-orb landing-orb-3" />

      {/* Animated particles */}
      <div className="landing-particles" />

      {/* Main content */}
      <div className="landing-container">
        {/* Left content */}
        <div className="landing-content">
          <div className="landing-badge">
            <span className="landing-badge-dot" />
            🌾 Farm Management System
          </div>

          <h1 className="landing-title">
            <span className="landing-title-icon">🌿</span>
            Farm<span className="landing-title-accent">Vendor</span>
          </h1>

          <h2 className="landing-subtitle">
            Farmer Vendor Management System
          </h2>

          <p className="landing-description">
            A comprehensive data-driven platform for managing farming operations,
            tracking expenses, monitoring chemical usage, and vendor sales — built
            with real-world field visit data from farmers' records.
          </p>

          <div className="landing-features">
            <div className="landing-chip">
              <span className="landing-chip-icon">📊</span>
              Real-time Analytics
            </div>
            <div className="landing-chip">
              <span className="landing-chip-icon">🧪</span>
              Chemical Tracking
            </div>
            <div className="landing-chip">
              <span className="landing-chip-icon">💰</span>
              Expense Management
            </div>
          </div>

          <div className="landing-stats">
            <div className="landing-stat">
              <span className="landing-stat-value">9+</span>
              <span className="landing-stat-label">Modules</span>
            </div>
            <div className="landing-stat-divider" />
            <div className="landing-stat">
              <span className="landing-stat-value">3</span>
              <span className="landing-stat-label">Languages</span>
            </div>
            <div className="landing-stat-divider" />
            <div className="landing-stat">
              <span className="landing-stat-value">100%</span>
              <span className="landing-stat-label">Real Data</span>
            </div>
          </div>

          <button className="landing-cta" onClick={handleProceed}>
            <span>Proceed to Dashboard</span>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </button>

          <div className="landing-tech-stack">
            <span className="landing-tech-label">Built with</span>
            <div className="landing-tech-pills">
              <span className="landing-tech-pill">React</span>
              <span className="landing-tech-pill">Flask</span>
              <span className="landing-tech-pill">MySQL</span>
            </div>
          </div>
        </div>

        {/* Right decorative section */}
        <div className="landing-visual">
          <div className="landing-visual-card landing-visual-card-1">
            <div className="landing-visual-card-icon">👨‍🌾</div>
            <div className="landing-visual-card-text">
              <span className="landing-visual-card-title">Farmers</span>
              <span className="landing-visual-card-sub">Profile & Records</span>
            </div>
          </div>

          <div className="landing-visual-card landing-visual-card-2">
            <div className="landing-visual-card-icon">🌾</div>
            <div className="landing-visual-card-text">
              <span className="landing-visual-card-title">Crops</span>
              <span className="landing-visual-card-sub">Kharif & Rabi</span>
            </div>
          </div>

          <div className="landing-visual-card landing-visual-card-3">
            <div className="landing-visual-card-icon">📈</div>
            <div className="landing-visual-card-text">
              <span className="landing-visual-card-title">Revenue</span>
              <span className="landing-visual-card-sub">₹2,885 Total</span>
            </div>
          </div>

          <div className="landing-visual-card landing-visual-card-4">
            <div className="landing-visual-card-icon">🧪</div>
            <div className="landing-visual-card-text">
              <span className="landing-visual-card-title">Activities</span>
              <span className="landing-visual-card-sub">Chemical Usage</span>
            </div>
          </div>

          {/* Central plant illustration */}
          <div className="landing-plant">
            <div className="landing-plant-stem" />
            <div className="landing-plant-leaf landing-plant-leaf-1" />
            <div className="landing-plant-leaf landing-plant-leaf-2" />
            <div className="landing-plant-leaf landing-plant-leaf-3" />
            <div className="landing-plant-glow" />
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="landing-footer">
        <span>© 2026 FarmVendor — DBMS Mini Project</span>
        <span className="landing-footer-dot">•</span>
        <span>Powered by Team(PRASHEEK,OM,SIMRAN,BHAVESH)
        </span>
      </div>
    </div>
  );
}
