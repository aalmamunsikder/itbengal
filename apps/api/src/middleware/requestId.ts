/**
 * Request ID middleware.
 * Attaches a UUID v4 to every incoming request as `req.id`
 * and echoes it in the `X-Request-ID` response header.
 * Enables request tracing across logs.
 * @module middleware/requestId
 */

import type { NextFunction, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';

/**
 * Middleware that assigns a unique identifier to each request.
 * If the client sends an `X-Request-ID` header, that value is used
 * (useful for distributed tracing); otherwise a new UUID v4 is generated.
 */
export function requestId(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const id =
    (req.headers['x-request-id'] as string | undefined) ?? uuidv4();

  req.id = id;
  res.setHeader('X-Request-ID', id);

  next();
}
