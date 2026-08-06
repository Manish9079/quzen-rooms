import { socketService } from './socketService';
import { roomService } from './roomService';

/**
 * Message-focused API: history comes over REST (roomService), live
 * messages/typing/deletes ride the shared socket (socketService).
 */
export const chatService = {
  getHistory: (code, params) => roomService.getMessages(code, params),

  send: (body) => socketService.emitAck('chat:send', { body }),
  setTyping: (isTyping) => socketService.emit('chat:typing', { isTyping }),
  deleteMessage: (messageId) => socketService.emitAck('chat:deleteMessage', { messageId }),

  onMessage: (handler) => socketService.on('chat:message', handler),
  onTyping: (handler) => socketService.on('chat:typing', handler),
  onMessageDeleted: (handler) => socketService.on('chat:messageDeleted', handler),
};
