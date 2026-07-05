/**
 * Cryptographic utility functions.
 *
 * Uses bcryptjs for password hashing and Node.js built-in crypto
 * for AES-256-GCM encryption, token generation, and API key management.
 *
 * @module @itbengal/utils/crypto
 */

import { randomBytes, createCipheriv, createDecipheriv, createHash } from 'node:crypto';
import bcrypt from 'bcryptjs';

/** Number of bcrypt salt rounds used for password hashing. */
const BCRYPT_ROUNDS = 12;

/** AES-256-GCM initialization vector length in bytes. */
const IV_LENGTH = 16;

/** Default token length in bytes (produces 2× hex characters). */
const DEFAULT_TOKEN_LENGTH = 32;

/** Characters used for API key random portion (URL-safe). */
const API_KEY_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

/**
 * Hash a plaintext password using bcrypt.
 *
 * @param password - The plaintext password to hash.
 * @returns A bcrypt hash string.
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(BCRYPT_ROUNDS);
  return bcrypt.hash(password, salt);
}

/**
 * Verify a plaintext password against a bcrypt hash.
 *
 * @param password - The plaintext password to check.
 * @param hash - The bcrypt hash to compare against.
 * @returns `true` if the password matches the hash.
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Encrypt plaintext using AES-256-GCM.
 *
 * The key must be exactly 32 bytes (256 bits). The output format is
 * `iv:authTag:ciphertext` where all three parts are hex-encoded.
 *
 * @param text - Plaintext to encrypt.
 * @param key - 32-byte encryption key (hex-encoded or raw).
 * @returns Colon-delimited string: `iv:authTag:encrypted`.
 */
export function encrypt(text: string, key: string): string {
  const keyBuffer = Buffer.from(key, 'hex');

  if (keyBuffer.length !== 32) {
    throw new Error('Encryption key must be exactly 32 bytes (64 hex characters).');
  }

  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv('aes-256-gcm', keyBuffer, iv);

  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const authTag = cipher.getAuthTag();

  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

/**
 * Decrypt AES-256-GCM ciphertext previously produced by {@link encrypt}.
 *
 * @param cipherText - Colon-delimited string: `iv:authTag:encrypted`.
 * @param key - 32-byte encryption key (hex-encoded).
 * @returns Decrypted plaintext.
 * @throws If the key is invalid, the data is tampered with, or the format is wrong.
 */
export function decrypt(cipherText: string, key: string): string {
  const keyBuffer = Buffer.from(key, 'hex');

  if (keyBuffer.length !== 32) {
    throw new Error('Encryption key must be exactly 32 bytes (64 hex characters).');
  }

  const parts = cipherText.split(':');

  if (parts.length !== 3) {
    throw new Error('Invalid ciphertext format. Expected "iv:authTag:encrypted".');
  }

  const [ivHex, authTagHex, encryptedHex] = parts as [string, string, string];

  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  const decipher = createDecipheriv('aes-256-gcm', keyBuffer, iv);

  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}

/**
 * Generate a cryptographically secure random hex token.
 *
 * @param length - Number of random bytes (output will be `length * 2` hex characters). Defaults to 32.
 * @returns Hex-encoded random token.
 */
export function generateToken(length: number = DEFAULT_TOKEN_LENGTH): string {
  return randomBytes(length).toString('hex');
}

/**
 * Generate an API key with a human-readable prefix.
 *
 * Format: `prefix_<32 random URL-safe characters>`.
 *
 * @param prefix - Prefix for the API key (e.g. "itb_live", "itb_test").
 * @returns The full API key string.
 */
export function generateApiKey(prefix: string): string {
  const bytes = randomBytes(32);
  let key = '';

  for (let i = 0; i < 32; i++) {
    key += API_KEY_CHARS[bytes[i]! % API_KEY_CHARS.length];
  }

  return `${prefix}_${key}`;
}

/**
 * Produce a SHA-256 hash of an API key for safe storage.
 *
 * @param apiKey - The raw API key to hash.
 * @returns Hex-encoded SHA-256 digest.
 */
export function hashApiKey(apiKey: string): string {
  return createHash('sha256').update(apiKey).digest('hex');
}
