import { useState } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import LandingPage from './pages/LandingPage';
import Dashboard from './pages/Dashboard';
import Farmers from './pages/Farmers';
import Land from './pages/Land';
import Crops from './pages/Crops';
import Harvests from './pages/Harvests';
import Products from './pages/Products';
import Sales from './pages/Sales';
import Expenses from './pages/Expenses';
import Activities from './pages/Activities';
import Reports from './pages/Reports';
import Fertilizers from './pages/Fertilizers';
import Market from './pages/Market';
import Notifications from './pages/Notifications';
import SoilReports from './pages/SoilReports';
import AgriGuide from './pages/AgriGuide';
import Toast from './components/Toast';

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  const closeSidebar = () => setSidebarOpen(false);

  const isLanding = location.pathname === '/';

  // Landing page is full-screen, no sidebar
  if (isLanding) {
    return <LandingPage />;
  }

  return (
    <div className="app-layout">
      {/* Mobile overlay */}
      {sidebarOpen && <div className="sidebar-overlay" onClick={closeSidebar} />}

      <Sidebar isOpen={sidebarOpen} onClose={closeSidebar} />

      <main className="main-content">
        {/* Mobile hamburger */}
        <button
          className="mobile-menu-btn"
          onClick={() => setSidebarOpen(true)}
          aria-label="Open menu"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>

        <Routes>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/farmers" element={<Farmers />} />
          <Route path="/land" element={<Land />} />
          <Route path="/crops" element={<Crops />} />
          <Route path="/harvests" element={<Harvests />} />
          <Route path="/activities" element={<Activities />} />
          <Route path="/products" element={<Products />} />
          <Route path="/sales" element={<Sales />} />
          <Route path="/expenses" element={<Expenses />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/fertilizers" element={<Fertilizers />} />
          <Route path="/market" element={<Market />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/soil-reports" element={<SoilReports />} />
          <Route path="/agri-guide" element={<AgriGuide />} />
        </Routes>
      </main>

      {/* Global Toast Notification System */}
      <Toast />
    </div>
  );
}

export default App;
