/**
 * Express request/response logging middleware.
 *
 * Logs every incoming HTTP request with method, URL, status code,
 * response time, IP, and user agent. Each request is assigned a
 * unique `requestId` (UUID v4) that is attached to the response
 * headers and to all log entries emitted during that request.
 *
 * Health-check endpoints (`/health`, `/healthz`, `/ready`, `/readyz`)
 * are excluded from logging to avoid noise.
 *
 * @module @itbengal/logger/middleware
 */

import { randomUUID } from 'node:crypto';
import type { Request, Response, NextFunction } from 'express';
import type { Logger } from 'winston';
import { createChildLogger } from './index.js';

/** Paths that are skipped during request logging. */
const SKIP_PATHS = new Set(['/health', '/healthz', '/ready', '/readyz']);

/** Header name used to propagate the request ID. */
const REQUEST_ID_HEADER = 'x-request-id';

/**
 * Options for the request-logging middleware.
 */
export interface RequestLoggerOptions {
  /** The parent logger to create child loggers from. */
  logger: Logger;
  /** Additional paths to skip (in addition to health checks). */
  skipPaths?: string[];
}

/**
 * Create an Express middleware that logs every request and response.
 *
 * The middleware:
 * 1. Generates (or reuses) a `X-Request-Id` header.
 * 2. Creates a child logger with the request ID.
 * 3. Attaches the child logger to `req.log` for downstream handlers.
 * 4. Logs the completed request with method, URL, status code,
 *    response time in ms, client IP, and user agent.
 *
 * @param options - Middleware configuration.
 * @returns Express middleware function.
 *
 * @example
 * ```ts
 * import express from 'express';
 * import { createLogger } from '@itbengal/logger';
 * import { requestLogger } from '@itbengal/logger/middleware';
 *
 * const logger = createLogger({ service: 'api' });
 * const app = express();
 *
 * app.use(requestLogger({ logger }));
 *
 * app.get('/ping', (req, res) => {
 *   req.log.info('Pong!');
 *   res.json({ pong: true });
 * });
 * ```
 */
export function requestLogger(options: RequestLoggerOptions) {
  const { logger, skipPaths: extraSkipPaths = [] } = options;

  const allSkipPaths = new Set([...SKIP_PATHS, ...extraSkipPaths]);

  return (req: Request, res: Response, next: NextFunction): void => {
    // Skip health-check endpoints.
    if (allSkipPaths.has(req.path)) {
      next();
      return;
    }

    // Assign or reuse a request ID.
    const requestId =
      (req.headers[REQUEST_ID_HEADER] as string | undefined) ?? randomUUID();
    res.setHeader(REQUEST_ID_HEADER, requestId);

    // Create a request-scoped child logger.
    const childLogger = createChildLogger(logger, { requestId });

    // Attach to the request for downstream use.
    (req as RequestWithLogger).log = childLogger;

    const startTime = process.hrtime.bigint();

    // Hook into the response finish event.
    res.on('finish', () => {
      const durationNs = process.hrtime.bigint() - startTime;
      const durationMs = Number(durationNs / 1_000_000n);

      const logData = {
        method: req.method,
        url: req.originalUrl,
        statusCode: res.statusCode,
        durationMs,
        ip: req.ip ?? req.socket.remoteAddress ?? 'unknown',
        userAgent: req.get('user-agent') ?? 'unknown',
      };

      if (res.statusCode >= 500) {
        childLogger.error('Request completed with server error', logData);
      } else if (res.statusCode >= 400) {
        childLogger.warn('Request completed with client error', logData);
      } else {
        childLogger.info('Request completed', logData);
      }
    });

    next();
  };
}

// ─── Type Augmentation ───────────────────────────────────────────────────────

/**
 * Extended Express Request that includes a scoped logger.
 */
export interface RequestWithLogger extends Request {
  /** Request-scoped logger with the `requestId` attached. */
  log: Logger;
}

// Augment the Express Request interface globally so that `req.log`
// is available everywhere without explicit casting.
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      /** Request-scoped Winston logger (injected by requestLogger middleware). */
      log: Logger;
    }
  }
}
