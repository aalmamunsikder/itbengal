/**
 * BullMQ queue configuration.
 * Provides Redis connection options and default job settings.
 * @module config/queue
 */

import type { ConnectionOptions, DefaultJobOptions } from 'bullmq';

import { redisConfig } from './redis.js';

/**
 * Parse the Redis URL into host/port/password components for BullMQ.
 * BullMQ does not accept a URL string directly — it needs discrete fields.
 */
function parseRedisUrl(url: string): {
  host: string;
  port: number;
  password?: string;
} {
  try {
    const parsed = new URL(url);
    return {
      host: parsed.hostname || 'localhost',
      port: parseInt(parsed.port || '6379', 10),
      password: parsed.password || undefined,
    };
  } catch {
    return { host: 'localhost', port: 6379 };
  }
}

/** Redis connection options for BullMQ workers and queues */
export const queueConnection: ConnectionOptions = {
  ...parseRedisUrl(redisConfig.url),
  password: redisConfig.password || undefined,
  db: redisConfig.db,
};

/** Default options applied to every enqueued job */
export const defaultJobOptions: DefaultJobOptions = {
  /** Retry failed jobs up to 3 times */
  attempts: 3,

  /** Exponential backoff: 1s, 2s, 4s */
  backoff: {
    type: 'exponential',
    delay: 1000,
  },

  /** Remove completed jobs after 24 hours to save memory */
  removeOnComplete: {
    age: 24 * 60 * 60, // 24 hours in seconds
    count: 1000,
  },

  /** Keep failed jobs for 7 days for debugging */
  removeOnFail: {
    age: 7 * 24 * 60 * 60, // 7 days in seconds
  },
};

/** Available queue names in the application */
export const QUEUE_NAMES = {
  EMAIL: 'email',
  DEPLOYMENT: 'deployment',
  BILLING: 'billing',
  CLEANUP: 'cleanup',
} as const;
