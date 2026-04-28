import { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import API from '../api';
import {
  FiHome, FiUsers, FiMap, FiBox, FiShoppingCart,
  FiDollarSign, FiLayers, FiPackage, FiX, FiGlobe, FiBarChart2, FiDroplet,
  FiBell, FiTruck, FiFileText, FiShield
} from 'react-icons/fi';

const langOptions = [
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'hi', label: 'हिंदी', flag: '🇮🇳' },
  { code: 'mr', label: 'मराठी', flag: '🇮🇳' },
];

export default function Sidebar({ isOpen, onClose }) {
  const { t, lang, setLang } = useLanguage();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    API.get('/notifications/unread-count')
      .then(res => setUnreadCount(res.data.count))
      .catch(() => {});
    const interval = setInterval(() => {
      API.get('/notifications/unread-count')
        .then(res => setUnreadCount(res.data.count))
        .catch(() => {});
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const navItems = [
    { section: t('overview') },
    { path: '/dashboard', label: t('dashboard'), icon: <FiHome /> },
    { section: t('farming') },
    { path: '/farmers', label: t('farmers'), icon: <FiUsers /> },
    { path: '/land', label: t('landRecords'), icon: <FiMap /> },
    { path: '/crops', label: t('crops'), icon: <FiLayers /> },
    { path: '/harvests', label: t('harvests'), icon: <FiPackage /> },
    { path: '/activities', label: t('activities'), icon: <FiDroplet /> },
    { path: '/fertilizers', label: t('fertilizers') || 'Fertilizers', icon: <span>🧪</span> },
    { path: '/soil-reports', label: t('soilReports') || 'Soil Reports', icon: <FiFileText /> },
    { path: '/agri-guide', label: t('agriGuide') || 'Agri Guide', icon: <FiShield /> },
    { section: t('vendor') },
    { path: '/products', label: t('products'), icon: <FiBox /> },
    { path: '/sales', label: t('sales'), icon: <FiShoppingCart /> },
    { path: '/expenses', label: t('expenses'), icon: <FiDollarSign /> },
    { path: '/market', label: t('market') || 'Market', icon: <FiTruck /> },
    { section: t('analytics') || 'ANALYTICS' },
    { path: '/reports', label: t('reports') || 'Reports', icon: <FiBarChart2 /> },
    { path: '/notifications', label: t('notifications') || 'Notifications', icon: <FiBell />, badge: unreadCount },
  ];

  return (
    <aside className={`sidebar ${isOpen ? 'sidebar-open' : ''}`}>
      <div className="sidebar-brand">
        <div className="sidebar-brand-row">
          <h1>
            <span className="brand-icon">🌾</span>
            <span>{t('appName')}</span>
          </h1>
          <button className="sidebar-close-btn" onClick={onClose} aria-label="Close menu">
            <FiX />
          </button>
        </div>
        <p>{t('appSubtitle')}</p>
      </div>

      {/* Language Selector */}
      <div className="lang-selector">
        <div className="lang-selector-label">
          <FiGlobe />
          <span>{t('language')}</span>
        </div>
        <div className="lang-buttons">
          {langOptions.map(opt => (
            <button
              key={opt.code}
              className={`lang-btn ${lang === opt.code ? 'lang-btn-active' : ''}`}
              onClick={() => setLang(opt.code)}
            >
              <span className="lang-flag">{opt.flag}</span>
              <span>{opt.label}</span>
            </button>
          ))}
        </div>
      </div>

      <nav className="sidebar-nav">
        {navItems.map((item, i) =>
          item.section ? (
            <div key={i} className="nav-section-title">{item.section}</div>
          ) : (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/dashboard'}
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              onClick={onClose}
            >
              <span className="nav-icon">{item.icon}</span>
              <span>{item.label}</span>
              {item.badge > 0 && <span className="nav-badge">{item.badge}</span>}
            </NavLink>
          )
        )}
      </nav>
    </aside>
  );
}
