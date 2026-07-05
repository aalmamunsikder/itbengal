/**
 * Platform-wide constants.
 *
 * Centralised configuration values that are shared across services.
 * Runtime environment-specific overrides should be handled via env variables,
 * but these serve as sensible defaults and documentation.
 *
 * @module @itbengal/utils/constants
 */

// ─── Rate Limits (requests per minute) ───────────────────────────────────────

/** Default rate limits per endpoint category (requests per minute per IP). */
export const RATE_LIMITS = {
  /** Auth endpoints (login, register, password reset). */
  auth: 20,
  /** General API endpoints. */
  api: 100,
  /** File upload endpoints. */
  upload: 10,
} as const;

// ─── Cache TTLs (seconds) ────────────────────────────────────────────────────

/** Time-to-live values for cached data (in seconds). */
export const CACHE_TTL = {
  /** User session data. */
  session: 86_400,
  /** Generic API response caching. */
  apiResponse: 60,
  /** Cached user profile data. */
  userProfile: 300,
  /** Plan listings (rarely change). */
  plans: 3_600,
  /** DNS record lookups. */
  dns: 60,
  /** Server node health data. */
  nodeHealth: 30,
} as const;

// ─── Error Codes ─────────────────────────────────────────────────────────────

/** Machine-readable error codes returned by the API. */
export const ERROR_CODES = {
  // Authentication
  AUTH_INVALID_CREDENTIALS: 'AUTH_INVALID_CREDENTIALS',
  AUTH_ACCOUNT_LOCKED: 'AUTH_ACCOUNT_LOCKED',
  AUTH_EMAIL_NOT_VERIFIED: 'AUTH_EMAIL_NOT_VERIFIED',
  AUTH_2FA_REQUIRED: 'AUTH_2FA_REQUIRED',
  AUTH_2FA_INVALID: 'AUTH_2FA_INVALID',
  AUTH_TOKEN_EXPIRED: 'AUTH_TOKEN_EXPIRED',
  AUTH_TOKEN_INVALID: 'AUTH_TOKEN_INVALID',
  AUTH_REFRESH_TOKEN_INVALID: 'AUTH_REFRESH_TOKEN_INVALID',
  AUTH_ACCOUNT_SUSPENDED: 'AUTH_ACCOUNT_SUSPENDED',
  AUTH_ACCOUNT_DELETED: 'AUTH_ACCOUNT_DELETED',

  // Authorization
  FORBIDDEN: 'FORBIDDEN',
  INSUFFICIENT_PERMISSIONS: 'INSUFFICIENT_PERMISSIONS',

  // Validation
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  DUPLICATE_ENTRY: 'DUPLICATE_ENTRY',

  // Resources
  RESOURCE_NOT_FOUND: 'RESOURCE_NOT_FOUND',
  RESOURCE_CONFLICT: 'RESOURCE_CONFLICT',

  // Deployments
  DEPLOYMENT_BUILD_FAILED: 'DEPLOYMENT_BUILD_FAILED',
  DEPLOYMENT_TIMEOUT: 'DEPLOYMENT_TIMEOUT',
  DEPLOYMENT_CANCELLED: 'DEPLOYMENT_CANCELLED',

  // Billing
  PAYMENT_FAILED: 'PAYMENT_FAILED',
  SUBSCRIPTION_EXPIRED: 'SUBSCRIPTION_EXPIRED',
  QUOTA_EXCEEDED: 'QUOTA_EXCEEDED',

  // Server
  SERVER_UNAVAILABLE: 'SERVER_UNAVAILABLE',
  CONTAINER_START_FAILED: 'CONTAINER_START_FAILED',

  // Rate Limiting
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',

  // Internal
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const;

// ─── Deployment Configuration ────────────────────────────────────────────────

/** Default deployment pipeline configuration. */
export const DEPLOYMENT = {
  /** Maximum time a build is allowed to run (10 minutes). */
  MAX_BUILD_TIME_MS: 600_000,
  /** Interval between container health checks (5 seconds). */
  HEALTH_CHECK_INTERVAL_MS: 5_000,
  /** Maximum wait time for a container to become healthy (2 minutes). */
  HEALTH_CHECK_TIMEOUT_MS: 120_000,
  /** Number of health-check failures before marking a deployment as failed. */
  MAX_HEALTH_CHECK_FAILURES: 5,
  /** Maximum number of concurrent builds per server node. */
  MAX_CONCURRENT_BUILDS: 3,
  /** How many previous deployments to keep for instant rollback. */
  ROLLBACK_RETENTION_COUNT: 10,
  /** Maximum deployment log lines stored per deployment. */
  MAX_LOG_LINES: 10_000,
} as const;

// ─── File Upload ─────────────────────────────────────────────────────────────

/** File upload constraints. */
export const FILE_UPLOAD = {
  /** Maximum upload size in bytes (100 MB). */
  MAX_SIZE: 104_857_600,
  /** Allowed file extensions for project archive uploads. */
  ALLOWED_EXTENSIONS: [
    'zip',
    'tar',
    'tar.gz',
    'tgz',
  ],
  /** Allowed MIME types for avatar uploads. */
  ALLOWED_AVATAR_TYPES: [
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
  ],
  /** Maximum avatar file size in bytes (5 MB). */
  MAX_AVATAR_SIZE: 5_242_880,
} as const;
