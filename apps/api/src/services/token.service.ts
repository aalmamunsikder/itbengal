/**
 * Token service — JWT lifecycle management.
 *
 * Handles generation, verification, blacklisting, and HTTP cookie
 * management for access and refresh tokens.
 *
 * Access tokens live for 15 minutes.
 * Refresh tokens live for 7 days.
 *
 * @module services/token
 */

import type { Response } from 'express';

import type { JWTPayload } from '@itbengal/types';
import { generateTokenPair, verifyToken, hashApiKey } from '@itbengal/utils';

import { appConfig } from '../config/app.js';
import { UnauthorizedError } from '../middleware/errorHandler.js';
import * as sessionRepository from '../repositories/session.repository.js';

// ---------------------------------------------------------------------------
// JWT configuration (from environment)
// ---------------------------------------------------------------------------

/** Secret used to sign access tokens. */
const JWT_ACCESS_SECRET =
  process.env['JWT_ACCESS_SECRET'] ??
  'your-access-secret-change-in-production';

/** Secret used to sign refresh tokens (should differ from access secret). */
const JWT_REFRESH_SECRET =
  process.env['JWT_REFRESH_SECRET'] ??
  'your-refresh-secret-change-in-production';

/** Access token lifetime (e.g. "15m"). */
const JWT_ACCESS_EXPIRY = process.env['JWT_ACCESS_EXPIRY'] ?? '15m';

/** Refresh token lifetime (e.g. "7d"). */
const JWT_REFRESH_EXPIRY = process.env['JWT_REFRESH_EXPIRY'] ?? '7d';

// ---------------------------------------------------------------------------
// Cookie settings
// ---------------------------------------------------------------------------

/** 15 minutes in milliseconds. */
const ACCESS_TOKEN_MAX_AGE = 15 * 60 * 1000;

/** 7 days in milliseconds. */
const REFRESH_TOKEN_MAX_AGE = 7 * 24 * 60 * 60 * 1000;

/** 15 minutes in seconds (for blacklist TTL). */
const ACCESS_TOKEN_TTL_SECONDS = 15 * 60;

/** 7 days in seconds (for blacklist / refresh TTL). */
const REFRESH_TOKEN_TTL_SECONDS = 7 * 24 * 60 * 60;

// ---------------------------------------------------------------------------
// Token generation
// ---------------------------------------------------------------------------

/**
 * Generate a paired access + refresh token for an authenticated user.
 *
 * @param user - Minimal user data to embed in the JWT payload.
 * @returns Object containing both signed JWT strings.
 */
export function generateAuthTokens(user: {
  id: string;
  email: string;
  role: string;
  organizationId: string | null;
}): { accessToken: string; refreshToken: string } {
  const payload = {
    sub: user.id,
    email: user.email,
    role: user.role,
    organizationId: user.organizationId,
  };

  return generateTokenPair(
    payload,
    JWT_ACCESS_SECRET,
    JWT_REFRESH_SECRET,
    JWT_ACCESS_EXPIRY,
    JWT_REFRESH_EXPIRY,
  );
}

// ---------------------------------------------------------------------------
// Token verification
// ---------------------------------------------------------------------------

/**
 * Verify an access token's signature, expiry, and blacklist status.
 *
 * @param token - The raw JWT string.
 * @returns The decoded payload if the token is valid.
 * @throws {UnauthorizedError} If the token is invalid, expired, or blacklisted.
 */
export async function verifyAccessToken(token: string): Promise<JWTPayload> {
  const payload = verifyToken(token, JWT_ACCESS_SECRET);

  if (!payload) {
    throw new UnauthorizedError('Invalid or expired access token');
  }

  // Check the blacklist
  const blacklisted = await sessionRepository.isTokenBlacklisted(token);
  if (blacklisted) {
    throw new UnauthorizedError('Token has been revoked');
  }

  return payload;
}

/**
 * Verify a refresh token's signature and expiry.
 *
 * @param token - The raw JWT string.
 * @returns The decoded payload if the token is valid.
 * @throws {UnauthorizedError} If the token is invalid or expired.
 */
export function verifyRefreshToken(token: string): JWTPayload {
  const payload = verifyToken(token, JWT_REFRESH_SECRET);

  if (!payload) {
    throw new UnauthorizedError('Invalid or expired refresh token');
  }

  return payload;
}

// ---------------------------------------------------------------------------
// Token blacklisting
// ---------------------------------------------------------------------------

/**
 * Blacklist a token for its remaining lifetime.
 *
 * The function decodes the token to determine the remaining TTL.
 * If the token cannot be decoded, a sensible default TTL is used.
 *
 * @param token - The raw JWT string to blacklist.
 */
export async function blacklistToken(token: string): Promise<void> {
  // Try to read expiry from the payload for an accurate TTL
  const payload = verifyToken(token, JWT_ACCESS_SECRET)
    ?? verifyToken(token, JWT_REFRESH_SECRET);

  let ttl = ACCESS_TOKEN_TTL_SECONDS; // fallback

  if (payload?.exp) {
    const remaining = payload.exp - Math.floor(Date.now() / 1000);
    ttl = remaining > 0 ? remaining : 1;
  }

  await sessionRepository.blacklistToken(token, ttl);
}

// ---------------------------------------------------------------------------
// Cookie management
// ---------------------------------------------------------------------------

/**
 * Set HTTP-only authentication cookies on the response.
 *
 * - `access_token`  — short-lived, available to all API paths.
 * - `refresh_token` — long-lived, scoped to the refresh endpoint only.
 *
 * @param res          - Express response object.
 * @param accessToken  - Signed access JWT.
 * @param refreshToken - Signed refresh JWT.
 */
export function setAuthCookies(
  res: Response,
  accessToken: string,
  refreshToken: string,
): void {
  const isProduction = appConfig.isProduction;

  res.cookie('access_token', accessToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    path: '/',
    maxAge: ACCESS_TOKEN_MAX_AGE,
  });

  res.cookie('refresh_token', refreshToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    path: '/api/v1/auth/refresh',
    maxAge: REFRESH_TOKEN_MAX_AGE,
  });
}

/**
 * Clear both authentication cookies.
 *
 * @param res - Express response object.
 */
export function clearAuthCookies(res: Response): void {
  const isProduction = appConfig.isProduction;

  res.clearCookie('access_token', {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    path: '/',
  });

  res.clearCookie('refresh_token', {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    path: '/api/v1/auth/refresh',
  });
}

// ---------------------------------------------------------------------------
// Exported constants (for use by other services)
// ---------------------------------------------------------------------------

export {
  REFRESH_TOKEN_TTL_SECONDS,
  ACCESS_TOKEN_TTL_SECONDS,
  hashApiKey as hashToken,
};
