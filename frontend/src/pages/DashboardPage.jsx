import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAnalytics, getLeads } from '../services/leads';
import StatusBadge from '../components/StatusBadge';
import { formatDistanceToNow } from 'date-fns';

const STATUS_COLORS = {
  new: '#3b82f6',
  contacted: '#eab308',
  converted: '#22c55e',
  lost: '#ef4444',
};

function StatCard({ label, value, sub, color }) {
  return (
    <div className="stat-card">
      <div className="stat-card-accent" style={{ background: color }} />
      <div className="stat-card-label">{label}</div>
      <div className="stat-card-value" style={{ color }}>{value}</div>
      {sub && <div className="stat-card-sub">{sub}</div>}
    </div>
  );
}

export default function DashboardPage() {
  const [analytics, setAnalytics] = useState(null);
  const [recentLeads, setRecentLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    async function load() {
      try {
        const [a, leads] = await Promise.all([getAnalytics(), getLeads()]);
        setAnalytics(a);
        setRecentLeads(leads.slice(0, 5));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) return (
    <div style={{ padding: 32 }}>
      <div className="loading-screen" style={{ height: 300 }}>
        <div className="spinner" />
      </div>
    </div>
  );

  const maxSource = analytics?.bySource
    ? Math.max(...Object.values(analytics.bySource), 1)
    : 1;

  return (
    <>
      <div className="page-header">
        <h1>Dashboard</h1>
        <p>Overview of your lead pipeline</p>
      </div>

      <div className="page-content">
        {/* Stats */}
        <div className="stats-grid">
          <StatCard label="Total Leads"   value={analytics?.total ?? 0}  sub={`${analytics?.recentCount ?? 0} this week`} color="var(--accent2)" />
          <StatCard label="New"           value={analytics?.new ?? 0}    sub="Awaiting contact" color={STATUS_COLORS.new} />
          <StatCard label="Contacted"     value={analytics?.contacted ?? 0} sub="In progress" color={STATUS_COLORS.contacted} />
          <StatCard label="Converted"     value={analytics?.converted ?? 0} sub="Closed won" color={STATUS_COLORS.converted} />
          <StatCard label="Lost"          value={analytics?.lost ?? 0}   sub="Closed lost" color={STATUS_COLORS.lost} />
          <StatCard label="Conv. Rate"    value={`${analytics?.conversionRate ?? 0}%`} sub="All time" color="var(--accent)" />
        </div>

        {/* Charts row */}
        <div className="analytics-row">
          {/* Source breakdown */}
          <div className="card">
            <div className="card-title">Leads by Source</div>
            {analytics?.bySource && Object.keys(analytics.bySource).length > 0 ? (
              Object.entries(analytics.bySource)
                .sort((a, b) => b[1] - a[1])
                .map(([source, count]) => (
                  <div className="bar-item" key={source}>
                    <span className="bar-label">{source}</span>
                    <div className="bar-track">
                      <div
                        className="bar-fill"
                        style={{ width: `${Math.round((count / maxSource) * 100)}%` }}
                      />
                    </div>
                    <span className="bar-count">{count}</span>
                  </div>
                ))
            ) : (
              <p style={{ color: 'var(--text3)', fontSize: 13 }}>No data yet</p>
            )}
          </div>

          {/* Status funnel */}
          <div className="card">
            <div className="card-title">Pipeline Funnel</div>
            {[
              { key: 'new',       label: 'New' },
              { key: 'contacted', label: 'Contacted' },
              { key: 'converted', label: 'Converted' },
              { key: 'lost',      label: 'Lost' },
            ].map(({ key, label }) => (
              <div className="funnel-item" key={key}>
                <span className="funnel-dot" style={{ background: STATUS_COLORS[key] }} />
                <span className="funnel-name">{label}</span>
                <span className="funnel-count">{analytics?.[key] ?? 0}</span>
                <span className="funnel-pct">
                  {analytics?.total
                    ? `${Math.round(((analytics[key] ?? 0) / analytics.total) * 100)}%`
                    : '—'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent leads */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div className="card-title" style={{ marginBottom: 0 }}>Recent Leads</div>
            <button className="btn-sm secondary" onClick={() => navigate('/leads')}>View All →</button>
          </div>

          {recentLeads.length === 0 ? (
            <div className="empty-state" style={{ padding: '30px 20px' }}>
              <p>No leads yet</p>
              <small>Leads submitted through your contact form will appear here</small>
            </div>
          ) : (
            <div className="table-wrap" style={{ border: 'none', background: 'transparent' }}>
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Source</th>
                    <th>Status</th>
                    <th>Added</th>
                  </tr>
                </thead>
                <tbody>
                  {recentLeads.map(lead => (
                    <tr key={lead.id} onClick={() => navigate(`/leads/${lead.id}`)}>
                      <td className="lead-name">{lead.name}</td>
                      <td className="lead-email">{lead.email}</td>
                      <td><span style={{ color: 'var(--text2)', fontSize: 13 }}>{lead.source}</span></td>
                      <td><StatusBadge status={lead.status} /></td>
                      <td style={{ color: 'var(--text3)', fontSize: 13 }}>
                        {lead.createdAt ? formatDistanceToNow(lead.createdAt, { addSuffix: true }) : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
