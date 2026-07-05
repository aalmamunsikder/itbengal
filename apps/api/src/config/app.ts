/**
 * Application configuration.
 * Loads from environment variables with sensible development defaults.
 * @module config/app
 */

/** Core application configuration derived from environment variables */
export const appConfig = {
  /** HTTP server port */
  port: parseInt(process.env['PORT'] ?? '4000', 10),

  /** Current Node.js environment */
  nodeEnv: process.env['NODE_ENV'] ?? 'development',

  /** Application display name */
  appName: process.env['APP_NAME'] ?? 'ITBengal',

  /** Public-facing application URL (dashboard) */
  appUrl: process.env['APP_URL'] ?? 'http://localhost:3000',

  /** API server URL */
  apiUrl: process.env['API_URL'] ?? 'http://localhost:4000',

  /** Admin panel URL */
  adminUrl: process.env['ADMIN_URL'] ?? 'http://localhost:3001',

  /** Primary domain for the hosting platform */
  domain: process.env['DOMAIN'] ?? 'itbengal.xyz',

  /** Encryption key for sensitive data (32-byte hex) */
  encryptionKey:
    process.env['ENCRYPTION_KEY'] ??
    'your-32-byte-hex-encryption-key-change-this',

  /** Whether the app is running in production */
  get isProduction(): boolean {
    return this.nodeEnv === 'production';
  },

  /** Whether the app is running in development */
  get isDevelopment(): boolean {
    return this.nodeEnv === 'development';
  },

  /** Whether the app is running in test mode */
  get isTest(): boolean {
    return this.nodeEnv === 'test';
  },
} as const;
