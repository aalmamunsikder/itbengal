/**
 * Standardized API response helpers.
 * Ensures all API responses follow a consistent JSON envelope format.
 * @module utils/apiResponse
 */

import type { Response } from 'express';

/** Standard success response envelope */
interface SuccessResponse<T> {
  success: true;
  message: string;
  data: T;
}

/** Standard error response envelope */
interface ErrorResponse {
  success: false;
  message: string;
  code?: string;
  errors?: unknown[];
  stack?: string;
}

/** Paginated response envelope with metadata */
interface PaginatedResponse<T> {
  success: true;
  message: string;
  data: T[];
  pagination: {
    page: number;
    perPage: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

/**
 * Send a standardized success response.
 *
 * @param res - Express response object
 * @param data - Response payload
 * @param message - Human-readable success message
 * @param statusCode - HTTP status code (default 200)
 */
export function sendSuccess<T>(
  res: Response,
  data: T,
  message = 'Success',
  statusCode = 200,
): void {
  const body: SuccessResponse<T> = {
    success: true,
    message,
    data,
  };
  res.status(statusCode).json(body);
}

/**
 * Send a standardized error response.
 * Typically called by the global error handler, but can be used directly.
 *
 * @param res - Express response object
 * @param error - Error details
 */
export function sendError(
  res: Response,
  error: {
    statusCode?: number;
    message: string;
    code?: string;
    errors?: unknown[];
    stack?: string;
  },
): void {
  const statusCode = error.statusCode ?? 500;
  const body: ErrorResponse = {
    success: false,
    message: error.message,
    ...(error.code && { code: error.code }),
    ...(error.errors && { errors: error.errors }),
    ...(error.stack && { stack: error.stack }),
  };
  res.status(statusCode).json(body);
}

/**
 * Send a standardized paginated response.
 *
 * @param res - Express response object
 * @param data - Array of items for the current page
 * @param total - Total number of items across all pages
 * @param page - Current page number
 * @param perPage - Items per page
 * @param message - Human-readable success message
 */
export function sendPaginated<T>(
  res: Response,
  data: T[],
  total: number,
  page: number,
  perPage: number,
  message = 'Success',
): void {
  const totalPages = Math.ceil(total / perPage);
  const body: PaginatedResponse<T> = {
    success: true,
    message,
    data,
    pagination: {
      page,
      perPage,
      total,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
  };
  res.status(200).json(body);
}
