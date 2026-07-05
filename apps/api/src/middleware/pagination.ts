/**
 * Pagination middleware.
 * Parses page/perPage/sortBy/sortOrder from query parameters
 * and attaches a normalised pagination object to `req.pagination`.
 * @module middleware/pagination
 */

import type { NextFunction, Request, Response } from 'express';

/** Maximum allowed items per page to prevent abuse */
const MAX_PER_PAGE = 100;

/** Default items per page */
const DEFAULT_PER_PAGE = 20;

/** Default sort column */
const DEFAULT_SORT_BY = 'createdAt';

/**
 * Middleware that parses pagination query parameters.
 *
 * Supported query params:
 * - `page` — Page number (1-indexed, default 1)
 * - `perPage` — Items per page (default 20, max 100)
 * - `sortBy` — Column to sort by (default 'createdAt')
 * - `sortOrder` — 'asc' or 'desc' (default 'desc')
 *
 * The parsed values are available at `req.pagination`.
 */
export function pagination(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  const query = req.query;

  const page = Math.max(1, parseInt(String(query['page'] ?? '1'), 10) || 1);
  const perPage = Math.min(
    MAX_PER_PAGE,
    Math.max(1, parseInt(String(query['perPage'] ?? String(DEFAULT_PER_PAGE)), 10) || DEFAULT_PER_PAGE),
  );

  const sortBy = typeof query['sortBy'] === 'string' && query['sortBy'].length > 0
    ? query['sortBy']
    : DEFAULT_SORT_BY;

  const rawOrder = typeof query['sortOrder'] === 'string'
    ? query['sortOrder'].toLowerCase()
    : 'desc';
  const sortOrder: 'asc' | 'desc' = rawOrder === 'asc' ? 'asc' : 'desc';

  req.pagination = {
    page,
    perPage,
    sortBy,
    sortOrder,
    offset: (page - 1) * perPage,
  };

  next();
}
