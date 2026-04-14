import { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import API from '../api';
import { FiPlus, FiTrash2 } from 'react-icons/fi';

export default function Farmers() {
  const { t } = useLanguage();
  const [farmers, setFarmers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: '', location: '' });

  const fetchFarmers = () => {
    API.get('/farmers')
      .then(res => setFarmers(res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchFarmers(); }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    API.post('/farmers', form)
      .then(() => { setForm({ name: '', location: '' }); fetchFarmers(); })
      .catch(err => alert('Error: ' + err.message));
  };

  const handleDelete = (id) => {
    if (!confirm(t('confirmDeleteFarmer'))) return;
    API.delete(`/farmers/${id}`)
      .then(() => fetchFarmers())
      .catch(err => alert('Error: ' + err.message));
  };

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
                        <td><button className="btn btn-danger" onClick={() => handleDelete(f.farmer_id)}><FiTrash2 /> {t('delete')}</button></td>
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
                    <div className="mobile-card-actions"><button className="btn btn-danger" onClick={() => handleDelete(f.farmer_id)}><FiTrash2 /> {t('delete')}</button></div>
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
