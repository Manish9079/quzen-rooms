import { useContext } from 'react';

import { UserContext } from './userContext.js';

export function useUser() {
  const ctx = useContext(UserContext);

  if (!ctx) {
    throw new Error('useUser must be used within a UserProvider');
  }

  return ctx;
}
