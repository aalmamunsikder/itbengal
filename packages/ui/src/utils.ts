import { clsx } from 'clsx';
import type { ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merges Tailwind CSS classes with intelligent conflict resolution.
 *
 * Combines `clsx` (conditional class joining) with `tailwind-merge`
 * (deduplication and conflict resolution of Tailwind utility classes).
 *
 * @param inputs - Class values to merge (strings, objects, arrays, etc.)
 * @returns Merged class string with Tailwind conflicts resolved
 *
 * @example
 * ```ts
 * cn('px-4 py-2', isActive && 'bg-indigo-600', 'px-6')
 * // → 'py-2 px-6 bg-indigo-600' (px-6 wins over px-4)
 * ```
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
