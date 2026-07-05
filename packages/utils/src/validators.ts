/**
 * Input validation schemas and helper functions built with Zod.
 *
 * @module @itbengal/utils/validators
 */

import { z } from 'zod';

// ─── Password Requirements ──────────────────────────────────────────────────

/**
 * Human-readable password requirements shown in UI and error messages.
 */
export const PASSWORD_REQUIREMENTS = {
  minLength: 10,
  requireUppercase: true,
  requireLowercase: true,
  requireDigit: true,
  requireSpecial: true,
  description:
    'Password must be at least 10 characters and include an uppercase letter, a lowercase letter, a digit, and a special character.',
} as const;

// ─── Zod Schemas ─────────────────────────────────────────────────────────────

/**
 * Schema for validating email addresses.
 * Uses Zod's built-in email validator with a max-length guard.
 */
export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(1, 'Email is required.')
  .max(255, 'Email must be at most 255 characters.')
  .email('Invalid email address.');

/**
 * Schema for validating passwords against the platform's strength policy.
 *
 * Requirements:
 * - Minimum 10 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one digit
 * - At least one special character
 */
export const passwordSchema = z
  .string()
  .min(PASSWORD_REQUIREMENTS.minLength, `Password must be at least ${PASSWORD_REQUIREMENTS.minLength} characters.`)
  .max(128, 'Password must be at most 128 characters.')
  .refine((val) => /[A-Z]/.test(val), {
    message: 'Password must contain at least one uppercase letter.',
  })
  .refine((val) => /[a-z]/.test(val), {
    message: 'Password must contain at least one lowercase letter.',
  })
  .refine((val) => /\d/.test(val), {
    message: 'Password must contain at least one digit.',
  })
  .refine((val) => /[^A-Za-z0-9]/.test(val), {
    message: 'Password must contain at least one special character.',
  });

/**
 * Schema for validating domain names (e.g. "example.com", "sub.domain.co.uk").
 */
export const domainSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(1, 'Domain name is required.')
  .max(253, 'Domain name must be at most 253 characters.')
  .regex(
    /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/,
    'Invalid domain name format.',
  );

/**
 * Schema for validating IPv4 and IPv6 addresses.
 */
export const ipAddressSchema = z
  .string()
  .trim()
  .min(1, 'IP address is required.')
  .refine(
    (val) => {
      // IPv4
      if (/^(\d{1,3}\.){3}\d{1,3}$/.test(val)) {
        return val.split('.').every((octet) => {
          const n = Number(octet);
          return n >= 0 && n <= 255;
        });
      }
      // IPv6 (simplified check — allows compressed forms)
      if (/^([0-9a-fA-F]{0,4}:){2,7}[0-9a-fA-F]{0,4}$/.test(val)) {
        return true;
      }
      return false;
    },
    { message: 'Invalid IP address.' },
  );

/**
 * Schema for validating URL-safe slugs (lowercase alphanumerics and hyphens).
 */
export const slugSchema = z
  .string()
  .trim()
  .min(1, 'Slug is required.')
  .max(128, 'Slug must be at most 128 characters.')
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must contain only lowercase letters, numbers, and hyphens.');

/**
 * Schema for validating UUID v4 / v7 strings.
 */
export const uuidSchema = z
  .string()
  .trim()
  .uuid('Invalid UUID format.');

// ─── Helper Functions ────────────────────────────────────────────────────────

/**
 * Check whether a string is a valid email address.
 *
 * @param email - The string to validate.
 * @returns `true` if the string passes the email schema.
 */
export function isValidEmail(email: string): boolean {
  return emailSchema.safeParse(email).success;
}

/**
 * Check whether a string meets the platform's password requirements.
 *
 * @param password - The string to validate.
 * @returns `true` if the string passes all password rules.
 */
export function isValidPassword(password: string): boolean {
  return passwordSchema.safeParse(password).success;
}

/**
 * Check whether a string is a valid domain name.
 *
 * @param domain - The string to validate.
 * @returns `true` if the string passes the domain schema.
 */
export function isValidDomain(domain: string): boolean {
  return domainSchema.safeParse(domain).success;
}
