import { apiClient } from './apiClient';
import { socketService } from './socketService';

function makeConversationId(userAId, userBId) {
  return [userAId, userBId].sort().join('__');
}

function listen(event, handler) {
  socketService.connect();
  return socketService.on(event, handler);
}

export const directMessageService = {
  getConversationId(userAId, userBId) {
    return makeConversationId(userAId, userBId);
  },

  async getHistory(_userAId, friendId) {
    const { messages } = await apiClient.get(
      `/direct-messages/conversations/${encodeURIComponent(friendId)}/messages`
    );
    return messages;
  },

  async send(_sender, receiverId, body) {
    const text = body.trim();
    if (!text) return null;

    const { message } = await apiClient.post(
      `/direct-messages/conversations/${encodeURIComponent(receiverId)}/messages`,
      { body: text }
    );
    return message;
  },

  subscribe(userAId, userBId, handler) {
    const conversationId = makeConversationId(userAId, userBId);
    return listen('directMessage:created', (message) => {
      if (message.conversationId === conversationId) handler(message);
    });
  },

  async deleteMessage(messageId) {
    return apiClient.delete(`/direct-messages/messages/${encodeURIComponent(messageId)}`);
  },

  subscribeToDeleted(userAId, userBId, handler) {
    const conversationId = makeConversationId(userAId, userBId);
    const unsubscribeDeleted = listen('directMessage:deleted', (message) => {
      if (message.conversationId === conversationId) handler(message);
    });
    const unsubscribeCleared = socketService.on('directMessage:cleared', (event) => {
      if (event.conversationId === conversationId) {
        handler({ conversationId, cleared: true });
      }
    });

    return () => {
      unsubscribeDeleted();
      unsubscribeCleared();
    };
  },

  async markConversationAsRead(_currentUserId, friendId) {
    const { count } = await apiClient.post(
      `/direct-messages/conversations/${encodeURIComponent(friendId)}/read`
    );
    return count;
  },

  subscribeToUpdates(userAId, userBId, handler) {
    const conversationId = makeConversationId(userAId, userBId);
    return listen('directMessage:updated', (message) => {
      if (message.conversationId === conversationId) handler(message);
    });
  },

  async getUnreadCount(_currentUserId, friendId) {
    const { count } = await apiClient.get(
      `/direct-messages/conversations/${encodeURIComponent(friendId)}/unread`
    );
    return count;
  },

  subscribeToAllIncoming(currentUserId, handler) {
    return listen('directMessage:created', (message) => {
      if (message.receiverId === currentUserId) handler(message);
    });
  },

  async getTotalUnreadCount() {
    const { count } = await apiClient.get('/direct-messages/unread');
    return count;
  },

  subscribeToAllUpdates(currentUserId, handler) {
    const unsubscriptions = [
      listen('directMessage:updated', (message) => {
        if (message.receiverId === currentUserId) handler(message);
      }),
      socketService.on('directMessage:deleted', (message) => {
        if (message.receiverId === currentUserId) handler(message);
      }),
      socketService.on('directMessage:cleared', (event) => {
        if (event.userId === currentUserId) handler(event);
      }),
    ];

    return () => unsubscriptions.forEach((unsubscribe) => unsubscribe());
  },

  async deleteConversation(_currentUserId, friendId) {
    await apiClient.delete(
      `/direct-messages/conversations/${encodeURIComponent(friendId)}`
    );
    return true;
  },
};
