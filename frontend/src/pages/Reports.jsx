import { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import API from '../api';

const TABS = [
  { key: 'farmer', label: '👨‍🌾 Farmer Summary', endpoint: '/reports/farmer-summary' },
  { key: 'monthly', label: '📅 Monthly Sales', endpoint: '/reports/monthly-sales' },
  { key: 'product', label: '📦 Revenue by Product', endpoint: '/reports/revenue-by-product' },
  { key: 'land', label: '🗺️ Expense by Land', endpoint: '/reports/expense-by-land' },
  { key: 'audit', label: '📋 Audit Log', endpoint: '/audit-log' },
];

export default function Reports() {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState('farmer');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const tab = TABS.find(t => t.key === activeTab);
    API.get(tab.endpoint)
      .then(res => setData(res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, [activeTab]);

  const renderTable = () => {
    if (loading) return <div className="loading"><div className="spinner"></div><span>Loading...</span></div>;
    if (!data.length) return <div className="empty-state"><p>No data available</p></div>;

    switch (activeTab) {
      case 'farmer':
        return (
          <table className="data-table">
            <thead><tr><th>Farmer ID</th><th>Name</th><th>Location</th><th>Lands</th><th>Total Expense</th><th>Harvest Profit</th></tr></thead>
            <tbody>
              {data.map(r => (
                <tr key={r.farmer_id}>
                  <td>{r.farmer_id}</td><td>{r.farmer_name}</td><td>{r.location || '—'}</td>
                  <td>{r.land_count}</td>
                  <td className="amount amount-negative">₹{r.total_expense.toLocaleString()}</td>
                  <td className="amount amount-positive">₹{r.total_harvest_profit.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        );
      case 'monthly':
        return (
          <table className="data-table">
            <thead><tr><th>Month</th><th>Total Sales</th><th>Quantity (kg)</th><th>Revenue</th></tr></thead>
            <tbody>
              {data.map(r => (
                <tr key={r.sale_month}>
                  <td>{r.sale_month}</td><td>{r.total_sales}</td>
                  <td>{r.total_quantity_kg} kg</td>
                  <td className="amount amount-positive">₹{r.total_revenue.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        );
      case 'product':
        return (
          <table className="data-table">
            <thead><tr><th>Product</th><th>Sales Count</th><th>Quantity (kg)</th><th>Revenue</th></tr></thead>
            <tbody>
              {data.map(r => (
                <tr key={r.product_id}>
                  <td>{r.product_name}</td><td>{r.total_sales}</td>
                  <td>{r.total_quantity_kg} kg</td>
                  <td className="amount amount-positive">₹{r.total_revenue.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        );
      case 'land':
        return (
          <table className="data-table">
            <thead><tr><th>Land</th><th>Area</th><th>Location</th><th>Farmer</th><th>Expenses</th><th>Total</th></tr></thead>
            <tbody>
              {data.map(r => (
                <tr key={r.land_id}>
                  <td>{r.land_id}</td><td>{r.area}</td><td>{r.location || '—'}</td>
                  <td>{r.farmer_name}</td><td>{r.expense_count}</td>
                  <td className="amount amount-negative">₹{r.total_expense.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        );
      case 'audit':
        return (
          <table className="data-table">
            <thead><tr><th>ID</th><th>Table</th><th>Action</th><th>Record</th><th>Details</th><th>Time</th></tr></thead>
            <tbody>
              {data.map(r => (
                <tr key={r.log_id}>
                  <td>{r.log_id}</td><td>{r.table_name}</td>
                  <td><span className="audit-badge">{r.action}</span></td>
                  <td>{r.record_id}</td><td>{r.details}</td><td>{r.log_time}</td>
                </tr>
              ))}
            </tbody>
          </table>
        );
      default: return null;
    }
  };

  return (
    <>
      <div className="page-header">
        <h2>📊 {t('reports') || 'Reports & Analytics'}</h2>
        <p>{t('reportsDesc') || 'View reports powered by stored procedures and audit logs from triggers'}</p>
      </div>

      <div className="report-tabs">
        {TABS.map(tab => (
          <button
            key={tab.key}
            className={`report-tab ${activeTab === tab.key ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="glass-card">
        <div className="glass-card-header">
          <h3>{TABS.find(t => t.key === activeTab)?.label}</h3>
          <span className="badge badge-default" style={{ fontSize: '0.75rem' }}>
            {activeTab === 'audit' ? 'Trigger Logs' : 'Stored Procedure'}
          </span>
        </div>
        <div className="glass-card-body">
          <div className="data-table-wrapper">
            {renderTable()}
          </div>
        </div>
      </div>
    </>
  );
}
