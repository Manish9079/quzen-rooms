import { apiClient } from './apiClient';
import { socketService } from './socketService';

export const chatService = {
  async getHistory(roomCode) {
    return apiClient.get(`/rooms/${encodeURIComponent(roomCode)}/messages`);
  },

  async send(_roomCode, _user, body) {
    return socketService.emitAck('chat:send', { body });
  },

  subscribeToMessages(_roomCode, handler) {
    return socketService.on('chat:message', handler);
  },

  async deleteMessage(messageId) {
    return socketService.emitAck('chat:deleteMessage', { messageId });
  },

  subscribeToDeletedMessages(_roomCode, handler) {
    return socketService.on('chat:messageDeleted', handler);
  },
};
