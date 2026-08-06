import { prisma } from '../config/prisma.js';
import { ApiError } from '../utils/ApiError.js';
import { publicUserSelect } from './auth.service.js';

function serializeMessage(m) {
  return {
    id: m.id,
    body: m.deletedAt ? null : m.body,
    deleted: Boolean(m.deletedAt),
    createdAt: m.createdAt,
    author: m.user,
  };
}

export async function getRecentMessages(roomId, { before, limit } = {}) {
  const messages = await prisma.message.findMany({
    where: { roomId, ...(before ? { createdAt: { lt: new Date(before) } } : {}) },
    include: { user: { select: publicUserSelect } },
    orderBy: { createdAt: 'desc' },
    take: limit || 50,
  });
  return messages.reverse().map(serializeMessage);
}

export async function createMessage(roomId, userId, body) {
  const message = await prisma.message.create({
    data: { roomId, userId, body },
    include: { user: { select: publicUserSelect } },
  });
  return serializeMessage(message);
}

export async function deleteOwnMessage(messageId, userId) {
  const message = await prisma.message.findUnique({ where: { id: messageId } });
  if (!message || message.deletedAt) throw ApiError.notFound('Message not found.');
  if (message.userId !== userId) throw ApiError.forbidden('You can only delete your own messages.');

  const updated = await prisma.message.update({
    where: { id: messageId },
    data: { deletedAt: new Date() },
    include: { user: { select: publicUserSelect } },
  });
  return serializeMessage(updated);
}

export { serializeMessage };
