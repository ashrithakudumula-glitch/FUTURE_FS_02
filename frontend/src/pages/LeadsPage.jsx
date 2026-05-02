import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { getLeads, deleteLead } from '../services/leads';
import StatusBadge, { ALL_STATUSES } from '../components/StatusBadge';
import AddLeadModal from '../components/AddLeadModal';
import { formatDistanceToNow } from 'date-fns';

const SOURCES = ['website', 'referral', 'social', 'email', 'cold-outreach', 'event', 'other'];

export default function LeadsPage() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const navigate = useNavigate();

  async function loadLeads() {
    setLoading(true);
    try {
      const data = await getLeads({ status: statusFilter || undefined, source: sourceFilter || undefined });
      setLeads(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadLeads(); }, [statusFilter, sourceFilter]);

  const filtered = useMemo(() => {
    if (!search.trim()) return leads;
    const q = search.toLowerCase();
    return leads.filter(l =>
      l.name?.toLowerCase().includes(q) ||
      l.email?.toLowerCase().includes(q) ||
      l.message?.toLowerCase().includes(q) ||
      l.source?.toLowerCase().includes(q)
    );
  }, [leads, search]);

  async function handleDelete(e, id) {
    e.stopPropagation();
    if (!confirm('Delete this lead and all its notes?')) return;
    setDeletingId(id);
    try {
      await deleteLead(id);
      setLeads(prev => prev.filter(l => l.id !== id));
    } catch {
      alert('Failed to delete lead.');
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <>
      <div className="page-header">
        <h1>Leads</h1>
        <p>{filtered.length} lead{filtered.length !== 1 ? 's' : ''} found</p>
      </div>

      <div className="page-content">
        <div className="leads-toolbar">
          {/* Search */}
          <div className="search-wrap">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              className="search-input"
              placeholder="Search name, email, message…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          {/* Filters */}
          <select className="filter-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="">All Statuses</option>
            {ALL_STATUSES.map(s => (
              <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
            ))}
          </select>

          <select className="filter-select" value={sourceFilter} onChange={e => setSourceFilter(e.target.value)}>
            <option value="">All Sources</option>
            {SOURCES.map(s => (
              <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
            ))}
          </select>

          {/* Add Lead */}
          <button className="btn-primary" onClick={() => setShowModal(true)}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Add Lead
          </button>
        </div>

        {loading ? (
          <div className="loading-screen" style={{ height: 300 }}>
            <div className="spinner" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
            <p>No leads found</p>
            <small>{search ? 'Try adjusting your search or filters' : 'Add your first lead or wait for contact form submissions'}</small>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Name / Email</th>
                  <th>Source</th>
                  <th>Status</th>
                  <th>Added</th>
                  <th>Last Update</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(lead => (
                  <tr key={lead.id} onClick={() => navigate(`/leads/${lead.id}`)}>
                    <td>
                      <div className="lead-name">{lead.name}</div>
                      <div className="lead-email">{lead.email}</div>
                    </td>
                    <td>
                      <span style={{ fontSize: 13, color: 'var(--text2)' }}>{lead.source || '—'}</span>
                    </td>
                    <td><StatusBadge status={lead.status} /></td>
                    <td style={{ color: 'var(--text3)', fontSize: 13 }}>
                      {lead.createdAt ? formatDistanceToNow(lead.createdAt, { addSuffix: true }) : '—'}
                    </td>
                    <td style={{ color: 'var(--text3)', fontSize: 13 }}>
                      {lead.updatedAt ? formatDistanceToNow(lead.updatedAt, { addSuffix: true }) : '—'}
                    </td>
                    <td>
                      <div className="actions-cell" onClick={e => e.stopPropagation()}>
                        <button
                          className="btn-icon"
                          title="View Lead"
                          onClick={() => navigate(`/leads/${lead.id}`)}
                        >
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                            <circle cx="12" cy="12" r="3"/>
                          </svg>
                        </button>
                        <button
                          className="btn-icon danger"
                          title="Delete Lead"
                          disabled={deletingId === lead.id}
                          onClick={e => handleDelete(e, lead.id)}
                        >
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="3 6 5 6 21 6"/>
                            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                            <path d="M10 11v6"/><path d="M14 11v6"/>
                            <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <AddLeadModal
          onClose={() => setShowModal(false)}
          onCreated={() => loadLeads()}
        />
      )}
    </>
  );
}
