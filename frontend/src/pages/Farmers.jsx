import { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import API from '../api';
import { FiPlus, FiTrash2, FiEdit2 } from 'react-icons/fi';

export default function Farmers() {
  const { t } = useLanguage();
  const [farmers, setFarmers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: '', location: '' });
  const [sortBy, setSortBy] = useState('created_at');
  const [order, setOrder] = useState('desc');
  const [filterLoc, setFilterLoc] = useState('');
  const [suggestionData, setSuggestionData] = useState(null);
  const [loadingSuggestion, setLoadingSuggestion] = useState(false);
  const [editItem, setEditItem] = useState(null);

  const fetchFarmers = () => {
    const params = new URLSearchParams({ sort_by: sortBy, order });
    if (filterLoc) params.append('location', filterLoc);
    API.get(`/farmers?${params}`)
      .then(res => setFarmers(res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchFarmers(); }, [sortBy, order, filterLoc]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    API.post('/farmers', form)
      .then(() => { setForm({ name: '', location: '' }); fetchFarmers(); })
      .catch(err => alert('Error: ' + err.message));
  };

  const handleDelete = (id) => {
    if (!confirm(t('confirmDeleteFarmer') || 'Delete this farmer?')) return;
    API.delete(`/farmers/${id}`).then(() => fetchFarmers()).catch(err => alert('Error: ' + err.message));
  };

  const handleGetSuggestion = (farmerId) => {
    setLoadingSuggestion(true);
    API.get(`/smart-suggestions/${farmerId}`)
      .then(res => setSuggestionData(res.data))
      .catch(err => alert('Error getting suggestion: ' + err.message))
      .finally(() => setLoadingSuggestion(false));
  };

  const handleUpdate = (e) => {
    e.preventDefault();
    API.put(`/farmers/${editItem.farmer_id}`, editItem)
      .then(() => { setEditItem(null); fetchFarmers(); })
      .catch(err => alert('Error: ' + err.message));
  };

  const locations = [...new Set(farmers.map(f => f.location).filter(Boolean))];

  return (
    <>
      <div className="page-header">
        <h2>👨‍🌾 {t('farmers')}</h2>
        <p>{t('manageFarmerRecords')}</p>
      </div>

      <div className="glass-card section-gap">
        <div className="glass-card-header"><h3>{t('addNewFarmer')}</h3></div>
        <div className="glass-card-body">
          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <div className="form-group">
                <label>{t('farmerName')} *</label>
                <input type="text" placeholder="e.g. Mrs. Sunita Patil" value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>{t('location')}</label>
                <input type="text" placeholder="e.g. Pune" value={form.location}
                  onChange={e => setForm({ ...form, location: e.target.value })} />
              </div>
            </div>
            <button type="submit" className="btn btn-primary"><FiPlus /> {t('addFarmer')}</button>
          </form>
        </div>
      </div>

      <div className="glass-card">
        <div className="glass-card-header"><h3>{t('allFarmers')} ({farmers.length})</h3></div>
        <div className="filter-toolbar">
          <div className="filter-group">
            <label>Sort By</label>
            <select value={sortBy} onChange={e => setSortBy(e.target.value)}>
              <option value="created_at">Date Added</option>
              <option value="name">Name</option>
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
            <label>Filter Location</label>
            <select value={filterLoc} onChange={e => setFilterLoc(e.target.value)}>
              <option value="">All</option>
              {locations.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>
        </div>
        <div className="glass-card-body">
          {loading ? (
            <div className="loading"><div className="spinner"></div><span>{t('loading')}</span></div>
          ) : farmers.length === 0 ? (
            <div className="empty-state"><div className="empty-icon">👨‍🌾</div><p>{t('noFarmersYet')}</p></div>
          ) : (
            <>
              <div className="data-table-wrapper">
                <table className="data-table">
                  <thead><tr><th>{t('farmerId')}</th><th>{t('name')}</th><th>{t('location')}</th><th>{t('action')}</th></tr></thead>
                  <tbody>
                    {farmers.map(f => (
                      <tr key={f.farmer_id}>
                        <td>{f.farmer_id}</td><td>{f.name}</td><td>{f.location || '—'}</td>
                        <td>
                          <div className="action-btns">
                            <button className="btn btn-sm btn-secondary" onClick={() => handleGetSuggestion(f.farmer_id)} title="Get Smart Advice">💡 Advice</button>
                            <button className="btn btn-edit btn-sm" onClick={() => setEditItem({...f})}><FiEdit2 /> Edit</button>
                            <button className="btn btn-danger btn-sm" onClick={() => handleDelete(f.farmer_id)}><FiTrash2 /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mobile-cards">
                {farmers.map(f => (
                  <div key={f.farmer_id} className="mobile-card">
                    <div className="mobile-card-row"><span className="mobile-card-label">{t('farmerId')}</span><span className="mobile-card-value">{f.farmer_id}</span></div>
                    <div className="mobile-card-row"><span className="mobile-card-label">{t('name')}</span><span className="mobile-card-value">{f.name}</span></div>
                    <div className="mobile-card-row"><span className="mobile-card-label">{t('location')}</span><span className="mobile-card-value">{f.location || '—'}</span></div>
                    <div className="mobile-card-actions">
                      <div className="action-btns">
                        <button className="btn btn-sm btn-secondary" onClick={() => handleGetSuggestion(f.farmer_id)}>💡 Advice</button>
                        <button className="btn btn-edit btn-sm" onClick={() => setEditItem({...f})}><FiEdit2 /> Edit</button>
                        <button className="btn btn-danger btn-sm" onClick={() => handleDelete(f.farmer_id)}><FiTrash2 /></button>
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
            <h3>Edit Farmer — {editItem.farmer_id}</h3>
            <form onSubmit={handleUpdate}>
              <div className="form-grid">
                <div className="form-group">
                  <label>{t('farmerName')} *</label>
                  <input type="text" value={editItem.name} onChange={e => setEditItem({...editItem, name: e.target.value})} required />
                </div>
                <div className="form-group">
                  <label>{t('location')}</label>
                  <input type="text" value={editItem.location || ''} onChange={e => setEditItem({...editItem, location: e.target.value})} />
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

      {suggestionData && (
        <div className="modal-overlay" onClick={() => setSuggestionData(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{maxWidth: '450px', textAlign: 'center'}}>
            <h3 style={{fontSize: '1.5rem', marginBottom: '16px'}}>💡 Smart Suggestion</h3>
            <div style={{fontSize: '3rem', margin: '16px 0'}}>🌱</div>
            <h4 style={{color: 'var(--primary-light)', fontSize: '1.25rem', marginBottom: '8px'}}>Recommended Crop: {suggestionData.recommended_crop}</h4>
            <p style={{color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: '1.5', marginBottom: '24px'}}>{suggestionData.basis}</p>
            <div className="modal-actions" style={{justifyContent: 'center'}}>
              <button type="button" className="btn btn-primary" onClick={() => setSuggestionData(null)}>Got it</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
