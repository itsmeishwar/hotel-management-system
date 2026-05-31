import { useEffect, useState } from 'react';
import { PageHeader } from '../components/ui/PageHeader';
import { Badge } from '../components/ui/Badge';
import { DataTable } from '../components/ui/DataTable';
import { reportsApi } from '../lib/api';

function guestName(guest) {
  if (!guest) return '—';
  return `${guest.firstName} ${guest.lastName}`;
}

function formatMoney(n) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n || 0);
}

export default function Reports() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError('');
      try {
        const res = await reportsApi.dashboard();
        setData(res.data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const recentColumns = [
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
      key: 'status',
      label: 'Status',
      render: (row) => <Badge status={row.status} />
    }
  ];

  if (loading) {
    return (
      <div>
        <PageHeader title="Reports" subtitle="Property overview" />
        <p className="text-sm text-ink-muted">Loading report data…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <PageHeader title="Reports" subtitle="Property overview" />
        <p className="text-sm text-terracotta">{error}</p>
      </div>
    );
  }

  const { rooms, guests, finance, housekeeping, recentReservations } = data;

  return (
    <div>
      <PageHeader
        title="Reports"
        subtitle={`Occupancy ${rooms?.occupancyRate ?? 0}% · ${new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`}
      />

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="panel p-4">
          <p className="text-xs text-ink-faint uppercase tracking-wide">Occupancy</p>
          <p className="font-serif text-2xl mt-1">{rooms?.occupancyRate ?? 0}%</p>
          <p className="text-xs text-ink-muted mt-1">
            {rooms?.occupied} of {rooms?.total} rooms
          </p>
        </div>
        <div className="panel p-4">
          <p className="text-xs text-ink-faint uppercase tracking-wide">Revenue (month)</p>
          <p className="font-serif text-2xl mt-1">{formatMoney(finance?.monthlyRevenue)}</p>
        </div>
        <div className="panel p-4">
          <p className="text-xs text-ink-faint uppercase tracking-wide">Guests in house</p>
          <p className="font-serif text-2xl mt-1">{guests?.checkedInToday ?? 0}</p>
          <p className="text-xs text-ink-muted mt-1">{guests?.checkOutsToday ?? 0} departing today</p>
        </div>
        <div className="panel p-4">
          <p className="text-xs text-ink-faint uppercase tracking-wide">HK backlog</p>
          <p className="font-serif text-2xl mt-1">{housekeeping?.pendingTasks ?? 0}</p>
          <p className="text-xs text-ink-muted mt-1">
            {finance?.overdueInvoices ?? 0} overdue invoices
          </p>
        </div>
      </div>

      <div className="panel">
        <div className="panel-header">
          <h2 className="text-sm font-medium text-ink">Recent reservations</h2>
        </div>
        <div className="panel-body p-0">
          <DataTable
            columns={recentColumns}
            rows={recentReservations || []}
            emptyMessage="No recent reservation activity."
          />
        </div>
      </div>
    </div>
  );
}
