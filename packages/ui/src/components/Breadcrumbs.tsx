'use client';

import { ChevronRight } from 'lucide-react';
import { cn } from '../utils';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface BreadcrumbItem {
  /** Display label */
  label: string;
  /** Link href — omit for the current/last item */
  href?: string;
}

export interface BreadcrumbsProps {
  /** Ordered array of breadcrumb items */
  items: BreadcrumbItem[];
  /** Additional CSS classes */
  className?: string;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

/**
 * Navigation breadcrumbs with chevron separators. The last item renders
 * as plain text (current page). Links truncate on small screens.
 *
 * @example
 * ```tsx
 * <Breadcrumbs
 *   items={[
 *     { label: 'Dashboard', href: '/' },
 *     { label: 'Projects', href: '/projects' },
 *     { label: 'my-app' },
 *   ]}
 * />
 * ```
 */
export function Breadcrumbs({ items, className }: BreadcrumbsProps) {
  return (
    <nav aria-label="Breadcrumb" className={className}>
      <ol className="flex items-center flex-wrap gap-1 text-sm">
        {items.map((item, idx) => {
          const isLast = idx === items.length - 1;

          return (
            <li key={idx} className="inline-flex items-center gap-1">
              {idx > 0 && (
                <ChevronRight
                  size={14}
                  className="shrink-0 text-gray-400 dark:text-gray-500"
                  aria-hidden="true"
                />
              )}
              {isLast || !item.href ? (
                <span
                  className={cn(
                    'truncate max-w-[200px]',
                    isLast
                      ? 'font-medium text-gray-900 dark:text-gray-100'
                      : 'text-gray-500 dark:text-gray-400',
                  )}
                  aria-current={isLast ? 'page' : undefined}
                >
                  {item.label}
                </span>
              ) : (
                <a
                  href={item.href}
                  className={cn(
                    'truncate max-w-[200px] text-gray-500 hover:text-gray-700',
                    'dark:text-gray-400 dark:hover:text-gray-200',
                    'transition-colors duration-150',
                  )}
                >
                  {item.label}
                </a>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

Breadcrumbs.displayName = 'Breadcrumbs';
