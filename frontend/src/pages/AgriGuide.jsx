import { useState, useEffect } from 'react';
import API from '../api';
import { useLanguage } from '../context/LanguageContext';
import {
  FiShield, FiTrendingUp, FiChevronDown, FiAlertCircle, FiCheckCircle
} from 'react-icons/fi';
import { GiWheat } from 'react-icons/gi';

export default function AgriGuide() {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState('disease');
  const [diseaseGuide, setDiseaseGuide] = useState({});
  const [processGuide, setProcessGuide] = useState({});
  const [selectedCrop, setSelectedCrop] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    Promise.all([
      API.get('/guide/disease'),
      API.get('/guide/process'),
    ])
      .then(([dRes, pRes]) => {
        setDiseaseGuide(dRes.data);
        setProcessGuide(pRes.data);
        const crops = Object.keys(dRes.data);
        if (crops.length > 0) setSelectedCrop(crops[0]);
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner" />
        <span>{t('loadingGuide') || 'Loading Agri-Guide...'}</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="empty-state">
        <div className="empty-icon"><FiAlertCircle /></div>
        <p style={{ color: 'var(--danger)' }}>Failed to load guide: {error}</p>
      </div>
    );
  }

  const crops = Object.keys(diseaseGuide);
  const currentDiseases = diseaseGuide[selectedCrop] || {};
  const currentProcess = processGuide[selectedCrop] || [];
  const diseaseKeys = Object.keys(currentDiseases);

  return (
    <>
      {/* ── Page Header ── */}
      <div className="page-header">
        <h2>{t('agriGuideTitle') || '🌾 Smart Agri-Guide'}</h2>
        <p>{t('agriGuideDesc') || 'AI-powered disease control guidance and high-yield farming procedures.'}</p>
      </div>

      {/* ── Tab Switcher ── */}
      <div className="agriguide-tabs">
        <button
          className={`agriguide-tab-btn ${activeTab === 'disease' ? 'agriguide-tab-active' : ''}`}
          onClick={() => setActiveTab('disease')}
        >
          <FiShield className="agriguide-tab-icon" />
          <span>{t('pesticidesTab') || 'Pesticide & Disease Guide'}</span>
        </button>
        <button
          className={`agriguide-tab-btn ${activeTab === 'process' ? 'agriguide-tab-active' : ''}`}
          onClick={() => setActiveTab('process')}
        >
          <FiTrendingUp className="agriguide-tab-icon" />
          <span>{t('yieldTab') || 'Highest Yield Process'}</span>
        </button>
      </div>

      {/* ── Crop Selector ── */}
      <div className="glass-card agriguide-crop-selector">
        <div className="agriguide-crop-inner">
          <div className="agriguide-crop-icon">
            <GiWheat size={24} />
          </div>
          <div className="agriguide-crop-field">
            <label className="agriguide-crop-label">
              {t('selectCropLabel') || 'Select Crop'}
            </label>
            <div className="agriguide-select-wrap">
              <select
                className="agriguide-select"
                value={selectedCrop}
                onChange={e => setSelectedCrop(e.target.value)}
              >
                {crops.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <FiChevronDown className="agriguide-select-arrow" />
            </div>
          </div>
          <div className="agriguide-crop-badge">
            {activeTab === 'disease'
              ? `${diseaseKeys.length} ${diseaseKeys.length === 1 ? 'Disease' : 'Diseases'}`
              : `${currentProcess.length} Steps`}
          </div>
        </div>
      </div>

      {/* ── Disease / Pesticide Guide ── */}
      {activeTab === 'disease' && (
        <div className="agriguide-disease-grid">
          {diseaseKeys.length === 0 ? (
            <div className="empty-state" style={{ gridColumn: '1 / -1' }}>
              <div className="empty-icon">🦠</div>
              <p>{t('noDisease') || 'No disease data available for this crop.'}</p>
            </div>
          ) : (
            diseaseKeys.map((disease, idx) => {
              const remedies = currentDiseases[disease];
              return (
                <div
                  key={disease}
                  className="glass-card agriguide-disease-card"
                  style={{ animationDelay: `${idx * 0.07}s` }}
                >
                  {/* Card top accent bar */}
                  <div className="agriguide-card-accent" />

                  {/* Disease title */}
                  <div className="agriguide-disease-header">
                    <span className="agriguide-disease-emoji">🦠</span>
                    <h3 className="agriguide-disease-name">{disease}</h3>
                  </div>

                  {/* Divider */}
                  <div className="agriguide-divider" />

                  {/* Chemical Remedy */}
                  <div className="agriguide-remedy">
                    <div className="agriguide-remedy-label agriguide-remedy-chemical">
                      {t('chemicalRemedy') || '🧪 Chemical Remedy'}
                    </div>
                    <p className="agriguide-remedy-text agriguide-remedy-text-chemical">
                      {remedies.chemical}
                    </p>
                  </div>

                  {/* Organic Remedy */}
                  <div className="agriguide-remedy">
                    <div className="agriguide-remedy-label agriguide-remedy-organic">
                      {t('organicRemedy') || '🌿 Organic Remedy'}
                    </div>
                    <p className="agriguide-remedy-text agriguide-remedy-text-organic">
                      {remedies.organic}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ── SOP / Yield Process ── */}
      {activeTab === 'process' && (
        <div className="glass-card agriguide-sop-card">
          <div className="glass-card-header">
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <FiTrendingUp style={{ color: 'var(--primary-light)' }} />
              {t('sopTitle') || 'Standard Operating Procedure (SOP)'}
              <span style={{
                marginLeft: '8px',
                fontSize: '0.72rem',
                fontWeight: 600,
                padding: '3px 10px',
                background: 'rgba(34,197,94,0.12)',
                border: '1px solid var(--border)',
                borderRadius: '20px',
                color: 'var(--primary-light)',
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
              }}>
                {selectedCrop}
              </span>
            </h3>
          </div>
          <div className="glass-card-body">
            {currentProcess.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">📋</div>
                <p>{t('noSop') || 'No SOP timeline available for this crop.'}</p>
              </div>
            ) : (
              <div className="agriguide-timeline">
                {currentProcess.map((step, idx) => (
                  <div
                    key={idx}
                    className="agriguide-timeline-item"
                    style={{ animationDelay: `${idx * 0.08}s` }}
                  >
                    {/* Step number bubble */}
                    <div className="agriguide-step-bubble">
                      <FiCheckCircle size={13} />
                    </div>
                    {/* Connector line */}
                    {idx < currentProcess.length - 1 && (
                      <div className="agriguide-step-line" />
                    )}
                    {/* Content */}
                    <div className="agriguide-step-content">
                      <div className="agriguide-step-badge">
                        {t('stepLabel') || 'Step'} {step.step}
                      </div>
                      <h4 className="agriguide-step-title">{step.title}</h4>
                      <p className="agriguide-step-desc">{step.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
