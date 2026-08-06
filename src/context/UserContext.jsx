import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { getItem, setItem, STORAGE_KEYS } from '../utils/storage';

// Non-sensitive, device-local preferences only. Identity (name, avatar,
// email) now lives on the backend and comes from AuthContext instead —
// see that file for why this split exists.
const DEFAULT_SETTINGS = {
  micOnJoin: false,
  cameraOnJoin: false,
  noiseSuppression: true,
  chatSounds: true,
  theme: 'light',
};

const UserContext = createContext(null);

export function UserProvider({ children }) {
  const [settings, setSettingsState] = useState(() => ({ ...DEFAULT_SETTINGS, ...getItem(STORAGE_KEYS.SETTINGS, {}) }));
  const [recentRooms, setRecentRoomsState] = useState(() => getItem(STORAGE_KEYS.RECENT_ROOMS, []));

  useEffect(() => { setItem(STORAGE_KEYS.SETTINGS, settings); }, [settings]);

  const updateSettings = useCallback((patch) => {
    setSettingsState((prev) => ({ ...prev, ...patch }));
  }, []);

  const addRecentRoom = useCallback((room) => {
    setRecentRoomsState((prev) => {
      const next = [room, ...prev.filter((r) => r.code !== room.code)].slice(0, 8);
      setItem(STORAGE_KEYS.RECENT_ROOMS, next);
      return next;
    });
  }, []);

  const value = { settings, updateSettings, recentRooms, addRecentRoom };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export function useUser() {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error('useUser must be used within a UserProvider');
  return ctx;
}
