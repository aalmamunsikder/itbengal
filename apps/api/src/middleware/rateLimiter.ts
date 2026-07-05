/**
 * Rate limiting middleware with Redis-backed store.
 * Uses express-rate-limit + rate-limit-redis for distributed limiting.
 * @module middleware/rateLimiter
 */

import type { Request } from 'express';
import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';

import {
  authRateLimitConfig,
  defaultRateLimitConfig,
  uploadRateLimitConfig,
} from '../config/rateLimit.js';
import { createRedisClient } from '../config/redis.js';

/** Shared Redis client for all rate limiters */
let rateLimitRedisClient: ReturnType<typeof createRedisClient> | null = null;

/**
 * Lazily initialises and returns the Redis client for rate limiting.
 * Deferred to avoid connecting during module load / tests.
 */
function getRateLimitRedisClient(): ReturnType<typeof createRedisClient> {
  if (!rateLimitRedisClient) {
    rateLimitRedisClient = createRedisClient('rate-limit');
  }
  return rateLimitRedisClient;
}

/** Options for creating a rate limiter */
interface RateLimiterOptions {
  /** Time window in milliseconds */
  windowMs: number;
  /** Max requests within the window */
  max: number;
  /** Error message when limit exceeded */
  message: string;
  /** Optional prefix for Redis keys */
  keyPrefix?: string;
}

/**
 * Creates a rate-limiting middleware backed by Redis.
 *
 * @param options - Rate limit window, max requests, and message
 * @returns Express middleware
 */
export function createRateLimiter(options: RateLimiterOptions) {
  const redisClient = getRateLimitRedisClient();

  return rateLimit({
    windowMs: options.windowMs,
    max: options.max,
    standardHeaders: true, // X-RateLimit-* headers
    legacyHeaders: false, // Disable X-RateLimit-Limit (old format)
    message: {
      success: false,
      message: options.message,
      code: 'TOO_MANY_REQUESTS',
    },
    keyGenerator: (req: Request): string => {
      // Use authenticated user ID if available, otherwise fall back to IP
      return req.user?.userId ?? req.ip ?? 'unknown';
    },
    store: new RedisStore({
      // Use `sendCommand` adapter for ioredis
      sendCommand: (...args: string[]) =>
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-explicit-any
        redisClient.call(args[0]!, ...args.slice(1)) as any,
      prefix: options.keyPrefix ?? 'rl:',
    }),
    skip: (_req: Request): boolean => {
      // Skip rate limiting in test environment
      return process.env['NODE_ENV'] === 'test';
    },
  });
}

/** Default rate limiter: 100 req / 15 min */
export const defaultLimiter = createRateLimiter({
  ...defaultRateLimitConfig,
  keyPrefix: 'rl:default:',
});

/** Auth rate limiter: 20 req / 15 min (login, register, password reset) */
export const authLimiter = createRateLimiter({
  ...authRateLimitConfig,
  keyPrefix: 'rl:auth:',
});

/** Upload rate limiter: 10 req / 15 min */
export const uploadLimiter = createRateLimiter({
  ...uploadRateLimitConfig,
  keyPrefix: 'rl:upload:',
});
