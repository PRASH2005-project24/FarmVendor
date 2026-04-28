import { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import API from '../api';
import { FiPlus, FiTrash2, FiEdit2, FiMapPin, FiPhone, FiNavigation } from 'react-icons/fi';

export default function Market() {
  const { t } = useLanguage();
  const [exporters, setExporters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    exporter_name: '', exporter_type: '', crop_product: '',
    current_rate: '', rate_unit: 'per quintal', location: '', distance_km: '', contact: ''
  });
  const [filterCrop, setFilterCrop] = useState('');
  const [filterType, setFilterType] = useState('');
  const [editItem, setEditItem] = useState(null);

  const fetchData = () => {
    const params = new URLSearchParams({ sort_by: 'distance_km', order: 'asc' });
    if (filterCrop) params.append('crop_product', filterCrop);
    if (filterType) params.append('exporter_type', filterType);
    API.get(`/exporters?${params}`)
      .then(res => setExporters(res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, [filterCrop, filterType]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.exporter_name.trim()) return;
    API.post('/exporters', { ...form, current_rate: parseFloat(form.current_rate) || 0, distance_km: parseFloat(form.distance_km) || 0 })
      .then(() => {
        setForm({ exporter_name: '', exporter_type: '', crop_product: '', current_rate: '', rate_unit: 'per quintal', location: '', distance_km: '', contact: '' });
        fetchData();
      })
      .catch(err => alert('Error: ' + err.message));
  };

  const handleDelete = (id) => {
    if (!confirm(t('confirmDeleteExporter') || 'Delete this exporter?')) return;
    API.delete(`/exporters/${id}`).then(() => fetchData()).catch(err => alert('Error: ' + err.message));
  };

  const handleUpdate = (e) => {
    e.preventDefault();
    API.put(`/exporters/${editItem.exporter_id}`, editItem)
      .then(() => { setEditItem(null); fetchData(); })
      .catch(err => alert('Error: ' + err.message));
  };

  const getTypeBadge = (type) => {
    const colors = { Factory: 'badge-kharif', Cooperative: 'badge-rabi', Trader: 'badge-default', Market: 'badge-kharif' };
    return `badge ${colors[type] || 'badge-default'}`;
  };

  const uniqueCrops = [...new Set(exporters.map(e => e.crop_product).filter(Boolean))];

  return (
    <>
      <div className="page-header">
        <h2>🏭 {t('market') || 'Market & Exporters'}</h2>
        <p>{t('manageMarket') || 'Find nearby buyers, factories, and current market rates'}</p>
      </div>

      <div className="glass-card section-gap">
        <div className="glass-card-header"><h3>{t('addExporter') || 'Add Buyer / Exporter'}</h3></div>
        <div className="glass-card-body">
          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <div className="form-group">
                <label>{t('exporterName') || 'Name'} *</label>
                <input type="text" placeholder="e.g. Baramati Sugar Factory" value={form.exporter_name} onChange={e => setForm({ ...form, exporter_name: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>{t('exporterType') || 'Type'}</label>
                <select value={form.exporter_type} onChange={e => setForm({ ...form, exporter_type: e.target.value })}>
                  <option value="">Select Type</option>
                  <option value="Factory">🏭 Factory</option>
                  <option value="Cooperative">🤝 Cooperative</option>
                  <option value="Trader">📦 Trader</option>
                  <option value="Market">🏪 Market</option>
                </select>
              </div>
              <div className="form-group">
                <label>{t('cropProduct') || 'Crop/Product'}</label>
                <input type="text" placeholder="e.g. Sugarcane, Onion" value={form.crop_product} onChange={e => setForm({ ...form, crop_product: e.target.value })} />
              </div>
              <div className="form-group">
                <label>{t('currentRate') || 'Current Rate (₹)'}</label>
                <input type="number" step="0.01" placeholder="e.g. 3150" value={form.current_rate} onChange={e => setForm({ ...form, current_rate: e.target.value })} />
              </div>
              <div className="form-group">
                <label>{t('rateUnit') || 'Rate Unit'}</label>
                <select value={form.rate_unit} onChange={e => setForm({ ...form, rate_unit: e.target.value })}>
                  <option value="per quintal">Per Quintal</option>
                  <option value="per tonne">Per Tonne</option>
                  <option value="per kg">Per Kg</option>
                </select>
              </div>
              <div className="form-group">
                <label>{t('location')}</label>
                <input type="text" placeholder="e.g. Baramati, Pune" value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} />
              </div>
              <div className="form-group">
                <label>{t('distanceKm') || 'Distance (km)'}</label>
                <input type="number" step="0.1" placeholder="e.g. 25" value={form.distance_km} onChange={e => setForm({ ...form, distance_km: e.target.value })} />
              </div>
              <div className="form-group">
                <label>{t('contactNumber') || 'Contact'}</label>
                <input type="text" placeholder="e.g. 020-27121234" value={form.contact} onChange={e => setForm({ ...form, contact: e.target.value })} />
              </div>
            </div>
            <button type="submit" className="btn btn-primary"><FiPlus /> {t('addExporter') || 'Add Exporter'}</button>
          </form>
        </div>
      </div>

      <div className="glass-card">
        <div className="glass-card-header"><h3>🏪 {t('allExporters') || 'All Buyers & Exporters'} ({exporters.length})</h3></div>
        <div className="filter-toolbar">
          <div className="filter-group">
            <label>Filter Crop</label>
            <select value={filterCrop} onChange={e => setFilterCrop(e.target.value)}>
              <option value="">All</option>
              {uniqueCrops.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="filter-group">
            <label>Filter Type</label>
            <select value={filterType} onChange={e => setFilterType(e.target.value)}>
              <option value="">All</option>
              <option value="Factory">Factory</option>
              <option value="Cooperative">Cooperative</option>
              <option value="Trader">Trader</option>
              <option value="Market">Market</option>
            </select>
          </div>
        </div>
        <div className="glass-card-body">
          {loading ? (
            <div className="loading"><div className="spinner"></div><span>{t('loading')}</span></div>
          ) : exporters.length === 0 ? (
            <div className="empty-state"><div className="empty-icon">🏭</div><p>{t('noExportersYet') || 'No exporters added yet'}</p></div>
          ) : (
            <div className="exporter-cards">
              {exporters.map(ex => (
                <div key={ex.exporter_id} className="exporter-card">
                  <div className="exporter-card-header">
                    <h4>{ex.exporter_name}</h4>
                    <span className={getTypeBadge(ex.exporter_type)}>{ex.exporter_type || 'Other'}</span>
                  </div>
                  <div className="exporter-card-body">
                    {ex.crop_product && <div className="exporter-detail"><span>🌾</span><span>{ex.crop_product}</span></div>}
                    {ex.current_rate > 0 && <div className="exporter-detail exporter-rate"><span>💰</span><span>₹{ex.current_rate.toLocaleString()} {ex.rate_unit}</span></div>}
                    {ex.location && <div className="exporter-detail"><FiMapPin /><span>{ex.location}</span></div>}
                    {ex.distance_km > 0 && <div className="exporter-detail"><FiNavigation /><span>{ex.distance_km} km away</span></div>}
                    {ex.contact && <div className="exporter-detail"><FiPhone /><span>{ex.contact}</span></div>}
                  </div>
                  <div className="exporter-card-actions">
                    <button className="btn btn-edit btn-sm" onClick={() => setEditItem({...ex})}><FiEdit2 /> Edit</button>
                    <button className="btn btn-danger btn-sm" onClick={() => handleDelete(ex.exporter_id)}><FiTrash2 /></button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {editItem && (
        <div className="modal-overlay" onClick={() => setEditItem(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3>Edit Exporter — {editItem.exporter_id}</h3>
            <form onSubmit={handleUpdate}>
              <div className="form-grid">
                <div className="form-group">
                  <label>Name *</label>
                  <input type="text" value={editItem.exporter_name} onChange={e => setEditItem({...editItem, exporter_name: e.target.value})} required />
                </div>
                <div className="form-group">
                  <label>Type</label>
                  <select value={editItem.exporter_type || ''} onChange={e => setEditItem({...editItem, exporter_type: e.target.value})}>
                    <option value="">Select</option>
                    <option value="Factory">Factory</option>
                    <option value="Cooperative">Cooperative</option>
                    <option value="Trader">Trader</option>
                    <option value="Market">Market</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Crop/Product</label>
                  <input type="text" value={editItem.crop_product || ''} onChange={e => setEditItem({...editItem, crop_product: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>Rate (₹)</label>
                  <input type="number" step="0.01" value={editItem.current_rate || ''} onChange={e => setEditItem({...editItem, current_rate: parseFloat(e.target.value) || 0})} />
                </div>
                <div className="form-group">
                  <label>Rate Unit</label>
                  <select value={editItem.rate_unit || 'per quintal'} onChange={e => setEditItem({...editItem, rate_unit: e.target.value})}>
                    <option value="per quintal">Per Quintal</option>
                    <option value="per tonne">Per Tonne</option>
                    <option value="per kg">Per Kg</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Location</label>
                  <input type="text" value={editItem.location || ''} onChange={e => setEditItem({...editItem, location: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>Distance (km)</label>
                  <input type="number" step="0.1" value={editItem.distance_km || ''} onChange={e => setEditItem({...editItem, distance_km: parseFloat(e.target.value) || 0})} />
                </div>
                <div className="form-group">
                  <label>Contact</label>
                  <input type="text" value={editItem.contact || ''} onChange={e => setEditItem({...editItem, contact: e.target.value})} />
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
