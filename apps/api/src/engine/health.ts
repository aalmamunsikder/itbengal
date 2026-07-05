/**
 * Container health check service — HTTP-based readiness probes.
 *
 * Polls an HTTP endpoint until it returns a 2xx response or all
 * retries are exhausted. Used during deployment to verify that a
 * newly started container is ready to serve traffic.
 *
 * @module engine/health
 */

import { logger } from '../utils/logger.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Options for the health check poller. */
interface HealthCheckOptions {
  /** Maximum number of retry attempts (default: 30). */
  maxRetries?: number;
  /** Interval between retries in milliseconds (default: 2000). */
  intervalMs?: number;
  /** Per-request timeout in milliseconds (default: 5000). */
  timeoutMs?: number;
}

/** Default health check configuration. */
const DEFAULTS: Required<HealthCheckOptions> = {
  maxRetries: 30,
  intervalMs: 2000,
  timeoutMs: 5000,
} as const;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Sleep for the specified duration.
 * @param ms - Milliseconds to wait.
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Wait for a container to become healthy by polling an HTTP endpoint.
 *
 * Performs HTTP GET requests at regular intervals until a 2xx status
 * code is received or all retries are exhausted. Uses `AbortController`
 * for per-request timeouts.
 *
 * @param url     - The health check URL to probe (e.g. `http://localhost:3000/`).
 * @param options - Optional retry/timeout configuration.
 * @returns `true` if the endpoint responded with 2xx within the retry window,
 *          `false` if all retries were exhausted.
 *
 * @example
 * ```ts
 * const healthy = await waitForHealthy('http://localhost:3000/', {
 *   maxRetries: 20,
 *   intervalMs: 3000,
 * });
 *
 * if (!healthy) {
 *   throw new Error('Container failed health check');
 * }
 * ```
 */
export async function waitForHealthy(
  url: string,
  options?: HealthCheckOptions,
): Promise<boolean> {
  const { maxRetries, intervalMs, timeoutMs } = { ...DEFAULTS, ...options };

  logger.info(`Starting health check on ${url} (max ${maxRetries} attempts, ${intervalMs}ms interval)`);

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      try {
        const response = await fetch(url, {
          method: 'GET',
          signal: controller.signal,
          // Don't follow redirects — we just need a response
          redirect: 'manual',
        });

        clearTimeout(timeoutId);

        if (response.ok || (response.status >= 200 && response.status < 400)) {
          logger.info(`Health check passed on attempt ${attempt}/${maxRetries} (status: ${response.status})`);
          return true;
        }

        logger.debug(
          `Health check attempt ${attempt}/${maxRetries}: status ${response.status}`,
        );
      } catch {
        clearTimeout(timeoutId);
        logger.debug(
          `Health check attempt ${attempt}/${maxRetries}: request failed or timed out`,
        );
      }
    } catch (error) {
      logger.debug(
        `Health check attempt ${attempt}/${maxRetries}: ${error instanceof Error ? error.message : 'unknown error'}`,
      );
    }

    // Wait before the next attempt (unless it's the last one)
    if (attempt < maxRetries) {
      await sleep(intervalMs);
    }
  }

  logger.warn(`Health check failed after ${maxRetries} attempts on ${url}`);
  return false;
}

export type { HealthCheckOptions };
