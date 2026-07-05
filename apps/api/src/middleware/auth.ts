/**
 * Authentication middleware.
 * Extracts and verifies JWT tokens from Authorization header or cookies.
 * Attaches the decoded payload to `req.user`.
 * @module middleware/auth
 */

import type { NextFunction, Request, Response } from 'express';
import type { UserRole } from '@itbengal/types';

import { verifyToken } from '@itbengal/utils';

import { UnauthorizedError, ForbiddenError } from './errorHandler.js';

/** JWT access token secret from environment */
const JWT_ACCESS_SECRET = process.env['JWT_ACCESS_SECRET'] ?? '';

/**
 * Extracts the Bearer token from the Authorization header or the
 * `access_token` cookie.
 */
function extractToken(req: Request): string | null {
  // 1. Check Authorization header
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.slice(7);
  }

  // 2. Check cookies
  const cookieToken = req.cookies?.access_token as string | undefined;
  if (cookieToken) {
    return cookieToken;
  }

  return null;
}

/**
 * Verify a JWT access token using the HS256 secret and return
 * a normalised user payload for `req.user`.
 *
 * @throws UnauthorizedError when the token is invalid or expired
 */
function verifyAccessToken(token: string): Express.Request['user'] {
  if (!JWT_ACCESS_SECRET) {
    throw new UnauthorizedError('JWT secret is not configured');
  }

  const payload = verifyToken(token, JWT_ACCESS_SECRET);

  if (!payload) {
    throw new UnauthorizedError('Invalid or expired token');
  }

  return {
    userId: payload.sub,
    email: payload.email,
    role: payload.role as string,
    organizationId: payload.organizationId ?? null,
    iat: payload.iat,
    exp: payload.exp,
  };
}

/**
 * Require a valid JWT. Rejects with 401 if no token or invalid token.
 */
export function authenticate(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  const token = extractToken(req);
  if (!token) {
    next(new UnauthorizedError('No authentication token provided'));
    return;
  }

  try {
    req.user = verifyAccessToken(token);
    next();
  } catch (err) {
    next(err);
  }
}

/**
 * Try to authenticate but don't fail if no token is present.
 * Useful for routes that behave differently for authenticated users
 * (e.g., showing personalised data) but still work anonymously.
 */
export function optionalAuth(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  const token = extractToken(req);
  if (!token) {
    next();
    return;
  }

  try {
    req.user = verifyAccessToken(token);
  } catch {
    // Swallow error — the user simply isn't authenticated
  }

  next();
}

/**
 * Factory that creates a middleware checking the user's role.
 * Must be used **after** `authenticate`.
 *
 * @param roles - Allowed roles (UserRole values or plain strings)
 * @returns Express middleware
 *
 * @example
 * ```ts
 * router.get('/admin/stats', authenticate, requireRole(UserRole.ADMIN), handler);
 * ```
 */
export function requireRole(...roles: (UserRole | string)[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new UnauthorizedError('Authentication required'));
      return;
    }

    if (!roles.includes(req.user.role)) {
      next(
        new ForbiddenError(
          `Role '${req.user.role}' is not authorised for this resource`,
        ),
      );
      return;
    }

    next();
  };
}
