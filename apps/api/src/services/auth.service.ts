/**
 * Authentication service — core auth business logic.
 *
 * Orchestrates registration, login (with 2FA), logout, token refresh,
 * email verification, password reset, and TOTP-based two-factor
 * authentication.
 *
 * TOTP is implemented inline using Node.js crypto (HMAC-SHA1,
 * 30 s time step, ±1 step tolerance) — no external TOTP libraries.
 *
 * @module services/auth
 */

import { createHmac, randomBytes, createHash } from 'node:crypto';

import { prisma, Prisma } from '@itbengal/database';
import type { User as PrismaUser } from '@itbengal/database';
import type { User } from '@itbengal/types';

import {
  hashPassword,
  verifyPassword,
  encrypt,
  decrypt,
  generateToken,
} from '@itbengal/utils';

import { appConfig } from '../config/app.js';
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
  TooManyRequestsError,
  UnauthorizedError,
} from '../middleware/errorHandler.js';
import * as sessionRepository from '../repositories/session.repository.js';
import * as userRepository from '../repositories/user.repository.js';
import { addEmailJob } from '../jobs/email.job.js';
import * as tokenService from './token.service.js';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Verification token expiry: 24 hours. */
const VERIFICATION_TOKEN_EXPIRY_MS = 24 * 60 * 60 * 1000;

/** Password-reset token expiry: 1 hour. */
const RESET_TOKEN_EXPIRY_MS = 60 * 60 * 1000;

/** TOTP time step in seconds. */
const TOTP_STEP = 30;

/** Number of TOTP time steps to tolerate in either direction. */
const TOTP_WINDOW = 1;

/** Number of backup codes to generate. */
const BACKUP_CODE_COUNT = 10;

/** Length of each backup code (characters). */
const BACKUP_CODE_LENGTH = 8;

/** Base32 alphabet (RFC 4648). */
const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

// ---------------------------------------------------------------------------
// TOTP Helpers (inline, no external library)
// ---------------------------------------------------------------------------

/**
 * Encode a buffer as a base32 string (RFC 4648 without padding).
 */
