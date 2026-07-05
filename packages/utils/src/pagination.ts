/**
 * Pagination helpers for parsing query parameters and building paginated responses.
 *
 * @module @itbengal/utils/pagination
 */

import type { PaginatedResponse, SortOrder } from '@itbengal/types';

/** Default number of items per page. */
const DEFAULT_PER_PAGE = 20;

/** Maximum number of items per page to prevent abuse. */
const MAX_PER_PAGE = 100;

/** Default page number. */
const DEFAULT_PAGE = 1;

/**
 * Parsed pagination parameters ready for database queries.
 */
export interface ParsedPagination {
  /** Current page (1-indexed). */
  page: number;
  /** Items per page. */
  perPage: number;
  /** Number of rows to skip (for OFFSET-based pagination). */
  skip: number;
  /** Number of rows to take (alias for perPage). */
  take: number;
  /** Column and direction for ORDER BY. */
  orderBy: {
    column: string;
    direction: SortOrder;
  };
}

/**
 * Parse raw query parameters into sanitised pagination values.
 *
 * Handles coercion, clamping, and defaults so that callers
 * never need to worry about invalid input.
 *
 * @param query - Raw query parameters (e.g. from `req.query`).
 * @returns Parsed and validated pagination parameters.
 */
export function parsePaginationQuery(
  query: Record<string, unknown>,
): ParsedPagination {
  let page = Number(query['page']);
  if (!Number.isFinite(page) || page < 1) {
    page = DEFAULT_PAGE;
  }
  page = Math.floor(page);

  let perPage = Number(query['perPage']);
  if (!Number.isFinite(perPage) || perPage < 1) {
    perPage = DEFAULT_PER_PAGE;
  }
  perPage = Math.min(Math.floor(perPage), MAX_PER_PAGE);

  const sortBy = typeof query['sortBy'] === 'string' && query['sortBy'].length > 0
    ? query['sortBy']
    : 'createdAt';

  const rawOrder = typeof query['sortOrder'] === 'string'
    ? query['sortOrder'].toLowerCase()
    : 'desc';
  const direction: SortOrder = rawOrder === 'asc' ? 'asc' : 'desc';

  return {
    page,
    perPage,
    skip: (page - 1) * perPage,
    take: perPage,
    orderBy: {
      column: sortBy,
      direction,
    },
  };
}

/**
 * Build a standardised paginated response object.
 *
 * @param data    - Array of items for the current page.
 * @param total   - Total number of items across all pages.
 * @param page    - Current page number (1-indexed).
 * @param perPage - Items per page.
 * @returns A {@link PaginatedResponse} with data and computed meta.
 */
export function createPaginatedResponse<T>(
  data: T[],
  total: number,
  page: number,
  perPage: number,
): PaginatedResponse<T> {
  const totalPages = Math.max(1, Math.ceil(total / perPage));

  return {
    data,
    meta: {
      page,
      perPage,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  };
}
