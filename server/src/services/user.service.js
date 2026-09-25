import { db as prisma } from '../config/dynamo.js';
import { ApiError } from '../utils/ApiError.js';
import { publicUserSelect } from './auth.service.js';

export async function getUserByUsername(username) {
  const user = await prisma.user.findUnique({
    where: { username: username.toLowerCase() },
    select: publicUserSelect,
  });
  if (!user) throw ApiError.notFound('User not found.');
  return user;
}

export async function updateProfile(userId, patch) {
  return prisma.user.update({
    where: { id: userId },
    data: patch,
    select: publicUserSelect,
  });
}
