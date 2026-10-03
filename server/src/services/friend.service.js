import { db } from '../config/dynamo.js';
import { ApiError } from '../utils/ApiError.js';

const publicUserSelect = {
  id: true,
  username: true,
  displayName: true,
  avatar: true,
};

export async function searchUsers(currentUserId, query) {
  const normalizedQuery = query.trim().replace(/^@/, '').toLowerCase();
  if (!normalizedQuery) return [];

  const users = await db.user.findMany({ select: publicUserSelect });
  return users.filter((user) => user.id !== currentUserId && (
    user.username?.toLowerCase().includes(normalizedQuery) ||
    user.displayName?.toLowerCase().includes(normalizedQuery)
  ));
}

export async function getIncomingRequests(userId) {
  return db.friendRequest.findMany({
    where: { toUserId: userId, status: 'PENDING' },
    orderBy: { createdAt: 'desc' },
  });
}

export async function sendRequest(fromUser, toUserId) {
  if (!toUserId || typeof toUserId !== 'string') {
    throw ApiError.badRequest('Choose a user to add.');
  }
  if (fromUser.id === toUserId) throw ApiError.badRequest('You cannot add yourself.');

  const toUser = await db.user.findUnique({ where: { id: toUserId }, select: publicUserSelect });
  if (!toUser) throw ApiError.notFound('User not found.');

  const existingFriendship = await db.friendship.findFirst({
    where: { OR: [
      { userAId: fromUser.id, userBId: toUserId },
      { userAId: toUserId, userBId: fromUser.id },
    ] },
  });
  if (existingFriendship) throw ApiError.conflict('This user is already your friend.');

  const existingRequest = await db.friendRequest.findFirst({
    where: { status: 'PENDING', OR: [
      { fromUserId: fromUser.id, toUserId },
      { fromUserId: toUserId, toUserId: fromUser.id },
    ] },
  });
  if (existingRequest) {
    if (existingRequest.fromUserId === fromUser.id) throw ApiError.conflict('Friend request already sent.');
    throw ApiError.conflict('This user has already sent you a friend request.');
  }

  return db.friendRequest.create({
    data: {
      fromUserId: fromUser.id,
      fromDisplayName: fromUser.displayName,
      toUserId: toUser.id,
      toDisplayName: toUser.displayName,
      status: 'PENDING',
    },
  });
}

async function getOwnedRequest(userId, requestId) {
  const request = await db.friendRequest.findUnique({ where: { id: requestId } });
  if (!request || request.toUserId !== userId || request.status !== 'PENDING') {
    throw ApiError.notFound('Pending friend request not found.');
  }
  return request;
}

export async function acceptRequest(user, requestId) {
  const request = await getOwnedRequest(user.id, requestId);
  const friendship = await db.friendship.create({
    data: {
      userAId: request.fromUserId,
      userADisplayName: request.fromDisplayName,
      userBId: request.toUserId,
      userBDisplayName: request.toDisplayName,
    },
  });
  await db.friendRequest.update({ where: { id: request.id }, data: { status: 'ACCEPTED' } });
  return friendship;
}

export async function rejectRequest(user, requestId) {
  const request = await getOwnedRequest(user.id, requestId);
  await db.friendRequest.update({ where: { id: request.id }, data: { status: 'REJECTED' } });
}

export async function getFriends(userId) {
  const friendships = await db.friendship.findMany({
    where: { OR: [{ userAId: userId }, { userBId: userId }] },
  });

  return friendships.map((friendship) => friendship.userAId === userId
    ? { id: friendship.userBId, displayName: friendship.userBDisplayName, friendshipId: friendship.id }
    : { id: friendship.userAId, displayName: friendship.userADisplayName, friendshipId: friendship.id });
}

export async function removeFriend(userId, friendshipId) {
  const friendship = await db.friendship.findUnique({ where: { id: friendshipId } });
  if (!friendship || (friendship.userAId !== userId && friendship.userBId !== userId)) {
    throw ApiError.notFound('Friendship not found.');
  }
  await db.friendship.delete({ where: { id: friendship.id } });
}