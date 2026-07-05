/**
 * User service — profile management and session operations.
 *
 * Provides high-level operations for viewing / updating user profiles,
 * changing passwords, and managing active sessions.
 *
 * @module services/user
 */

import type { User } from '@itbengal/types';
import type { Session } from '@itbengal/database';

import { hashPassword, verifyPassword } from '@itbengal/utils';

import { NotFoundError, UnauthorizedError } from '../middleware/errorHandler.js';
import * as sessionRepository from '../repositories/session.repository.js';
import * as userRepository from '../repositories/user.repository.js';
import { sanitizeUser } from './auth.service.js';

// ---------------------------------------------------------------------------
// Profile
// ---------------------------------------------------------------------------

/**
 * Retrieve the authenticated user's profile.
 *
 * @param userId - The user's UUID.
 * @returns The sanitized user profile.
 * @throws {NotFoundError} If the user does not exist.
 */
export async function getProfile(userId: string): Promise<User> {
  const user = await userRepository.findById(userId);
  if (!user) {
    throw new NotFoundError('User not found');
  }
  return sanitizeUser(user);
}

/**
 * Update the authenticated user's profile fields.
 *
 * Only the supplied fields are updated; omitted fields remain unchanged.
 *
 * @param userId - The user's UUID.
 * @param data   - Partial profile data to update.
 * @returns The updated sanitized user.
 * @throws {NotFoundError} If the user does not exist.
 */
export async function updateProfile(
  userId: string,
  data: {
    firstName?: string;
    lastName?: string;
    avatarUrl?: string;
  },
): Promise<User> {
  const user = await userRepository.findById(userId);
  if (!user) {
    throw new NotFoundError('User not found');
  }

  const updated = await userRepository.updateById(userId, data);
  return sanitizeUser(updated);
}

// ---------------------------------------------------------------------------
// Password
// ---------------------------------------------------------------------------

/**
 * Change the authenticated user's password.
 *
 * Verifies the current password, hashes the new one, persists it,
 * and deletes all sessions to force re-authentication on every device.
 *
 * @param userId          - The user's UUID.
 * @param currentPassword - The user's current password for confirmation.
 * @param newPassword     - The desired new password.
 * @throws {NotFoundError}     If the user does not exist.
 * @throws {UnauthorizedError} If the current password is wrong.
 */
export async function changePassword(
  userId: string,
  currentPassword: string,
  newPassword: string,
): Promise<void> {
  const user = await userRepository.findById(userId);
  if (!user) {
    throw new NotFoundError('User not found');
  }

  const valid = await verifyPassword(currentPassword, user.passwordHash);
  if (!valid) {
    throw new UnauthorizedError('Current password is incorrect');
  }

  const newHash = await hashPassword(newPassword);
  await userRepository.updatePassword(userId, newHash);

  // Force re-login everywhere
  await sessionRepository.deleteAllForUser(userId);
  await sessionRepository.deleteRefreshToken(userId);
}

// ---------------------------------------------------------------------------
// Session management
// ---------------------------------------------------------------------------

/**
 * List all active (non-expired) sessions for the authenticated user.
 *
 * @param userId - The user's UUID.
 * @returns Array of active session records.
 */
export async function getActiveSessions(userId: string): Promise<Session[]> {
  return sessionRepository.findAllForUser(userId);
}

/**
 * Revoke (delete) a specific session belonging to the user.
 *
 * @param userId    - The user's UUID (authorization guard).
 * @param sessionId - The session record's UUID.
 */
export async function revokeSession(
  userId: string,
  sessionId: string,
): Promise<void> {
  await sessionRepository.deleteById(sessionId, userId);
}

/**
 * Revoke (delete) all sessions for the user, effectively
 * logging them out on every device.
 *
 * @param userId - The user's UUID.
 */
export async function revokeAllSessions(userId: string): Promise<void> {
  await sessionRepository.deleteAllForUser(userId);
  await sessionRepository.deleteRefreshToken(userId);
}
