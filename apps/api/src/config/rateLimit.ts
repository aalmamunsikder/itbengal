/**
 * Rate limiting configuration.
 * Defines preset rate limit windows and thresholds for different endpoint categories.
 * @module config/rateLimit
 */

/** Rate limit preset configuration */
interface RateLimitPreset {
  /** Time window in milliseconds */
  windowMs: number;
  /** Maximum requests within the window */
  max: number;
  /** Error message when limit is exceeded */
  message: string;
}

/** Default rate limiter: 100 requests per 15 minutes */
export const defaultRateLimitConfig: RateLimitPreset = {
  windowMs: parseInt(process.env['RATE_LIMIT_WINDOW_MS'] ?? '900000', 10),
  max: parseInt(process.env['RATE_LIMIT_MAX_REQUESTS'] ?? '100', 10),
  message: 'Too many requests. Please try again later.',
};

/** Auth rate limiter: 20 requests per 15 minutes (stricter for login/register) */
export const authRateLimitConfig: RateLimitPreset = {
  windowMs: 15 * 60 * 1000,
  max: parseInt(process.env['RATE_LIMIT_AUTH_MAX'] ?? '20', 10),
  message: 'Too many authentication attempts. Please try again later.',
};

/** Upload rate limiter: 10 requests per 15 minutes (file uploads) */
export const uploadRateLimitConfig: RateLimitPreset = {
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: 'Upload limit exceeded. Please try again later.',
};
