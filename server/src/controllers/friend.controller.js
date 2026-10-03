import { asyncHandler } from '../utils/asyncHandler.js';
import { ok, created } from '../utils/ApiResponse.js';
import * as friendService from '../services/friend.service.js';

export const searchUsers = asyncHandler(async (req, res) => {
  const users = await friendService.searchUsers(req.user.id, req.query.q || '');
  ok(res, { users });
});

export const getIncomingRequests = asyncHandler(async (req, res) => {
  const requests = await friendService.getIncomingRequests(req.user.id);
  ok(res, { requests });
});

export const sendRequest = asyncHandler(async (req, res) => {
  const request = await friendService.sendRequest(req.user, req.body.toUserId);
  created(res, { request });
});

export const acceptRequest = asyncHandler(async (req, res) => {
  const friendship = await friendService.acceptRequest(req.user, req.params.requestId);
  ok(res, { friendship });
});

export const rejectRequest = asyncHandler(async (req, res) => {
  await friendService.rejectRequest(req.user, req.params.requestId);
  ok(res, { rejected: true });
});

export const getFriends = asyncHandler(async (req, res) => {
  const friends = await friendService.getFriends(req.user.id);
  ok(res, { friends });
});

export const removeFriend = asyncHandler(async (req, res) => {
  await friendService.removeFriend(req.user.id, req.params.friendshipId);
  ok(res, { removed: true });
});