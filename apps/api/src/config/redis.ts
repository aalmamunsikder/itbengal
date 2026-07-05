/**
 * Redis configuration and client factory.
 * Uses ioredis for Redis connections (cache, sessions, BullMQ backing store).
 * @module config/redis
 */

import Redis from 'ioredis';

/** Redis connection configuration */
export const redisConfig = {
  /** Redis connection URL */
  url: process.env['REDIS_URL'] ?? 'redis://localhost:6379',

  /** Redis password (empty for local dev) */
  password: process.env['REDIS_PASSWORD'] ?? undefined,

  /** Redis database index */
  db: parseInt(process.env['REDIS_DB'] ?? '0', 10),
} as const;

/**
 * Creates a new ioredis client instance.
 * Each consumer (cache, BullMQ, rate-limiter) should get its own client.
 *
 * @param name - A human-readable name for this connection (used in logging)
 * @returns A configured Redis client
 */
export function createRedisClient(name = 'default'): Redis {
  const client = new Redis(redisConfig.url, {
    password: redisConfig.password || undefined,
    db: redisConfig.db,
    maxRetriesPerRequest: null, // Required for BullMQ compatibility
    enableReadyCheck: true,
    retryStrategy(times: number): number | null {
      if (times > 10) {
        console.error(
          `[Redis:${name}] Failed to connect after ${String(times)} attempts`,
        );
        return null; // Stop retrying
      }
      // Exponential backoff: 200ms, 400ms, 800ms, ..., max 5s
      return Math.min(times * 200, 5000);
    },
    connectionName: `itbengal-api-${name}`,
  });

  client.on('connect', () => {
    console.log(`[Redis:${name}] Connected`);
  });

  client.on('error', (err: Error) => {
    console.error(`[Redis:${name}] Error:`, err.message);
  });

  client.on('close', () => {
    console.log(`[Redis:${name}] Connection closed`);
  });

  return client;
}