function base32Encode(buffer: Buffer): string {
  let bits = 0;
  let value = 0;
  let output = '';

  for (let i = 0; i < buffer.length; i++) {
    value = (value << 8) | buffer[i]!;
    bits += 8;

    while (bits >= 5) {
      output += BASE32_ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }

  if (bits > 0) {
    output += BASE32_ALPHABET[(value << (5 - bits)) & 31];
  }

  return output;
}

/**
 * Decode a base32-encoded string back to a buffer.
 */
function base32Decode(encoded: string): Buffer {
  const cleaned = encoded.toUpperCase().replace(/=+$/, '');
  const bytes: number[] = [];
  let bits = 0;
  let value = 0;

  for (const char of cleaned) {
    const idx = BASE32_ALPHABET.indexOf(char);
    if (idx === -1) continue;

    value = (value << 5) | idx;
    bits += 5;

    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }

  return Buffer.from(bytes);
}

/**
 * Generate a TOTP code for the given secret and time counter.
 *
 * Uses HMAC-SHA1 per RFC 6238 / RFC 4226.
 */
function generateTOTPCode(secret: Buffer, counter: number): string {
  // Convert counter to 8-byte big-endian buffer
  const counterBuffer = Buffer.alloc(8);
  for (let i = 7; i >= 0; i--) {
    counterBuffer[i] = counter & 0xff;
    counter = counter >>> 8;
  }

  const hmac = createHmac('sha1', secret).update(counterBuffer).digest();
  const offset = hmac[hmac.length - 1]! & 0x0f;

  const code =
    ((hmac[offset]! & 0x7f) << 24) |
    ((hmac[offset + 1]! & 0xff) << 16) |
    ((hmac[offset + 2]! & 0xff) << 8) |
    (hmac[offset + 3]! & 0xff);

  return String(code % 1_000_000).padStart(6, '0');
}

/**
 * Generate a random TOTP secret (20 bytes → 32-char base32).
 *
 * @returns The base32-encoded secret string.
 */
function generateTOTPSecret(): string {
  return base32Encode(randomBytes(20));
}

/**
 * Build the otpauth:// URI for QR code generation.
 *
 * @param secret - Base32-encoded secret.
 * @param email  - The user's email (used as the account label).
 * @param issuer - Issuer name shown in authenticator apps.
 */
function generateTOTPUri(
  secret: string,
  email: string,
  issuer: string,
): string {
  const encodedIssuer = encodeURIComponent(issuer);
  const encodedEmail = encodeURIComponent(email);
  return `otpauth://totp/${encodedIssuer}:${encodedEmail}?secret=${secret}&issuer=${encodedIssuer}&algorithm=SHA1&digits=6&period=${String(TOTP_STEP)}`;
}

/**
 * Verify a TOTP code against a base32 secret with a ±window tolerance.
 *
 * @param secret - Base32-encoded secret.
 * @param code   - The 6-digit code submitted by the user.
 * @returns `true` if the code matches within the window.
 */
function verifyTOTPCode(secret: string, code: string): boolean {
  const secretBuffer = base32Decode(secret);
  const now = Math.floor(Date.now() / 1000);
  const currentCounter = Math.floor(now / TOTP_STEP);

  for (let i = -TOTP_WINDOW; i <= TOTP_WINDOW; i++) {
    const expected = generateTOTPCode(secretBuffer, currentCounter + i);
    if (expected === code) {
      return true;
    }
  }

  return false;
}

/**
 * Generate a random alphanumeric backup code.
 */
function generateBackupCode(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  const bytes = randomBytes(BACKUP_CODE_LENGTH);
  let code = '';
  for (let i = 0; i < BACKUP_CODE_LENGTH; i++) {
    code += chars[bytes[i]! % chars.length];
  }
  return code;
}

/**
 * Hash a backup code using SHA-256 for safe storage.
 */
function hashBackupCode(code: string): string {
  return createHash('sha256').update(code).digest('hex');
}

// ---------------------------------------------------------------------------
// Audit log helper
// ---------------------------------------------------------------------------

/**
 * Insert a row into the `audit_logs` table.
 */
async function createAuditLog(
  userId: string,
  action: string,
  resource: string,
  resourceId: string,
  metadata?: Record<string, unknown>,
  ipAddress?: string,
  userAgent?: string,
): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        userId,
        action,
        resource,
        resourceId,
        metadata: (metadata as Prisma.InputJsonValue) ?? undefined,
        ipAddress: ipAddress ?? null,
        userAgent: userAgent ?? null,
      },
    });
  } catch (err) {
    // Audit log failure should never block the primary flow
    console.error('[AuditLog] Failed to create entry:', err);
  }
}

// ---------------------------------------------------------------------------
// User sanitisation
// ---------------------------------------------------------------------------

/**
 * Strip sensitive fields from a Prisma user record for API responses.
 *
 * @param user - The raw Prisma user object.
 * @returns A safe {@link User} object.
 */
function sanitizeUser(user: PrismaUser): User {
  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role as unknown as User['role'],
    status: user.status as unknown as User['status'],
    emailVerified: user.emailVerified,
    twoFactorEnabled: user.twoFactorEnabled,
    avatarUrl: user.avatarUrl,
    lastLoginAt: user.lastLoginAt?.toISOString() ?? null,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Register a new user account.
 *
 * 1. Check uniqueness of email.
 * 2. Hash password and create user + organization.
 * 3. Generate and store a verification token.
 * 4. Queue verification email.
 *
 * @param data - Registration form data.
 * @returns The sanitized new user.
 */
export async function register(data: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}): Promise<User> {
  // 1. Check email uniqueness
  const existing = await userRepository.findByEmail(data.email);
  if (existing) {
    throw new ConflictError('An account with this email address already exists');
  }

  // 2. Hash password and create user + org
  const passwordHash = await hashPassword(data.password);
  const user = await userRepository.create({
    email: data.email,
    passwordHash,
    firstName: data.firstName,
    lastName: data.lastName,
  });

  // 3. Generate verification token (24h expiry)
  const verificationToken = generateToken(32);
  const expiry = new Date(Date.now() + VERIFICATION_TOKEN_EXPIRY_MS);
  await userRepository.setVerificationToken(user.id, verificationToken, expiry);

  // 4. Queue verification email
  await addEmailJob({
    type: 'verification',
    to: data.email,
    firstName: data.firstName,
    token: verificationToken,
  });

  return sanitizeUser(user);
}

