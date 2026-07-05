/**
 * Formatting utility functions for currency, dates, bytes, and text.
 *
 * @module @itbengal/utils/formatters
 */

// ─── Currency Symbols ────────────────────────────────────────────────────────

const CURRENCY_SYMBOLS: Record<string, string> = {
  BDT: '৳',
  USD: '$',
  EUR: '€',
  GBP: '£',
  INR: '₹',
  JPY: '¥',
};

/**
 * Format a monetary amount with the appropriate currency symbol.
 *
 * Amounts are expected in the **smallest currency unit** (e.g. paisa, cents).
 * They are divided by 100 for display.
 *
 * @param amount   - Amount in smallest currency unit.
 * @param currency - ISO-4217 currency code (e.g. "BDT", "USD").
 * @returns Formatted string like "৳1,234.56" or "USD 1,234.56".
 */
export function formatCurrency(amount: number, currency: string): string {
  const value = amount / 100;
  const symbol = CURRENCY_SYMBOLS[currency.toUpperCase()];
  const formatted = value.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  if (symbol) {
    return `${symbol}${formatted}`;
  }

  return `${currency.toUpperCase()} ${formatted}`;
}

// ─── Date Formatting ─────────────────────────────────────────────────────────

/**
 * Format a date using Intl.DateTimeFormat.
 *
 * @param date   - Date object or ISO-8601 string.
 * @param format - Preset name: "short" (MM/DD/YYYY), "long" (Month DD, YYYY), or "iso" (ISO-8601). Defaults to "short".
 * @returns Formatted date string.
 */
export function formatDate(date: Date | string, format: 'short' | 'long' | 'iso' = 'short'): string {
  const d = typeof date === 'string' ? new Date(date) : date;

  switch (format) {
    case 'iso':
      return d.toISOString();
    case 'long':
      return d.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    case 'short':
    default:
      return d.toLocaleDateString('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      });
  }
}

// ─── Relative Time ───────────────────────────────────────────────────────────

/** Time-unit thresholds (in seconds) for relative-time formatting. */
const TIME_UNITS: Array<{ unit: Intl.RelativeTimeFormatUnit; seconds: number }> = [
  { unit: 'year', seconds: 31536000 },
  { unit: 'month', seconds: 2592000 },
  { unit: 'week', seconds: 604800 },
  { unit: 'day', seconds: 86400 },
  { unit: 'hour', seconds: 3600 },
  { unit: 'minute', seconds: 60 },
  { unit: 'second', seconds: 1 },
];

/**
 * Format a date as a human-readable relative time string (e.g. "2 hours ago").
 *
 * @param date - Date object or ISO-8601 string.
 * @returns Relative time string.
 */
export function formatRelativeTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const diffSeconds = Math.round((d.getTime() - Date.now()) / 1000);

  const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });

  for (const { unit, seconds } of TIME_UNITS) {
    if (Math.abs(diffSeconds) >= seconds) {
      const value = Math.round(diffSeconds / seconds);
      return rtf.format(value, unit);
    }
  }

  return rtf.format(0, 'second');
}

// ─── Bytes ───────────────────────────────────────────────────────────────────

const BYTE_UNITS = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'] as const;

/**
 * Format a byte count into a human-readable string (e.g. "1.5 GB").
 *
 * Uses binary prefixes (1 KB = 1024 B).
 *
 * @param bytes - Number of bytes.
 * @returns Formatted string.
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';

  const isNegative = bytes < 0;
  let absBytes = Math.abs(bytes);

  let unitIndex = 0;
  while (absBytes >= 1024 && unitIndex < BYTE_UNITS.length - 1) {
    absBytes /= 1024;
    unitIndex++;
  }

  const formatted = absBytes % 1 === 0 ? absBytes.toString() : absBytes.toFixed(2);
  return `${isNegative ? '-' : ''}${formatted} ${BYTE_UNITS[unitIndex]}`;
}

// ─── Duration ────────────────────────────────────────────────────────────────

/**
 * Format a duration in milliseconds to a compact human-readable string (e.g. "2m 30s").
 *
 * @param ms - Duration in milliseconds.
 * @returns Formatted duration string.
 */
export function formatDuration(ms: number): string {
  if (ms < 0) ms = 0;

  const totalSeconds = Math.floor(ms / 1000);

  if (totalSeconds === 0) {
    return `${ms}ms`;
  }

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const parts: string[] = [];
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (seconds > 0 || parts.length === 0) parts.push(`${seconds}s`);

  return parts.join(' ');
}

// ─── Numbers ─────────────────────────────────────────────────────────────────

/**
 * Format a number with locale-aware thousand separators (e.g. "1,234,567").
 *
 * @param num - The number to format.
 * @returns Formatted string.
 */
export function formatNumber(num: number): string {
  return num.toLocaleString('en-US');
}

// ─── Text ────────────────────────────────────────────────────────────────────

/**
 * Convert an arbitrary string to a URL-safe slug.
 *
 * - Converts to lowercase
 * - Replaces non-alphanumeric characters with hyphens
 * - Collapses consecutive hyphens
 * - Trims leading/trailing hyphens
 *
 * @param text - The text to slugify.
 * @returns URL-safe slug.
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Truncate a string to a maximum length, appending an ellipsis if truncated.
 *
 * @param text   - The string to truncate.
 * @param length - Maximum length (including the ellipsis).
 * @returns Truncated string.
 */
export function truncate(text: string, length: number): string {
  if (length < 4) return text.slice(0, length);
  if (text.length <= length) return text;
  return text.slice(0, length - 3) + '...';
}
