// Thin localStorage wrapper for V1 persistence. Every key is namespaced
// under "quzen:" so this can later be swapped for a real user-settings
// API (see services/api.js) without touching call sites much — keep the
// same function names, change the implementation.

const NS = 'quzen';

function key(k) {
  return `${NS}:${k}`;
}

export function getItem(k, fallback = null) {
  try {
    const raw = localStorage.getItem(key(k));
    if (raw === null) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

export function setItem(k, value) {
  try {
    localStorage.setItem(key(k), JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

export function removeItem(k) {
  try {
    localStorage.removeItem(key(k));
  } catch {
    /* no-op */
  }
}

export const STORAGE_KEYS = {
  DISPLAY_NAME: 'displayName',
  AVATAR_COLOR: 'avatarColor',
  RECENT_ROOMS: 'recentRooms',
  SETTINGS: 'settings',
  PROFILE: 'profile',
  THEME: 'theme',
};