/**
 * Authenticate a user with email / password and optional 2FA code.
 *
 * @param data      - Login credentials.
 * @param ipAddress - Client IP (for session / audit).
 * @param userAgent - Client User-Agent string.
 * @returns Auth response or a partial result indicating pending 2FA / verification.
 */
export async function login(
  data: { email: string; password: string; twoFactorCode?: string },
  ipAddress: string,
  userAgent: string,
): Promise<
  | { user: User; accessToken: string; refreshToken: string }
  | { requiresTwoFactor: true }
  | { requiresVerification: true }
> {
  // 1. Find user
  const user = await userRepository.findByEmail(data.email);
  if (!user) {
    throw new UnauthorizedError('Invalid email or password');
  }

  // 2. Check lock
  if (user.lockedUntil && user.lockedUntil > new Date()) {
    const unlockMinutes = Math.ceil(
      (user.lockedUntil.getTime() - Date.now()) / 60_000,
    );
    throw new TooManyRequestsError(
      `Account is locked. Try again in ${String(unlockMinutes)} minute(s).`,
    );
  }

  // 3. Check status
  if (user.status === 'SUSPENDED') {
    throw new ForbiddenError(
      'Your account has been suspended. Please contact support.',
    );
  }
  if (user.status === 'DELETED') {
    throw new ForbiddenError('This account has been deleted.');
  }

  // 4. Verify password
  const passwordValid = await verifyPassword(data.password, user.passwordHash);
  if (!passwordValid) {
    await userRepository.incrementFailedAttempts(user.id);
    throw new UnauthorizedError('Invalid email or password');
  }

  // 5. Check email verification
  if (!user.emailVerified) {
    return { requiresVerification: true };
  }

  // 6. Two-factor check
  if (user.twoFactorEnabled) {
    if (!data.twoFactorCode) {
      return { requiresTwoFactor: true };
    }

    const isValid = await verifyTwoFactor(user.id, data.twoFactorCode);
    if (!isValid) {
      throw new UnauthorizedError('Invalid two-factor authentication code');
    }
  }

  // 7. Generate tokens
  const { accessToken, refreshToken } = tokenService.generateAuthTokens({
    id: user.id,
    email: user.email,
    role: user.role,
    organizationId: user.organizationId,
  });

  // 8. Create session
  const tokenHash = tokenService.hashToken(refreshToken);
  await sessionRepository.createSession({
    userId: user.id,
    tokenHash,
    ipAddress,
    userAgent,
    expiresAt: new Date(
      Date.now() + tokenService.REFRESH_TOKEN_TTL_SECONDS * 1000,
    ),
  });

  // 9. Store refresh token in Redis
  await sessionRepository.storeRefreshToken(
    user.id,
    tokenHash,
    tokenService.REFRESH_TOKEN_TTL_SECONDS,
  );

  // 10. Update login success
  await userRepository.updateLoginSuccess(user.id);

  // 11. Audit
  await createAuditLog(
    user.id,
    'login',
    'user',
    user.id,
    { ip: ipAddress },
    ipAddress,
    userAgent,
  );

  return {
    user: sanitizeUser(user),
    accessToken,
    refreshToken,
  };
}

