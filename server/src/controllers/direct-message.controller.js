import { asyncHandler } from '../utils/asyncHandler.js';
import { ok, created } from '../utils/ApiResponse.js';
import * as directMessageService from '../services/direct-message.service.js';

function emitToUsers(req, userIds, event, payload) {
  const io = req.app.get('io');
  if (!io) return;
  for (const userId of new Set(userIds)) {
    io.to(`user:${userId}`).emit(event, payload);
  }
}

export const getHistory = asyncHandler(async (req, res) => {
  const messages = await directMessageService.getHistory(req.user.id, req.params.friendId);
  ok(res, { messages });
});

export const sendMessage = asyncHandler(async (req, res) => {
  const message = await directMessageService.sendMessage(req.user, req.params.friendId, req.body.body);
  emitToUsers(req, [message.senderId, message.receiverId], 'directMessage:created', message);
  created(res, { message });
});

export const markAsRead = asyncHandler(async (req, res) => {
  const messages = await directMessageService.markAsRead(req.user.id, req.params.friendId);
  for (const message of messages) {
    emitToUsers(req, [message.senderId, message.receiverId], 'directMessage:updated', message);
  }
  ok(res, { count: messages.length, messages });
});

export const deleteMessage = asyncHandler(async (req, res) => {
  const message = await directMessageService.deleteMessage(req.user.id, req.params.messageId);
  emitToUsers(req, [message.senderId, message.receiverId], 'directMessage:deleted', message);
  ok(res, { deleted: true });
});

export const clearConversation = asyncHandler(async (req, res) => {
  const result = await directMessageService.clearConversation(req.user.id, req.params.friendId);
  emitToUsers(req, [req.user.id], 'directMessage:cleared', {
    userId: req.user.id,
    friendId: req.params.friendId,
    conversationId: result.conversationId,
  });
  ok(res, { cleared: true });
});

export const getUnreadCount = asyncHandler(async (req, res) => {
  const count = await directMessageService.getUnreadCount(req.user.id, req.params.friendId);
  ok(res, { count });
});

export const getTotalUnreadCount = asyncHandler(async (req, res) => {
  const count = await directMessageService.getTotalUnreadCount(req.user.id);
  ok(res, { count });
});
