import { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import API from '../api';
import { FiPlus, FiTrash2, FiEdit2 } from 'react-icons/fi';

export default function Crops() {
  const { t } = useLanguage();
  const [crops, setCrops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ crop_name: '', season: '' });
  const [sortBy, setSortBy] = useState('created_at');
  const [order, setOrder] = useState('desc');
  const [filterSeason, setFilterSeason] = useState('');
  const [editItem, setEditItem] = useState(null);

  const fetchCrops = () => {
    const params = new URLSearchParams({ sort_by: sortBy, order });
    if (filterSeason) params.append('season', filterSeason);
    API.get(`/crops?${params}`)
      .then(res => setCrops(res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchCrops(); }, [sortBy, order, filterSeason]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.crop_name.trim() || !form.season) return;
    API.post('/crops', form)
      .then(() => { setForm({ crop_name: '', season: '' }); fetchCrops(); })
      .catch(err => alert('Error: ' + err.message));
  };

  const handleDelete = (id) => {
    if (!confirm(t('confirmDeleteCrop'))) return;
    API.delete(`/crops/${id}`).then(() => fetchCrops()).catch(err => alert('Error: ' + err.message));
  };

  const handleUpdate = (e) => {
    e.preventDefault();
    API.put(`/crops/${editItem.crop_id}`, editItem)
      .then(() => { setEditItem(null); fetchCrops(); })
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
        <h2>🌱 {t('crops')}</h2>
        <p>{t('manageCrops')}</p>
      </div>

      <div className="glass-card section-gap">
        <div className="glass-card-header"><h3>{t('addNewCrop')}</h3></div>
        <div className="glass-card-body">
          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <div className="form-group">
                <label>{t('cropName')} *</label>
                <input type="text" placeholder="e.g. Tomato" value={form.crop_name} onChange={e => setForm({ ...form, crop_name: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>{t('season')} *</label>
                <select value={form.season} onChange={e => setForm({ ...form, season: e.target.value })} required>
                  <option value="">{t('selectSeason')}</option>
                  <option value="Kharif">Kharif</option>
                  <option value="Rabi">Rabi</option>
                  <option value="Zaid">Zaid</option>
                </select>
              </div>
            </div>
            <button type="submit" className="btn btn-primary"><FiPlus /> {t('addCrop')}</button>
          </form>
        </div>
      </div>

      <div className="glass-card">
        <div className="glass-card-header"><h3>{t('allCrops')} ({crops.length})</h3></div>
        <div className="filter-toolbar">
          <div className="filter-group">
            <label>Sort By</label>
            <select value={sortBy} onChange={e => setSortBy(e.target.value)}>
              <option value="created_at">Date Added</option>
              <option value="crop_name">Name</option>
              <option value="season">Season</option>
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
            <label>Filter Season</label>
            <select value={filterSeason} onChange={e => setFilterSeason(e.target.value)}>
              <option value="">All</option>
              <option value="Kharif">Kharif</option>
              <option value="Rabi">Rabi</option>
              <option value="Zaid">Zaid</option>
            </select>
          </div>
        </div>
        <div className="glass-card-body">
          {loading ? (
            <div className="loading"><div className="spinner"></div><span>{t('loading')}</span></div>
          ) : crops.length === 0 ? (
            <div className="empty-state"><div className="empty-icon">🌱</div><p>{t('noCropsYet')}</p></div>
          ) : (
            <>
              <div className="data-table-wrapper">
                <table className="data-table">
                  <thead><tr><th>{t('cropId')}</th><th>{t('cropName')}</th><th>{t('season')}</th><th>{t('action')}</th></tr></thead>
                  <tbody>
                    {crops.map(c => (
                      <tr key={c.crop_id}>
                        <td>{c.crop_id}</td><td>{c.crop_name}</td>
                        <td><span className={getBadgeClass(c.season)}>{c.season}</span></td>
                        <td>
                          <div className="action-btns">
                            <button className="btn btn-edit btn-sm" onClick={() => setEditItem({...c})}><FiEdit2 /> Edit</button>
                            <button className="btn btn-danger btn-sm" onClick={() => handleDelete(c.crop_id)}><FiTrash2 /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mobile-cards">
                {crops.map(c => (
                  <div key={c.crop_id} className="mobile-card">
                    <div className="mobile-card-row"><span className="mobile-card-label">{t('cropId')}</span><span className="mobile-card-value">{c.crop_id}</span></div>
                    <div className="mobile-card-row"><span className="mobile-card-label">{t('cropName')}</span><span className="mobile-card-value">{c.crop_name}</span></div>
                    <div className="mobile-card-row"><span className="mobile-card-label">{t('season')}</span><span className="mobile-card-value"><span className={getBadgeClass(c.season)}>{c.season}</span></span></div>
                    <div className="mobile-card-actions">
                      <div className="action-btns">
                        <button className="btn btn-edit btn-sm" onClick={() => setEditItem({...c})}><FiEdit2 /> Edit</button>
                        <button className="btn btn-danger btn-sm" onClick={() => handleDelete(c.crop_id)}><FiTrash2 /></button>
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
            <h3>Edit Crop — {editItem.crop_id}</h3>
            <form onSubmit={handleUpdate}>
              <div className="form-grid">
                <div className="form-group">
                  <label>{t('cropName')} *</label>
                  <input type="text" value={editItem.crop_name} onChange={e => setEditItem({...editItem, crop_name: e.target.value})} required />
                </div>
                <div className="form-group">
                  <label>{t('season')} *</label>
                  <select value={editItem.season} onChange={e => setEditItem({...editItem, season: e.target.value})} required>
                    <option value="Kharif">Kharif</option>
                    <option value="Rabi">Rabi</option>
                    <option value="Zaid">Zaid</option>
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
