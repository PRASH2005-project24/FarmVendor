import { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import API from '../api';
import { FiPlus, FiTrash2, FiEdit2 } from 'react-icons/fi';

export default function Land() {
  const { t } = useLanguage();
  const [lands, setLands] = useState([]);
  const [farmers, setFarmers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ area: '', location: '', farmer_id: '' });
  const [sortBy, setSortBy] = useState('created_at');
  const [order, setOrder] = useState('desc');
  const [filterFarmer, setFilterFarmer] = useState('');
  const [editItem, setEditItem] = useState(null);

  const fetchData = () => {
    const params = new URLSearchParams({ sort_by: sortBy, order });
    if (filterFarmer) params.append('farmer_id', filterFarmer);
    Promise.all([API.get(`/land?${params}`), API.get('/farmers')])
      .then(([landRes, farmerRes]) => { setLands(landRes.data); setFarmers(farmerRes.data); })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, [sortBy, order, filterFarmer]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.area.trim() || !form.farmer_id) return;
    API.post('/land', form)
      .then(() => { setForm({ area: '', location: '', farmer_id: '' }); fetchData(); })
      .catch(err => alert('Error: ' + err.message));
  };

  const handleDelete = (id) => {
    if (!confirm(t('confirmDeleteLand'))) return;
    API.delete(`/land/${id}`).then(() => fetchData()).catch(err => alert('Error: ' + err.message));
  };

  const handleUpdate = (e) => {
    e.preventDefault();
    API.put(`/land/${editItem.land_id}`, editItem)
      .then(() => { setEditItem(null); fetchData(); })
      .catch(err => alert('Error: ' + err.message));
  };

  return (
    <>
      <div className="page-header">
        <h2>🗺️ {t('landRecords')}</h2>
        <p>{t('manageLandInfo')}</p>
      </div>

      <div className="glass-card section-gap">
        <div className="glass-card-header"><h3>{t('addLandRecord')}</h3></div>
        <div className="glass-card-body">
          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <div className="form-group">
                <label>{t('area')} *</label>
                <input type="text" placeholder="e.g. 2 Acres" value={form.area} onChange={e => setForm({ ...form, area: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>{t('location')}</label>
                <input type="text" placeholder="e.g. Pune Rural" value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} />
              </div>
              <div className="form-group">
                <label>{t('farmer')} *</label>
                <select value={form.farmer_id} onChange={e => setForm({ ...form, farmer_id: e.target.value })} required>
                  <option value="">{t('selectFarmer')}</option>
                  {farmers.map(f => <option key={f.farmer_id} value={f.farmer_id}>{f.name} ({f.farmer_id})</option>)}
                </select>
              </div>
            </div>
            <button type="submit" className="btn btn-primary"><FiPlus /> {t('addLand')}</button>
          </form>
        </div>
      </div>

      <div className="glass-card">
        <div className="glass-card-header"><h3>{t('allLandRecords')} ({lands.length})</h3></div>
        <div className="filter-toolbar">
          <div className="filter-group">
            <label>Sort By</label>
            <select value={sortBy} onChange={e => setSortBy(e.target.value)}>
              <option value="created_at">Date Added</option>
              <option value="area">Area</option>
              <option value="location">Location</option>
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
            <label>Filter Farmer</label>
            <select value={filterFarmer} onChange={e => setFilterFarmer(e.target.value)}>
              <option value="">All</option>
              {farmers.map(f => <option key={f.farmer_id} value={f.farmer_id}>{f.name}</option>)}
            </select>
          </div>
        </div>
        <div className="glass-card-body">
          {loading ? (
            <div className="loading"><div className="spinner"></div><span>{t('loading')}</span></div>
          ) : lands.length === 0 ? (
            <div className="empty-state"><div className="empty-icon">🗺️</div><p>{t('noLandYet')}</p></div>
          ) : (
            <>
              <div className="data-table-wrapper">
                <table className="data-table">
                  <thead><tr><th>{t('landId')}</th><th>{t('area')}</th><th>{t('location')}</th><th>{t('farmer')}</th><th>{t('action')}</th></tr></thead>
                  <tbody>
                    {lands.map(l => (
                      <tr key={l.land_id}>
                        <td>{l.land_id}</td><td>{l.area}</td><td>{l.location || '—'}</td><td>{l.farmer_name || l.farmer_id}</td>
                        <td>
                          <div className="action-btns">
                            <button className="btn btn-edit btn-sm" onClick={() => setEditItem({...l})}><FiEdit2 /> Edit</button>
                            <button className="btn btn-danger btn-sm" onClick={() => handleDelete(l.land_id)}><FiTrash2 /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mobile-cards">
                {lands.map(l => (
                  <div key={l.land_id} className="mobile-card">
                    <div className="mobile-card-row"><span className="mobile-card-label">{t('landId')}</span><span className="mobile-card-value">{l.land_id}</span></div>
                    <div className="mobile-card-row"><span className="mobile-card-label">{t('area')}</span><span className="mobile-card-value">{l.area}</span></div>
                    <div className="mobile-card-row"><span className="mobile-card-label">{t('location')}</span><span className="mobile-card-value">{l.location || '—'}</span></div>
                    <div className="mobile-card-row"><span className="mobile-card-label">{t('farmer')}</span><span className="mobile-card-value">{l.farmer_name || l.farmer_id}</span></div>
                    <div className="mobile-card-actions">
                      <div className="action-btns">
                        <button className="btn btn-edit btn-sm" onClick={() => setEditItem({...l})}><FiEdit2 /> Edit</button>
                        <button className="btn btn-danger btn-sm" onClick={() => handleDelete(l.land_id)}><FiTrash2 /></button>
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
            <h3>Edit Land — {editItem.land_id}</h3>
            <form onSubmit={handleUpdate}>
              <div className="form-grid">
                <div className="form-group">
                  <label>{t('area')} *</label>
                  <input type="text" value={editItem.area} onChange={e => setEditItem({...editItem, area: e.target.value})} required />
                </div>
                <div className="form-group">
                  <label>{t('location')}</label>
                  <input type="text" value={editItem.location || ''} onChange={e => setEditItem({...editItem, location: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>{t('farmer')} *</label>
                  <select value={editItem.farmer_id} onChange={e => setEditItem({...editItem, farmer_id: e.target.value})} required>
                    {farmers.map(f => <option key={f.farmer_id} value={f.farmer_id}>{f.name} ({f.farmer_id})</option>)}
                  </select>
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
