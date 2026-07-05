/**
 * Error handling middleware and custom error classes.
 * All operational errors extend AppError and carry a status code + error code.
 * The global error handler formats responses and distinguishes
 * operational errors (expected) from programming errors (bugs).
 * @module middleware/errorHandler
 */

import type { NextFunction, Request, Response } from 'express';

import { appConfig } from '../config/app.js';
import { sendError } from '../utils/apiResponse.js';

// ---------------------------------------------------------------------------
// Custom Error Classes
// ---------------------------------------------------------------------------

/**
 * Base application error.
 * All custom errors should extend this class.
 * `isOperational` distinguishes expected errors (bad input, not found)
 * from unexpected bugs (null reference, type errors).
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly isOperational: boolean;

  constructor(
    message: string,
    statusCode: number,
    code: string,
    isOperational = true,
  ) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = isOperational;

    // Preserve proper stack trace in V8
    Error.captureStackTrace(this, this.constructor);
  }
}

/** 404 — Resource not found */
export class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super(message, 404, 'NOT_FOUND');
  }
}

/** 401 — Authentication required or invalid credentials */
export class UnauthorizedError extends AppError {
  constructor(message = 'Authentication required') {
    super(message, 401, 'UNAUTHORIZED');
  }
}

/** 403 — Authenticated but insufficient permissions */
export class ForbiddenError extends AppError {
  constructor(message = 'Access denied') {
    super(message, 403, 'FORBIDDEN');
  }
}

/** 400 — Request validation failed */
export class ValidationError extends AppError {
  public readonly errors: unknown[];

  constructor(message = 'Validation failed', errors: unknown[] = []) {
    super(message, 400, 'VALIDATION_ERROR');
    this.errors = errors;
  }
}

/** 409 — Resource already exists / conflicting state */
export class ConflictError extends AppError {
  constructor(message = 'Resource already exists') {
    super(message, 409, 'CONFLICT');
  }
}

/** 429 — Rate limit exceeded */
export class TooManyRequestsError extends AppError {
  constructor(message = 'Too many requests. Please try again later.') {
    super(message, 429, 'TOO_MANY_REQUESTS');
  }
}

// ---------------------------------------------------------------------------
// Global Error Handler Middleware
// ---------------------------------------------------------------------------

/**
 * Express global error-handling middleware.
 * Must be registered **after** all routes.
 *
 * - Operational errors (AppError) are forwarded to the client as-is.
 * - Programming errors get a generic 500 in production to avoid leaking internals.
 * - Stack traces are included only in development.
 */
export function globalErrorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction,
): void {
  // Log every error
  const requestId = req.id ?? 'unknown';
  console.error(`[Error] [${requestId}] ${err.message}`, {
    name: err.name,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  // Handle known operational errors
  if (err instanceof AppError) {
    sendError(res, {
      statusCode: err.statusCode,
      message: err.message,
      code: err.code,
      ...(err instanceof ValidationError && { errors: err.errors }),
      ...(appConfig.isDevelopment && { stack: err.stack }),
    });
    return;
  }

  // Handle JSON parse errors from express.json()
  if (err.name === 'SyntaxError' && 'body' in err) {
    sendError(res, {
      statusCode: 400,
      message: 'Invalid JSON in request body',
      code: 'INVALID_JSON',
    });
    return;
  }

  // Programming / unknown errors — hide details in production
  sendError(res, {
    statusCode: 500,
    message: appConfig.isProduction
      ? 'An unexpected error occurred'
      : err.message,
    code: 'INTERNAL_ERROR',
    ...(appConfig.isDevelopment && { stack: err.stack }),
  });
}
