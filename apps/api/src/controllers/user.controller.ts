/**
 * User controller.
 * Handles user profile and session management endpoints.
 * @module controllers/user
 */

import type { Request, Response } from 'express';

import * as userService from '../services/user.service.js';
import * as tokenService from '../services/token.service.js';
import { sendSuccess } from '../utils/apiResponse.js';

/**
 * GET /api/v1/users/me
 * Return the authenticated user's full profile.
 */
export async function getProfile(
  req: Request,
  res: Response,
): Promise<void> {
  const user = await userService.getProfile(req.user!.userId);

  sendSuccess(res, { user }, 'User profile retrieved');
}

/**
 * PATCH /api/v1/users/me
 * Update the authenticated user's profile.
 */
export async function updateProfile(
  req: Request,
  res: Response,
): Promise<void> {
  const user = await userService.updateProfile(req.user!.userId, req.body);

  sendSuccess(res, { user }, 'Profile updated successfully');
}

/**
 * POST /api/v1/users/me/change-password
 * Change the authenticated user's password.
 * Clears auth cookies to force re-authentication.
 */
export async function changePassword(
  req: Request,
  res: Response,
): Promise<void> {
  const { currentPassword, newPassword } = req.body;
  await userService.changePassword(req.user!.userId, currentPassword, newPassword);

  tokenService.clearAuthCookies(res);

  sendSuccess(res, null, 'Password changed successfully. Please log in again.');
}

/**
 * GET /api/v1/users/me/sessions
 * List all active sessions for the authenticated user.
 */
export async function getSessions(
  req: Request,
  res: Response,
): Promise<void> {
  const sessions = await userService.getActiveSessions(req.user!.userId);

  sendSuccess(res, { sessions }, 'Active sessions retrieved');
}

/**
 * DELETE /api/v1/users/me/sessions/:sessionId
 * Revoke a specific session for the authenticated user.
 */
export async function revokeSession(
  req: Request,
  res: Response,
): Promise<void> {
  await userService.revokeSession(req.user!.userId, req.params.sessionId as string);

  sendSuccess(res, null, 'Session revoked successfully');
}

/**
 * DELETE /api/v1/users/me/sessions
 * Revoke all sessions for the authenticated user.
 * Clears auth cookies on the current response.
 */
export async function revokeAllSessions(
  req: Request,
  res: Response,
): Promise<void> {
  await userService.revokeAllSessions(req.user!.userId);

  tokenService.clearAuthCookies(res);

  sendSuccess(res, null, 'All sessions revoked. Please log in again.');
}
