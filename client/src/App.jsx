import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import AppShell from './layouts/AppShell';
import Login from './pages/Login';
import FrontDesk from './pages/FrontDesk';
import Rooms from './pages/Rooms';
import Reservations from './pages/Reservations';
import Housekeeping from './pages/Housekeeping';
import Billing from './pages/Billing';
import Reports from './pages/Reports';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream-100">
        <p className="text-sm text-ink-muted">Loading…</p>
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function DefaultRedirect() {
  const { user, canAccessNav } = useAuth();
  const routes = [
    { to: '/front-desk', item: { permission: 'checkin', roles: ['front_desk'] } },
    { to: '/housekeeping', item: { permission: 'housekeeping.read', roles: ['housekeeping'] } },
    { to: '/reports', item: { roles: ['management', 'front_desk'] } },
    { to: '/rooms', item: { permission: 'rooms.read', roles: ['housekeeping'] } }
  ];

  for (const r of routes) {
    if (canAccessNav(r.item)) return <Navigate to={r.to} replace />;
  }
  return <Navigate to="/front-desk" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <AppShell />
              </ProtectedRoute>
            }
          >
            <Route index element={<DefaultRedirect />} />
            <Route path="front-desk" element={<FrontDesk />} />
            <Route path="rooms" element={<Rooms />} />
            <Route path="reservations" element={<Reservations />} />
            <Route path="housekeeping" element={<Housekeeping />} />
            <Route path="billing" element={<Billing />} />
            <Route path="reports" element={<Reports />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
