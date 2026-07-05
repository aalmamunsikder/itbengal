/**
 * Express Request type augmentation for the ITBengal API.
 * Adds custom properties attached by middleware.
 */

/** JWT payload structure attached by auth middleware */
interface JWTPayload {
  /** User's unique identifier */
  userId: string;
  /** User's email address */
  email: string;
  /** User's role */
  role: string;
  /** Organization the user is currently acting within */
  organizationId: string | null;
  /** Token issued-at timestamp (seconds) */
  iat?: number;
  /** Token expiration timestamp (seconds) */
  exp?: number;
  /** Token issuer */
  iss?: string;
}

/** Parsed pagination parameters attached by pagination middleware */
interface PaginationQuery {
  /** Current page number (1-indexed) */
  page: number;
  /** Items per page */
  perPage: number;
  /** Column to sort by */
  sortBy: string;
  /** Sort direction */
  sortOrder: 'asc' | 'desc';
  /** Computed offset for database queries */
  offset: number;
}

declare global {
  namespace Express {
    interface Request {
      /** Unique request identifier (UUID v4), set by requestId middleware */
      id: string;
      /** Authenticated user payload, set by auth middleware */
      user?: JWTPayload;
      /** Parsed pagination parameters, set by pagination middleware */
      pagination?: PaginationQuery;
    }
  }
}

export type { JWTPayload, PaginationQuery };
