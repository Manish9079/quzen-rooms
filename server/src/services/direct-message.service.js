import { db } from '../config/dynamo.js';
import { ApiError } from '../utils/ApiError.js';

function getConversationId(userAId, userBId) {
  return [userAId, userBId].sort().join('__');
}

async function requireFriendship(userId, friendId) {
  if (!friendId || userId === friendId) {
    throw ApiError.badRequest('Choose a friend to message.');
  }

  const friendship = await db.friendship.findFirst({
    where: { OR: [
      { userAId: userId, userBId: friendId },
      { userAId: friendId, userBId: userId },
    ] },
  });
  if (!friendship) throw ApiError.forbidden('You can only message a friend.');

  return getConversationId(userId, friendId);
}

function isHiddenForUser(message, userId) {
  return (message.senderId === userId && message.deletedForSender) ||
    (message.receiverId === userId && message.deletedForReceiver);
}

export async function getHistory(userId, friendId) {
  const conversationId = await requireFriendship(userId, friendId);
  const messages = await db.message.findMany({
    where: { conversationId },
    orderBy: { createdAt: 'desc' },
  });

  return messages
    .filter((message) => !isHiddenForUser(message, userId))
    .reverse();
}

export async function sendMessage(sender, receiverId, body) {
  const conversationId = await requireFriendship(sender.id, receiverId);
  const receiver = await db.user.findUnique({
    where: { id: receiverId },
    select: { id: true },
  });
  if (!receiver) throw ApiError.notFound('Friend not found.');

  return db.message.create({
    data: {
      conversationId,
      senderId: sender.id,
      senderDisplayName: sender.displayName,
      receiverId,
      body,
      isRead: false,
      deletedForSender: false,
      deletedForReceiver: false,
    },
  });
}

export async function markAsRead(userId, friendId) {
  const conversationId = await requireFriendship(userId, friendId);
  const unread = await db.message.findMany({
    where: { conversationId, receiverId: userId, isRead: false },
  });
  const visibleUnread = unread.filter((message) => !isHiddenForUser(message, userId));

  const updatedMessages = await Promise.all(visibleUnread.map((message) =>
    db.message.update({
      where: { id: message.id },
      data: { isRead: true, readAt: new Date() },
    })
  ));

  return updatedMessages;
}

export async function deleteMessage(userId, messageId) {
  const message = await db.message.findUnique({ where: { id: messageId } });
  if (!message || !message.conversationId) throw ApiError.notFound('Message not found.');
  if (message.senderId !== userId) throw ApiError.forbidden('You can only delete your own messages.');

  await db.message.delete({ where: { id: messageId } });
  return message;
}

export async function clearConversation(userId, friendId) {
  const conversationId = await requireFriendship(userId, friendId);
  const messages = await db.message.findMany({ where: { conversationId } });
  const updatedMessages = await Promise.all(messages.map((message) => {
    const field = message.senderId === userId ? 'deletedForSender' : 'deletedForReceiver';
    if (message[field]) return message;
    return db.message.update({
      where: { id: message.id },
      data: { [field]: true },
    });
  }));

  return { conversationId, messages: updatedMessages };
}

export async function getUnreadCount(userId, friendId) {
  const conversationId = await requireFriendship(userId, friendId);
  const messages = await db.message.findMany({
    where: { conversationId, receiverId: userId, isRead: false },
  });

  return messages.filter((message) => !isHiddenForUser(message, userId)).length;
}

export async function getTotalUnreadCount(userId) {
  const messages = await db.message.findMany({
    where: { receiverId: userId, isRead: false },
  });

  return messages.filter((message) => !isHiddenForUser(message, userId)).length;
}
