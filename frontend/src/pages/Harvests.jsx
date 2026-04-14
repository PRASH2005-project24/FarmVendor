import { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import API from '../api';
import { FiPlus, FiTrash2 } from 'react-icons/fi';

export default function Harvests() {
  const { t } = useLanguage();
  const [harvests, setHarvests] = useState([]);
  const [crops, setCrops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ crop_id: '', yield_amount: '', profit: '', harvest_date: '' });

  const fetchData = () => {
    Promise.all([API.get('/harvests'), API.get('/crops')])
      .then(([harvRes, cropRes]) => { setHarvests(harvRes.data); setCrops(cropRes.data); })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.crop_id || !form.yield_amount.trim()) return;
    API.post('/harvests', form)
      .then(() => { setForm({ crop_id: '', yield_amount: '', profit: '', harvest_date: '' }); fetchData(); })
      .catch(err => alert('Error: ' + err.message));
  };

  const handleDelete = (id) => {
    if (!confirm(t('confirmDeleteHarvest'))) return;
    API.delete(`/harvests/${id}`)
      .then(() => fetchData())
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
        <h2>📦 {t('harvests')}</h2>
        <p>{t('recordHarvests')}</p>
      </div>

      <div className="glass-card section-gap">
        <div className="glass-card-header"><h3>{t('addHarvestRecord')}</h3></div>
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
                <label>{t('yieldAmount')} *</label>
                <input type="text" placeholder="e.g. 500 kg" value={form.yield_amount} onChange={e => setForm({ ...form, yield_amount: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>{t('profitRs')}</label>
                <input type="number" step="0.01" placeholder="e.g. 8000" value={form.profit} onChange={e => setForm({ ...form, profit: e.target.value })} />
              </div>
              <div className="form-group">
                <label>{t('harvestDate')}</label>
                <input type="date" value={form.harvest_date} onChange={e => setForm({ ...form, harvest_date: e.target.value })} />
              </div>
            </div>
            <button type="submit" className="btn btn-primary"><FiPlus /> {t('addHarvest')}</button>
          </form>
        </div>
      </div>

      <div className="glass-card">
        <div className="glass-card-header"><h3>{t('allHarvests')} ({harvests.length})</h3></div>
        <div className="glass-card-body">
          {loading ? (
            <div className="loading"><div className="spinner"></div><span>{t('loading')}</span></div>
          ) : harvests.length === 0 ? (
            <div className="empty-state"><div className="empty-icon">📦</div><p>{t('noHarvestsYet')}</p></div>
          ) : (
            <>
              <div className="data-table-wrapper">
                <table className="data-table">
                  <thead><tr><th>{t('harvestId')}</th><th>{t('crop')}</th><th>{t('season')}</th><th>{t('yieldAmount')}</th><th>{t('profit')}</th><th>{t('date')}</th><th>{t('action')}</th></tr></thead>
                  <tbody>
                    {harvests.map(h => (
                      <tr key={h.harvest_id}>
                        <td>{h.harvest_id}</td><td>{h.crop_name || h.crop_id}</td>
                        <td><span className={getBadgeClass(h.season)}>{h.season || '—'}</span></td>
                        <td>{h.yield_amount}</td>
                        <td className="amount amount-positive">{h.profit ? `₹${h.profit.toLocaleString()}` : '—'}</td>
                        <td>{h.harvest_date || '—'}</td>
                        <td><button className="btn btn-danger" onClick={() => handleDelete(h.harvest_id)}><FiTrash2 /> {t('delete')}</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mobile-cards">
                {harvests.map(h => (
                  <div key={h.harvest_id} className="mobile-card">
                    <div className="mobile-card-row"><span className="mobile-card-label">{t('crop')}</span><span className="mobile-card-value">{h.crop_name || h.crop_id}</span></div>
                    <div className="mobile-card-row"><span className="mobile-card-label">{t('season')}</span><span className="mobile-card-value"><span className={getBadgeClass(h.season)}>{h.season || '—'}</span></span></div>
                    <div className="mobile-card-row"><span className="mobile-card-label">{t('yieldAmount')}</span><span className="mobile-card-value">{h.yield_amount}</span></div>
                    <div className="mobile-card-row"><span className="mobile-card-label">{t('profit')}</span><span className="mobile-card-value amount amount-positive">{h.profit ? `₹${h.profit.toLocaleString()}` : '—'}</span></div>
                    <div className="mobile-card-row"><span className="mobile-card-label">{t('date')}</span><span className="mobile-card-value">{h.harvest_date || '—'}</span></div>
                    <div className="mobile-card-actions"><button className="btn btn-danger" onClick={() => handleDelete(h.harvest_id)}><FiTrash2 /> {t('delete')}</button></div>
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
