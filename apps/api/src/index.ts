/**
 * API server entry point.
 * Loads environment, boots the Express app, connects to external services,
 * and registers graceful shutdown handlers.
 * @module index
 */

import 'dotenv/config';

import type { Server } from 'node:http';

import { app } from './app.js';
import { appConfig } from './config/app.js';
import { createRedisClient } from './config/redis.js';
import { setupWebSocket } from './engine/index.js';

// ---------------------------------------------------------------------------
// External connections
// ---------------------------------------------------------------------------

/** Primary Redis client for the API (cache, pub-sub) */
const redis = createRedisClient('main');

// ---------------------------------------------------------------------------
// HTTP server
// ---------------------------------------------------------------------------

let server: Server;

async function startServer(): Promise<void> {
  const { port, appName, nodeEnv, apiUrl } = appConfig;

  // Wait for Redis to be ready (or fail fast)
  try {
    await redis.ping();
    console.log(`[${appName}] ✓ Redis connected`);
  } catch (err) {
    console.warn(
      `[${appName}] ⚠ Redis not available — some features will be degraded`,
      err instanceof Error ? err.message : err,
    );
  }

  // NOTE: Prisma client connection will be added here once @itbengal/database is built.
  // try {
  //   await prisma.$connect();
  //   console.log(`[${appName}] ✓ Database connected`);
  // } catch (err) { ... }

  server = app.listen(port, () => {
    console.log(`
╔══════════════════════════════════════════════════╗
║                                                  ║
║   ${appName} API Server                          ║
║                                                  ║
║   URL:         ${apiUrl.padEnd(33)}║
║   Environment: ${nodeEnv.padEnd(33)}║
║   Node.js:     ${process.version.padEnd(33)}║
║   PID:         ${String(process.pid).padEnd(33)}║
║                                                  ║
╚══════════════════════════════════════════════════╝
    `);
  });

  // Attach WebSocket server for log streaming
  setupWebSocket(server);

  // Prevent the server from keeping idle connections alive indefinitely
  // during shutdown
  server.keepAliveTimeout = 65_000; // slightly above typical ALB timeout (60s)
  server.headersTimeout = 66_000;
}

// ---------------------------------------------------------------------------
// Graceful shutdown
// ---------------------------------------------------------------------------

async function shutdown(signal: string): Promise<void> {
  console.log(`\n[${appConfig.appName}] ${signal} received — shutting down gracefully…`);

  // 1. Stop accepting new connections
  if (server) {
    await new Promise<void>((resolve, reject) => {
      server.close((err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
    console.log(`[${appConfig.appName}] ✓ HTTP server closed`);
  }

  // 2. Close Redis
  try {
    await redis.quit();
    console.log(`[${appConfig.appName}] ✓ Redis disconnected`);
  } catch {
    // Ignore — might already be closed
  }

  // 3. Close Prisma (will be added in Sprint 2)
  // try {
  //   await prisma.$disconnect();
  //   console.log(`[${appConfig.appName}] ✓ Database disconnected`);
  // } catch { }

  console.log(`[${appConfig.appName}] Shutdown complete.`);
  process.exit(0);
}

// ---------------------------------------------------------------------------
// Process event handlers
// ---------------------------------------------------------------------------

// Graceful shutdown on SIGTERM (Docker/K8s) and SIGINT (Ctrl-C)
process.on('SIGTERM', () => void shutdown('SIGTERM'));
process.on('SIGINT', () => void shutdown('SIGINT'));

// Log and exit on uncaught exceptions — the process is in an undefined state
process.on('uncaughtException', (err: Error) => {
  console.error(`[${appConfig.appName}] UNCAUGHT EXCEPTION — shutting down`, {
    name: err.name,
    message: err.message,
    stack: err.stack,
  });
  void shutdown('uncaughtException');
});

// Log unhandled promise rejections
process.on('unhandledRejection', (reason: unknown) => {
  console.error(
    `[${appConfig.appName}] UNHANDLED REJECTION`,
    reason instanceof Error
      ? { name: reason.name, message: reason.message, stack: reason.stack }
      : reason,
  );
  // In Node 15+ this terminates the process. We log and let Node decide.
});

// ---------------------------------------------------------------------------
// Boot
// ---------------------------------------------------------------------------

startServer().catch((err: unknown) => {
  console.error(`[${appConfig.appName}] Failed to start server:`, err);
  process.exit(1);
});
