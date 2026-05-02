const STATUS_CONFIG = {
  new:       { label: 'New',       cls: 'badge-new' },
  contacted: { label: 'Contacted', cls: 'badge-contacted' },
  converted: { label: 'Converted', cls: 'badge-converted' },
  lost:      { label: 'Lost',      cls: 'badge-lost' },
};

export default function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.new;
  return <span className={`badge ${cfg.cls}`}>{cfg.label}</span>;
}

export const ALL_STATUSES = Object.keys(STATUS_CONFIG);
export { STATUS_CONFIG };
