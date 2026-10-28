import {
  useState,
  useCallback,
  useEffect,
} from 'react';

import { AuthContext } from './authContext.js';
import { authService } from '../services/authService';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  const restoreSession = useCallback(async () => {
    setLoading(true);
    setAuthError(null);
    try {
      const { user: current } = await authService.me();
      setUser(current);
    } catch (error) {
      setUser(null);
      if (error.status !== 401) setAuthError(error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    restoreSession();
  }, [restoreSession]);

  const login = useCallback(async (identifier, password) => {
    const result = await authService.login({
      identifier,
      password,
    });

    if (result?.user) {
      setUser(result.user);

      return result.user;
    }

    return result;
  }, []);

  const register = useCallback(async (payload) => {
    const result = await authService.register(payload);
    if (result?.user) {
      setUser(result.user);
      return result;
    }
    return result;
  }, []);

  const updateProfile = useCallback(async (patch) => {
    const { user: updatedUser } = await authService.updateProfile(patch);
    setUser(updatedUser);
    return updatedUser;
  }, []);

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } finally {
      setUser(null);
    }
  }, []);

  const value = {
    user,
    loading,
    isAuthenticated: Boolean(user),
    authError,
    restoreSession,
    login,
    register,
    updateProfile,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
