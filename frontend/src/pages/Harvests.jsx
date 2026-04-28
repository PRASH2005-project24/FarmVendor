import { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import API from '../api';
import { FiPlus, FiTrash2, FiEdit2 } from 'react-icons/fi';

export default function Harvests() {
  const { t } = useLanguage();
  const [harvests, setHarvests] = useState([]);
  const [crops, setCrops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ crop_id: '', yield_amount: '', total_cost: '', profit: '', harvest_date: '' });
  const [sortBy, setSortBy] = useState('created_at');
  const [order, setOrder] = useState('desc');
  const [filterSeason, setFilterSeason] = useState('');
  const [filterCrop, setFilterCrop] = useState('');
  const [editItem, setEditItem] = useState(null);

  const fetchData = () => {
    const params = new URLSearchParams({ sort_by: sortBy, order });
    if (filterSeason) params.append('season', filterSeason);
    if (filterCrop) params.append('crop_id', filterCrop);
    Promise.all([API.get(`/harvests?${params}`), API.get('/crops')])
      .then(([harvRes, cropRes]) => { setHarvests(harvRes.data); setCrops(cropRes.data); })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, [sortBy, order, filterSeason, filterCrop]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.crop_id || !form.yield_amount.trim()) return;
    API.post('/harvests', form)
      .then(() => { setForm({ crop_id: '', yield_amount: '', total_cost: '', profit: '', harvest_date: '' }); fetchData(); })
      .catch(err => alert('Error: ' + err.message));
  };

  const handleDelete = (id) => {
    if (!confirm(t('confirmDeleteHarvest'))) return;
    API.delete(`/harvests/${id}`).then(() => fetchData()).catch(err => alert('Error: ' + err.message));
  };

  const handleUpdate = (e) => {
    e.preventDefault();
    API.put(`/harvests/${editItem.harvest_id}`, editItem)
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
                <label>{t('totalCostRs')}</label>
                <input type="number" step="0.01" placeholder="e.g. 958000" value={form.total_cost} onChange={e => setForm({ ...form, total_cost: e.target.value })} />
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
        <div className="filter-toolbar">
          <div className="filter-group">
            <label>Sort By</label>
            <select value={sortBy} onChange={e => setSortBy(e.target.value)}>
              <option value="created_at">Date Added</option>
              <option value="profit">Profit</option>
              <option value="total_cost">Total Cost</option>
              <option value="harvest_date">Harvest Date</option>
              <option value="yield_amount">Yield</option>
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
            </select>
          </div>
          <div className="filter-group">
            <label>Filter Crop</label>
            <select value={filterCrop} onChange={e => setFilterCrop(e.target.value)}>
              <option value="">All</option>
              {crops.map(c => <option key={c.crop_id} value={c.crop_id}>{c.crop_name}</option>)}
            </select>
          </div>
        </div>
        <div className="glass-card-body">
          {loading ? (
            <div className="loading"><div className="spinner"></div><span>{t('loading')}</span></div>
          ) : harvests.length === 0 ? (
            <div className="empty-state"><div className="empty-icon">📦</div><p>{t('noHarvestsYet')}</p></div>
          ) : (
            <>
              <div className="data-table-wrapper">
                <table className="data-table">
                  <thead><tr><th>{t('harvestId')}</th><th>{t('crop')}</th><th>{t('season')}</th><th>{t('yieldAmount')}</th><th>{t('totalCost')}</th><th>{t('profit')}</th><th>{t('date')}</th><th>{t('action')}</th></tr></thead>
                  <tbody>
                    {harvests.map(h => (
                      <tr key={h.harvest_id}>
                        <td>{h.harvest_id}</td><td>{h.crop_name || h.crop_id}</td>
                        <td><span className={getBadgeClass(h.season)}>{h.season || '—'}</span></td>
                        <td>{h.yield_amount}</td>
                        <td className="amount amount-negative">{h.total_cost ? `₹${h.total_cost.toLocaleString()}` : '—'}</td>
                        <td className="amount amount-positive">{h.profit ? `₹${h.profit.toLocaleString()}` : '—'}</td>
                        <td>{h.harvest_date || '—'}</td>
                        <td>
                          <div className="action-btns">
                            <button className="btn btn-edit btn-sm" onClick={() => setEditItem({...h})}><FiEdit2 /> Edit</button>
                            <button className="btn btn-danger btn-sm" onClick={() => handleDelete(h.harvest_id)}><FiTrash2 /></button>
                          </div>
                        </td>
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
                    <div className="mobile-card-row"><span className="mobile-card-label">{t('totalCost')}</span><span className="mobile-card-value amount amount-negative">{h.total_cost ? `₹${h.total_cost.toLocaleString()}` : '—'}</span></div>
                    <div className="mobile-card-row"><span className="mobile-card-label">{t('profit')}</span><span className="mobile-card-value amount amount-positive">{h.profit ? `₹${h.profit.toLocaleString()}` : '—'}</span></div>
                    <div className="mobile-card-row"><span className="mobile-card-label">{t('date')}</span><span className="mobile-card-value">{h.harvest_date || '—'}</span></div>
                    <div className="mobile-card-actions">
                      <div className="action-btns">
                        <button className="btn btn-edit btn-sm" onClick={() => setEditItem({...h})}><FiEdit2 /> Edit</button>
                        <button className="btn btn-danger btn-sm" onClick={() => handleDelete(h.harvest_id)}><FiTrash2 /></button>
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
            <h3>Edit Harvest — {editItem.harvest_id}</h3>
            <form onSubmit={handleUpdate}>
              <div className="form-grid">
                <div className="form-group">
                  <label>{t('crop')} *</label>
                  <select value={editItem.crop_id} onChange={e => setEditItem({...editItem, crop_id: e.target.value})} required>
                    {crops.map(c => <option key={c.crop_id} value={c.crop_id}>{c.crop_name} - {c.season}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>{t('yieldAmount')} *</label>
                  <input type="text" value={editItem.yield_amount} onChange={e => setEditItem({...editItem, yield_amount: e.target.value})} required />
                </div>
                <div className="form-group">
                  <label>{t('totalCostRs')}</label>
                  <input type="number" step="0.01" value={editItem.total_cost || ''} onChange={e => setEditItem({...editItem, total_cost: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>{t('profitRs')}</label>
                  <input type="number" step="0.01" value={editItem.profit || ''} onChange={e => setEditItem({...editItem, profit: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>{t('harvestDate')}</label>
                  <input type="date" value={editItem.harvest_date || ''} onChange={e => setEditItem({...editItem, harvest_date: e.target.value})} />
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
