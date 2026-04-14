import { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import API from '../api';
import { FiPlus, FiTrash2 } from 'react-icons/fi';

export default function Products() {
  const { t } = useLanguage();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ product_name: '' });

  const fetchProducts = () => {
    API.get('/products')
      .then(res => setProducts(res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchProducts(); }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.product_name.trim()) return;
    API.post('/products', form)
      .then(() => { setForm({ product_name: '' }); fetchProducts(); })
      .catch(err => alert('Error: ' + err.message));
  };

  const handleDelete = (id) => {
    if (!confirm(t('confirmDeleteProduct'))) return;
    API.delete(`/products/${id}`)
      .then(() => fetchProducts())
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
                <input type="text" placeholder="e.g. Tomato, Potato, Cabbage" value={form.product_name}
                  onChange={e => setForm({ ...form, product_name: e.target.value })} required />
              </div>
            </div>
            <button type="submit" className="btn btn-primary"><FiPlus /> {t('addProduct')}</button>
          </form>
        </div>
      </div>

      <div className="glass-card">
        <div className="glass-card-header"><h3>{t('allProducts')} ({products.length})</h3></div>
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
                        <td><button className="btn btn-danger" onClick={() => handleDelete(p.product_id)}><FiTrash2 /> {t('delete')}</button></td>
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
                    <div className="mobile-card-actions"><button className="btn btn-danger" onClick={() => handleDelete(p.product_id)}><FiTrash2 /> {t('delete')}</button></div>
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
