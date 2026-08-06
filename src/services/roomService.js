import { apiClient } from './apiClient';

export const roomService = {
  createRoom: (payload) => apiClient.post('/rooms', payload),
  getPublicRooms: (params) => apiClient.get(`/rooms/public${apiClient.toQueryString(params)}`),
  getRoom: (code) => apiClient.get(`/rooms/${code}`),
  joinRoom: (code, password) => apiClient.post(`/rooms/${code}/join`, { password }),
  leaveRoom: (code) => apiClient.post(`/rooms/${code}/leave`),
  deleteRoom: (code) => apiClient.delete(`/rooms/${code}`),
  updateRoom: (code, patch) => apiClient.patch(`/rooms/${code}`, patch),
  getParticipants: (code) => apiClient.get(`/rooms/${code}/participants`),
  getMessages: (code, params) => apiClient.get(`/rooms/${code}/messages${apiClient.toQueryString(params)}`),
};
