import { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import API from '../api';
import { FiPlus, FiTrash2, FiEdit2 } from 'react-icons/fi';

export default function Expenses() {
  const { t } = useLanguage();
  const [expenses, setExpenses] = useState([]);
  const [lands, setLands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ type: '', amount: '', expense_date: '', land_id: '' });
  const [sortBy, setSortBy] = useState('created_at');
  const [order, setOrder] = useState('desc');
  const [filterLand, setFilterLand] = useState('');
  const [filterType, setFilterType] = useState('');
  const [editItem, setEditItem] = useState(null);

  const fetchData = () => {
    const params = new URLSearchParams({ sort_by: sortBy, order });
    if (filterLand) params.append('land_id', filterLand);
    if (filterType) params.append('type', filterType);
    Promise.all([API.get(`/expenses?${params}`), API.get('/land')])
      .then(([expRes, landRes]) => { setExpenses(expRes.data); setLands(landRes.data); })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, [sortBy, order, filterLand, filterType]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.type.trim() || !form.amount || !form.land_id) return;
    API.post('/expenses', form)
      .then(() => { setForm({ type: '', amount: '', expense_date: '', land_id: '' }); fetchData(); })
      .catch(err => alert('Error: ' + err.message));
  };

  const handleDelete = (id) => {
    if (!confirm(t('confirmDeleteExpense'))) return;
    API.delete(`/expenses/${id}`).then(() => fetchData()).catch(err => alert('Error: ' + err.message));
  };

  const handleUpdate = (e) => {
    e.preventDefault();
    API.put(`/expenses/${editItem.expense_id}`, editItem)
      .then(() => { setEditItem(null); fetchData(); })
      .catch(err => alert('Error: ' + err.message));
  };

  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const expenseTypes = [...new Set(expenses.map(e => e.type).filter(Boolean))];

  return (
    <>
      <div className="page-header">
        <h2>💸 {t('expenses')}</h2>
        <p>{t('trackExpenses')}</p>
      </div>

      <div className="glass-card section-gap">
        <div className="glass-card-header"><h3>{t('addNewExpense')}</h3></div>
        <div className="glass-card-body">
          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <div className="form-group">
                <label>{t('expenseType')} *</label>
                <input type="text" placeholder="e.g. Fertilizer, Seeds, Labor" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>{t('amount')} *</label>
                <input type="number" step="0.01" placeholder="e.g. 2000" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>{t('date')}</label>
                <input type="date" value={form.expense_date} onChange={e => setForm({ ...form, expense_date: e.target.value })} />
              </div>
              <div className="form-group">
                <label>{t('land')} *</label>
                <select value={form.land_id} onChange={e => setForm({ ...form, land_id: e.target.value })} required>
                  <option value="">{t('selectLand')}</option>
                  {lands.map(l => <option key={l.land_id} value={l.land_id}>{l.area} - {l.location || l.land_id} ({l.farmer_name || l.farmer_id})</option>)}
                </select>
              </div>
            </div>
            <button type="submit" className="btn btn-primary"><FiPlus /> {t('addExpense')}</button>
          </form>
        </div>
      </div>

      <div className="glass-card">
        <div className="glass-card-header">
          <h3>{t('allExpenses')} ({expenses.length})</h3>
          <span className="amount amount-negative" style={{ fontSize: '1rem' }}>{t('totalExpensesLabel')}: ₹{totalExpenses.toLocaleString()}</span>
        </div>
        <div className="filter-toolbar">
          <div className="filter-group">
            <label>Sort By</label>
            <select value={sortBy} onChange={e => setSortBy(e.target.value)}>
              <option value="created_at">Date Added</option>
              <option value="amount">Amount</option>
              <option value="expense_date">Expense Date</option>
              <option value="type">Type</option>
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
            <label>Filter Land</label>
            <select value={filterLand} onChange={e => setFilterLand(e.target.value)}>
              <option value="">All</option>
              {lands.map(l => <option key={l.land_id} value={l.land_id}>{l.area} - {l.location || l.land_id}</option>)}
            </select>
          </div>
          <div className="filter-group">
            <label>Filter Type</label>
            <select value={filterType} onChange={e => setFilterType(e.target.value)}>
              <option value="">All</option>
              {expenseTypes.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </div>
        <div className="glass-card-body">
          {loading ? (
            <div className="loading"><div className="spinner"></div><span>{t('loading')}</span></div>
          ) : expenses.length === 0 ? (
            <div className="empty-state"><div className="empty-icon">💸</div><p>{t('noExpensesYet')}</p></div>
          ) : (
            <>
              <div className="data-table-wrapper">
                <table className="data-table">
                  <thead><tr><th>{t('expenseId')}</th><th>{t('type')}</th><th>{t('amount')}</th><th>{t('date')}</th><th>{t('land')}</th><th>{t('farmer')}</th><th>{t('action')}</th></tr></thead>
                  <tbody>
                    {expenses.map(e => (
                      <tr key={e.expense_id}>
                        <td>{e.expense_id}</td><td>{e.type}</td>
                        <td className="amount amount-negative">₹{e.amount.toLocaleString()}</td>
                        <td>{e.expense_date || '—'}</td><td>{e.land_area || e.land_id}</td><td>{e.farmer_name || '—'}</td>
                        <td>
                          <div className="action-btns">
                            <button className="btn btn-edit btn-sm" onClick={() => setEditItem({...e})}><FiEdit2 /> Edit</button>
                            <button className="btn btn-danger btn-sm" onClick={() => handleDelete(e.expense_id)}><FiTrash2 /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mobile-cards">
                {expenses.map(e => (
                  <div key={e.expense_id} className="mobile-card">
                    <div className="mobile-card-row"><span className="mobile-card-label">{t('type')}</span><span className="mobile-card-value">{e.type}</span></div>
                    <div className="mobile-card-row"><span className="mobile-card-label">{t('amount')}</span><span className="mobile-card-value amount amount-negative">₹{e.amount.toLocaleString()}</span></div>
                    <div className="mobile-card-row"><span className="mobile-card-label">{t('date')}</span><span className="mobile-card-value">{e.expense_date || '—'}</span></div>
                    <div className="mobile-card-row"><span className="mobile-card-label">{t('land')}</span><span className="mobile-card-value">{e.land_area || e.land_id}</span></div>
                    <div className="mobile-card-row"><span className="mobile-card-label">{t('farmer')}</span><span className="mobile-card-value">{e.farmer_name || '—'}</span></div>
                    <div className="mobile-card-actions">
                      <div className="action-btns">
                        <button className="btn btn-edit btn-sm" onClick={() => setEditItem({...e})}><FiEdit2 /> Edit</button>
                        <button className="btn btn-danger btn-sm" onClick={() => handleDelete(e.expense_id)}><FiTrash2 /></button>
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
            <h3>Edit Expense — {editItem.expense_id}</h3>
            <form onSubmit={handleUpdate}>
              <div className="form-grid">
                <div className="form-group">
                  <label>{t('expenseType')} *</label>
                  <input type="text" value={editItem.type} onChange={e => setEditItem({...editItem, type: e.target.value})} required />
                </div>
                <div className="form-group">
                  <label>{t('amount')} *</label>
                  <input type="number" step="0.01" value={editItem.amount} onChange={e => setEditItem({...editItem, amount: e.target.value})} required />
                </div>
                <div className="form-group">
                  <label>{t('date')}</label>
                  <input type="date" value={editItem.expense_date || ''} onChange={e => setEditItem({...editItem, expense_date: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>{t('land')} *</label>
                  <select value={editItem.land_id} onChange={e => setEditItem({...editItem, land_id: e.target.value})} required>
                    {lands.map(l => <option key={l.land_id} value={l.land_id}>{l.area} - {l.location || l.land_id}</option>)}
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
