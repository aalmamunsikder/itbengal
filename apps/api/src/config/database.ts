/**
 * Database configuration.
 * Reads PostgreSQL connection settings from environment variables.
 * @module config/database
 */

/** Database connection configuration */
export const databaseConfig = {
  /** PostgreSQL connection URL */
  url:
    process.env['DATABASE_URL'] ??
    'postgresql://itbengal:itbengal_dev_password@localhost:5432/itbengal?schema=public',

  /** Minimum connections in the pool */
  poolMin: parseInt(process.env['DATABASE_POOL_MIN'] ?? '2', 10),

  /** Maximum connections in the pool */
  poolMax: parseInt(process.env['DATABASE_POOL_MAX'] ?? '10', 10),
} as const;
