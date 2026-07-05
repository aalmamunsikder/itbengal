/**
 * @itbengal/utils — Common utility functions shared across services.
 *
 * @module @itbengal/utils
 */

// ─── Crypto ──────────────────────────────────────────────────────────────────
export {
  hashPassword,
  verifyPassword,
  encrypt,
  decrypt,
  generateToken,
  generateApiKey,
  hashApiKey,
} from './crypto.js';

// ─── JWT ─────────────────────────────────────────────────────────────────────
export {
  generateAccessToken,
  generateRefreshToken,
  generateTokenPair,
  verifyToken,
  decodeToken,
} from './jwt.js';

// ─── Validators ──────────────────────────────────────────────────────────────
export {
  emailSchema,
  passwordSchema,
  domainSchema,
  ipAddressSchema,
  slugSchema,
  uuidSchema,
  isValidEmail,
  isValidPassword,
  isValidDomain,
  PASSWORD_REQUIREMENTS,
} from './validators.js';

// ─── Formatters ──────────────────────────────────────────────────────────────
export {
  formatCurrency,
  formatDate,
  formatRelativeTime,
  formatBytes,
  formatDuration,
  formatNumber,
  slugify,
  truncate,
} from './formatters.js';

// ─── Pagination ──────────────────────────────────────────────────────────────
export {
  parsePaginationQuery,
  createPaginatedResponse,
} from './pagination.js';
export type { ParsedPagination } from './pagination.js';

// ─── API Response ────────────────────────────────────────────────────────────
export {
  successResponse,
  errorResponse,
  paginatedResponse,
} from './apiResponse.js';

// ─── Constants ───────────────────────────────────────────────────────────────
export {
  RATE_LIMITS,
  CACHE_TTL,
  ERROR_CODES,
  DEPLOYMENT,
  FILE_UPLOAD,
} from './constants.js';
