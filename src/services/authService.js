import { apiClient } from './apiClient';

export const authService = {
  register: (payload) => apiClient.post('/auth/register', payload),
  login: (payload) => apiClient.post('/auth/login', payload),
  logout: () => apiClient.post('/auth/logout'),
  refresh: () => apiClient.post('/auth/refresh', undefined, { skipAuthRedirect: true }),
  me: () => apiClient.get('/auth/me', { skipAuthRedirect: true }),
  changePassword: (payload) => apiClient.patch('/users/me/password', payload),
  forgotPassword: (email) => apiClient.post('/auth/forgot-password', { email }),
  resetPassword: (payload) => apiClient.post('/auth/reset-password', payload),

  updateProfile: (patch) => apiClient.patch('/users/me', patch),
  getByUsername: (username) => apiClient.get(`/users/${username}`),
};