/**
 * Log out the current session.
 *
 * Blacklists the access token, removes the refresh token from Redis,
 * and deletes the DB session record.
 *
 * @param accessToken - The current access JWT (to blacklist).
 * @param userId      - The authenticated user's ID.
 */
export async function logout(
  accessToken: string,
  userId: string,
): Promise<void> {
  // Blacklist the access token
  await tokenService.blacklistToken(accessToken);

  // Delete refresh token from Redis
  await sessionRepository.deleteRefreshToken(userId);

  // Delete all sessions for this user (single-device simplicity)
  // If multi-device support is needed, this should delete by tokenHash instead
  await sessionRepository.deleteAllForUser(userId);

  // Audit
  await createAuditLog(userId, 'logout', 'user', userId);
}

/**
 * Issue a new token pair using a valid refresh token.
 *
 * @param refreshTokenStr - The raw refresh JWT string.
 * @returns New access and refresh token pair.
 */
export async function refreshToken(refreshTokenStr: string): Promise<{
  accessToken: string;
  refreshToken: string;
}> {
  // 1. Verify
  const payload = tokenService.verifyRefreshToken(refreshTokenStr);

  // 2. Check blacklist
  const blacklisted =
    await sessionRepository.isTokenBlacklisted(refreshTokenStr);
  if (blacklisted) {
    throw new UnauthorizedError('Refresh token has been revoked');
  }

  // 3. Find user
  const user = await userRepository.findById(payload.sub);
  if (!user) {
    throw new UnauthorizedError('User not found');
  }

  // 4. Generate new pair
  const newTokens = tokenService.generateAuthTokens({
    id: user.id,
    email: user.email,
    role: user.role,
    organizationId: user.organizationId,
  });

  // 5. Blacklist old refresh token
  await tokenService.blacklistToken(refreshTokenStr);

  // 6. Store new refresh token in Redis
  const newTokenHash = tokenService.hashToken(newTokens.refreshToken);
  await sessionRepository.storeRefreshToken(
    user.id,
    newTokenHash,
    tokenService.REFRESH_TOKEN_TTL_SECONDS,
  );

  // 7. Update session record
  const oldTokenHash = tokenService.hashToken(refreshTokenStr);
  await sessionRepository.deleteByTokenHash(oldTokenHash);
  await sessionRepository.createSession({
    userId: user.id,
    tokenHash: newTokenHash,
    ipAddress: '',
    userAgent: '',
    expiresAt: new Date(
      Date.now() + tokenService.REFRESH_TOKEN_TTL_SECONDS * 1000,
    ),
  });

  return newTokens;
}

/**
 * Verify a user's email address using the token from the verification email.
 *
 * @param token - The hex verification token.
 */
export async function verifyEmail(token: string): Promise<void> {
  const user = await userRepository.findByVerificationToken(token);
  if (!user) {
    throw new NotFoundError('Invalid or expired verification token');
  }

  await userRepository.markEmailVerified(user.id);

  // Queue welcome email
  await addEmailJob({
    type: 'welcome',
    to: user.email,
    firstName: user.firstName,
  });
}

/**
 * Initiate the forgot-password flow.
 *
 * Always returns success to avoid email-enumeration attacks.
 * If the email exists, a reset link is sent.
 *
 * @param email - The email address submitted by the user.
 */
export async function forgotPassword(email: string): Promise<void> {
  const user = await userRepository.findByEmail(email);

  if (user) {
    const resetToken = generateToken(32);
    const expiry = new Date(Date.now() + RESET_TOKEN_EXPIRY_MS);
    await userRepository.setResetToken(user.id, resetToken, expiry);

    await addEmailJob({
      type: 'password-reset',
      to: user.email,
      firstName: user.firstName,
      token: resetToken,
    });
  }

  // Always succeed to prevent email enumeration
}

/**
 * Reset a user's password using a valid reset token.
 *
 * @param token       - The hex reset token from the email link.
 * @param newPassword - The new password to set.
 */
