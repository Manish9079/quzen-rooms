import { asyncHandler } from '../utils/asyncHandler.js';
import { ok, created } from '../utils/ApiResponse.js';
import { accessTokenCookieOptions, refreshTokenCookieOptions, clearCookieOptions } from '../utils/cookies.js';
import * as authService from '../services/auth.service.js';

function setSessionCookies(res, accessToken, refreshToken) {
  res.cookie('accessToken', accessToken, accessTokenCookieOptions());
  res.cookie('refreshToken', refreshToken, refreshTokenCookieOptions());
}

export const register = asyncHandler(async (req, res) => {
  const { user, accessToken, refreshToken } = await authService.registerUser(req.body);
  setSessionCookies(res, accessToken, refreshToken);
  created(res, { user, accessToken });
});

export const login = asyncHandler(async (req, res) => {
  const { user, accessToken, refreshToken } = await authService.loginUser(req.body);
  setSessionCookies(res, accessToken, refreshToken);
  ok(res, { user, accessToken });
});

export const refresh = asyncHandler(async (req, res) => {
  const { user, accessToken, refreshToken } = await authService.rotateRefreshToken(
    req.cookies?.refreshToken,
    req.headers['user-agent'],
  );
  setSessionCookies(res, accessToken, refreshToken);
  ok(res, { user, accessToken });
});

export const logout = asyncHandler(async (req, res) => {
  await authService.logoutUser(req.cookies?.refreshToken, req.user?.id);
  res.clearCookie('accessToken', clearCookieOptions());
  res.clearCookie('refreshToken', { ...clearCookieOptions(), path: '/api/auth' });
  ok(res, { loggedOut: true });
});

export const me = asyncHandler(async (req, res) => {
  ok(res, { user: req.user });
});

export const changePassword = asyncHandler(async (req, res) => {
  await authService.changePassword(req.user.id, req.body.currentPassword, req.body.newPassword);
  ok(res, { changed: true });
});

export const forgotPassword = asyncHandler(async (req, res) => {
  await authService.requestPasswordReset(req.body.email);
  // Same response whether or not the email exists (prevents enumeration).
  ok(res, { message: 'If that email is registered, a reset link has been sent.' });
});

export const resetPassword = asyncHandler(async (req, res) => {
  await authService.resetPassword(req.body.token, req.body.newPassword);
  ok(res, { reset: true });
});
