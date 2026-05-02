import { useState } from 'react';
import { createLead } from '../services/leads';

const SOURCES = ['website', 'referral', 'social', 'email', 'cold-outreach', 'event', 'other'];

export default function AddLeadModal({ onClose, onCreated }) {
  const [form, setForm] = useState({ name: '', email: '', phone: '', message: '', source: 'website' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function set(k, v) { setForm(f => ({ ...f, [k]: v })); }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim()) {
      setError('Name and email are required.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const id = await createLead(form);
      onCreated(id);
      onClose();
    } catch (err) {
      setError('Failed to create lead. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h2>Add New Lead</h2>
          <button className="btn-close" onClick={onClose}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {error && <div className="error-msg">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div className="form-group">
              <label>Full Name *</label>
              <input className="form-input" value={form.name} onChange={e => set('name', e.target.value)} placeholder="Jane Smith" />
            </div>
            <div className="form-group">
              <label>Email *</label>
              <input className="form-input" type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="jane@example.com" />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div className="form-group">
              <label>Phone</label>
              <input className="form-input" value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="+1 555 000 0000" />
            </div>
            <div className="form-group">
              <label>Source</label>
              <select className="form-input filter-select" style={{ width: '100%' }} value={form.source} onChange={e => set('source', e.target.value)}>
                {SOURCES.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Message / Notes</label>
            <textarea className="note-textarea" rows={3} value={form.message} onChange={e => set('message', e.target.value)} placeholder="What are they interested in?" />
          </div>

          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '8px' }}>
            <button type="button" className="btn-sm secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-sm primary" disabled={loading}>
              {loading ? 'Creating…' : 'Create Lead'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
