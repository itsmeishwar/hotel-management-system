import { useCallback, useEffect, useState } from 'react';
import { PageHeader } from '../components/ui/PageHeader';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { DataTable } from '../components/ui/DataTable';
import { frontDeskApi } from '../lib/api';

function formatToday() {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric'
  });
}

function guestName(guest) {
  if (!guest) return '—';
  return `${guest.firstName} ${guest.lastName}`;
}

export default function FrontDesk() {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState('');
  const [showWalkIn, setShowWalkIn] = useState(false);
  const [walkInForm, setWalkInForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    roomType: 'standard',
    checkOutDate: '',
    adults: 1,
    amountPaid: 0
  });

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await frontDeskApi.dashboard();
      setDashboard(res.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (searchQuery.length < 2) return;
    setSearching(true);
    try {
      const res = await frontDeskApi.searchGuests(searchQuery);
      setSearchResults(res.data);
    } catch {
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  const handleCheckIn = async () => {
    if (!selected) return;
    setActionLoading(true);
    setActionError('');
    try {
      await frontDeskApi.quickCheckIn({ reservationId: selected.id });
      setSelected(null);
      await loadDashboard();
    } catch (err) {
      setActionError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCheckOut = async () => {
    if (!selected) return;
    setActionLoading(true);
    setActionError('');
    try {
      await frontDeskApi.quickCheckOut({ reservationId: selected.id });
      setSelected(null);
      await loadDashboard();
    } catch (err) {
      setActionError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleWalkIn = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    setActionError('');
    const today = new Date().toISOString().split('T')[0];
    try {
      await frontDeskApi.walkIn({
        guestData: {
          firstName: walkInForm.firstName,
          lastName: walkInForm.lastName,
          email: walkInForm.email || undefined,
          phoneNumber: walkInForm.phoneNumber || undefined
        },
        roomData: { roomType: walkInForm.roomType },
        checkInDate: today,
        checkOutDate: walkInForm.checkOutDate,
        adults: walkInForm.adults,
        children: 0,
        amountPaid: Number(walkInForm.amountPaid) || 0
      });
      setShowWalkIn(false);
      setWalkInForm({
        firstName: '',
        lastName: '',
        email: '',
        phoneNumber: '',
        roomType: 'standard',
        checkOutDate: '',
        adults: 1,
        amountPaid: 0
      });
      await loadDashboard();
    } catch (err) {
      setActionError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const stats = dashboard?.stats;
  const arrivals = dashboard?.todayCheckIns || [];
  const departures = dashboard?.todayCheckOuts || [];

  const reservationColumns = [
    {
      key: 'guest',
      label: 'Guest',
      render: (row) => guestName(row.guest)
    },
    {
      key: 'room',
      label: 'Room',
      render: (row) => (row.room ? `Room ${row.room.roomNumber}` : '—')
    },
    {
      key: 'status',
      label: 'Status',
      render: (row) => <Badge status={row.status} />
    }
  ];

  return (
    <div>
      <PageHeader
        title="Front desk"
        subtitle={formatToday()}
        actions={
          <Button variant="secondary" onClick={() => setShowWalkIn(!showWalkIn)}>
            {showWalkIn ? 'Cancel walk-in' : 'Walk-in guest'}
          </Button>
        }
      />

      {error && (
        <p className="text-sm text-terracotta mb-4">{error}</p>
      )}

      {stats && (
        <div className="panel flex flex-wrap mb-6 overflow-hidden">
          <div className="stat-strip-item">
            <span className="stat-strip-value">{stats.todayCheckIns}</span>
            <span className="stat-strip-label">Arrivals today</span>
          </div>
          <div className="stat-strip-item">
            <span className="stat-strip-value">{stats.todayCheckOuts}</span>
            <span className="stat-strip-label">Departures today</span>
          </div>
          <div className="stat-strip-item">
            <span className="stat-strip-value">{stats.occupiedRooms}</span>
            <span className="stat-strip-label">In house</span>
          </div>
          <div className="stat-strip-item">
            <span className="stat-strip-value">{stats.availableRooms}</span>
            <span className="stat-strip-label">Rooms free</span>
          </div>
        </div>
      )}

      {showWalkIn && (
        <div className="panel mb-6">
          <div className="panel-header">
            <h2 className="text-sm font-medium text-ink">New walk-in</h2>
          </div>
          <form onSubmit={handleWalkIn} className="panel-body grid sm:grid-cols-2 gap-4">
            <Input
              label="First name"
              value={walkInForm.firstName}
              onChange={(e) => setWalkInForm({ ...walkInForm, firstName: e.target.value })}
              required
            />
            <Input
              label="Last name"
              value={walkInForm.lastName}
              onChange={(e) => setWalkInForm({ ...walkInForm, lastName: e.target.value })}
              required
            />
            <Input
              label="Email"
              type="email"
              value={walkInForm.email}
              onChange={(e) => setWalkInForm({ ...walkInForm, email: e.target.value })}
            />
            <Input
              label="Phone"
              value={walkInForm.phoneNumber}
              onChange={(e) => setWalkInForm({ ...walkInForm, phoneNumber: e.target.value })}
            />
            <div>
              <label className="block text-sm text-ink-muted mb-1">Room type</label>
              <select
                className="w-full px-3 py-2 text-sm bg-white border border-cream-300 rounded-md"
                value={walkInForm.roomType}
                onChange={(e) => setWalkInForm({ ...walkInForm, roomType: e.target.value })}
              >
                <option value="standard">Standard</option>
                <option value="deluxe">Deluxe</option>
                <option value="suite">Suite</option>
                <option value="presidential">Presidential</option>
              </select>
            </div>
            <Input
              label="Check-out date"
              type="date"
              value={walkInForm.checkOutDate}
              onChange={(e) => setWalkInForm({ ...walkInForm, checkOutDate: e.target.value })}
              required
            />
            {actionError && showWalkIn && (
              <p className="sm:col-span-2 text-xs text-terracotta">{actionError}</p>
            )}
            <div className="sm:col-span-2">
              <Button type="submit" disabled={actionLoading}>
                {actionLoading ? 'Processing…' : 'Register walk-in'}
              </Button>
            </div>
          </form>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="panel">
            <div className="panel-header">
              <h2 className="text-sm font-medium text-ink">Today&apos;s arrivals</h2>
              <span className="text-xs text-ink-faint">{arrivals.length} expected</span>
            </div>
            <div className="panel-body p-0">
              {loading ? (
                <p className="text-sm text-ink-muted py-8 text-center">Loading arrivals…</p>
              ) : (
                <DataTable
                  columns={reservationColumns}
                  rows={arrivals}
                  selectedId={selected?.id}
                  onRowClick={setSelected}
                  emptyMessage="No arrivals scheduled for today."
                />
              )}
            </div>
          </div>

          <div className="panel">
            <div className="panel-header">
              <h2 className="text-sm font-medium text-ink">Due checkout today</h2>
              <span className="text-xs text-ink-faint">{departures.length} guests</span>
            </div>
            <div className="panel-body p-0">
              <DataTable
                columns={reservationColumns}
                rows={departures}
                selectedId={selected?.id}
                onRowClick={setSelected}
                emptyMessage="No departures scheduled for today."
              />
            </div>
          </div>

          <div className="panel">
            <div className="panel-header">
              <h2 className="text-sm font-medium text-ink">Guest lookup</h2>
            </div>
            <div className="panel-body">
              <form onSubmit={handleSearch} className="flex gap-2 mb-4">
                <Input
                  className="flex-1"
                  placeholder="Last name, phone, or email"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <Button type="submit" variant="secondary" disabled={searching || searchQuery.length < 2}>
                  Search
                </Button>
              </form>
              {searchResults.length === 0 && searchQuery.length >= 2 && !searching ? (
                <p className="text-sm text-ink-muted">
                  No guests match that search. Try phone number or last name.
                </p>
              ) : (
                <ul className="divide-y divide-cream-100">
                  {searchResults.map((g) => (
                    <li key={g.id} className="py-2 flex justify-between text-sm">
                      <span>{guestName(g)}</span>
                      <span className="text-ink-faint">{g.phoneNumber || g.email}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>

        <div className="panel h-fit sticky top-6">
          <div className="panel-header">
            <h2 className="text-sm font-medium text-ink">Selected reservation</h2>
          </div>
          <div className="panel-body">
            {!selected ? (
              <p className="text-sm text-ink-muted">
                Select an arrival or departure from the list to check in or out.
              </p>
            ) : (
              <div className="space-y-4">
                <div>
                  <p className="font-serif text-lg">{guestName(selected.guest)}</p>
                  {selected.room && (
                    <p className="text-sm text-ink-muted mt-1">
                      Room {selected.room.roomNumber} · {selected.room.roomType}
                    </p>
                  )}
                  <div className="mt-2">
                    <Badge status={selected.status} />
                  </div>
                </div>

                {actionError && (
                  <p className="text-xs text-terracotta">{actionError}</p>
                )}

                <div className="flex flex-col gap-2">
                  {selected.status === 'confirmed' && (
                    <Button onClick={handleCheckIn} disabled={actionLoading}>
                      {actionLoading ? 'Working…' : 'Complete check-in'}
                    </Button>
                  )}
                  {selected.status === 'checked_in' && (
                    <Button onClick={handleCheckOut} disabled={actionLoading}>
                      {actionLoading ? 'Working…' : 'Complete check-out'}
                    </Button>
                  )}
                  <Button variant="ghost" size="sm" onClick={() => setSelected(null)}>
                    Clear selection
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
