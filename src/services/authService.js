import { apiClient } from './apiClient';

export const authService = {
  async register({ username, displayName, email, password }) {
    return apiClient.post('/auth/register', { username, displayName, email, password });
  },

  async login({ identifier, password }) {
    return apiClient.post('/auth/login', { identifier, password });
  },

  async logout() {
    await apiClient.post('/auth/logout');
  },

  async me() {
    return apiClient.get('/auth/me');
  },
  async confirmRegistration() {
    throw new Error(
      'Email verification is not available yet because the Express API has no verification endpoint.'
    );
  },
};