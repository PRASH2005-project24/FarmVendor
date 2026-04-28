import { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import API from '../api';
import { FiPlus, FiTrash2, FiEdit2 } from 'react-icons/fi';

export default function Activities() {
  const { t } = useLanguage();
  const [activities, setActivities] = useState([]);
  const [crops, setCrops] = useState([]);
  const [lands, setLands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ crop_id: '', land_id: '', chemical_name: '', quantity: '', activity_date: '' });
  const [sortBy, setSortBy] = useState('created_at');
  const [order, setOrder] = useState('desc');
  const [filterCrop, setFilterCrop] = useState('');
  const [editItem, setEditItem] = useState(null);

  const fetchData = () => {
    const params = new URLSearchParams({ sort_by: sortBy, order });
    if (filterCrop) params.append('crop_id', filterCrop);
    Promise.all([API.get(`/activities?${params}`), API.get('/crops'), API.get('/land')])
      .then(([actRes, cropRes, landRes]) => { setActivities(actRes.data); setCrops(cropRes.data); setLands(landRes.data); })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, [sortBy, order, filterCrop]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.crop_id || !form.chemical_name.trim() || !form.quantity.trim()) return;
    API.post('/activities', form)
      .then(() => { setForm({ crop_id: '', land_id: '', chemical_name: '', quantity: '', activity_date: '' }); fetchData(); })
      .catch(err => alert('Error: ' + err.message));
  };

  const handleDelete = (id) => {
    if (!confirm(t('confirmDeleteActivity'))) return;
    API.delete(`/activities/${id}`).then(() => fetchData()).catch(err => alert('Error: ' + err.message));
  };

  const handleUpdate = (e) => {
    e.preventDefault();
    API.put(`/activities/${editItem.activity_id}`, editItem)
      .then(() => { setEditItem(null); fetchData(); })
      .catch(err => alert('Error: ' + err.message));
  };

  const getBadgeClass = (season) => {
    if (!season) return 'badge badge-default';
    const s = season.toLowerCase();
    if (s === 'kharif') return 'badge badge-kharif';
    if (s === 'rabi') return 'badge badge-rabi';
    return 'badge badge-default';
  };

  return (
    <>
      <div className="page-header">
        <h2>🧪 {t('activities')}</h2>
        <p>{t('trackActivities')}</p>
      </div>

      <div className="glass-card section-gap">
        <div className="glass-card-header"><h3>{t('addNewActivity')}</h3></div>
        <div className="glass-card-body">
          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <div className="form-group">
                <label>{t('crop')} *</label>
                <select value={form.crop_id} onChange={e => setForm({ ...form, crop_id: e.target.value })} required>
                  <option value="">{t('selectCrop')}</option>
                  {crops.map(c => <option key={c.crop_id} value={c.crop_id}>{c.crop_name} - {c.season} ({c.crop_id})</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>{t('land') || 'Land'}</label>
                <select value={form.land_id} onChange={e => setForm({ ...form, land_id: e.target.value })}>
                  <option value="">{t('selectLand') || 'Select Land'}</option>
                  {lands.map(l => <option key={l.land_id} value={l.land_id}>{l.area} — {l.location || l.land_id} ({l.farmer_name || l.farmer_id})</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>{t('chemicalName')} *</label>
                <input type="text" placeholder="e.g. Phosphoric Acid, Potassium" value={form.chemical_name} onChange={e => setForm({ ...form, chemical_name: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>{t('quantityUsed')} *</label>
                <input type="text" placeholder="e.g. 500 gm, 3 units, 85%" value={form.quantity} onChange={e => setForm({ ...form, quantity: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>{t('activityDate')}</label>
                <input type="date" value={form.activity_date} onChange={e => setForm({ ...form, activity_date: e.target.value })} />
              </div>
            </div>
            <button type="submit" className="btn btn-primary"><FiPlus /> {t('addActivity')}</button>
          </form>
        </div>
      </div>

      <div className="glass-card">
        <div className="glass-card-header"><h3>{t('allActivities')} ({activities.length})</h3></div>
        <div className="filter-toolbar">
          <div className="filter-group">
            <label>Sort By</label>
            <select value={sortBy} onChange={e => setSortBy(e.target.value)}>
              <option value="created_at">Date Added</option>
              <option value="chemical_name">Chemical Name</option>
              <option value="activity_date">Activity Date</option>
              <option value="quantity">Quantity</option>
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
            <label>Filter Crop</label>
            <select value={filterCrop} onChange={e => setFilterCrop(e.target.value)}>
              <option value="">All</option>
              {crops.map(c => <option key={c.crop_id} value={c.crop_id}>{c.crop_name} - {c.season}</option>)}
            </select>
          </div>
        </div>
        <div className="glass-card-body">
          {loading ? (
            <div className="loading"><div className="spinner"></div><span>{t('loading')}</span></div>
          ) : activities.length === 0 ? (
            <div className="empty-state"><div className="empty-icon">🧪</div><p>{t('noActivitiesYet')}</p></div>
          ) : (
            <>
              <div className="data-table-wrapper">
                <table className="data-table">
                  <thead><tr><th>{t('activityId')}</th><th>{t('crop')}</th><th>{t('season')}</th><th>{t('land') || 'Land'}</th><th>{t('chemicalName')}</th><th>{t('quantityUsed')}</th><th>{t('date')}</th><th>{t('action')}</th></tr></thead>
                  <tbody>
                    {activities.map(a => (
                      <tr key={a.activity_id}>
                        <td>{a.activity_id}</td><td>{a.crop_name || a.crop_id}</td>
                        <td><span className={getBadgeClass(a.season)}>{a.season || '—'}</span></td>
                        <td>{a.land_area ? `${a.land_area} — ${a.land_location || ''}` : '—'}</td>
                        <td>{a.chemical_name}</td>
                        <td>{a.quantity}</td>
                        <td>{a.activity_date || '—'}</td>
                        <td>
                          <div className="action-btns">
                            <button className="btn btn-edit btn-sm" onClick={() => setEditItem({...a})}><FiEdit2 /> Edit</button>
                            <button className="btn btn-danger btn-sm" onClick={() => handleDelete(a.activity_id)}><FiTrash2 /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mobile-cards">
                {activities.map(a => (
                  <div key={a.activity_id} className="mobile-card">
                    <div className="mobile-card-row"><span className="mobile-card-label">{t('crop')}</span><span className="mobile-card-value">{a.crop_name || a.crop_id}</span></div>
                    <div className="mobile-card-row"><span className="mobile-card-label">{t('season')}</span><span className="mobile-card-value"><span className={getBadgeClass(a.season)}>{a.season || '—'}</span></span></div>
                    <div className="mobile-card-row"><span className="mobile-card-label">{t('land') || 'Land'}</span><span className="mobile-card-value">{a.land_area ? `${a.land_area} — ${a.land_location || ''}` : '—'}</span></div>
                    <div className="mobile-card-row"><span className="mobile-card-label">{t('chemicalName')}</span><span className="mobile-card-value">{a.chemical_name}</span></div>
                    <div className="mobile-card-row"><span className="mobile-card-label">{t('quantityUsed')}</span><span className="mobile-card-value">{a.quantity}</span></div>
                    <div className="mobile-card-row"><span className="mobile-card-label">{t('date')}</span><span className="mobile-card-value">{a.activity_date || '—'}</span></div>
                    <div className="mobile-card-actions">
                      <div className="action-btns">
                        <button className="btn btn-edit btn-sm" onClick={() => setEditItem({...a})}><FiEdit2 /> Edit</button>
                        <button className="btn btn-danger btn-sm" onClick={() => handleDelete(a.activity_id)}><FiTrash2 /></button>
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
            <h3>Edit Activity — {editItem.activity_id}</h3>
            <form onSubmit={handleUpdate}>
              <div className="form-grid">
                <div className="form-group">
                  <label>{t('crop')} *</label>
                  <select value={editItem.crop_id} onChange={e => setEditItem({...editItem, crop_id: e.target.value})} required>
                    {crops.map(c => <option key={c.crop_id} value={c.crop_id}>{c.crop_name} - {c.season}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>{t('land') || 'Land'}</label>
                  <select value={editItem.land_id || ''} onChange={e => setEditItem({...editItem, land_id: e.target.value})}>
                    <option value="">None</option>
                    {lands.map(l => <option key={l.land_id} value={l.land_id}>{l.area} — {l.location || l.land_id}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>{t('chemicalName')} *</label>
                  <input type="text" value={editItem.chemical_name} onChange={e => setEditItem({...editItem, chemical_name: e.target.value})} required />
                </div>
                <div className="form-group">
                  <label>{t('quantityUsed')} *</label>
                  <input type="text" value={editItem.quantity} onChange={e => setEditItem({...editItem, quantity: e.target.value})} required />
                </div>
                <div className="form-group">
                  <label>{t('activityDate')}</label>
                  <input type="date" value={editItem.activity_date || ''} onChange={e => setEditItem({...editItem, activity_date: e.target.value})} />
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
