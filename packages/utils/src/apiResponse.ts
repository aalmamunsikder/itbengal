/**
 * Standardised API response builders.
 *
 * These helpers ensure every endpoint returns a consistent JSON shape
 * so clients can rely on a single response structure.
 *
 * @module @itbengal/utils/apiResponse
 */

import type { ApiError, ApiResponse, PaginatedResponse } from '@itbengal/types';
import { createPaginatedResponse } from './pagination.js';

/**
 * Build a successful API response.
 *
 * @param data    - The response payload.
 * @param message - Optional human-readable success message.
 * @returns A standardised {@link ApiResponse} object.
 */
export function successResponse<T>(data: T, message?: string): ApiResponse<T> {
  return {
    success: true,
    data,
    message,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Build a standardised error response.
 *
 * @param statusCode - HTTP status code.
 * @param message    - Human-readable error description.
 * @param code       - Machine-readable error code (e.g. "AUTH_INVALID_CREDENTIALS").
 * @param details    - Optional extra details (validation errors, etc.).
 * @returns A standardised {@link ApiError} object.
 */
export function errorResponse(
  statusCode: number,
  message: string,
  code?: string,
  details?: unknown,
): ApiError {
  return {
    statusCode,
    message,
    code,
    details,
  };
}

/**
 * Build a successful paginated API response.
 *
 * @param data    - Array of items for the current page.
 * @param total   - Total number of items across all pages.
 * @param page    - Current page number (1-indexed).
 * @param perPage - Items per page.
 * @param message - Optional human-readable message.
 * @returns A standardised {@link ApiResponse} wrapping a {@link PaginatedResponse}.
 */
export function paginatedResponse<T>(
  data: T[],
  total: number,
  page: number,
  perPage: number,
  message?: string,
): ApiResponse<PaginatedResponse<T>> {
  const paginated = createPaginatedResponse(data, total, page, perPage);

  return {
    success: true,
    data: paginated,
    message,
    timestamp: new Date().toISOString(),
  };
}
