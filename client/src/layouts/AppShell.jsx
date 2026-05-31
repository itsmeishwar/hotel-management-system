import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { PROPERTY_NAME } from '../config';

const NAV_ITEMS = [
  {
    to: '/front-desk',
    label: 'Front desk',
    permission: 'checkin',
    roles: ['front_desk']
  },
  {
    to: '/rooms',
    label: 'Rooms',
    permission: 'rooms.read',
    roles: ['housekeeping']
  },
  {
    to: '/reservations',
    label: 'Reservations',
    permission: 'reservations.read',
    roles: ['front_desk']
  },
  {
    to: '/housekeeping',
    label: 'Housekeeping',
    permission: 'housekeeping.read',
    roles: ['housekeeping']
  },
  {
    to: '/billing',
    label: 'Billing',
    permission: 'billing.read',
    roles: ['front_desk']
  },
  {
    to: '/reports',
    label: 'Reports',
    roles: ['management', 'front_desk']
  }
];

function NavItem({ item }) {
  const { canAccessNav } = useAuth();
  if (!canAccessNav(item)) return null;

  return (
    <NavLink
      to={item.to}
      className={({ isActive }) =>
        `block px-3 py-2 text-sm rounded-md transition-colors ${
          isActive
            ? 'bg-olive/10 text-olive-dark font-medium'
            : 'text-ink-muted hover:text-ink hover:bg-cream-100'
        }`
      }
    >
      {item.label}
    </NavLink>
  );
}

export default function AppShell() {
  const { user, logout, loading } = useAuth();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream-100">
        <p className="text-sm text-ink-muted">Loading…</p>
      </div>
    );
  }

  if (!user) {
    navigate('/login', { replace: true });
    return null;
  }

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const staffName = [user.firstName, user.lastName].filter(Boolean).join(' ');

  return (
    <div className="min-h-screen flex bg-cream-100">
      <aside className="w-52 shrink-0 bg-white border-r border-cream-300 flex flex-col">
        <div className="px-4 py-5 border-b border-cream-200">
          <p className="font-serif text-lg text-ink leading-tight">{PROPERTY_NAME}</p>
          <p className="text-xs text-ink-faint mt-0.5 capitalize">{user.role?.replace(/_/g, ' ')}</p>
        </div>

        <nav className="flex-1 p-3 space-y-0.5">
          {NAV_ITEMS.map((item) => (
            <NavItem key={item.to} item={item} />
          ))}
        </nav>

        <div className="p-3 border-t border-cream-200">
          <p className="text-xs text-ink-muted px-3 mb-2 truncate">{staffName}</p>
          <Button variant="ghost" size="sm" className="w-full justify-start" onClick={handleLogout}>
            Sign out
          </Button>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
