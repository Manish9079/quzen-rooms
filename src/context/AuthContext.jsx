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

  useEffect(() => {
    authService
      .me()
      .then(({ user: current }) => setUser(current))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

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
    login,
    register,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
