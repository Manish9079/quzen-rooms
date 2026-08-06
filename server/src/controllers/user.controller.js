import { asyncHandler } from '../utils/asyncHandler.js';
import { ok } from '../utils/ApiResponse.js';
import * as userService from '../services/user.service.js';

export const getByUsername = asyncHandler(async (req, res) => {
  const user = await userService.getUserByUsername(req.params.username);
  ok(res, { user });
});

export const updateMe = asyncHandler(async (req, res) => {
  const user = await userService.updateProfile(req.user.id, req.body);
  ok(res, { user });
});
