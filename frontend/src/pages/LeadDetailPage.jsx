import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getLead, updateLeadStatus, addNote } from '../services/leads';
import { STATUS_CONFIG, ALL_STATUSES } from '../components/StatusBadge';
import { format, formatDistanceToNow } from 'date-fns';

export default function LeadDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [lead, setLead] = useState(null);
  const [loading, setLoading] = useState(true);
  const [savingStatus, setSavingStatus] = useState(false);
  const [noteContent, setNoteContent] = useState('');
  const [savingNote, setSavingNote] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const data = await getLead(id);
        setLead(data);
      } catch {
        setError('Lead not found.');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  async function handleStatusChange(status) {
    if (lead.status === status || savingStatus) return;
    setSavingStatus(true);
    try {
      await updateLeadStatus(id, status);
      setLead(prev => ({ ...prev, status, updatedAt: new Date() }));
    } catch {
      alert('Failed to update status.');
    } finally {
      setSavingStatus(false);
    }
  }

  async function handleAddNote(e) {
    e.preventDefault();
    if (!noteContent.trim()) return;
    setSavingNote(true);
    try {
      const note = await addNote(id, noteContent.trim());
      setLead(prev => ({ ...prev, notes: [note, ...(prev.notes || [])] }));
      setNoteContent('');
    } catch {
      alert('Failed to add note.');
    } finally {
      setSavingNote(false);
    }
  }

  if (loading) return (
    <div className="loading-screen" style={{ height: '60vh' }}>
      <div className="spinner" />
    </div>
  );

  if (error || !lead) return (
    <div className="page-content" style={{ paddingTop: 32 }}>
      <p style={{ color: 'var(--text2)' }}>{error || 'Lead not found.'}</p>
      <button className="btn-sm secondary" style={{ marginTop: 12 }} onClick={() => navigate('/leads')}>
        ← Back to Leads
      </button>
    </div>
  );

  return (
    <>
      <div className="page-header">
        <button className="btn-back" onClick={() => navigate('/leads')}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
          Back to Leads
        </button>
        <h1>{lead.name}</h1>
        <p>{lead.email}{lead.phone ? ` · ${lead.phone}` : ''}</p>
      </div>

      <div className="page-content">
        <div className="detail-grid">
          {/* Left column */}
          <div>
            {/* Lead Info */}
            <div className="detail-card">
              <h3>Lead Information</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 24px' }}>
                <div className="info-row">
                  <span className="info-label">Full Name</span>
                  <span className="info-value">{lead.name}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Email</span>
                  <span className="info-value">
                    <a href={`mailto:${lead.email}`} style={{ color: 'var(--accent2)' }}>{lead.email}</a>
                  </span>
                </div>
                <div className="info-row">
                  <span className="info-label">Phone</span>
                  <span className="info-value">{lead.phone || '—'}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Source</span>
                  <span className="info-value" style={{ textTransform: 'capitalize' }}>{lead.source || '—'}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Created</span>
                  <span className="info-value">
                    {lead.createdAt ? format(lead.createdAt, 'MMM d, yyyy · h:mm a') : '—'}
                  </span>
                </div>
                <div className="info-row">
                  <span className="info-label">Last Updated</span>
                  <span className="info-value">
                    {lead.updatedAt ? formatDistanceToNow(lead.updatedAt, { addSuffix: true }) : '—'}
                  </span>
                </div>
              </div>
              {lead.message && (
                <div className="info-row" style={{ marginTop: 12 }}>
                  <span className="info-label">Message</span>
                  <span className="info-value" style={{ color: 'var(--text2)', lineHeight: 1.6 }}>{lead.message}</span>
                </div>
              )}
            </div>

            {/* Status */}
            <div className="detail-card">
              <h3>Pipeline Status</h3>
              <div className="status-select-wrap">
                {ALL_STATUSES.map(s => (
                  <button
                    key={s}
                    className={`status-btn ${lead.status === s ? `active-${s}` : ''}`}
                    onClick={() => handleStatusChange(s)}
                    disabled={savingStatus}
                  >
                    {STATUS_CONFIG[s].label}
                  </button>
                ))}
              </div>
              {savingStatus && (
                <p style={{ fontSize: 12, color: 'var(--text3)', marginTop: 10 }}>Saving…</p>
              )}
            </div>

            {/* Notes */}
            <div className="detail-card">
              <h3>Follow-up Notes</h3>

              <form className="note-form" onSubmit={handleAddNote}>
                <textarea
                  className="note-textarea"
                  placeholder="Add a follow-up note, call summary, or next steps…"
                  value={noteContent}
                  onChange={e => setNoteContent(e.target.value)}
                  rows={3}
                />
                <button className="btn-sm primary" type="submit" disabled={savingNote || !noteContent.trim()}>
                  {savingNote ? 'Saving…' : '+ Add Note'}
                </button>
              </form>

              {lead.notes && lead.notes.length > 0 ? (
                <div className="notes-list" style={{ marginTop: 20 }}>
                  {lead.notes.map(note => (
                    <div key={note.id} className="note-item">
                      <div className="note-meta">
                        <span className="note-author">{note.author || 'admin'}</span>
                        <span className="note-time">
                          {note.createdAt
                            ? formatDistanceToNow(note.createdAt instanceof Date ? note.createdAt : new Date(note.createdAt), { addSuffix: true })
                            : ''}
                        </span>
                      </div>
                      <div className="note-body">{note.content}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ color: 'var(--text3)', fontSize: 13, marginTop: 16 }}>
                  No notes yet. Add your first follow-up above.
                </p>
              )}
            </div>
          </div>

          {/* Right column — quick summary */}
          <div>
            <div className="detail-card">
              <h3>Quick Summary</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ textAlign: 'center', padding: '16px 0', borderBottom: '1px solid var(--border)' }}>
                  <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Current Status</div>
                  <span className={`badge badge-${lead.status}`} style={{ fontSize: 14, padding: '6px 16px' }}>
                    {STATUS_CONFIG[lead.status]?.label}
                  </span>
                </div>
                <div className="info-row">
                  <span className="info-label">Notes Count</span>
                  <span className="info-value">{lead.notes?.length ?? 0}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Source</span>
                  <span className="info-value" style={{ textTransform: 'capitalize' }}>{lead.source || 'website'}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Lead Age</span>
                  <span className="info-value">
                    {lead.createdAt ? formatDistanceToNow(lead.createdAt) : '—'}
                  </span>
                </div>
              </div>
            </div>

            <div className="detail-card">
              <h3>Quick Actions</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <a
                  href={`mailto:${lead.email}`}
                  className="btn-sm secondary"
                  style={{ justifyContent: 'center' }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                    <polyline points="22,6 12,13 2,6"/>
                  </svg>
                  Send Email
                </a>
                {lead.status === 'new' && (
                  <button
                    className="btn-sm primary"
                    style={{ justifyContent: 'center' }}
                    onClick={() => handleStatusChange('contacted')}
                    disabled={savingStatus}
                  >
                    Mark as Contacted
                  </button>
                )}
                {lead.status === 'contacted' && (
                  <button
                    className="btn-sm primary"
                    style={{ justifyContent: 'center', background: 'var(--green)' }}
                    onClick={() => handleStatusChange('converted')}
                    disabled={savingStatus}
                  >
                    Mark as Converted ✓
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
