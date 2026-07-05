/**
 * User repository — Prisma-based data access for User, Organization, and Session models.
 *
 * All queries exclude soft-deleted records (deletedAt IS NULL) unless otherwise noted.
 * Organization auto-creation uses a Prisma transaction to ensure atomicity.
 *
 * @module repositories/user
 */

import { prisma } from '@itbengal/database';
import type { User, Organization, Prisma } from '@itbengal/database';
import { UserStatus } from '@itbengal/database';

import { slugify } from '@itbengal/utils';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Number of failed login attempts before the account is automatically locked. */
const MAX_FAILED_ATTEMPTS = 5;

/** Duration (in minutes) to lock an account after exceeding failed attempts. */
const LOCK_DURATION_MINUTES = 30;

/** Default include clause to attach the user's organization to queries. */
const INCLUDE_ORGANIZATION = {
  organization: true,
} as const;

// ---------------------------------------------------------------------------
// Read operations
// ---------------------------------------------------------------------------

/**
 * Find a user by email address (case-insensitive).
 * Excludes soft-deleted users.
 *
 * @param email - The email address to search for.
 * @returns The matched user (with organization), or `null`.
 */
export async function findByEmail(
  email: string,
): Promise<(User & { organization: Organization | null }) | null> {
  return prisma.user.findFirst({
    where: {
      email: email.toLowerCase(),
      deletedAt: null,
    },
    include: INCLUDE_ORGANIZATION,
  });
}

/**
 * Find a user by primary key.
 * Excludes soft-deleted users.
 *
 * @param id - The user's UUID.
 * @returns The matched user (with organization), or `null`.
 */
export async function findById(
  id: string,
): Promise<(User & { organization: Organization | null }) | null> {
  return prisma.user.findFirst({
    where: {
      id,
      deletedAt: null,
    },
    include: INCLUDE_ORGANIZATION,
  });
}

/**
 * Find a user whose email verification token is valid and not expired.
 *
 * @param token - The verification token from the email link.
 * @returns The matched user, or `null` if the token is invalid / expired.
 */
export async function findByVerificationToken(
  token: string,
): Promise<User | null> {
  return prisma.user.findFirst({
    where: {
      emailVerificationToken: token,
      emailVerificationExpiry: { gt: new Date() },
      deletedAt: null,
    },
  });
}

/**
 * Find a user whose password-reset token is valid and not expired.
 *
 * @param token - The reset token from the email link.
 * @returns The matched user, or `null` if the token is invalid / expired.
 */
export async function findByResetToken(
  token: string,
): Promise<User | null> {
  return prisma.user.findFirst({
    where: {
      passwordResetToken: token,
      passwordResetExpiry: { gt: new Date() },
      deletedAt: null,
    },
  });
}

// ---------------------------------------------------------------------------
// Write operations
// ---------------------------------------------------------------------------

/**
 * Create a new user together with a personal organization (transactional).
 *
 * The organization slug is derived from the user's first name using
 * {@link slugify} with a random suffix to avoid collisions.
 *
 * @param data - The registration data.
 * @returns The newly created user with organization attached.
 */
export async function create(data: {
  email: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
}): Promise<User & { organization: Organization | null }> {
  const orgName = `${data.firstName}'s Organization`;
  const baseSlug = slugify(orgName);
  const uniqueSuffix = Math.random().toString(36).slice(2, 8);
  const orgSlug = `${baseSlug}-${uniqueSuffix}`;

  return prisma.$transaction(async (tx) => {
    // 1. Create the user first (without organization)
    const user = await tx.user.create({
      data: {
        email: data.email.toLowerCase(),
        passwordHash: data.passwordHash,
        firstName: data.firstName,
        lastName: data.lastName,
      },
    });

    // 2. Create the organization owned by this user
    const organization = await tx.organization.create({
      data: {
        name: orgName,
        slug: orgSlug,
        ownerId: user.id,
      },
    });

    // 3. Link the user to the organization
    const updatedUser = await tx.user.update({
      where: { id: user.id },
      data: { organizationId: organization.id },
      include: INCLUDE_ORGANIZATION,
    });

    return updatedUser;
  });
}

/**
 * Update arbitrary fields on a user record.
 *
 * @param id   - The user's UUID.
 * @param data - A partial set of user columns to update.
 * @returns The updated user.
 */
export async function updateById(
  id: string,
  data: Prisma.UserUpdateInput,
): Promise<User> {
  return prisma.user.update({
    where: { id },
    data,
  });
}

/**
 * Record a successful login: set `lastLoginAt`, reset failed attempts, clear lock.
 *
 * @param id - The user's UUID.
 */
