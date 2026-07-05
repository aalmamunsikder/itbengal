/**
 * Auth validators — Zod schemas for authentication endpoints.
 *
 * Provides request body validation for all auth-related routes.
 * Used with the `validate` middleware to enforce type-safe inputs.
 *
 * Password complexity requirements:
 * - Minimum 10 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one digit
 * - At least one special character
 *
 * @module validators/auth
 */

import { z } from 'zod';

// ---------------------------------------------------------------------------
// Shared field schemas
// ---------------------------------------------------------------------------

/** Reusable email field: validated, trimmed, lowercased. */
const emailField = z
  .string({ required_error: 'Email is required' })
  .trim()
  .toLowerCase()
  .email('Please provide a valid email address');

/**
 * Reusable strong-password field.
 *
 * Enforces minimum length + character class diversity via regex.
 */
const passwordField = z
  .string({ required_error: 'Password is required' })
  .min(10, 'Password must be at least 10 characters long')
  .regex(
    /[A-Z]/,
    'Password must contain at least one uppercase letter',
  )
  .regex(
    /[a-z]/,
    'Password must contain at least one lowercase letter',
  )
  .regex(
    /\d/,
    'Password must contain at least one digit',
  )
  .regex(
    /[^A-Za-z0-9]/,
    'Password must contain at least one special character',
  );

/** First or last name: trimmed, bounded length. */
const nameField = (label: string) =>
  z
    .string({ required_error: `${label} is required` })
    .trim()
    .min(1, `${label} must not be empty`)
    .max(50, `${label} must be at most 50 characters`);

// ---------------------------------------------------------------------------
// Schemas
// ---------------------------------------------------------------------------

/**
 * Registration request schema.
 *
 * @example
 * ```json
 * { "email": "user@example.com", "password": "S3cure!Pass", "firstName": "John", "lastName": "Doe" }
 * ```
 */
export const registerSchema = z.object({
  email: emailField,
  password: passwordField,
  firstName: nameField('First name'),
  lastName: nameField('Last name'),
});

/**
 * Login request schema.
 *
 * `twoFactorCode` is optional and sent only when the server responds
 * with `requiresTwoFactor: true`.
 */
export const loginSchema = z.object({
  email: emailField,
  password: z
    .string({ required_error: 'Password is required' })
    .min(1, 'Password is required'),
  twoFactorCode: z
    .string()
    .regex(/^\d{6}$/, 'Two-factor code must be 6 digits')
    .optional(),
});

/**
 * Email verification request schema.
 */
export const verifyEmailSchema = z.object({
  token: z
    .string({ required_error: 'Verification token is required' })
    .min(1, 'Verification token is required'),
});

/**
 * Forgot-password request schema.
 */
export const forgotPasswordSchema = z.object({
  email: emailField,
});

/**
 * Password-reset request schema.
 */
export const resetPasswordSchema = z.object({
  token: z
    .string({ required_error: 'Reset token is required' })
    .min(1, 'Reset token is required'),
  newPassword: passwordField,
});

/**
 * Change-password request schema (authenticated users).
 */
export const changePasswordSchema = z.object({
  currentPassword: z
    .string({ required_error: 'Current password is required' })
    .min(1, 'Current password is required'),
  newPassword: passwordField,
});

/**
 * Setup 2FA schema — no body required, just authentication.
 */
export const setupTwoFactorSchema = z.object({}).strict();

/**
 * Verify 2FA code schema.
 *
 * Accepts 6-digit TOTP codes and 8-character backup codes.
 */
export const verifyTwoFactorSchema = z.object({
  code: z
    .string({ required_error: 'Verification code is required' })
    .min(6, 'Code must be at least 6 characters')
    .max(8, 'Code must be at most 8 characters'),
});

/**
 * Update profile schema.
 *
 * All fields are optional — only supplied fields are updated.
 */
export const updateProfileSchema = z.object({
  firstName: nameField('First name').optional(),
  lastName: nameField('Last name').optional(),
  avatarUrl: z.string().url('Avatar URL must be a valid URL').optional(),
});

/**
 * Disable 2FA schema.
 * Requires user's current password for verification.
 */
export const disableTwoFactorSchema = z.object({
  password: z.string({ required_error: 'Password is required' }),
});

// ---------------------------------------------------------------------------
// Inferred types
// ---------------------------------------------------------------------------

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type VerifyTwoFactorInput = z.infer<typeof verifyTwoFactorSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type DisableTwoFactorInput = z.infer<typeof disableTwoFactorSchema>;