export async function resetPassword(
  token: string,
  newPassword: string,
): Promise<void> {
  const user = await userRepository.findByResetToken(token);
  if (!user) {
    throw new NotFoundError('Invalid or expired reset token');
  }

  const passwordHash = await hashPassword(newPassword);
  await userRepository.updatePassword(user.id, passwordHash);

  // Force re-login on all devices
  await sessionRepository.deleteAllForUser(user.id);
  await sessionRepository.deleteRefreshToken(user.id);
}

/**
 * Set up TOTP-based two-factor authentication.
 *
 * Generates the TOTP secret, encrypts it, creates backup codes,
 * and returns everything the client needs to display the QR code
 * and save backup codes.
 *
 * @param userId - The authenticated user's UUID.
 * @returns The QR code URI, base32 secret, and plaintext backup codes.
 */
export async function setupTwoFactor(userId: string): Promise<{
  qrCodeUrl: string;
  secret: string;
  backupCodes: string[];
}> {
  const user = await userRepository.findById(userId);
  if (!user) {
    throw new NotFoundError('User not found');
  }

  // 1. Generate TOTP secret
  const secret = generateTOTPSecret();

  // 2. Generate QR code URI
  const qrCodeUrl = generateTOTPUri(secret, user.email, 'ITBengal');

  // 3. Generate backup codes
  const rawBackupCodes: string[] = [];
  const hashedBackupCodes: string[] = [];

  for (let i = 0; i < BACKUP_CODE_COUNT; i++) {
    const code = generateBackupCode();
    rawBackupCodes.push(code);
    hashedBackupCodes.push(hashBackupCode(code));
  }

  // 4. Encrypt TOTP secret
  const encryptedSecret = encrypt(secret, appConfig.encryptionKey);

  // 5. Save to DB
  await userRepository.setTwoFactorSecret(
    userId,
    encryptedSecret,
    hashedBackupCodes,
  );

  return {
    qrCodeUrl,
    secret,
    backupCodes: rawBackupCodes,
  };
}

/**
 * Verify a TOTP code or backup code for an authenticated user.
 *
 * @param userId - The user's UUID.
 * @param code   - The 6-digit TOTP code or 8-char backup code.
 * @returns `true` if the code is valid.
 */
export async function verifyTwoFactor(
  userId: string,
  code: string,
): Promise<boolean> {
  const user = await userRepository.findById(userId);
  if (!user || !user.twoFactorSecret) {
    return false;
  }

  // Decrypt TOTP secret
  const secret = decrypt(user.twoFactorSecret, appConfig.encryptionKey);

  // Try TOTP first (6-digit codes)
  if (code.length === 6 && /^\d{6}$/.test(code)) {
    if (verifyTOTPCode(secret, code)) {
      return true;
    }
  }

  // Try backup codes
  const hashedInput = hashBackupCode(code);
  const matchIndex = user.backupCodes.findIndex((bc) => bc === hashedInput);

  if (matchIndex !== -1) {
    // Remove the used backup code
    const remainingCodes = [
      ...user.backupCodes.slice(0, matchIndex),
      ...user.backupCodes.slice(matchIndex + 1),
    ];
    await userRepository.useBackupCode(userId, hashedInput, remainingCodes);
    return true;
  }

  return false;
}

/**
 * Disable two-factor authentication after verifying the user's password.
 *
 * @param userId   - The user's UUID.
 * @param password - The user's current password (for confirmation).
 */
export async function disableTwoFactor(
  userId: string,
  password: string,
): Promise<void> {
  const user = await userRepository.findById(userId);
  if (!user) {
    throw new NotFoundError('User not found');
  }

  const passwordValid = await verifyPassword(password, user.passwordHash);
  if (!passwordValid) {
    throw new UnauthorizedError('Invalid password');
  }

  await userRepository.disableTwoFactor(userId);
}

// ---------------------------------------------------------------------------
// Re-export for external consumers
// ---------------------------------------------------------------------------

export { sanitizeUser };
