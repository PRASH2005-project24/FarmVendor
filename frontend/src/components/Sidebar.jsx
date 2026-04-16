import { NavLink } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import {
  FiHome, FiUsers, FiMap, FiBox, FiShoppingCart,
  FiDollarSign, FiLayers, FiPackage, FiX, FiGlobe, FiBarChart2
} from 'react-icons/fi';

const langOptions = [
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'hi', label: 'हिंदी', flag: '🇮🇳' },
  { code: 'mr', label: 'मराठी', flag: '🇮🇳' },
];

export default function Sidebar({ isOpen, onClose }) {
  const { t, lang, setLang } = useLanguage();

  const navItems = [
    { section: t('overview') },
    { path: '/', label: t('dashboard'), icon: <FiHome /> },
    { section: t('farming') },
    { path: '/farmers', label: t('farmers'), icon: <FiUsers /> },
    { path: '/land', label: t('landRecords'), icon: <FiMap /> },
    { path: '/crops', label: t('crops'), icon: <FiLayers /> },
    { path: '/harvests', label: t('harvests'), icon: <FiPackage /> },
    { section: t('vendor') },
    { path: '/products', label: t('products'), icon: <FiBox /> },
    { path: '/sales', label: t('sales'), icon: <FiShoppingCart /> },
    { path: '/expenses', label: t('expenses'), icon: <FiDollarSign /> },
    { section: t('analytics') || 'ANALYTICS' },
    { path: '/reports', label: t('reports') || 'Reports', icon: <FiBarChart2 /> },
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
              end={item.path === '/'}
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              onClick={onClose}
            >
              <span className="nav-icon">{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          )
        )}
      </nav>
    </aside>
  );
}
