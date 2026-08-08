import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { authService } from '../services/authService';
import { dataClient } from '../services/dataClient';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    authService.me()
      .then(({ user: current }) => setUser(current))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (identifier, password) => {
    const result = await authService.login({ identifier, password });

    if (result?.user) {
      setUser(result.user);
      const { data: profiles } = await dataClient.models.UserProfile.list({
  filter: {
    ownerId: {
      eq: result.user.id,
    },
  },
});

if (!profiles.length) {
  await dataClient.models.UserProfile.create({
    ownerId: result.user.id,
    username: result.user.username || result.user.email.split('@')[0],
    displayName: result.user.displayName || result.user.email,
    email: result.user.email,
  });
}
      return result.user;
    }

    return result;
  }, []);

  const register = useCallback(async (payload) => {
    return authService.register(payload);
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

export function useAuth() {
  const ctx = useContext(AuthContext);

  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return ctx;
}