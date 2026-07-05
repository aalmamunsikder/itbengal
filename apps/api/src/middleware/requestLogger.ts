/**
 * Request logger middleware.
 * Logs incoming requests and their response status/duration.
 * @module middleware/requestLogger
 */

import type { NextFunction, Request, Response } from 'express';

/**
 * Logs method, path, status code, and response time for every request.
 * Uses `res.on('finish')` to capture the final status after the response is sent.
 */
export function requestLogger(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    const requestId = req.id ?? '-';
    const { method, originalUrl } = req;
    const { statusCode } = res;

    // Colour-code status: 2xx green, 3xx cyan, 4xx yellow, 5xx red
    const level = statusCode >= 500 ? 'error' : statusCode >= 400 ? 'warn' : 'info';

    const line = `[${requestId}] ${method} ${originalUrl} → ${String(statusCode)} (${String(duration)}ms)`;

    if (level === 'error') {
      console.error(line);
    } else if (level === 'warn') {
      console.warn(line);
    } else {
      console.log(line);
    }
  });

  next();
}
