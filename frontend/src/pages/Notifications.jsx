import { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import API from '../api';
import { FiPlus, FiTrash2, FiCheck, FiBell, FiCheckCircle } from 'react-icons/fi';

export default function Notifications() {
  const { t } = useLanguage();
  const [notifications, setNotifications] = useState([]);
  const [crops, setCrops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ crop_id: '', title: '', message: '', notify_date: '' });
  const [filter, setFilter] = useState('all'); // 'all', 'unread', 'read'

  const fetchData = () => {
    const params = new URLSearchParams();
    if (filter === 'unread') params.append('is_read', 'false');
    if (filter === 'read') params.append('is_read', 'true');
    Promise.all([API.get(`/notifications?${params}`), API.get('/crops')])
      .then(([notifRes, cropRes]) => { setNotifications(notifRes.data); setCrops(cropRes.data); })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, [filter]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.message.trim() || !form.notify_date) return;
    API.post('/notifications', form)
      .then(() => { setForm({ crop_id: '', title: '', message: '', notify_date: '' }); fetchData(); })
      .catch(err => alert('Error: ' + err.message));
  };

  const markAsRead = (id) => {
    API.put(`/notifications/${id}/read`)
      .then(() => fetchData())
      .catch(err => alert('Error: ' + err.message));
  };

  const handleDelete = (id) => {
    if (!confirm('Delete this notification?')) return;
    API.delete(`/notifications/${id}`).then(() => fetchData()).catch(err => alert('Error: ' + err.message));
  };

  const markAllRead = () => {
    const unread = notifications.filter(n => !n.is_read);
    Promise.all(unread.map(n => API.put(`/notifications/${n.notification_id}/read`)))
      .then(() => fetchData())
      .catch(err => alert('Error: ' + err.message));
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const getDateStatus = (dateStr) => {
    const today = new Date();
    today.setHours(0,0,0,0);
    const d = new Date(dateStr);
    d.setHours(0,0,0,0);
    const diff = Math.ceil((d - today) / (1000 * 60 * 60 * 24));
    if (diff < 0) return { label: `${Math.abs(diff)} days ago`, cls: 'notif-overdue' };
    if (diff === 0) return { label: 'Today', cls: 'notif-today' };
    if (diff === 1) return { label: 'Tomorrow', cls: 'notif-soon' };
    if (diff <= 7) return { label: `In ${diff} days`, cls: 'notif-soon' };
    return { label: `In ${diff} days`, cls: 'notif-future' };
  };

  return (
    <>
      <div className="page-header">
        <h2>🔔 {t('notifications') || 'Notifications'}</h2>
        <p>{t('smartReminders') || 'Smart farming reminders and alerts'}</p>
      </div>

      <div className="glass-card section-gap">
        <div className="glass-card-header"><h3>{t('createNotification') || 'Create Reminder'}</h3></div>
        <div className="glass-card-body">
          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <div className="form-group">
                <label>{t('crop')} (optional)</label>
                <select value={form.crop_id} onChange={e => setForm({ ...form, crop_id: e.target.value })}>
                  <option value="">{t('selectCrop') || 'Select Crop'}</option>
                  {crops.map(c => <option key={c.crop_id} value={c.crop_id}>{c.crop_name} - {c.season}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Title *</label>
                <input type="text" placeholder="e.g. 💧 Water tomatoes" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>Date *</label>
                <input type="date" value={form.notify_date} onChange={e => setForm({ ...form, notify_date: e.target.value })} required />
              </div>
              <div className="form-group" style={{gridColumn:'1/-1'}}>
                <label>Message *</label>
                <input type="text" placeholder="e.g. Apply 2-3 liters of water per plant" value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} required />
              </div>
            </div>
            <button type="submit" className="btn btn-primary"><FiPlus /> Create Reminder</button>
          </form>
        </div>
      </div>

      <div className="glass-card">
        <div className="glass-card-header" style={{display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:'0.5rem'}}>
          <h3><FiBell /> {t('allNotifications') || 'All Reminders'} ({notifications.length}){unreadCount > 0 && <span className="notif-badge-inline">{unreadCount} new</span>}</h3>
          {unreadCount > 0 && (
            <button className="btn btn-sm btn-secondary" onClick={markAllRead}><FiCheckCircle /> Mark All Read</button>
          )}
        </div>
        <div className="filter-toolbar">
          <div className="filter-group">
            <label>Show</label>
            <select value={filter} onChange={e => setFilter(e.target.value)}>
              <option value="all">All</option>
              <option value="unread">Unread Only</option>
              <option value="read">Read Only</option>
            </select>
          </div>
        </div>
        <div className="glass-card-body">
          {loading ? (
            <div className="loading"><div className="spinner"></div><span>{t('loading')}</span></div>
          ) : notifications.length === 0 ? (
            <div className="empty-state"><div className="empty-icon">🔔</div><p>No notifications yet</p></div>
          ) : (
            <div className="notification-timeline">
              {notifications.map(n => {
                const ds = getDateStatus(n.notify_date);
                return (
                  <div key={n.notification_id} className={`notification-item ${n.is_read ? 'notif-read' : 'notif-unread'} ${ds.cls}`}>
                    <div className="notif-dot"></div>
                    <div className="notif-content">
                      <div className="notif-header">
                        <h4>{n.title}</h4>
                        <span className={`notif-date-badge ${ds.cls}`}>{ds.label}</span>
                      </div>
                      <p className="notif-message">{n.message}</p>
                      <div className="notif-meta">
                        {n.crop_name && <span className="badge badge-default">🌾 {n.crop_name}</span>}
                        <span className="notif-date-text">📅 {n.notify_date}</span>
                      </div>
                      <div className="action-btns" style={{marginTop:'0.5rem'}}>
                        {!n.is_read && (
                          <button className="btn btn-edit btn-sm" onClick={() => markAsRead(n.notification_id)}><FiCheck /> Mark Read</button>
                        )}
                        <button className="btn btn-danger btn-sm" onClick={() => handleDelete(n.notification_id)}><FiTrash2 /></button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
