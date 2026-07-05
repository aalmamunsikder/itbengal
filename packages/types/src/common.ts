/**
 * Common types shared across the ITBengal platform.
 * @module @itbengal/types/common
 */

/** Sort order for paginated queries. */
export const SortOrder = {
  ASC: 'asc',
  DESC: 'desc',
} as const;
export type SortOrder = (typeof SortOrder)[keyof typeof SortOrder];

/**
 * Standard API success response wrapper.
 * Every successful API response follows this shape.
 */
export interface ApiResponse<T> {
  /** Whether the request succeeded. */
  success: boolean;
  /** The response payload. */
  data: T;
  /** Optional human-readable message. */
  message?: string;
  /** ISO-8601 timestamp of the response. */
  timestamp: string;
}

/**
 * Standard API error response.
 * Returned when a request fails with a known error condition.
 */
export interface ApiError {
  /** HTTP status code. */
  statusCode: number;
  /** Human-readable error message. */
  message: string;
  /** Machine-readable error code for client-side handling. */
  code?: string;
  /** Additional error details (validation errors, etc.). */
  details?: unknown;
}

/**
 * Metadata included in every paginated response.
 */
export interface PaginationMeta {
  /** Current page number (1-indexed). */
  page: number;
  /** Number of items per page. */
  perPage: number;
  /** Total number of items across all pages. */
  total: number;
  /** Total number of pages. */
  totalPages: number;
  /** Whether there is a next page. */
  hasNext: boolean;
  /** Whether there is a previous page. */
  hasPrev: boolean;
}

/**
 * Paginated response containing data and pagination metadata.
 */
export interface PaginatedResponse<T> {
  /** Array of items for the current page. */
  data: T[];
  /** Pagination metadata. */
  meta: PaginationMeta;
}

/**
 * Query parameters for paginated endpoints.
 */
export interface PaginationQuery {
  /** Page number (1-indexed). */
  page?: number;
  /** Number of items per page. */
  perPage?: number;
  /** Column to sort by. */
  sortBy?: string;
  /** Sort direction. */
  sortOrder?: SortOrder;
}

/**
 * A date range filter used in reporting and analytics queries.
 */
export interface DateRange {
  /** Start date (inclusive). */
  from: Date | string;
  /** End date (inclusive). */
  to: Date | string;
}

/**
 * Generic key-value pair for flexible metadata storage.
 */
export interface KeyValue {
  /** The key identifier. */
  key: string;
  /** The associated value. */
  value: string;
}
