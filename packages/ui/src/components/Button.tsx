'use client';

import { forwardRef } from 'react';
import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Loader2 } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '../utils';

/** Available button visual variants */
const BUTTON_VARIANTS = {
  primary:
    'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-md shadow-indigo-500/25 hover:from-indigo-500 hover:to-indigo-400 hover:shadow-lg hover:shadow-indigo-500/30 active:from-indigo-700 active:to-indigo-600 dark:from-indigo-500 dark:to-indigo-400 dark:hover:from-indigo-400 dark:hover:to-indigo-300',
  secondary:
    'border border-gray-300 bg-white text-gray-700 shadow-sm hover:bg-gray-50 hover:border-gray-400 active:bg-gray-100 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700 dark:hover:border-gray-500',
  ghost:
    'bg-transparent text-gray-600 hover:bg-gray-100 hover:text-gray-900 active:bg-gray-200 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-gray-100',
  danger:
    'bg-gradient-to-r from-red-600 to-red-500 text-white shadow-md shadow-red-500/25 hover:from-red-500 hover:to-red-400 hover:shadow-lg hover:shadow-red-500/30 active:from-red-700 active:to-red-600 dark:from-red-500 dark:to-red-400',
  success:
    'bg-gradient-to-r from-emerald-600 to-emerald-500 text-white shadow-md shadow-emerald-500/25 hover:from-emerald-500 hover:to-emerald-400 hover:shadow-lg hover:shadow-emerald-500/30 active:from-emerald-700 active:to-emerald-600 dark:from-emerald-500 dark:to-emerald-400',
} as const;

/** Available button sizes */
const BUTTON_SIZES = {
  sm: 'h-8 px-3 text-xs gap-1.5 rounded-md',
  md: 'h-10 px-4 text-sm gap-2 rounded-lg',
  lg: 'h-12 px-6 text-base gap-2.5 rounded-lg',
} as const;

/** Icon sizes mapped to button sizes */
const ICON_SIZES = {
  sm: 14,
  md: 16,
  lg: 18,
} as const;

export type ButtonVariant = keyof typeof BUTTON_VARIANTS;
export type ButtonSize = keyof typeof BUTTON_SIZES;

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Visual style variant */
  variant?: ButtonVariant;
  /** Size preset */
  size?: ButtonSize;
  /** Shows a loading spinner and disables the button */
  isLoading?: boolean;
  /** Icon component rendered before children */
  leftIcon?: LucideIcon;
  /** Icon component rendered after children */
  rightIcon?: LucideIcon;
  /** Stretch to fill container width */
  fullWidth?: boolean;
  /** Button content */
  children: ReactNode;
}

/**
 * A versatile button component with multiple variants, sizes, loading states,
 * and icon support. Built with Tailwind CSS and dark mode support.
 *
 * @example
 * ```tsx
 * <Button variant="primary" size="md" leftIcon={Plus}>
 *   Create Project
 * </Button>
 *
 * <Button variant="danger" isLoading>
 *   Deleting...
 * </Button>
 * ```
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      isLoading = false,
      disabled,
      leftIcon: LeftIcon,
      rightIcon: RightIcon,
      fullWidth = false,
      children,
      className,
      ...props
    },
    ref,
  ) => {
    const isDisabled = disabled || isLoading;
    const iconSize = ICON_SIZES[size];

    return (
      <button
        ref={ref}
        disabled={isDisabled}
        className={cn(
          // Base styles
          'inline-flex items-center justify-center font-medium',
          'transition-all duration-200 ease-out',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2',
          'dark:focus-visible:ring-offset-gray-900',
          // Hover transform
          'hover:scale-[1.02] active:scale-[0.98]',
          // Variant + size
          BUTTON_VARIANTS[variant],
          BUTTON_SIZES[size],
          // Full width
          fullWidth && 'w-full',
          // Disabled
          isDisabled &&
            'pointer-events-none opacity-50 shadow-none hover:scale-100',
          className,
        )}
        {...props}
      >
        {isLoading ? (
          <Loader2 size={iconSize} className="animate-spin" />
        ) : LeftIcon ? (
          <LeftIcon size={iconSize} />
        ) : null}
        {children}
        {!isLoading && RightIcon && <RightIcon size={iconSize} />}
      </button>
    );
  },
);

Button.displayName = 'Button';
