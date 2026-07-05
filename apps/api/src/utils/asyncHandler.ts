/**
 * Async route handler wrapper.
 * Catches rejected promises from async Express handlers and forwards to next().
 * Without this, unhandled rejections in async handlers crash the server.
 * @module utils/asyncHandler
 */

import type { NextFunction, Request, RequestHandler, Response } from 'express';

/**
 * Wraps an async route handler so rejected promises are passed to Express error handling.
 *
 * @param fn - Async route handler function
 * @returns An Express-compatible middleware that catches errors
 *
 * @example
 * ```ts
 * router.get('/users', asyncHandler(async (req, res) => {
 *   const users = await userService.findAll();
 *   sendSuccess(res, users);
 * }));
 * ```
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>,
): RequestHandler {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
