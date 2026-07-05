/**
 * Authentication and authorization types.
 * @module @itbengal/types/auth
 */

import type { UserRole, UserStatus } from './enums.js';

/**
 * Core user entity returned from the API.
 */
export interface User {
  /** Primary key (UUIDv7). */
  id: string;
  /** Email address (unique, lowercase). */
  email: string;
  /** User's first name. */
  firstName: string;
  /** User's last name. */
  lastName: string;
  /** Platform role. */
  role: UserRole;
  /** Account status. */
  status: UserStatus;
  /** Whether the user's email has been verified. */
  emailVerified: boolean;
  /** Whether two-factor authentication is enabled. */
  twoFactorEnabled: boolean;
  /** URL to the user's avatar image. */
  avatarUrl: string | null;
  /** Timestamp of the most recent login. */
  lastLoginAt: string | null;
  /** When the user account was created. */
  createdAt: string;
  /** When the user account was last updated. */
  updatedAt: string;
}

/**
 * A server-side session record tied to a user.
 */
export interface Session {
  /** Session ID (UUIDv7). */
  id: string;
  /** The user this session belongs to. */
  userId: string;
  /** SHA-256 hash of the refresh token. */
  tokenHash: string;
  /** IP address the session was created from. */
  ipAddress: string;
  /** User-Agent header value at session creation. */
  userAgent: string;
  /** When this session expires. */
  expiresAt: string;
  /** When this session was created. */
  createdAt: string;
}

/**
 * Request body for user login.
 */
export interface LoginRequest {
  /** User's email address. */
  email: string;
  /** User's password. */
  password: string;
  /** Optional TOTP code if 2FA is enabled. */
  twoFactorCode?: string;
}

/**
 * Request body for user registration.
 */
export interface RegisterRequest {
  /** Email address to register with. */
  email: string;
  /** Password (must meet strength requirements). */
  password: string;
  /** User's first name. */
  firstName: string;
  /** User's last name. */
  lastName: string;
}

/**
 * Response returned after successful authentication.
 */
export interface AuthResponse {
  /** The authenticated user object. */
  user: User;
  /** Short-lived JWT access token. */
  accessToken: string;
  /** Long-lived opaque refresh token. */
  refreshToken: string;
}

/**
 * JWT access token payload.
 */
export interface JWTPayload {
  /** Subject — the user's ID. */
  sub: string;
  /** User's email address. */
  email: string;
  /** User's role. */
  role: UserRole;
  /** Organization the user is currently acting within. */
  organizationId: string | null;
  /** Issued-at timestamp (epoch seconds). */
  iat: number;
  /** Expiration timestamp (epoch seconds). */
  exp: number;
}

/**
 * Request body for the forgot-password flow.
 */
export interface ForgotPasswordRequest {
  /** Email address associated with the account. */
  email: string;
}

/**
 * Request body for resetting a password via a token.
 */
export interface ResetPasswordRequest {
  /** The password-reset token received via email. */
  token: string;
  /** The new password. */
  newPassword: string;
}

/**
 * Request body for changing the current password while authenticated.
 */
export interface ChangePasswordRequest {
  /** The user's current password. */
  currentPassword: string;
  /** The desired new password. */
  newPassword: string;
}

/**
 * Response returned when 2FA is first set up.
 */
export interface TwoFactorSetupResponse {
  /** Data URI for a QR code scannable by authenticator apps. */
  qrCodeUrl: string;
  /** The TOTP secret (base32-encoded). */
  secret: string;
  /** One-time backup codes for account recovery. */
  backupCodes: string[];
}

/**
 * Request body for verifying an email address.
 */
export interface VerifyEmailRequest {
  /** The verification token received via email. */
  token: string;
}

/**
 * Request body for creating a new API key.
 */
export interface ApiKeyCreateRequest {
  /** Human-readable name for the API key. */
  name: string;
  /** List of permission scopes granted to this key. */
  scopes: string[];
}

/**
 * An API key entity.
 */
export interface ApiKey {
  /** Primary key (UUIDv7). */
  id: string;
  /** The user who owns this key. */
  userId: string;
  /** Human-readable name. */
  name: string;
  /** SHA-256 hash of the raw API key. */
  keyHash: string;
  /** Prefix shown to users for identification (e.g. "itb_live"). */
  keyPrefix: string;
  /** Permission scopes. */
  scopes: string[];
  /** When this key was last used. */
  lastUsedAt: string | null;
  /** Optional expiration date. */
  expiresAt: string | null;
  /** When this key was created. */
  createdAt: string;
  /** When this key was last updated. */
  updatedAt: string;
}
