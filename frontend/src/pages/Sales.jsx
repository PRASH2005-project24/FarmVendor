import { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import API from '../api';
import { FiPlus, FiTrash2 } from 'react-icons/fi';

export default function Sales() {
  const { t } = useLanguage();
  const [sales, setSales] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ sale_date: '', product_id: '', quantity: '', price: '' });

  const fetchData = () => {
    Promise.all([API.get('/sales'), API.get('/products')])
      .then(([salesRes, prodRes]) => { setSales(salesRes.data); setProducts(prodRes.data); })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.sale_date || !form.product_id || !form.quantity || !form.price) return;
    API.post('/sales', form)
      .then(() => { setForm({ sale_date: '', product_id: '', quantity: '', price: '' }); fetchData(); })
      .catch(err => alert('Error: ' + err.message));
  };

  const handleDelete = (id) => {
    if (!confirm(t('confirmDeleteSale'))) return;
    API.delete(`/sales/${id}`)
      .then(() => fetchData())
      .catch(err => alert('Error: ' + err.message));
  };

  const totalRevenue = sales.reduce((sum, s) => sum + (s.price * s.quantity), 0);

  return (
    <>
      <div className="page-header">
        <h2>🛒 {t('sales')}</h2>
        <p>{t('recordViewSales')}</p>
      </div>

      <div className="glass-card section-gap">
        <div className="glass-card-header"><h3>{t('recordNewSale')}</h3></div>
        <div className="glass-card-body">
          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <div className="form-group">
                <label>{t('date')} *</label>
                <input type="date" value={form.sale_date} onChange={e => setForm({ ...form, sale_date: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>{t('product')} *</label>
                <select value={form.product_id} onChange={e => setForm({ ...form, product_id: e.target.value })} required>
                  <option value="">{t('selectProduct')}</option>
                  {products.map(p => <option key={p.product_id} value={p.product_id}>{p.product_name} ({p.product_id})</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>{t('quantityKg')} *</label>
                <input type="number" step="0.01" placeholder="e.g. 5" value={form.quantity} onChange={e => setForm({ ...form, quantity: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>{t('pricePerUnit')} *</label>
                <input type="number" step="0.01" placeholder="e.g. 100" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} required />
              </div>
            </div>
            <button type="submit" className="btn btn-primary"><FiPlus /> {t('recordSale')}</button>
          </form>
        </div>
      </div>

      <div className="glass-card">
        <div className="glass-card-header">
          <h3>{t('allSales')} ({sales.length})</h3>
          <span className="amount amount-positive" style={{ fontSize: '1rem' }}>{t('totalRevenue')}: ₹{totalRevenue.toLocaleString()}</span>
        </div>
        <div className="glass-card-body">
          {loading ? (
            <div className="loading"><div className="spinner"></div><span>{t('loading')}</span></div>
          ) : sales.length === 0 ? (
            <div className="empty-state"><div className="empty-icon">🛒</div><p>{t('noSalesYet')}</p></div>
          ) : (
            <>
              <div className="data-table-wrapper">
                <table className="data-table">
                  <thead><tr><th>{t('saleId')}</th><th>{t('date')}</th><th>{t('product')}</th><th>{t('quantity')}</th><th>{t('price')}</th><th>{t('total')}</th><th>{t('action')}</th></tr></thead>
                  <tbody>
                    {sales.map(s => (
                      <tr key={s.sale_id}>
                        <td>{s.sale_id}</td><td>{s.sale_date}</td><td>{s.product_name || s.product_id}</td>
                        <td>{s.quantity}</td><td className="amount">₹{s.price}</td>
                        <td className="amount amount-positive">₹{(s.price * s.quantity).toLocaleString()}</td>
                        <td><button className="btn btn-danger" onClick={() => handleDelete(s.sale_id)}><FiTrash2 /> {t('delete')}</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mobile-cards">
                {sales.map(s => (
                  <div key={s.sale_id} className="mobile-card">
                    <div className="mobile-card-row"><span className="mobile-card-label">{t('product')}</span><span className="mobile-card-value">{s.product_name || s.product_id}</span></div>
                    <div className="mobile-card-row"><span className="mobile-card-label">{t('date')}</span><span className="mobile-card-value">{s.sale_date}</span></div>
                    <div className="mobile-card-row"><span className="mobile-card-label">{t('quantity')}</span><span className="mobile-card-value">{s.quantity} kg</span></div>
                    <div className="mobile-card-row"><span className="mobile-card-label">{t('price')}</span><span className="mobile-card-value">₹{s.price}</span></div>
                    <div className="mobile-card-row"><span className="mobile-card-label">{t('total')}</span><span className="mobile-card-value amount amount-positive">₹{(s.price * s.quantity).toLocaleString()}</span></div>
                    <div className="mobile-card-actions"><button className="btn btn-danger" onClick={() => handleDelete(s.sale_id)}><FiTrash2 /> {t('delete')}</button></div>
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
