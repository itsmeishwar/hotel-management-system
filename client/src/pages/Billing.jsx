import { useEffect, useState } from 'react';
import { PageHeader } from '../components/ui/PageHeader';
import { Badge } from '../components/ui/Badge';
import { DataTable } from '../components/ui/DataTable';
import { billingApi } from '../lib/api';

function guestName(guest) {
  if (!guest) return '—';
  return `${guest.firstName} ${guest.lastName}`;
}

function formatMoney(n) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n || 0);
}

export default function Billing() {
  const [invoices, setInvoices] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError('');
      try {
        const [listRes, summaryRes] = await Promise.all([
          billingApi.list({ limit: 50 }),
          billingApi.summary().catch(() => null)
        ]);
        setInvoices(listRes.data || []);
        if (summaryRes?.data) setSummary(summaryRes.data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const columns = [
    {
      key: 'invoiceNumber',
      label: 'Invoice',
      render: (row) => <span className="font-mono text-xs">{row.invoiceNumber}</span>
    },
    {
      key: 'guest',
      label: 'Guest',
      render: (row) => guestName(row.guest)
    },
    {
      key: 'totalAmount',
      label: 'Total',
      render: (row) => formatMoney(row.totalAmount)
    },
    {
      key: 'balance',
      label: 'Balance',
      render: (row) => (
        <span className={row.balance > 0 ? 'text-terracotta' : 'text-ink-muted'}>
          {formatMoney(row.balance)}
        </span>
      )
    },
    {
      key: 'status',
      label: 'Status',
      render: (row) => <Badge status={row.status} />
    },
    {
      key: 'issueDate',
      label: 'Issued',
      render: (row) =>
        row.issueDate
          ? new Date(row.issueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
          : '—'
    }
  ];

  return (
    <div>
      <PageHeader title="Billing" subtitle="Invoices and outstanding balances" />

      {error && <p className="text-sm text-terracotta mb-4">{error}</p>}

      {summary && (
        <div className="panel flex flex-wrap mb-6 overflow-hidden">
          <div className="stat-strip-item">
            <span className="stat-strip-value">{formatMoney(summary.totalRevenue)}</span>
            <span className="stat-strip-label">Revenue (period)</span>
          </div>
          <div className="stat-strip-item">
            <span className="stat-strip-value">{summary.byStatus?.partial ?? 0}</span>
            <span className="stat-strip-label">Partial payment</span>
          </div>
          <div className="stat-strip-item">
            <span className="stat-strip-value">{summary.byStatus?.overdue ?? 0}</span>
            <span className="stat-strip-label">Overdue</span>
          </div>
        </div>
      )}

      <div className="panel">
        <div className="panel-header">
          <h2 className="text-sm font-medium text-ink">Recent invoices</h2>
        </div>
        <div className="panel-body p-0">
          {loading ? (
            <p className="text-sm text-ink-muted py-8 text-center">Loading invoices…</p>
          ) : (
            <DataTable
              columns={columns}
              rows={invoices}
              emptyMessage="No invoices yet."
            />
          )}
        </div>
      </div>
    </div>
  );
}
