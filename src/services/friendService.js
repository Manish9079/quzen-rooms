import { apiClient } from './apiClient';

export const friendService = {
  async searchUsers(query) {
    const { users } = await apiClient.get(`/friends/users${apiClient.query({ q: query })}`);
    return users;
  },

  async sendFriendRequest(toUser) {
    return apiClient.post('/friends/requests', { toUserId: toUser.id });
  },

  async getIncomingRequests() {
    const { requests } = await apiClient.get('/friends/requests');
    return requests;
  },

  async acceptFriendRequest(request) {
    return apiClient.post(`/friends/requests/${encodeURIComponent(request.id)}/accept`);
  },

  async rejectFriendRequest(requestId) {
    return apiClient.post(`/friends/requests/${encodeURIComponent(requestId)}/reject`);
  },

  async getFriends() {
    const { friends } = await apiClient.get('/friends');
    return friends;
  },

  async removeFriend(friendshipId) {
    return apiClient.delete(`/friends/${encodeURIComponent(friendshipId)}`);
  },
};
