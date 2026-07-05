'use client';

import { cn } from '../utils';
import type { HTMLAttributes, ReactNode } from 'react';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export type BadgeVariant =
  | 'success'
  | 'warning'
  | 'error'
  | 'info'
  | 'neutral'
  | 'primary';
export type BadgeSize = 'sm' | 'md' | 'lg';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  /** Color variant */
  variant?: BadgeVariant;
  /** Size preset */
  size?: BadgeSize;
  /** Show a colored dot indicator before the text */
  dot?: boolean;
  /** Badge content */
  children: ReactNode;
}

/* ------------------------------------------------------------------ */
/*  Style maps                                                         */
/* ------------------------------------------------------------------ */

const VARIANT_STYLES: Record<BadgeVariant, string> = {
  success:
    'bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-500/30',
  warning:
    'bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-500/10 dark:text-amber-400 dark:ring-amber-500/30',
  error:
    'bg-red-50 text-red-700 ring-red-600/20 dark:bg-red-500/10 dark:text-red-400 dark:ring-red-500/30',
  info: 'bg-blue-50 text-blue-700 ring-blue-600/20 dark:bg-blue-500/10 dark:text-blue-400 dark:ring-blue-500/30',
  neutral:
    'bg-gray-100 text-gray-700 ring-gray-500/20 dark:bg-gray-700 dark:text-gray-300 dark:ring-gray-500/30',
  primary:
    'bg-indigo-50 text-indigo-700 ring-indigo-600/20 dark:bg-indigo-500/10 dark:text-indigo-400 dark:ring-indigo-500/30',
};

const DOT_COLORS: Record<BadgeVariant, string> = {
  success: 'bg-emerald-500',
  warning: 'bg-amber-500',
  error: 'bg-red-500',
  info: 'bg-blue-500',
  neutral: 'bg-gray-500',
  primary: 'bg-indigo-500',
};

const SIZE_STYLES: Record<BadgeSize, string> = {
  sm: 'px-1.5 py-0.5 text-[10px] gap-1',
  md: 'px-2 py-0.5 text-xs gap-1.5',
  lg: 'px-2.5 py-1 text-sm gap-1.5',
};

const DOT_SIZES: Record<BadgeSize, string> = {
  sm: 'h-1 w-1',
  md: 'h-1.5 w-1.5',
  lg: 'h-2 w-2',
};

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

/**
 * A pill-shaped badge for status indicators, labels, and counts.
 *
 * @example
 * ```tsx
 * <Badge variant="success" dot>Active</Badge>
 * <Badge variant="error" size="sm">Failed</Badge>
 * ```
 */
export function Badge({
  variant = 'neutral',
  size = 'md',
  dot = false,
  children,
  className,
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center font-medium rounded-full ring-1 ring-inset',
        'whitespace-nowrap',
        VARIANT_STYLES[variant],
        SIZE_STYLES[size],
        className,
      )}
      {...props}
    >
      {dot && (
        <span
          className={cn('shrink-0 rounded-full', DOT_COLORS[variant], DOT_SIZES[size])}
          aria-hidden="true"
        />
      )}
      {children}
    </span>
  );
}

Badge.displayName = 'Badge';
