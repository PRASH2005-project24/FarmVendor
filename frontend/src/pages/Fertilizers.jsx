import { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import API from '../api';
import { FiPlus, FiTrash2, FiEdit2, FiFilter } from 'react-icons/fi';

export default function Fertilizers() {
  const { t } = useLanguage();
  const [dosages, setDosages] = useState([]);
  const [crops, setCrops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ crop_id: '', fertilizer_name: '', quantity: '', application_stage: '', notes: '' });
  const [filterCrop, setFilterCrop] = useState('');
  const [editItem, setEditItem] = useState(null);
  const [viewMode, setViewMode] = useState('grouped'); // 'grouped' or 'table'

  const fetchData = () => {
    const params = new URLSearchParams({ sort_by: 'created_at', order: 'desc' });
    if (filterCrop) params.append('crop_id', filterCrop);
    Promise.all([API.get(`/fertilizer-dosages?${params}`), API.get('/crops')])
      .then(([dosRes, cropRes]) => { setDosages(dosRes.data); setCrops(cropRes.data); })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, [filterCrop]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.crop_id || !form.fertilizer_name.trim() || !form.quantity.trim()) return;
    API.post('/fertilizer-dosages', form)
      .then(() => { setForm({ crop_id: '', fertilizer_name: '', quantity: '', application_stage: '', notes: '' }); fetchData(); })
      .catch(err => alert('Error: ' + err.message));
  };

  const handleDelete = (id) => {
    if (!confirm(t('confirmDeleteDosage') || 'Delete this fertilizer dosage?')) return;
    API.delete(`/fertilizer-dosages/${id}`).then(() => fetchData()).catch(err => alert('Error: ' + err.message));
  };

  const handleUpdate = (e) => {
    e.preventDefault();
    API.put(`/fertilizer-dosages/${editItem.dosage_id}`, editItem)
      .then(() => { setEditItem(null); fetchData(); })
      .catch(err => alert('Error: ' + err.message));
  };

  // Group dosages by crop
  const grouped = dosages.reduce((acc, d) => {
    const key = d.crop_name || d.crop_id;
    if (!acc[key]) acc[key] = { crop_name: d.crop_name, season: d.season, crop_id: d.crop_id, items: [] };
    acc[key].items.push(d);
    return acc;
  }, {});

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
        <h2>🧪 {t('fertilizers') || 'Fertilizers'}</h2>
        <p>{t('manageFertilizers') || 'Manage fertilizer dosages and recommendations per crop'}</p>
      </div>

      <div className="glass-card section-gap">
        <div className="glass-card-header"><h3>{t('addFertilizerDosage') || 'Add Fertilizer Dosage'}</h3></div>
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
                <label>{t('fertilizerName') || 'Fertilizer Name'} *</label>
                <input type="text" placeholder="e.g. 19:0:19, Urea, DAP" value={form.fertilizer_name} onChange={e => setForm({ ...form, fertilizer_name: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>{t('quantityUsed')} *</label>
                <input type="text" placeholder="e.g. 1 kg, 500 gm" value={form.quantity} onChange={e => setForm({ ...form, quantity: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>{t('applicationStage') || 'Application Stage'}</label>
                <input type="text" placeholder="e.g. At planting, After 30 days" value={form.application_stage} onChange={e => setForm({ ...form, application_stage: e.target.value })} />
              </div>
              <div className="form-group" style={{gridColumn: '1 / -1'}}>
                <label>{t('notes') || 'Notes'}</label>
                <input type="text" placeholder="Additional notes..." value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
              </div>
            </div>
            <button type="submit" className="btn btn-primary"><FiPlus /> {t('addDosage') || 'Add Dosage'}</button>
          </form>
        </div>
      </div>

      <div className="glass-card">
        <div className="glass-card-header" style={{display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:'0.5rem'}}>
          <h3>🧪 {t('fertilizerDosages') || 'Fertilizer Dosages'} ({dosages.length})</h3>
          <div style={{display:'flex',gap:'0.5rem'}}>
            <button className={`btn btn-sm ${viewMode === 'grouped' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setViewMode('grouped')}>Grouped</button>
            <button className={`btn btn-sm ${viewMode === 'table' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setViewMode('table')}>Table</button>
          </div>
        </div>
        <div className="filter-toolbar">
          <div className="filter-group">
            <label><FiFilter /> Filter Crop</label>
            <select value={filterCrop} onChange={e => setFilterCrop(e.target.value)}>
              <option value="">All Crops</option>
              {crops.map(c => <option key={c.crop_id} value={c.crop_id}>{c.crop_name} - {c.season}</option>)}
            </select>
          </div>
        </div>
        <div className="glass-card-body">
          {loading ? (
            <div className="loading"><div className="spinner"></div><span>{t('loading')}</span></div>
          ) : dosages.length === 0 ? (
            <div className="empty-state"><div className="empty-icon">🧪</div><p>{t('noDosagesYet') || 'No fertilizer dosages added yet'}</p></div>
          ) : viewMode === 'grouped' ? (
            <div className="fertilizer-grouped">
              {Object.values(grouped).map(group => (
                <div key={group.crop_id} className="fertilizer-crop-card">
                  <div className="fertilizer-crop-header">
                    <h4>🌾 {group.crop_name}</h4>
                    <span className={getBadgeClass(group.season)}>{group.season}</span>
                  </div>
                  <div className="fertilizer-items">
                    {group.items.map(d => (
                      <div key={d.dosage_id} className="fertilizer-item">
                        <div className="fertilizer-item-main">
                          <span className="fertilizer-name">{d.fertilizer_name}</span>
                          <span className="fertilizer-qty">{d.quantity}</span>
                        </div>
                        {d.application_stage && <div className="fertilizer-stage">📅 {d.application_stage}</div>}
                        {d.notes && <div className="fertilizer-notes">💡 {d.notes}</div>}
                        <div className="action-btns" style={{marginTop:'0.5rem'}}>
                          <button className="btn btn-edit btn-sm" onClick={() => setEditItem({...d})}><FiEdit2 /> Edit</button>
                          <button className="btn btn-danger btn-sm" onClick={() => handleDelete(d.dosage_id)}><FiTrash2 /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <>
              <div className="data-table-wrapper">
                <table className="data-table">
                  <thead><tr><th>ID</th><th>{t('crop')}</th><th>{t('season')}</th><th>{t('fertilizerName') || 'Fertilizer'}</th><th>{t('quantityUsed')}</th><th>Stage</th><th>{t('action')}</th></tr></thead>
                  <tbody>
                    {dosages.map(d => (
                      <tr key={d.dosage_id}>
                        <td>{d.dosage_id}</td>
                        <td>{d.crop_name || d.crop_id}</td>
                        <td><span className={getBadgeClass(d.season)}>{d.season || '—'}</span></td>
                        <td><strong>{d.fertilizer_name}</strong></td>
                        <td>{d.quantity}</td>
                        <td>{d.application_stage || '—'}</td>
                        <td>
                          <div className="action-btns">
                            <button className="btn btn-edit btn-sm" onClick={() => setEditItem({...d})}><FiEdit2 /> Edit</button>
                            <button className="btn btn-danger btn-sm" onClick={() => handleDelete(d.dosage_id)}><FiTrash2 /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mobile-cards">
                {dosages.map(d => (
                  <div key={d.dosage_id} className="mobile-card">
                    <div className="mobile-card-row"><span className="mobile-card-label">{t('crop')}</span><span className="mobile-card-value">{d.crop_name || d.crop_id}</span></div>
                    <div className="mobile-card-row"><span className="mobile-card-label">Fertilizer</span><span className="mobile-card-value"><strong>{d.fertilizer_name}</strong></span></div>
                    <div className="mobile-card-row"><span className="mobile-card-label">Quantity</span><span className="mobile-card-value">{d.quantity}</span></div>
                    <div className="mobile-card-row"><span className="mobile-card-label">Stage</span><span className="mobile-card-value">{d.application_stage || '—'}</span></div>
                    <div className="mobile-card-actions">
                      <div className="action-btns">
                        <button className="btn btn-edit btn-sm" onClick={() => setEditItem({...d})}><FiEdit2 /> Edit</button>
                        <button className="btn btn-danger btn-sm" onClick={() => handleDelete(d.dosage_id)}><FiTrash2 /></button>
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
            <h3>Edit Dosage — {editItem.dosage_id}</h3>
            <form onSubmit={handleUpdate}>
              <div className="form-grid">
                <div className="form-group">
                  <label>{t('crop')} *</label>
                  <select value={editItem.crop_id} onChange={e => setEditItem({...editItem, crop_id: e.target.value})} required>
                    {crops.map(c => <option key={c.crop_id} value={c.crop_id}>{c.crop_name} - {c.season}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>{t('fertilizerName') || 'Fertilizer Name'} *</label>
                  <input type="text" value={editItem.fertilizer_name} onChange={e => setEditItem({...editItem, fertilizer_name: e.target.value})} required />
                </div>
                <div className="form-group">
                  <label>{t('quantityUsed')} *</label>
                  <input type="text" value={editItem.quantity} onChange={e => setEditItem({...editItem, quantity: e.target.value})} required />
                </div>
                <div className="form-group">
                  <label>Stage</label>
                  <input type="text" value={editItem.application_stage || ''} onChange={e => setEditItem({...editItem, application_stage: e.target.value})} />
                </div>
                <div className="form-group" style={{gridColumn:'1/-1'}}>
                  <label>Notes</label>
                  <input type="text" value={editItem.notes || ''} onChange={e => setEditItem({...editItem, notes: e.target.value})} />
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
