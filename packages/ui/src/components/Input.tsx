'use client';

import { forwardRef, useState } from 'react';
import type { InputHTMLAttributes, ReactNode } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '../utils';

/** Available input sizes */
const INPUT_SIZES = {
  sm: {
    wrapper: 'h-8',
    input: 'text-xs px-2.5',
    icon: 14,
    iconPadding: 'pl-8',
    rightIconPadding: 'pr-8',
  },
  md: {
    wrapper: 'h-10',
    input: 'text-sm px-3',
    icon: 16,
    iconPadding: 'pl-9',
    rightIconPadding: 'pr-9',
  },
  lg: {
    wrapper: 'h-12',
    input: 'text-base px-4',
    icon: 18,
    iconPadding: 'pl-11',
    rightIconPadding: 'pr-11',
  },
} as const;

export type InputSize = keyof typeof INPUT_SIZES;

export interface InputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  /** Label text displayed above the input */
  label?: string;
  /** Error message displayed below the input in red */
  error?: string;
  /** Helper text displayed below the input in muted color */
  helperText?: string;
  /** Icon component rendered inside the left edge of the input */
  leftIcon?: LucideIcon;
  /** Icon component rendered inside the right edge of the input */
  rightIcon?: LucideIcon;
  /** Size preset */
  size?: InputSize;
}

/**
 * A styled text input with label, error/helper messages, icons,
 * and built-in password visibility toggle.
 *
 * @example
 * ```tsx
 * <Input
 *   label="Email"
 *   type="email"
 *   placeholder="you@example.com"
 *   leftIcon={Mail}
 *   error={errors.email}
 * />
 *
 * <Input label="Password" type="password" />
 * ```
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      helperText,
      leftIcon: LeftIcon,
      rightIcon: RightIcon,
      size = 'md',
      type,
      className,
      id,
      disabled,
      ...props
    },
    ref,
  ) => {
    const [showPassword, setShowPassword] = useState(false);
    const isPassword = type === 'password';
    const sizeConfig = INPUT_SIZES[size];
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-');

    // Determine the effective right icon — password toggle takes priority
    const hasRightElement = isPassword || !!RightIcon;
    const effectiveType = isPassword && showPassword ? 'text' : type;

    return (
      <div className={cn('flex flex-col gap-1.5', className)}>
        {label && (
          <label
            htmlFor={inputId}
            className={cn(
              'text-sm font-medium text-gray-700 dark:text-gray-300',
              disabled && 'opacity-50',
            )}
          >
            {label}
          </label>
        )}

        <div className="relative">
          {LeftIcon && (
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <LeftIcon
                size={sizeConfig.icon}
                className="text-gray-400 dark:text-gray-500"
              />
            </div>
          )}

          <input
            ref={ref}
            id={inputId}
            type={effectiveType}
            disabled={disabled}
            className={cn(
              // Base
              'w-full rounded-lg border bg-white font-normal',
              'transition-all duration-200 ease-out',
              'placeholder:text-gray-400',
              // Focus
              'focus:outline-none focus:ring-2 focus:ring-primary-500/40 focus:border-primary-500',
              // Dark mode
              'dark:bg-gray-800 dark:text-gray-100 dark:placeholder:text-gray-500',
              'dark:focus:ring-primary-400/40 dark:focus:border-primary-400',
              // Size
              sizeConfig.wrapper,
              sizeConfig.input,
              // Icons
              LeftIcon && sizeConfig.iconPadding,
              hasRightElement && sizeConfig.rightIconPadding,
              // States
              error
                ? 'border-red-400 focus:ring-red-500/40 focus:border-red-500 dark:border-red-500'
                : 'border-gray-300 dark:border-gray-600',
              disabled && 'cursor-not-allowed opacity-50 bg-gray-50 dark:bg-gray-900',
            )}
            aria-invalid={error ? 'true' : undefined}
            aria-describedby={
              error
                ? `${inputId}-error`
                : helperText
                  ? `${inputId}-helper`
                  : undefined
            }
            {...props}
          />

          {isPassword && (
            <button
              type="button"
              tabIndex={-1}
              onClick={() => setShowPassword((v) => !v)}
              className={cn(
                'absolute inset-y-0 right-0 flex items-center pr-3',
                'text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300',
                'transition-colors duration-150',
              )}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? (
                <EyeOff size={sizeConfig.icon} />
              ) : (
                <Eye size={sizeConfig.icon} />
              )}
            </button>
          )}

          {!isPassword && RightIcon && (
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
              <RightIcon
                size={sizeConfig.icon}
                className="text-gray-400 dark:text-gray-500"
              />
            </div>
          )}
        </div>

        {error && (
          <p
            id={`${inputId}-error`}
            role="alert"
            className="text-xs text-red-500 dark:text-red-400"
          >
            {error}
          </p>
        )}
        {!error && helperText && (
          <p
            id={`${inputId}-helper`}
            className="text-xs text-gray-500 dark:text-gray-400"
          >
            {helperText}
          </p>
        )}
      </div>
    );
  },
);

Input.displayName = 'Input';
