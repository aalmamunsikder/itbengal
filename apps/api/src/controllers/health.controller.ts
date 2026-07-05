/**
 * Health check controller.
 * Provides basic and detailed health endpoints for monitoring.
 * @module controllers/health
 */

import type { Request, Response } from 'express';

import { createRedisClient } from '../config/redis.js';
import { sendSuccess } from '../utils/apiResponse.js';

/** Cached app version — read once at startup */
const APP_VERSION = process.env['npm_package_version'] ?? '0.1.0';

/**
 * GET /api/v1/health
 * Basic health check — returns status, timestamp, and uptime.
 * No authentication required. Used by load balancers and uptime monitors.
 */
export async function healthCheck(
  _req: Request,
  res: Response,
): Promise<void> {
  sendSuccess(res, {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: APP_VERSION,
  });
}

/**
 * GET /api/v1/health/detailed
 * Detailed health check — pings database, Redis, reports memory and system info.
 * Protected by admin authentication.
 */
export async function detailedHealthCheck(
  _req: Request,
  res: Response,
): Promise<void> {
  const checks: Record<string, unknown> = {};

  // --- Database check ---
  try {
    // Attempt a lightweight query (Prisma will be wired in Sprint 2)
    // For now we report as "unconfigured" since the @itbengal/database
    // package isn't built yet.
    checks['database'] = { status: 'unconfigured', message: 'Prisma client not yet integrated' };
  } catch (err) {
    checks['database'] = {
      status: 'error',
      message: err instanceof Error ? err.message : 'Unknown error',
    };
  }

  // --- Redis check ---
  let redisClient: ReturnType<typeof createRedisClient> | null = null;
  try {
    redisClient = createRedisClient('health-check');
    const pong = await redisClient.ping();
    checks['redis'] = { status: pong === 'PONG' ? 'ok' : 'degraded', latency: 'n/a' };
  } catch (err) {
    checks['redis'] = {
      status: 'error',
      message: err instanceof Error ? err.message : 'Unknown error',
    };
  } finally {
    if (redisClient) {
      await redisClient.quit().catch(() => {
        /* ignore cleanup errors */
      });
    }
  }

  // --- System info ---
  const memoryUsage = process.memoryUsage();
  checks['memory'] = {
    rss: `${Math.round(memoryUsage.rss / 1024 / 1024)}MB`,
    heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB`,
    heapTotal: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)}MB`,
    external: `${Math.round(memoryUsage.external / 1024 / 1024)}MB`,
  };

  checks['system'] = {
    nodeVersion: process.version,
    platform: process.platform,
    arch: process.arch,
    uptime: process.uptime(),
    pid: process.pid,
  };

  // Overall status
  const allOk = Object.values(checks).every(
    (c) => (c as Record<string, unknown>)['status'] !== 'error',
  );

  sendSuccess(
    res,
    {
      status: allOk ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      version: APP_VERSION,
      checks,
    },
    allOk ? 'All systems operational' : 'Some systems are degraded',
  );
}
