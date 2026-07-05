/**
 * User routes.
 * Profile, password, and session management endpoints.
 * All routes require authentication.
 * @module routes/v1/user
 */

import { Router } from 'express';

import {
  changePassword,
  getProfile,
  getSessions,
  revokeAllSessions,
  revokeSession,
  updateProfile,
} from '../../controllers/user.controller.js';
import { authenticate } from '../../middleware/auth.js';
import { validate } from '../../middleware/validator.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import {
  changePasswordSchema,
  updateProfileSchema,
} from '../../validators/auth.validator.js';

const router = Router();

// ─── Profile ─────────────────────────────────────────────────────────────────

/**
 * GET /api/v1/users/me
 * Get the authenticated user's profile.
 */
router.get('/me', authenticate, asyncHandler(getProfile));

/**
 * PATCH /api/v1/users/me
 * Update the authenticated user's profile.
 */
router.patch(
  '/me',
  authenticate,
  validate(updateProfileSchema, 'body'),
  asyncHandler(updateProfile),
);

// ─── Password ────────────────────────────────────────────────────────────────

/**
 * POST /api/v1/users/me/change-password
 * Change the authenticated user's password.
 */
router.post(
  '/me/change-password',
  authenticate,
  validate(changePasswordSchema, 'body'),
  asyncHandler(changePassword),
);

// ─── Sessions ────────────────────────────────────────────────────────────────

/**
 * GET /api/v1/users/me/sessions
 * List all active sessions for the authenticated user.
 */
router.get('/me/sessions', authenticate, asyncHandler(getSessions));

/**
 * DELETE /api/v1/users/me/sessions/:sessionId
 * Revoke a specific session.
 */
router.delete(
  '/me/sessions/:sessionId',
  authenticate,
  asyncHandler(revokeSession),
);

/**
 * DELETE /api/v1/users/me/sessions
 * Revoke all sessions (global logout).
 */
router.delete('/me/sessions', authenticate, asyncHandler(revokeAllSessions));

export default router;
