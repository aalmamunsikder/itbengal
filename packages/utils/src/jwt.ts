/**
 * JWT token utilities.
 *
 * Thin wrappers around `jsonwebtoken` that produce and verify
 * access / refresh token pairs for the ITBengal platform.
 *
 * @module @itbengal/utils/jwt
 */

import jwt from 'jsonwebtoken';
import type { JWTPayload } from '@itbengal/types';

/**
 * Generate a short-lived JWT access token.
 *
 * @param payload - Claims to include in the token (typically sub, email, role).
 * @param secret  - HMAC secret for signing.
 * @param expiresIn - Expiration expressed as a `ms`-compatible string (e.g. "15m", "1h").
 * @returns Signed JWT string.
 */
export function generateAccessToken(
  payload: object,
  secret: string,
  expiresIn: string,
): string {
  return jwt.sign(payload, secret, { expiresIn: expiresIn as any, algorithm: 'HS256' });
}

/**
 * Generate a long-lived JWT refresh token.
 *
 * @param payload - Claims to include in the token.
 * @param secret  - HMAC secret for signing (should differ from the access token secret).
 * @param expiresIn - Expiration string (e.g. "7d", "30d").
 * @returns Signed JWT string.
 */
export function generateRefreshToken(
  payload: object,
  secret: string,
  expiresIn: string,
): string {
  return jwt.sign(payload, secret, { expiresIn: expiresIn as any, algorithm: 'HS256' });
}

/**
 * Convenience function that generates both an access token and a refresh token
 * in a single call.
 *
 * @param payload        - Claims to embed in both tokens.
 * @param accessSecret   - Secret for the access token.
 * @param refreshSecret  - Secret for the refresh token.
 * @param accessExpiry   - Access token lifetime (e.g. "15m").
 * @param refreshExpiry  - Refresh token lifetime (e.g. "7d").
 * @returns An object containing both signed tokens.
 */
export function generateTokenPair(
  payload: object,
  accessSecret: string,
  refreshSecret: string,
  accessExpiry: string,
  refreshExpiry: string,
): { accessToken: string; refreshToken: string } {
  return {
    accessToken: generateAccessToken(payload, accessSecret, accessExpiry),
    refreshToken: generateRefreshToken(payload, refreshSecret, refreshExpiry),
  };
}

/**
 * Verify a JWT token's signature and expiry.
 *
 * @param token  - The JWT string to verify.
 * @param secret - The HMAC secret used to sign the token.
 * @returns The decoded payload if valid, or `null` if verification fails.
 */
export function verifyToken(token: string, secret: string): JWTPayload | null {
  try {
    return jwt.verify(token, secret, { algorithms: ['HS256'] }) as JWTPayload;
  } catch {
    return null;
  }
}

/**
 * Decode a JWT without verifying its signature.
 *
 * **Warning:** Do not use the output of this function for authorization decisions.
 * It is intended for inspecting token claims during debugging or logging.
 *
 * @param token - The JWT string to decode.
 * @returns The decoded payload object, or `null` if the token cannot be decoded.
 */
export function decodeToken(token: string): Record<string, unknown> | null {
  const decoded = jwt.decode(token);

  if (decoded === null || typeof decoded === 'string') {
    return null;
  }

  return decoded as Record<string, unknown>;
}
