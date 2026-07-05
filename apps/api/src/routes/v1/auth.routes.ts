/**
 * Authentication routes.
 * All auth endpoints with appropriate rate limiting, validation, and 2FA support.
 * @module routes/v1/auth
 */

import { Router } from 'express';

import {
  disableTwoFactor,
  forgotPassword,
  login,
  logout,
  refreshToken,
  register,
  resetPassword,
  setupTwoFactor,
  verifyEmail,
  verifyTwoFactor,
} from '../../controllers/auth.controller.js';
import { authenticate } from '../../middleware/auth.js';
import { authLimiter } from '../../middleware/rateLimiter.js';
import { validate } from '../../middleware/validator.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import {
  registerSchema,
  loginSchema,
  verifyEmailSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  verifyTwoFactorSchema,
  disableTwoFactorSchema,
} from '../../validators/auth.validator.js';

const router = Router();

// ─── Public auth endpoints ───────────────────────────────────────────────────

/**
 * POST /api/v1/auth/register
 * Create a new user account.
 * Rate limited to prevent abuse.
 */
router.post(
  '/register',
  authLimiter,
  validate(registerSchema, 'body'),
  asyncHandler(register),
);

/**
 * POST /api/v1/auth/login
 * Authenticate and receive tokens.
 * Rate limited to prevent brute-force attacks.
 */
router.post(
  '/login',
  authLimiter,
  validate(loginSchema, 'body'),
  asyncHandler(login),
);

/**
 * POST /api/v1/auth/logout
 * Invalidate the current session / tokens.
 * Requires authentication.
 */
router.post('/logout', authenticate, asyncHandler(logout));

/**
 * POST /api/v1/auth/refresh
 * Get a new access token using a refresh token.
 */
router.post('/refresh', asyncHandler(refreshToken));

/**
 * POST /api/v1/auth/verify-email
 * Verify email address with a token.
 */
router.post(
  '/verify-email',
  validate(verifyEmailSchema, 'body'),
  asyncHandler(verifyEmail),
);

/**
 * POST /api/v1/auth/forgot-password
 * Request a password reset email.
 * Rate limited to prevent email flooding.
 */
router.post(
  '/forgot-password',
  authLimiter,
  validate(forgotPasswordSchema, 'body'),
  asyncHandler(forgotPassword),
);

/**
 * POST /api/v1/auth/reset-password
 * Reset password using a valid reset token.
 */
router.post(
  '/reset-password',
  validate(resetPasswordSchema, 'body'),
  asyncHandler(resetPassword),
);

// ─── Two-Factor Authentication ───────────────────────────────────────────────

/**
 * POST /api/v1/auth/2fa/setup
 * Initiate 2FA setup for the authenticated user.
 * Returns a QR code and backup codes.
 */
router.post('/2fa/setup', authenticate, asyncHandler(setupTwoFactor));

/**
 * POST /api/v1/auth/2fa/verify
 * Verify the TOTP code to complete 2FA enrollment.
 */
router.post(
  '/2fa/verify',
  authenticate,
  validate(verifyTwoFactorSchema, 'body'),
  asyncHandler(verifyTwoFactor),
);

/**
 * POST /api/v1/auth/2fa/disable
 * Disable 2FA for the authenticated user (requires password confirmation).
 */
router.post(
  '/2fa/disable',
  authenticate,
  validate(disableTwoFactorSchema, 'body'),
  asyncHandler(disableTwoFactor),
);

export default router;
