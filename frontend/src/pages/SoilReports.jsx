import { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import API from '../api';
import { FiPlus, FiTrash2, FiEdit2 } from 'react-icons/fi';

export default function SoilReports() {
  const { t } = useLanguage();
  const [reports, setReports] = useState([]);
  const [lands, setLands] = useState([]);
  const [crops, setCrops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ land_id: '', crop_id: '', ph_level: '', nitrogen: '', phosphorus: '', potassium: '', organic_carbon: '', report_date: '', notes: '' });
  const [filterLand, setFilterLand] = useState('');
  const [editItem, setEditItem] = useState(null);
  const [suggestions, setSuggestions] = useState(null);

  const fetchData = () => {
    const params = new URLSearchParams();
    if (filterLand) params.append('land_id', filterLand);
    Promise.all([API.get(`/soil-reports?${params}`), API.get('/land'), API.get('/crops')])
      .then(([repRes, landRes, cropRes]) => { setReports(repRes.data); setLands(landRes.data); setCrops(cropRes.data); })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, [filterLand]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.land_id) return;
    API.post('/soil-reports', {
      ...form,
      ph_level: parseFloat(form.ph_level) || null,
      nitrogen: parseFloat(form.nitrogen) || null,
      phosphorus: parseFloat(form.phosphorus) || null,
      potassium: parseFloat(form.potassium) || null,
      organic_carbon: parseFloat(form.organic_carbon) || null,
    })
      .then(() => { setForm({ land_id: '', crop_id: '', ph_level: '', nitrogen: '', phosphorus: '', potassium: '', organic_carbon: '', report_date: '', notes: '' }); fetchData(); })
      .catch(err => alert('Error: ' + err.message));
  };

  const handleDelete = (id) => {
    if (!confirm('Delete this soil report?')) return;
    API.delete(`/soil-reports/${id}`).then(() => fetchData()).catch(err => alert('Error: ' + err.message));
  };

  const handleUpdate = (e) => {
    e.preventDefault();
    API.put(`/soil-reports/${editItem.report_id}`, editItem)
      .then(() => { setEditItem(null); fetchData(); })
      .catch(err => alert('Error: ' + err.message));
  };

  const getSuggestions = (report) => {
    // Simple logic based on NPK levels
    const tips = [];
    if (report.ph_level !== null) {
      if (report.ph_level < 5.5) tips.push('⚠️ Soil is too acidic — apply lime');
      else if (report.ph_level < 6.0) tips.push('🟡 Slightly acidic — consider lime application');
      else if (report.ph_level > 8.0) tips.push('⚠️ Soil is too alkaline — apply gypsum');
      else if (report.ph_level > 7.5) tips.push('🟡 Slightly alkaline — add organic matter');
      else tips.push('✅ pH is in good range (6.0-7.5)');
    }
    if (report.nitrogen !== null) {
      if (report.nitrogen < 200) tips.push('🔴 Low Nitrogen — apply Urea or organic manure');
      else if (report.nitrogen < 300) tips.push('🟡 Medium Nitrogen — maintain with green manure');
      else tips.push('✅ Nitrogen levels are good');
    }
    if (report.phosphorus !== null) {
      if (report.phosphorus < 15) tips.push('🔴 Low Phosphorus — apply DAP or SSP');
      else if (report.phosphorus < 25) tips.push('🟡 Medium Phosphorus — use phosphate fertilizer');
      else tips.push('✅ Phosphorus levels are good');
    }
    if (report.potassium !== null) {
      if (report.potassium < 150) tips.push('🔴 Low Potassium — apply MOP (Muriate of Potash)');
      else if (report.potassium < 250) tips.push('🟡 Medium Potassium — use potash-based fertilizer');
      else tips.push('✅ Potassium levels are good');
    }
    return tips;
  };

  const getGaugeColor = (value, low, high) => {
    if (value === null || value === undefined) return '#666';
    if (value < low) return '#ef4444';
    if (value < high) return '#f59e0b';
    return '#22c55e';
  };

  return (
    <>
      <div className="page-header">
        <h2>📊 {t('soilReports') || 'Soil Reports'}</h2>
        <p>{t('manageSoilReports') || 'Enter and analyze soil test report data for your land'}</p>
      </div>

      <div className="glass-card section-gap">
        <div className="glass-card-header"><h3>{t('addSoilReport') || 'Add Soil Report'}</h3></div>
        <div className="glass-card-body">
          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <div className="form-group">
                <label>{t('land')} *</label>
                <select value={form.land_id} onChange={e => setForm({ ...form, land_id: e.target.value })} required>
                  <option value="">{t('selectLand')}</option>
                  {lands.map(l => <option key={l.land_id} value={l.land_id}>{l.area} — {l.location || l.land_id} ({l.farmer_name || l.farmer_id})</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>{t('crop')} (Optional)</label>
                <select value={form.crop_id} onChange={e => setForm({ ...form, crop_id: e.target.value })}>
                  <option value="">{t('selectCrop')}</option>
                  {crops.map(c => <option key={c.crop_id} value={c.crop_id}>{c.crop_name} - {c.season}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>pH Level</label>
                <input type="number" step="0.01" min="0" max="14" placeholder="e.g. 6.8" value={form.ph_level} onChange={e => setForm({ ...form, ph_level: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Nitrogen (kg/ha)</label>
                <input type="number" step="0.01" placeholder="e.g. 280" value={form.nitrogen} onChange={e => setForm({ ...form, nitrogen: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Phosphorus (kg/ha)</label>
                <input type="number" step="0.01" placeholder="e.g. 22.5" value={form.phosphorus} onChange={e => setForm({ ...form, phosphorus: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Potassium (kg/ha)</label>
                <input type="number" step="0.01" placeholder="e.g. 180" value={form.potassium} onChange={e => setForm({ ...form, potassium: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Organic Carbon (%)</label>
                <input type="number" step="0.01" placeholder="e.g. 0.65" value={form.organic_carbon} onChange={e => setForm({ ...form, organic_carbon: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Report Date</label>
                <input type="date" value={form.report_date} onChange={e => setForm({ ...form, report_date: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Notes</label>
                <input type="text" placeholder="e.g. Soil test from lab" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
              </div>
            </div>
            <button type="submit" className="btn btn-primary"><FiPlus /> Add Report</button>
          </form>
        </div>
      </div>

      <div className="glass-card">
        <div className="glass-card-header"><h3>📋 All Soil Reports ({reports.length})</h3></div>
        <div className="filter-toolbar">
          <div className="filter-group">
            <label>Filter by Land</label>
            <select value={filterLand} onChange={e => setFilterLand(e.target.value)}>
              <option value="">All</option>
              {lands.map(l => <option key={l.land_id} value={l.land_id}>{l.area} — {l.location || l.land_id}</option>)}
            </select>
          </div>
        </div>
        <div className="glass-card-body">
          {loading ? (
            <div className="loading"><div className="spinner"></div><span>{t('loading')}</span></div>
          ) : reports.length === 0 ? (
            <div className="empty-state"><div className="empty-icon">📊</div><p>No soil reports yet</p></div>
          ) : (
            <div className="soil-report-cards">
              {reports.map(r => {
                const tips = getSuggestions(r);
                return (
                  <div key={r.report_id} className="soil-report-card">
                    <div className="soil-report-header">
                      <div>
                        <h4>📋 {r.report_id}</h4>
                        <span className="soil-report-land">🗺️ {r.land_area} — {r.land_location || 'N/A'}</span>
                        {r.farmer_name && <span className="soil-report-farmer">👤 {r.farmer_name}</span>}
                      </div>
                      {r.report_date && <span className="badge badge-default">📅 {r.report_date}</span>}
                    </div>
                    <div className="soil-metrics">
                      <div className="soil-metric">
                        <span className="soil-metric-label">pH</span>
                        <span className="soil-metric-value" style={{color: getGaugeColor(r.ph_level, 6.0, 7.5)}}>{r.ph_level ?? '—'}</span>
                      </div>
                      <div className="soil-metric">
                        <span className="soil-metric-label">N (kg/ha)</span>
                        <span className="soil-metric-value" style={{color: getGaugeColor(r.nitrogen, 200, 300)}}>{r.nitrogen ?? '—'}</span>
                      </div>
                      <div className="soil-metric">
                        <span className="soil-metric-label">P (kg/ha)</span>
                        <span className="soil-metric-value" style={{color: getGaugeColor(r.phosphorus, 15, 25)}}>{r.phosphorus ?? '—'}</span>
                      </div>
                      <div className="soil-metric">
                        <span className="soil-metric-label">K (kg/ha)</span>
                        <span className="soil-metric-value" style={{color: getGaugeColor(r.potassium, 150, 250)}}>{r.potassium ?? '—'}</span>
                      </div>
                      <div className="soil-metric">
                        <span className="soil-metric-label">OC (%)</span>
                        <span className="soil-metric-value" style={{color: getGaugeColor(r.organic_carbon, 0.5, 0.75)}}>{r.organic_carbon ?? '—'}</span>
                      </div>
                    </div>
                    {tips.length > 0 && (
                      <div className="soil-suggestions">
                        <strong>💡 Suggestions:</strong>
                        <ul>{tips.map((tip, i) => <li key={i}>{tip}</li>)}</ul>
                      </div>
                    )}
                    {r.notes && <div className="soil-notes">📝 {r.notes}</div>}
                    <div className="action-btns" style={{marginTop:'0.75rem'}}>
                      <button className="btn btn-edit btn-sm" onClick={() => setEditItem({...r})}><FiEdit2 /> Edit</button>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDelete(r.report_id)}><FiTrash2 /></button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {editItem && (
        <div className="modal-overlay" onClick={() => setEditItem(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3>Edit Soil Report — {editItem.report_id}</h3>
            <form onSubmit={handleUpdate}>
              <div className="form-grid">
                <div className="form-group">
                  <label>Land *</label>
                  <select value={editItem.land_id} onChange={e => setEditItem({...editItem, land_id: e.target.value})} required>
                    {lands.map(l => <option key={l.land_id} value={l.land_id}>{l.area} — {l.location || l.land_id}</option>)}
                  </select>
                </div>
                <div className="form-group"><label>pH Level</label><input type="number" step="0.01" value={editItem.ph_level ?? ''} onChange={e => setEditItem({...editItem, ph_level: e.target.value})} /></div>
                <div className="form-group"><label>Nitrogen</label><input type="number" step="0.01" value={editItem.nitrogen ?? ''} onChange={e => setEditItem({...editItem, nitrogen: e.target.value})} /></div>
                <div className="form-group"><label>Phosphorus</label><input type="number" step="0.01" value={editItem.phosphorus ?? ''} onChange={e => setEditItem({...editItem, phosphorus: e.target.value})} /></div>
                <div className="form-group"><label>Potassium</label><input type="number" step="0.01" value={editItem.potassium ?? ''} onChange={e => setEditItem({...editItem, potassium: e.target.value})} /></div>
                <div className="form-group"><label>Organic Carbon</label><input type="number" step="0.01" value={editItem.organic_carbon ?? ''} onChange={e => setEditItem({...editItem, organic_carbon: e.target.value})} /></div>
                <div className="form-group"><label>Report Date</label><input type="date" value={editItem.report_date || ''} onChange={e => setEditItem({...editItem, report_date: e.target.value})} /></div>
                <div className="form-group"><label>Notes</label><input type="text" value={editItem.notes || ''} onChange={e => setEditItem({...editItem, notes: e.target.value})} /></div>
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
