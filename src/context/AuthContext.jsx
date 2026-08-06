import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { authService } from '../services/authService';
import { setUnauthorizedHandler } from '../services/apiClient';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // On refresh, ask the backend who we are — the httpOnly access-token
    // cookie (if any) rides along automatically. This is what makes auth
    // state survive a page reload without touching localStorage.
    authService.me()
      .then(({ user: current }) => setUser(current))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    // Any 401 anywhere in the app means the session is gone — clear it
    // so protected routes redirect to /login instead of looking "stuck".
    setUnauthorizedHandler(() => setUser(null));
    return () => setUnauthorizedHandler(null);
  }, []);

  const login = useCallback(async (identifier, password) => {
    const { user: loggedIn } = await authService.login({ identifier, password });
    setUser(loggedIn);
    return loggedIn;
  }, []);

  const register = useCallback(async (payload) => {
    const { user: created } = await authService.register(payload);
    setUser(created);
    return created;
  }, []);

  const logout = useCallback(async () => {
    try { await authService.logout(); } catch { /* still clear local state */ }
    setUser(null);
  }, []);

  const updateProfile = useCallback(async (patch) => {
    const { user: updated } = await authService.updateProfile(patch);
    setUser(updated);
    return updated;
  }, []);

  const value = {
    user, loading, isAuthenticated: Boolean(user),
    login, register, logout, updateProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
