import { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import API from '../api';
import { FiPlus, FiTrash2, FiEdit2 } from 'react-icons/fi';

export default function Sales() {
  const { t } = useLanguage();
  const [sales, setSales] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ sale_date: '', product_id: '', quantity_Kg: '', price: '' });
  const [sortBy, setSortBy] = useState('created_at');
  const [order, setOrder] = useState('desc');
  const [filterProduct, setFilterProduct] = useState('');
  const [editItem, setEditItem] = useState(null);

  const fetchData = () => {
    const params = new URLSearchParams({ sort_by: sortBy, order });
    if (filterProduct) params.append('product_id', filterProduct);
    Promise.all([API.get(`/sales?${params}`), API.get('/products')])
      .then(([salesRes, prodRes]) => { setSales(salesRes.data); setProducts(prodRes.data); })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, [sortBy, order, filterProduct]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.sale_date || !form.product_id || !form.quantity_Kg || !form.price) return;
    API.post('/sales', form)
      .then(() => { setForm({ sale_date: '', product_id: '', quantity_Kg: '', price: '' }); fetchData(); })
      .catch(err => alert('Error: ' + err.message));
  };

  const handleDelete = (id) => {
    if (!confirm(t('confirmDeleteSale'))) return;
    API.delete(`/sales/${id}`).then(() => fetchData()).catch(err => alert('Error: ' + err.message));
  };

  const handleUpdate = (e) => {
    e.preventDefault();
    API.put(`/sales/${editItem.sale_id}`, editItem)
      .then(() => { setEditItem(null); fetchData(); })
      .catch(err => alert('Error: ' + err.message));
  };

  const totalRevenue = sales.reduce((sum, s) => sum + (s.price * s.quantity_Kg), 0);

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
                <input type="number" step="0.01" placeholder="e.g. 5" value={form.quantity_Kg} onChange={e => setForm({ ...form, quantity_Kg: e.target.value })} required />
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
        <div className="filter-toolbar">
          <div className="filter-group">
            <label>Sort By</label>
            <select value={sortBy} onChange={e => setSortBy(e.target.value)}>
              <option value="created_at">Date Added</option>
              <option value="sale_date">Sale Date</option>
              <option value="price">Price</option>
              <option value="quantity_Kg">Quantity</option>
            </select>
          </div>
          <div className="filter-group">
            <label>Order</label>
            <select value={order} onChange={e => setOrder(e.target.value)}>
              <option value="asc">Ascending</option>
              <option value="desc">Descending</option>
            </select>
          </div>
          <div className="filter-group">
            <label>Filter Product</label>
            <select value={filterProduct} onChange={e => setFilterProduct(e.target.value)}>
              <option value="">All</option>
              {products.map(p => <option key={p.product_id} value={p.product_id}>{p.product_name}</option>)}
            </select>
          </div>
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
                        <td>{s.quantity_Kg} kg</td><td className="amount">₹{s.price}</td>
                        <td className="amount amount-positive">₹{(s.price * s.quantity_Kg).toLocaleString()}</td>
                        <td>
                          <div className="action-btns">
                            <button className="btn btn-edit btn-sm" onClick={() => setEditItem({...s})}><FiEdit2 /> Edit</button>
                            <button className="btn btn-danger btn-sm" onClick={() => handleDelete(s.sale_id)}><FiTrash2 /></button>
                          </div>
                        </td>
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
                    <div className="mobile-card-row"><span className="mobile-card-label">{t('quantity')}</span><span className="mobile-card-value">{s.quantity_Kg} kg</span></div>
                    <div className="mobile-card-row"><span className="mobile-card-label">{t('price')}</span><span className="mobile-card-value">₹{s.price}</span></div>
                    <div className="mobile-card-row"><span className="mobile-card-label">{t('total')}</span><span className="mobile-card-value amount amount-positive">₹{(s.price * s.quantity_Kg).toLocaleString()}</span></div>
                    <div className="mobile-card-actions">
                      <div className="action-btns">
                        <button className="btn btn-edit btn-sm" onClick={() => setEditItem({...s})}><FiEdit2 /> Edit</button>
                        <button className="btn btn-danger btn-sm" onClick={() => handleDelete(s.sale_id)}><FiTrash2 /></button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {editItem && (
        <div className="modal-overlay" onClick={() => setEditItem(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3>Edit Sale — {editItem.sale_id}</h3>
            <form onSubmit={handleUpdate}>
              <div className="form-grid">
                <div className="form-group">
                  <label>{t('date')} *</label>
                  <input type="date" value={editItem.sale_date} onChange={e => setEditItem({...editItem, sale_date: e.target.value})} required />
                </div>
                <div className="form-group">
                  <label>{t('product')} *</label>
                  <select value={editItem.product_id} onChange={e => setEditItem({...editItem, product_id: e.target.value})} required>
                    {products.map(p => <option key={p.product_id} value={p.product_id}>{p.product_name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>{t('quantityKg')} *</label>
                  <input type="number" step="0.01" value={editItem.quantity_Kg} onChange={e => setEditItem({...editItem, quantity_Kg: e.target.value})} required />
                </div>
                <div className="form-group">
                  <label>{t('pricePerUnit')} *</label>
                  <input type="number" step="0.01" value={editItem.price} onChange={e => setEditItem({...editItem, price: e.target.value})} required />
                </div>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setEditItem(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
