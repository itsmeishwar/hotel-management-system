import { useEffect, useState } from 'react';
import { PageHeader } from '../components/ui/PageHeader';
import { Badge } from '../components/ui/Badge';
import { roomsApi } from '../lib/api';

const ROOM_STATUS_STYLES = {
  available: 'bg-olive/15 border-olive/30 text-olive-dark',
  occupied: 'bg-terracotta/15 border-terracotta/30 text-terracotta',
  cleaning: 'bg-status-cleaning/15 border-status-cleaning/30 text-status-cleaning',
  maintenance: 'bg-status-maintenance/15 border-status-maintenance/30 text-status-maintenance',
  reserved: 'bg-cream-200 border-cream-300 text-ink-muted'
};

const HK_STYLES = {
  clean: 'ring-1 ring-olive/40',
  dirty: 'ring-2 ring-status-dirty/50',
  inspected: 'ring-1 ring-olive/60'
};

function RoomCell({ room }) {
  const statusStyle = ROOM_STATUS_STYLES[room.status] || ROOM_STATUS_STYLES.available;
  const hkStyle = HK_STYLES[room.housekeepingStatus] || '';

  return (
    <div
      className={`room-cell ${statusStyle} ${hkStyle}`}
      title={`${room.roomNumber} — ${room.status}, ${room.housekeepingStatus}`}
    >
      <span className="text-sm font-serif">{room.roomNumber}</span>
      <span className="text-[10px] text-ink-faint capitalize mt-0.5">{room.roomType}</span>
    </div>
  );
}

export default function Rooms() {
  const [floors, setFloors] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [selectedFloor, setSelectedFloor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [overviewRes, roomsRes] = await Promise.all([
          roomsApi.floorOverview(),
          roomsApi.list({ limit: 200, sortBy: 'roomNumber', sortOrder: 'asc' })
        ]);
        setFloors(overviewRes.data);
        setRooms(roomsRes.data.rooms);
        if (overviewRes.data.length > 0) {
          setSelectedFloor(overviewRes.data[0].floor);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const floorRooms = rooms.filter((r) => r.floor === selectedFloor);

  return (
    <div>
      <PageHeader
        title="Room status"
        subtitle="Floor plan — tap a room for status at a glance"
      />

      {error && <p className="text-sm text-terracotta mb-4">{error}</p>}

      {floors.length > 0 && (
        <div className="panel flex flex-wrap mb-6 overflow-hidden">
          {floors.map((f) => (
            <button
              key={f.floor}
              type="button"
              onClick={() => setSelectedFloor(f.floor)}
              className={`stat-strip-item text-left hover:bg-cream-50 transition-colors ${
                selectedFloor === f.floor ? 'bg-cream-50' : ''
              }`}
            >
              <span className="stat-strip-value">Floor {f.floor}</span>
              <span className="stat-strip-label">
                {f.availableRooms || f.dataValues?.availableRooms || 0} free ·{' '}
                {f.occupiedRooms || f.dataValues?.occupiedRooms || 0} occupied
              </span>
            </button>
          ))}
        </div>
      )}

      <div className="flex flex-wrap gap-4 mb-6 text-xs text-ink-muted">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-olive/30" /> Available
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-terracotta/30" /> Occupied
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-status-cleaning/30" /> Cleaning
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded ring-2 ring-status-dirty/50" /> Needs cleaning
        </span>
      </div>

      {loading ? (
        <p className="text-sm text-ink-muted">Loading rooms…</p>
      ) : selectedFloor !== null ? (
        <div className="panel">
          <div className="panel-header">
            <h2 className="text-sm font-medium text-ink">Floor {selectedFloor}</h2>
            <span className="text-xs text-ink-faint">{floorRooms.length} rooms</span>
          </div>
          <div className="panel-body">
            {floorRooms.length === 0 ? (
              <p className="text-sm text-ink-muted">No rooms on this floor.</p>
            ) : (
              <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2">
                {floorRooms.map((room) => (
                  <RoomCell key={room.id} room={room} />
                ))}
              </div>
            )}
          </div>
        </div>
      ) : null}

      <div className="panel mt-6">
        <div className="panel-header">
          <h2 className="text-sm font-medium text-ink">Floor summary</h2>
        </div>
        <div className="panel-body p-0 overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Floor</th>
                <th>Total</th>
                <th>Available</th>
                <th>Occupied</th>
                <th>Dirty</th>
              </tr>
            </thead>
            <tbody>
              {floors.map((f) => {
                const d = f.dataValues || f;
                return (
                  <tr key={f.floor}>
                    <td>Floor {f.floor}</td>
                    <td>{d.totalRooms}</td>
                    <td><Badge status="available">{d.availableRooms}</Badge></td>
                    <td><Badge status="occupied">{d.occupiedRooms}</Badge></td>
                    <td><Badge status="dirty">{d.dirtyRooms}</Badge></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
