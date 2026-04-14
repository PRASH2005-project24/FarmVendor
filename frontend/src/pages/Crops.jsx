import { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import API from '../api';
import { FiPlus, FiTrash2 } from 'react-icons/fi';

export default function Crops() {
  const { t } = useLanguage();
  const [crops, setCrops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ crop_name: '', season: 'Kharif' });

  const fetchCrops = () => {
    API.get('/crops')
      .then(res => setCrops(res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchCrops(); }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.crop_name.trim()) return;
    API.post('/crops', form)
      .then(() => { setForm({ crop_name: '', season: 'Kharif' }); fetchCrops(); })
      .catch(err => alert('Error: ' + err.message));
  };

  const handleDelete = (id) => {
    if (!confirm(t('confirmDeleteCrop'))) return;
    API.delete(`/crops/${id}`)
      .then(() => fetchCrops())
      .catch(err => alert('Error: ' + err.message));
  };

  const getBadgeClass = (season) => {
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
                <select value={form.season} onChange={e => setForm({ ...form, season: e.target.value })}>
                  <option value="Kharif">{t('seasonKharif')}</option>
                  <option value="Rabi">{t('seasonRabi')}</option>
                  <option value="Zaid">{t('seasonZaid')}</option>
                </select>
              </div>
            </div>
            <button type="submit" className="btn btn-primary"><FiPlus /> {t('addCrop')}</button>
          </form>
        </div>
      </div>

      <div className="glass-card">
        <div className="glass-card-header"><h3>{t('allCrops')} ({crops.length})</h3></div>
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
                        <td><button className="btn btn-danger" onClick={() => handleDelete(c.crop_id)}><FiTrash2 /> {t('delete')}</button></td>
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
                    <div className="mobile-card-actions"><button className="btn btn-danger" onClick={() => handleDelete(c.crop_id)}><FiTrash2 /> {t('delete')}</button></div>
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
