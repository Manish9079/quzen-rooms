import { apiClient } from './apiClient';

export const authService = {
  async register({ username, displayName, email, password }) {
    const result = await apiClient.post('/auth/register', { username, displayName, email, password });
    return result;
  },

  async login({ identifier, password }) {
    return apiClient.post('/auth/login', { identifier, password });
  },

  async changePassword({ currentPassword, newPassword, confirmPassword }) {
    return apiClient.patch('/auth/me/password', { currentPassword, newPassword, confirmPassword });
  },

  async logout() {
    await apiClient.post('/auth/logout');
  },

  async me() {
    return apiClient.get('/auth/me');
  },
};