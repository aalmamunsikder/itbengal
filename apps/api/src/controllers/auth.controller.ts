/**
 * Auth controller.
 * Handles all authentication endpoints by delegating to auth and token services.
 * @module controllers/auth
 */

import type { Request, Response } from 'express';

import * as authService from '../services/auth.service.js';
import * as tokenService from '../services/token.service.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { ForbiddenError, UnauthorizedError } from '../middleware/errorHandler.js';

/**
 * POST /api/v1/auth/register
 * Register a new user account.
 */
export async function register(
  req: Request,
  res: Response,
): Promise<void> {
  const user = await authService.register(req.body);

  sendSuccess(res, { user }, 'Registration successful. Please verify your email.', 201);
}

/**
 * POST /api/v1/auth/login
 * Authenticate a user and return access + refresh tokens.
 * Handles 2FA and unverified email branching.
 */
export async function login(
  req: Request,
  res: Response,
): Promise<void> {
  const { email, password, twoFactorCode } = req.body;
  const ipAddress = req.ip || '127.0.0.1';
  const userAgent = req.headers['user-agent'] ?? 'unknown';

  const result = await authService.login(
    { email, password, twoFactorCode },
    ipAddress,
    userAgent,
  ) as any;

  // Email not yet verified
  if (result.requiresVerification) {
    throw new ForbiddenError(result.message ?? 'Email verification required');
  }

  // Two-factor authentication required
  if (result.requiresTwoFactor) {
    sendSuccess(
      res,
      { requiresTwoFactor: true },
      result.message ?? 'Two-factor authentication required',
    );
    return;
  }

  // Successful login — set HTTP-only cookies and return tokens
  tokenService.setAuthCookies(res, result.accessToken, result.refreshToken);

  sendSuccess(
    res,
    {
      user: result.user,
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
    },
    'Login successful',
  );
}

/**
 * POST /api/v1/auth/logout
 * Invalidate the user's current session.
 */
export async function logout(
  req: Request,
  res: Response,
): Promise<void> {
  // Extract the access token to identify the session
  const authHeader = req.headers.authorization;
  const token =
    authHeader?.startsWith('Bearer ')
      ? authHeader.slice(7)
      : (req.cookies?.access_token as string | undefined);

  if (token) {
    await authService.logout(token, req.user!.userId);
  }

  tokenService.clearAuthCookies(res);

  sendSuccess(res, null, 'Logged out successfully');
}

/**
 * POST /api/v1/auth/refresh
 * Issue a new access token using a valid refresh token.
 */
export async function refreshToken(
  req: Request,
  res: Response,
): Promise<void> {
  // Accept refresh token from cookie or request body
  const token =
    (req.cookies?.refresh_token as string | undefined) ??
    (req.body?.refreshToken as string | undefined);

  if (!token) {
    throw new UnauthorizedError('Refresh token is required');
  }

  const result = await authService.refreshToken(token);

  tokenService.setAuthCookies(res, result.accessToken, result.refreshToken);

  sendSuccess(
    res,
    {
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
    },
    'Token refreshed successfully',
  );
}

/**
 * POST /api/v1/auth/verify-email
 * Verify a user's email address using a token sent via email.
 */
export async function verifyEmail(
  req: Request,
  res: Response,
): Promise<void> {
  await authService.verifyEmail(req.body.token);

  sendSuccess(res, null, 'Email verified successfully');
}

/**
 * POST /api/v1/auth/forgot-password
 * Send a password reset link to the user's email.
 * Always returns 200 to prevent user enumeration.
 */
export async function forgotPassword(
  req: Request,
  res: Response,
): Promise<void> {
  await authService.forgotPassword(req.body.email);

  // Always return success regardless of whether the email exists
  sendSuccess(
    res,
    null,
    'If an account with that email exists, a password reset link has been sent.',
  );
}

/**
 * POST /api/v1/auth/reset-password
 * Reset the user's password using a valid reset token.
 */
export async function resetPassword(
  req: Request,
  res: Response,
): Promise<void> {
  await authService.resetPassword(req.body.token, req.body.newPassword);

  sendSuccess(res, null, 'Password has been reset successfully');
}

/**
 * POST /api/v1/auth/2fa/setup
 * Set up two-factor authentication for the authenticated user.
 * Returns a QR code URL, secret, and backup codes.
 */
export async function setupTwoFactor(
  req: Request,
  res: Response,
): Promise<void> {
  const result = await authService.setupTwoFactor(req.user!.userId);

  sendSuccess(
    res,
    {
      qrCodeUrl: result.qrCodeUrl,
      secret: result.secret,
      backupCodes: result.backupCodes,
    },
    'Two-factor authentication setup initiated. Scan the QR code with your authenticator app.',
  );
}

/**
 * POST /api/v1/auth/2fa/verify
 * Verify the TOTP code to complete 2FA setup.
 */
export async function verifyTwoFactor(
  req: Request,
  res: Response,
): Promise<void> {
  await authService.verifyTwoFactor(req.user!.userId, req.body.code);

  sendSuccess(res, null, 'Two-factor authentication enabled successfully');
}

/**
 * POST /api/v1/auth/2fa/disable
 * Disable two-factor authentication (requires password confirmation).
 */
export async function disableTwoFactor(
  req: Request,
  res: Response,
): Promise<void> {
  await authService.disableTwoFactor(req.user!.userId, req.body.password);

  sendSuccess(res, null, 'Two-factor authentication disabled');
}
