import { useEffect, useState } from 'react';
import { PageHeader } from '../components/ui/PageHeader';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { DataTable } from '../components/ui/DataTable';
import { housekeepingApi } from '../lib/api';
import { useAuth } from '../context/AuthContext';

export default function Housekeeping() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updating, setUpdating] = useState(null);

  const isHousekeeper = user?.role === 'housekeeping';

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      if (isHousekeeper) {
        const res = await housekeepingApi.myTasks();
        setTasks(res.data);
      } else {
        const [tasksRes, dashRes] = await Promise.all([
          housekeepingApi.tasks({ limit: 50 }),
          housekeepingApi.dashboard()
        ]);
        setTasks(tasksRes.data?.tasks || tasksRes.data || []);
        setDashboard(dashRes.data);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [isHousekeeper]);

  const updateStatus = async (task, newStatus) => {
    setUpdating(task.id);
    try {
      await housekeepingApi.updateTask(task.id, { status: newStatus });
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setUpdating(null);
    }
  };

  const columns = [
    {
      key: 'room',
      label: 'Room',
      render: (row) => (row.room ? `Room ${row.room.roomNumber}` : '—')
    },
    {
      key: 'taskType',
      label: 'Task',
      render: (row) => row.taskType?.replace(/_/g, ' ')
    },
    {
      key: 'priority',
      label: 'Priority',
      render: (row) => <Badge status={row.priority}>{row.priority}</Badge>
    },
    {
      key: 'status',
      label: 'Status',
      render: (row) => <Badge status={row.status} />
    },
    {
      key: 'actions',
      label: '',
      render: (row) => {
        if (row.status === 'pending') {
          return (
            <Button
              size="sm"
              variant="secondary"
              disabled={updating === row.id}
              onClick={(e) => {
                e.stopPropagation();
                updateStatus(row, 'in_progress');
              }}
            >
              Start
            </Button>
          );
        }
        if (row.status === 'in_progress') {
          return (
            <Button
              size="sm"
              disabled={updating === row.id}
              onClick={(e) => {
                e.stopPropagation();
                updateStatus(row, 'completed');
              }}
            >
              Mark done
            </Button>
          );
        }
        return null;
      }
    }
  ];

  return (
    <div>
      <PageHeader
        title={isHousekeeper ? 'My tasks' : 'Housekeeping'}
        subtitle={
          isHousekeeper
            ? 'Rooms assigned to you today'
            : 'Turnover and cleaning queue'
        }
      />

      {error && <p className="text-sm text-terracotta mb-4">{error}</p>}

      {dashboard && !isHousekeeper && (
        <div className="panel flex flex-wrap mb-6 overflow-hidden">
          {(dashboard.todayTasksByStatus || []).map((item) => (
            <div key={item.status} className="stat-strip-item">
              <span className="stat-strip-value">{item.count || item.dataValues?.count}</span>
              <span className="stat-strip-label capitalize">{item.status?.replace(/_/g, ' ')}</span>
            </div>
          ))}
        </div>
      )}

      <div className="panel">
        <div className="panel-header">
          <h2 className="text-sm font-medium text-ink">
            {isHousekeeper ? 'Assigned rooms' : 'All tasks'}
          </h2>
        </div>
        <div className="panel-body p-0">
          {loading ? (
            <p className="text-sm text-ink-muted py-8 text-center">Loading tasks…</p>
          ) : (
            <DataTable
              columns={columns}
              rows={tasks}
              emptyMessage="No housekeeping tasks right now. Rooms are in good shape."
            />
          )}
        </div>
      </div>
    </div>
  );
}