export async function updateLoginSuccess(id: string): Promise<User> {
  return prisma.user.update({
    where: { id },
    data: {
      lastLoginAt: new Date(),
      failedLoginAttempts: 0,
      lockedUntil: null,
    },
  });
}

/**
 * Increment the failed login counter.
 * If the counter reaches {@link MAX_FAILED_ATTEMPTS}, the account is locked
 * for {@link LOCK_DURATION_MINUTES} minutes.
 *
 * @param id - The user's UUID.
 * @returns The updated user.
 */
export async function incrementFailedAttempts(id: string): Promise<User> {
  const user = await prisma.user.update({
    where: { id },
    data: {
      failedLoginAttempts: { increment: 1 },
    },
  });

  if (user.failedLoginAttempts >= MAX_FAILED_ATTEMPTS) {
    const lockedUntil = new Date(
      Date.now() + LOCK_DURATION_MINUTES * 60 * 1000,
    );

    return prisma.user.update({
      where: { id },
      data: {
        status: UserStatus.LOCKED,
        lockedUntil,
      },
    });
  }

  return user;
}

// ---------------------------------------------------------------------------
// Email verification
// ---------------------------------------------------------------------------

/**
 * Mark a user's email as verified and activate the account.
 * Clears the verification token so it cannot be reused.
 *
 * @param id - The user's UUID.
 */
export async function markEmailVerified(id: string): Promise<User> {
  return prisma.user.update({
    where: { id },
    data: {
      emailVerified: true,
      status: UserStatus.ACTIVE,
      emailVerificationToken: null,
      emailVerificationExpiry: null,
    },
  });
}

/**
 * Store a verification token with an expiry timestamp.
 *
 * @param id     - The user's UUID.
 * @param token  - The hex verification token.
 * @param expiry - When the token should expire.
 */
export async function setVerificationToken(
  id: string,
  token: string,
  expiry: Date,
): Promise<User> {
  return prisma.user.update({
    where: { id },
    data: {
      emailVerificationToken: token,
      emailVerificationExpiry: expiry,
    },
  });
}

// ---------------------------------------------------------------------------
// Password reset
// ---------------------------------------------------------------------------

/**
 * Store a password-reset token with an expiry timestamp.
 *
 * @param id     - The user's UUID.
 * @param token  - The hex reset token.
 * @param expiry - When the token should expire.
 */
export async function setResetToken(
  id: string,
  token: string,
  expiry: Date,
): Promise<User> {
  return prisma.user.update({
    where: { id },
    data: {
      passwordResetToken: token,
      passwordResetExpiry: expiry,
    },
  });
}

/**
 * Nullify the password-reset token fields.
 *
 * @param id - The user's UUID.
 */
export async function clearResetToken(id: string): Promise<User> {
  return prisma.user.update({
    where: { id },
    data: {
      passwordResetToken: null,
      passwordResetExpiry: null,
    },
  });
}

/**
 * Update the password hash and clear any outstanding reset token.
 *
 * @param id           - The user's UUID.
 * @param passwordHash - The new bcrypt hash.
 */
export async function updatePassword(
  id: string,
  passwordHash: string,
): Promise<User> {
  return prisma.user.update({
    where: { id },
    data: {
      passwordHash,
      passwordResetToken: null,
      passwordResetExpiry: null,
    },
  });
}

// ---------------------------------------------------------------------------
// Two-Factor Authentication
// ---------------------------------------------------------------------------

/**
 * Enable 2FA by storing the encrypted TOTP secret and hashed backup codes.
 *
 * @param id              - The user's UUID.
 * @param encryptedSecret - The AES-256-GCM encrypted TOTP secret.
 * @param backupCodes     - SHA-256 hashed backup codes.
 */
export async function setTwoFactorSecret(
  id: string,
  encryptedSecret: string,
  backupCodes: string[],
): Promise<User> {
  return prisma.user.update({
    where: { id },
    data: {
      twoFactorSecret: encryptedSecret,
      backupCodes,
      twoFactorEnabled: true,
    },
  });
}

/**
 * Disable 2FA and clear all related secrets.
 *
 * @param id - The user's UUID.
 */
export async function disableTwoFactor(id: string): Promise<User> {
  return prisma.user.update({
    where: { id },
    data: {
      twoFactorSecret: null,
      backupCodes: [],
      twoFactorEnabled: false,
    },
  });
}

/**
 * Consume a backup code: remove the used code from the stored list.
 *
 * @param id             - The user's UUID.
 * @param usedCode       - The hashed backup code that was consumed.
 * @param remainingCodes - The remaining hashed backup codes.
 */
export async function useBackupCode(
  id: string,
  _usedCode: string,
  remainingCodes: string[],
): Promise<User> {
  return prisma.user.update({
    where: { id },
    data: {
      backupCodes: remainingCodes,
    },
  });
}
