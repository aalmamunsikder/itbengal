/**
 * Session repository — Prisma + Redis based session management.
 *
 * Prisma is used for persistent session records (DB).
 * Redis is used for the token blacklist and refresh-token cache,
 * providing fast O(1) lookups during request authentication.
 *
 * Redis key patterns:
 * - `session:blacklist:{tokenHash}` — blacklisted access tokens
 * - `session:refresh:{userId}`      — cached refresh token hash
 *
 * @module repositories/session
 */

import type Redis from 'ioredis';

import { prisma } from '@itbengal/database';
import type { Session } from '@itbengal/database';

import { createRedisClient } from '../config/redis.js';

// ---------------------------------------------------------------------------
// Redis client (lazy singleton)
// ---------------------------------------------------------------------------

let redisClient: Redis | null = null;

/**
 * Returns the shared Redis client for session operations.
 * Created lazily on first access to avoid connection during module load.
 */
function getRedis(): Redis {
  if (!redisClient) {
    redisClient = createRedisClient('sessions');
  }
  return redisClient;
}

// ---------------------------------------------------------------------------
// Redis key builders
// ---------------------------------------------------------------------------

/** Build the Redis key for a blacklisted token. */
function blacklistKey(tokenHash: string): string {
  return `session:blacklist:${tokenHash}`;
}

/** Build the Redis key for a user's cached refresh token. */
function refreshKey(userId: string): string {
  return `session:refresh:${userId}`;
}

// ---------------------------------------------------------------------------
// Prisma session CRUD
// ---------------------------------------------------------------------------

/**
 * Persist a new session row in the database.
 *
 * @param data - Session creation data.
 * @returns The newly created session record.
 */
export async function createSession(data: {
  userId: string;
  tokenHash: string;
  ipAddress: string;
  userAgent: string;
  expiresAt: Date;
}): Promise<Session> {
  return prisma.session.create({
    data: {
      userId: data.userId,
      tokenHash: data.tokenHash,
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
      expiresAt: data.expiresAt,
    },
  });
}

/**
 * Find a session by the SHA-256 hash of its refresh token.
 *
 * @param tokenHash - The hashed token value.
 * @returns The matched session, or `null`.
 */
export async function findByTokenHash(
  tokenHash: string,
): Promise<Session | null> {
  return prisma.session.findUnique({
    where: { tokenHash },
  });
}

/**
 * Delete a single session by token hash.
 *
 * @param tokenHash - The hashed token value.
 */
export async function deleteByTokenHash(tokenHash: string): Promise<void> {
  await prisma.session.deleteMany({
    where: { tokenHash },
  });
}

/**
 * Delete **all** sessions belonging to a user.
 * Used when a password is changed or on explicit "log out everywhere".
 *
 * @param userId - The user's UUID.
 */
export async function deleteAllForUser(userId: string): Promise<void> {
  await prisma.session.deleteMany({
    where: { userId },
  });
}

/**
 * Retrieve all active (non-expired) sessions for a user.
 *
 * @param userId - The user's UUID.
 * @returns Array of active sessions, ordered newest first.
 */
export async function findAllForUser(userId: string): Promise<Session[]> {
  return prisma.session.findMany({
    where: {
      userId,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: 'desc' },
  });
}

/**
 * Delete a specific session by its primary key.
 * Only deletes if the session belongs to the specified user.
 *
 * @param sessionId - The session's UUID.
 * @param userId    - The user's UUID (authorization check).
 */
export async function deleteById(
  sessionId: string,
  userId: string,
): Promise<void> {
  await prisma.session.deleteMany({
    where: {
      id: sessionId,
      userId,
    },
  });
}

// ---------------------------------------------------------------------------
// Redis: Token blacklist
// ---------------------------------------------------------------------------

/**
 * Add a token to the blacklist.
 * The entry automatically expires after `ttlSeconds` so the blacklist
 * stays bounded even without manual cleanup.
 *
 * @param token      - The raw JWT string (or its hash).
 * @param ttlSeconds - Time-to-live in seconds (should match the token's remaining lifetime).
 */
export async function blacklistToken(
  token: string,
  ttlSeconds: number,
): Promise<void> {
  const redis = getRedis();
  const key = blacklistKey(token);
  await redis.set(key, '1', 'EX', Math.max(ttlSeconds, 1));
}

/**
 * Check whether a token has been blacklisted.
 *
 * @param token - The raw JWT string (or its hash).
 * @returns `true` if the token is blacklisted.
 */
export async function isTokenBlacklisted(token: string): Promise<boolean> {
  const redis = getRedis();
  const result = await redis.exists(blacklistKey(token));
  return result === 1;
}

// ---------------------------------------------------------------------------
// Redis: Refresh token cache
// ---------------------------------------------------------------------------

/**
 * Cache a refresh token hash in Redis with a TTL.
 *
 * @param userId     - The user's UUID.
 * @param tokenHash  - SHA-256 hash of the refresh token.
 * @param ttlSeconds - Time-to-live in seconds (should match the refresh token's lifetime).
 */
export async function storeRefreshToken(
  userId: string,
  tokenHash: string,
  ttlSeconds: number,
): Promise<void> {
  const redis = getRedis();
  await redis.set(refreshKey(userId), tokenHash, 'EX', Math.max(ttlSeconds, 1));
}

/**
 * Retrieve the cached refresh token hash for a user.
 *
 * @param userId - The user's UUID.
 * @returns The stored token hash, or `null` if absent / expired.
 */
export async function getRefreshToken(
  userId: string,
): Promise<string | null> {
  const redis = getRedis();
  return redis.get(refreshKey(userId));
}

/**
 * Remove the cached refresh token for a user.
 *
 * @param userId - The user's UUID.
 */
export async function deleteRefreshToken(userId: string): Promise<void> {
  const redis = getRedis();
  await redis.del(refreshKey(userId));
}
