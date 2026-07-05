/**
 * @module @itbengal/database/client
 * @description Singleton Prisma client with connection pooling, retry logic,
 * and graceful shutdown handlers.
 */

import { PrismaClient } from '@prisma/client';

/** Maximum number of connection retry attempts */
const MAX_RETRIES = 5;

/** Base delay in milliseconds between retry attempts (exponential backoff) */
const BASE_RETRY_DELAY_MS = 1_000;

/** Whether the current environment is development */
const isDevelopment = process.env['NODE_ENV'] !== 'production';

/**
 * Create a configured PrismaClient instance with appropriate logging
 * for the current environment.
 */
function createPrismaClient(): PrismaClient {
  return new PrismaClient({
    log: isDevelopment
      ? [
          { level: 'query', emit: 'event' },
          { level: 'warn', emit: 'stdout' },
          { level: 'error', emit: 'stdout' },
        ]
      : [{ level: 'error', emit: 'stdout' }],
    datasourceUrl: process.env['DATABASE_URL'],
  });
}

/**
 * Attempt to connect to the database with exponential backoff retry logic.
 *
 * @param client - The PrismaClient instance to connect
 * @param retries - Maximum number of retry attempts (default: MAX_RETRIES)
 * @throws Will throw after exhausting all retry attempts
 */
async function connectWithRetry(
  client: PrismaClient,
  retries: number = MAX_RETRIES,
): Promise<void> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await client.$connect();
      if (isDevelopment) {
        console.log(
          `[database] Connected to PostgreSQL (attempt ${String(attempt)}/${String(retries)})`,
        );
      }
      return;
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Unknown error';

      if (attempt === retries) {
        console.error(
          `[database] Failed to connect after ${String(retries)} attempts: ${message}`,
        );
        throw error;
      }

      const delay = BASE_RETRY_DELAY_MS * Math.pow(2, attempt - 1);
      console.warn(
        `[database] Connection attempt ${String(attempt)}/${String(retries)} failed: ${message}. Retrying in ${String(delay)}ms...`,
      );
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
}

/**
 * Global singleton reference for the Prisma client.
 * Prevents multiple client instances during development hot-reloading.
 */
const globalForPrisma = globalThis as unknown as {
  __prismaClient: PrismaClient | undefined;
};

/**
 * Singleton Prisma client instance.
 *
 * In development, the client is stored on `globalThis` to survive
 * hot-module-replacement reloads. In production, a new instance is
 * created once and reused.
 *
 * @example
 * ```ts
 * import { prisma } from '@itbengal/database';
 *
 * const users = await prisma.user.findMany();
 * ```
 */
export const prisma: PrismaClient =
  globalForPrisma.__prismaClient ?? createPrismaClient();

if (isDevelopment) {
  globalForPrisma.__prismaClient = prisma;
}

/**
 * Initialize the database connection with retry logic.
 * Should be called once at application startup.
 *
 * @param retries - Number of connection attempts before failing
 * @returns Promise that resolves when the connection is established
 *
 * @example
 * ```ts
 * import { initializeDatabase } from '@itbengal/database';
 *
 * await initializeDatabase();
 * ```
 */
export async function initializeDatabase(
  retries: number = MAX_RETRIES,
): Promise<void> {
  await connectWithRetry(prisma, retries);
}

/**
 * Gracefully disconnect from the database.
 * Should be called during application shutdown.
 */
export async function disconnectDatabase(): Promise<void> {
  await prisma.$disconnect();
  if (isDevelopment) {
    console.log('[database] Disconnected from PostgreSQL');
  }
}

// ---------------------------------------------------------------------------
// Graceful shutdown handlers — ensure connections are released on process exit
// ---------------------------------------------------------------------------
function handleShutdown(signal: string): void {
  console.log(`[database] Received ${signal}, disconnecting...`);
  prisma
    .$disconnect()
    .then(() => {
      process.exit(0);
    })
    .catch((err: unknown) => {
      console.error('[database] Error during disconnect:', err);
      process.exit(1);
    });
}

process.on('SIGTERM', () => handleShutdown('SIGTERM'));
process.on('SIGINT', () => handleShutdown('SIGINT'));
