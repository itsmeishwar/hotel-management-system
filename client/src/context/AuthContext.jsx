import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { authApi, getToken, setToken, clearToken, setUnauthorizedHandler } from '../lib/api';

const AuthContext = createContext(null);

function hasPermission(user, permission) {
  if (!user) return false;
  if (user.role === 'admin') return true;

  const perms = user.permissions || {};
  if (perms.all) return true;

  if (perms[permission] === true) return true;

  const [resource, action] = permission.split('.');
  if (resource && action && perms[resource]) {
    return perms[resource].includes(action) || perms[resource].includes('all');
  }

  return false;
}

function canAccessNav(user, navItem) {
  if (!user) return false;
  if (user.role === 'admin') return true;
  if (navItem.roles?.includes(user.role)) return true;
  if (navItem.permission && hasPermission(user, navItem.permission)) return true;
  return false;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const logout = useCallback(async () => {
    try {
      if (getToken()) await authApi.logout();
    } catch {
      // ignore logout errors
    } finally {
      clearToken();
      setUser(null);
    }
  }, []);

  const loadProfile = useCallback(async () => {
    const token = getToken();
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const res = await authApi.profile();
      setUser(res.data);
    } catch {
      clearToken();
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      setUser(null);
    });
    loadProfile();
  }, [loadProfile]);

  const login = async (email, password) => {
    const res = await authApi.login(email, password);
    setToken(res.data.token);
    setUser(res.data.user);
    return res.data.user;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        hasPermission: (p) => hasPermission(user, p),
        canAccessNav: (item) => canAccessNav(user, item)
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
