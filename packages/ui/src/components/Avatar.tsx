'use client';

import { useState } from 'react';
import { cn } from '../utils';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export interface AvatarProps {
  /** Image source URL */
  src?: string;
  /** Alt text for the image */
  alt?: string;
  /** Fallback initials when image is unavailable */
  fallback?: string;
  /** Size preset */
  size?: AvatarSize;
  /** Additional CSS classes */
  className?: string;
}

/* ------------------------------------------------------------------ */
/*  Size map                                                           */
/* ------------------------------------------------------------------ */

const SIZE_CLASSES: Record<AvatarSize, string> = {
  xs: 'h-6 w-6 text-[10px]',
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-12 w-12 text-base',
  xl: 'h-16 w-16 text-lg',
};

/** Generates a deterministic background color from a string */
function getInitialsColor(text: string): string {
  const colors = [
    'bg-primary-500',
    'bg-emerald-500',
    'bg-amber-500',
    'bg-rose-500',
    'bg-cyan-500',
    'bg-violet-500',
    'bg-orange-500',
    'bg-teal-500',
    'bg-pink-500',
    'bg-blue-500',
  ];
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = text.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length]!;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

/**
 * Circular avatar with image source or fallback initials on a deterministic
 * colored background.
 *
 * @example
 * ```tsx
 * <Avatar src="/avatars/user.jpg" alt="Jane Doe" size="md" />
 * <Avatar fallback="JD" size="lg" />
 * ```
 */
export function Avatar({
  src,
  alt = '',
  fallback,
  size = 'md',
  className,
}: AvatarProps) {
  const [imgError, setImgError] = useState(false);
  const showFallback = !src || imgError;

  const initials = fallback
    ? fallback.slice(0, 2).toUpperCase()
    : alt
      ? alt
          .split(' ')
          .map((w) => w[0])
          .join('')
          .slice(0, 2)
          .toUpperCase()
      : '?';

  return (
    <div
      className={cn(
        'relative inline-flex items-center justify-center rounded-full overflow-hidden shrink-0',
        'ring-2 ring-white dark:ring-gray-800',
        SIZE_CLASSES[size],
        showFallback && getInitialsColor(initials),
        className,
      )}
      role="img"
      aria-label={alt || fallback || 'Avatar'}
    >
      {showFallback ? (
        <span className="font-semibold text-white select-none leading-none">
          {initials}
        </span>
      ) : (
        <img
          src={src}
          alt={alt}
          onError={() => setImgError(true)}
          className="h-full w-full object-cover"
          loading="lazy"
        />
      )}
    </div>
  );
}

Avatar.displayName = 'Avatar';
