import { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import API from '../api';
import { FiPlus, FiTrash2, FiEdit2 } from 'react-icons/fi';

export default function Products() {
  const { t } = useLanguage();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ product_name: '' });
  const [sortBy, setSortBy] = useState('created_at');
  const [order, setOrder] = useState('desc');
  const [search, setSearch] = useState('');
  const [editItem, setEditItem] = useState(null);

  const fetchProducts = () => {
    const params = new URLSearchParams({ sort_by: sortBy, order });
    if (search) params.append('search', search);
    API.get(`/products?${params}`)
      .then(res => setProducts(res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchProducts(); }, [sortBy, order, search]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.product_name.trim()) return;
    API.post('/products', form)
      .then(() => { setForm({ product_name: '' }); fetchProducts(); })
      .catch(err => alert('Error: ' + err.message));
  };

  const handleDelete = (id) => {
    if (!confirm(t('confirmDeleteProduct'))) return;
    API.delete(`/products/${id}`).then(() => fetchProducts()).catch(err => alert('Error: ' + err.message));
  };

  const handleUpdate = (e) => {
    e.preventDefault();
    API.put(`/products/${editItem.product_id}`, editItem)
      .then(() => { setEditItem(null); fetchProducts(); })
      .catch(err => alert('Error: ' + err.message));
  };

  return (
    <>
      <div className="page-header">
        <h2>📦 {t('products')}</h2>
        <p>{t('manageProducts')}</p>
      </div>

      <div className="glass-card section-gap">
        <div className="glass-card-header"><h3>{t('addNewProduct')}</h3></div>
        <div className="glass-card-body">
          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <div className="form-group">
                <label>{t('productName')} *</label>
                <input type="text" placeholder="e.g. Tomato" value={form.product_name} onChange={e => setForm({ ...form, product_name: e.target.value })} required />
              </div>
            </div>
            <button type="submit" className="btn btn-primary"><FiPlus /> {t('addProduct')}</button>
          </form>
        </div>
      </div>

      <div className="glass-card">
        <div className="glass-card-header"><h3>{t('allProducts')} ({products.length})</h3></div>
        <div className="filter-toolbar">
          <div className="filter-group">
            <label>Sort By</label>
            <select value={sortBy} onChange={e => setSortBy(e.target.value)}>
              <option value="created_at">Date Added</option>
              <option value="product_name">Name</option>
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
            <label>Search</label>
            <input type="text" placeholder="Search product..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>
        <div className="glass-card-body">
          {loading ? (
            <div className="loading"><div className="spinner"></div><span>{t('loading')}</span></div>
          ) : products.length === 0 ? (
            <div className="empty-state"><div className="empty-icon">📦</div><p>{t('noProductsYet')}</p></div>
          ) : (
            <>
              <div className="data-table-wrapper">
                <table className="data-table">
                  <thead><tr><th>{t('productId')}</th><th>{t('productName')}</th><th>{t('action')}</th></tr></thead>
                  <tbody>
                    {products.map(p => (
                      <tr key={p.product_id}>
                        <td>{p.product_id}</td><td>{p.product_name}</td>
                        <td>
                          <div className="action-btns">
                            <button className="btn btn-edit btn-sm" onClick={() => setEditItem({...p})}><FiEdit2 /> Edit</button>
                            <button className="btn btn-danger btn-sm" onClick={() => handleDelete(p.product_id)}><FiTrash2 /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mobile-cards">
                {products.map(p => (
                  <div key={p.product_id} className="mobile-card">
                    <div className="mobile-card-row"><span className="mobile-card-label">{t('productId')}</span><span className="mobile-card-value">{p.product_id}</span></div>
                    <div className="mobile-card-row"><span className="mobile-card-label">{t('productName')}</span><span className="mobile-card-value">{p.product_name}</span></div>
                    <div className="mobile-card-actions">
                      <div className="action-btns">
                        <button className="btn btn-edit btn-sm" onClick={() => setEditItem({...p})}><FiEdit2 /> Edit</button>
                        <button className="btn btn-danger btn-sm" onClick={() => handleDelete(p.product_id)}><FiTrash2 /></button>
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
            <h3>Edit Product — {editItem.product_id}</h3>
            <form onSubmit={handleUpdate}>
              <div className="form-grid">
                <div className="form-group">
                  <label>{t('productName')} *</label>
                  <input type="text" value={editItem.product_name} onChange={e => setEditItem({...editItem, product_name: e.target.value})} required />
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
