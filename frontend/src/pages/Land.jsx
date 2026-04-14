import { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import API from '../api';
import { FiPlus, FiTrash2 } from 'react-icons/fi';

export default function Land() {
  const { t } = useLanguage();
  const [lands, setLands] = useState([]);
  const [farmers, setFarmers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ area: '', location: '', farmer_id: '' });

  const fetchData = () => {
    Promise.all([API.get('/land'), API.get('/farmers')])
      .then(([landRes, farmerRes]) => { setLands(landRes.data); setFarmers(farmerRes.data); })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.area.trim() || !form.farmer_id) return;
    API.post('/land', form)
      .then(() => { setForm({ area: '', location: '', farmer_id: '' }); fetchData(); })
      .catch(err => alert('Error: ' + err.message));
  };

  const handleDelete = (id) => {
    if (!confirm(t('confirmDeleteLand'))) return;
    API.delete(`/land/${id}`)
      .then(() => fetchData())
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
                        <td><button className="btn btn-danger" onClick={() => handleDelete(l.land_id)}><FiTrash2 /> {t('delete')}</button></td>
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
                    <div className="mobile-card-actions"><button className="btn btn-danger" onClick={() => handleDelete(l.land_id)}><FiTrash2 /> {t('delete')}</button></div>
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
