'use client';

import { forwardRef } from 'react';
import type { SelectHTMLAttributes } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '../utils';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface SelectOption {
  /** Option value */
  value: string;
  /** Display label */
  label: string;
}

export interface SelectProps
  extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  /** Label text displayed above the select */
  label?: string;
  /** Error message displayed below in red */
  error?: string;
  /** Array of selectable options */
  options: SelectOption[];
  /** Placeholder shown when no value is selected */
  placeholder?: string;
  /** Size preset */
  size?: 'sm' | 'md' | 'lg';
}

/* ------------------------------------------------------------------ */
/*  Sizes                                                              */
/* ------------------------------------------------------------------ */

const SIZE_STYLES = {
  sm: 'h-8 text-xs px-2.5 pr-8',
  md: 'h-10 text-sm px-3 pr-9',
  lg: 'h-12 text-base px-4 pr-10',
} as const;

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

/**
 * A styled select dropdown with label, error state, and custom chevron.
 *
 * @example
 * ```tsx
 * <Select
 *   label="Region"
 *   placeholder="Select a region"
 *   options={[
 *     { value: 'us', label: 'United States' },
 *     { value: 'eu', label: 'Europe' },
 *   ]}
 *   error={errors.region}
 * />
 * ```
 */
export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      label,
      error,
      options,
      placeholder,
      disabled,
      size = 'md',
      className,
      id,
      ...props
    },
    ref,
  ) => {
    const selectId = id ?? label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className={cn('flex flex-col gap-1.5', className)}>
        {label && (
          <label
            htmlFor={selectId}
            className={cn(
              'text-sm font-medium text-gray-700 dark:text-gray-300',
              disabled && 'opacity-50',
            )}
          >
            {label}
          </label>
        )}

        <div className="relative">
          <select
            ref={ref}
            id={selectId}
            disabled={disabled}
            className={cn(
              // Base
              'w-full appearance-none rounded-lg border bg-white font-normal',
              'transition-all duration-200 ease-out cursor-pointer',
              // Focus
              'focus:outline-none focus:ring-2 focus:ring-primary-500/40 focus:border-primary-500',
              // Dark
              'dark:bg-gray-800 dark:text-gray-100',
              'dark:focus:ring-primary-400/40 dark:focus:border-primary-400',
              // Size
              SIZE_STYLES[size],
              // Error
              error
                ? 'border-red-400 focus:ring-red-500/40 focus:border-red-500 dark:border-red-500'
                : 'border-gray-300 dark:border-gray-600',
              // Disabled
              disabled &&
                'cursor-not-allowed opacity-50 bg-gray-50 dark:bg-gray-900',
            )}
            aria-invalid={error ? 'true' : undefined}
            aria-describedby={error ? `${selectId}-error` : undefined}
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2.5">
            <ChevronDown
              size={16}
              className="text-gray-400 dark:text-gray-500"
            />
          </div>
        </div>

        {error && (
          <p
            id={`${selectId}-error`}
            role="alert"
            className="text-xs text-red-500 dark:text-red-400"
          >
            {error}
          </p>
        )}
      </div>
    );
  },
);

Select.displayName = 'Select';
