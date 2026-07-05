'use client';

import type { HTMLAttributes } from 'react';
import { cn } from '../utils';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export type SkeletonVariant = 'text' | 'circular' | 'rectangular' | 'card';

export interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  /** Shape variant */
  variant?: SkeletonVariant;
  /** Width — any CSS value or Tailwind class */
  width?: string;
  /** Height — any CSS value or Tailwind class */
  height?: string;
  /** Number of skeleton lines (only for `text` variant) */
  count?: number;
}

/* ------------------------------------------------------------------ */
/*  Shimmer keyframes (inlined via Tailwind arbitrary)                  */
/* ------------------------------------------------------------------ */

const SHIMMER =
  'relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_1.5s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/40 before:to-transparent dark:before:via-white/10';

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

/**
 * Skeleton placeholder for loading states. Supports text lines, circles,
 * rectangles, and card-shaped skeletons with a shimmer animation.
 *
 * @example
 * ```tsx
 * <Skeleton variant="text" count={3} />
 * <Skeleton variant="circular" width="40px" height="40px" />
 * <Skeleton variant="card" height="200px" />
 * ```
 */
export function Skeleton({
  variant = 'text',
  width,
  height,
  count = 1,
  className,
  style,
  ...props
}: SkeletonProps) {
  if (variant === 'text') {
    return (
      <div className={cn('flex flex-col gap-2', className)} {...props}>
        {Array.from({ length: count }, (_, i) => (
          <div
            key={i}
            className={cn(
              'h-4 rounded bg-gray-200 dark:bg-gray-700',
              SHIMMER,
              // Last line is shorter for visual realism
              i === count - 1 && count > 1 && 'w-3/4',
            )}
            style={{
              width: i === count - 1 && count > 1 ? undefined : (width ?? '100%'),
              height: height ?? undefined,
              ...style,
            }}
          />
        ))}
      </div>
    );
  }

  const variantClasses: Record<Exclude<SkeletonVariant, 'text'>, string> = {
    circular: 'rounded-full',
    rectangular: 'rounded-lg',
    card: 'rounded-xl',
  };

  return (
    <div
      className={cn(
        'bg-gray-200 dark:bg-gray-700',
        SHIMMER,
        variantClasses[variant],
        className,
      )}
      style={{
        width: width ?? (variant === 'circular' ? '40px' : '100%'),
        height:
          height ??
          (variant === 'circular' ? '40px' : variant === 'card' ? '200px' : '40px'),
        ...style,
      }}
      {...props}
    />
  );
}

Skeleton.displayName = 'Skeleton';
