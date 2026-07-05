/**
 * Configuration barrel file.
 * Re-exports all configuration modules.
 * @module config
 */

export { appConfig } from './app.js';
export { corsConfig } from './cors.js';
export { databaseConfig } from './database.js';
export { mailConfig } from './mail.js';
export { defaultJobOptions, QUEUE_NAMES, queueConnection } from './queue.js';
export {
  authRateLimitConfig,
  defaultRateLimitConfig,
  uploadRateLimitConfig,
} from './rateLimit.js';
export { createRedisClient, redisConfig } from './redis.js';
