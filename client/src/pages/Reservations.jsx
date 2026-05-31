import { useEffect, useState } from 'react';
import { PageHeader } from '../components/ui/PageHeader';
import { Badge } from '../components/ui/Badge';
import { DataTable } from '../components/ui/DataTable';
import { reservationsApi } from '../lib/api';

function guestName(guest) {
  if (!guest) return '—';
  return `${guest.firstName} ${guest.lastName}`;
}

function formatDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function Reservations() {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError('');
      try {
        const params = { limit: 50, sortOrder: 'desc' };
        if (statusFilter) params.status = statusFilter;
        const res = await reservationsApi.list(params);
        setReservations(res.data?.reservations || res.data || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [statusFilter]);

  const columns = [
    {
      key: 'confirmationNumber',
      label: 'Conf #',
      render: (row) => (
        <span className="font-mono text-xs">{row.confirmationNumber}</span>
      )
    },
    {
      key: 'guest',
      label: 'Guest',
      render: (row) => guestName(row.guest)
    },
    {
      key: 'room',
      label: 'Room',
      render: (row) => (row.room ? row.room.roomNumber : '—')
    },
    {
      key: 'dates',
      label: 'Stay',
      render: (row) => `${formatDate(row.checkInDate)} – ${formatDate(row.checkOutDate)}`
    },
    {
      key: 'status',
      label: 'Status',
      render: (row) => <Badge status={row.status} />
    },
    {
      key: 'source',
      label: 'Source',
      render: (row) => (
        <span className="capitalize text-ink-muted">{row.bookingSource?.replace(/_/g, ' ')}</span>
      )
    }
  ];

  return (
    <div>
      <PageHeader title="Reservations" subtitle="Active and upcoming stays" />

      {error && <p className="text-sm text-terracotta mb-4">{error}</p>}

      <div className="flex gap-2 mb-4">
        {['', 'confirmed', 'checked_in', 'checked_out', 'cancelled'].map((s) => (
          <button
            key={s || 'all'}
            type="button"
            onClick={() => setStatusFilter(s)}
            className={`text-xs px-3 py-1.5 rounded-md border transition-colors ${
              statusFilter === s
                ? 'bg-olive/10 border-olive/30 text-olive-dark'
                : 'border-cream-300 text-ink-muted hover:bg-cream-50'
            }`}
          >
            {s ? s.replace(/_/g, ' ') : 'All'}
          </button>
        ))}
      </div>

      <div className="panel">
        <div className="panel-body p-0">
          {loading ? (
            <p className="text-sm text-ink-muted py-8 text-center">Loading reservations…</p>
          ) : (
            <DataTable
              columns={columns}
              rows={reservations}
              emptyMessage="No reservations match this filter."
            />
          )}
        </div>
      </div>
    </div>
  );
}
