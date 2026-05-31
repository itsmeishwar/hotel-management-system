const variants = {
  default: 'bg-cream-200 text-ink-muted',
  arriving: 'bg-olive/10 text-olive-dark',
  inhouse: 'bg-terracotta/10 text-terracotta',
  departing: 'bg-status-cleaning/10 text-status-cleaning',
  confirmed: 'bg-cream-200 text-ink-muted',
  checked_in: 'bg-olive/10 text-olive-dark',
  checked_out: 'bg-cream-200 text-ink-faint',
  pending: 'bg-status-cleaning/10 text-status-cleaning',
  in_progress: 'bg-terracotta/10 text-terracotta',
  completed: 'bg-olive/10 text-olive-dark',
  paid: 'bg-olive/10 text-olive-dark',
  partial: 'bg-status-cleaning/10 text-status-cleaning',
  overdue: 'bg-terracotta/10 text-terracotta',
  available: 'bg-olive/10 text-olive-dark',
  occupied: 'bg-terracotta/10 text-terracotta',
  cleaning: 'bg-status-cleaning/10 text-status-cleaning',
  dirty: 'bg-status-dirty/10 text-status-dirty',
  clean: 'bg-olive/10 text-olive-dark'
};

const labels = {
  checked_in: 'In house',
  checked_out: 'Departed',
  in_progress: 'In progress',
  walk_in: 'Walk-in'
};

export function Badge({ status, children, className = '' }) {
  const key = status?.toLowerCase?.() || 'default';
  const style = variants[key] || variants.default;
  const text = children || labels[key] || status?.replace(/_/g, ' ') || '—';

  return (
    <span
      className={`inline-block px-2 py-0.5 text-xs font-medium rounded capitalize ${style} ${className}`}
    >
      {text}
    </span>
  );
}
