import { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import API from '../api';

export default function Dashboard() {
  const { t } = useLanguage();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    API.get('/dashboard')
      .then(res => setStats(res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <span>{t('loadingDashboard')}</span>
      </div>
    );
  }

  if (!stats) {
    return <div className="empty-state"><p>{t('failedLoad')}</p></div>;
  }

  const cards = [
    { label: t('totalFarmers'), value: stats.totalFarmers, emoji: '👨‍🌾' },
    { label: t('landRecordsLabel'), value: stats.totalLands, emoji: '🗺️' },
    { label: t('cropsLabel'), value: stats.totalCrops, emoji: '🌱' },
    { label: t('activitiesLabel'), value: stats.totalActivities, emoji: '🧪' },
    { label: t('productsLabel'), value: stats.totalProducts, emoji: '📦' },
    { label: t('totalSales'), value: stats.totalSales, emoji: '🛒' },
    { label: t('revenue'), value: `₹${stats.totalRevenue.toLocaleString()}`, emoji: '💰', className: 'revenue' },
    { label: t('expensesLabel'), value: `₹${stats.totalExpenses.toLocaleString()}`, emoji: '💸', className: 'expense' },
    { label: t('netProfit'), value: `₹${stats.netProfit.toLocaleString()}`, emoji: '📊', className: 'profit' },
  ];

  return (
    <>
      <div className="page-header">
        <h2>{t('dashboardTitle')}</h2>
        <p>{t('dashboardDesc')}</p>
      </div>

      <div className="stats-grid">
        {cards.map((card, i) => (
          <div key={i} className={`stat-card ${card.className || ''}`}>
            <span className="stat-icon">{card.emoji}</span>
            <div className="stat-label">{card.label}</div>
            <div className="stat-value">{card.value}</div>
          </div>
        ))}
      </div>

      <div className="glass-card">
        <div className="glass-card-header">
          <h3>{t('recentSales')}</h3>
        </div>
        <div className="glass-card-body">
          {stats.recentSales.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🛒</div>
              <p>{t('noSalesYet')}</p>
            </div>
          ) : (
            <>
              <div className="data-table-wrapper">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>{t('saleId')}</th>
                      <th>{t('date')}</th>
                      <th>{t('product')}</th>
                      <th>{t('qty')}</th>
                      <th>{t('price')}</th>
                      <th>{t('total')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.recentSales.map(sale => (
                      <tr key={sale.sale_id}>
                        <td>{sale.sale_id}</td>
                        <td>{sale.sale_date}</td>
                        <td>{sale.product_name}</td>
                        <td>{sale.quantity_Kg}</td>
                        <td className="amount">₹{sale.price}</td>
                        <td className="amount amount-positive">₹{sale.total}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {/* Mobile cards */}
              <div className="mobile-cards">
                {stats.recentSales.map(sale => (
                  <div key={sale.sale_id} className="mobile-card">
                    <div className="mobile-card-row">
                      <span className="mobile-card-label">{t('product')}</span>
                      <span className="mobile-card-value">{sale.product_name}</span>
                    </div>
                    <div className="mobile-card-row">
                      <span className="mobile-card-label">{t('date')}</span>
                      <span className="mobile-card-value">{sale.sale_date}</span>
                    </div>
                    <div className="mobile-card-row">
                      <span className="mobile-card-label">{t('qty')}</span>
                      <span className="mobile-card-value">{sale.quantity_Kg}</span>
                    </div>
                    <div className="mobile-card-row">
                      <span className="mobile-card-label">{t('total')}</span>
                      <span className="mobile-card-value amount amount-positive">₹{sale.total}</span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
