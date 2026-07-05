'use client';

import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '../utils';
import { Button } from './Button';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface EmptyStateAction {
  /** Button label */
  label: string;
  /** Click handler */
  onClick?: () => void;
  /** If provided, renders as a link */
  href?: string;
}

export interface EmptyStateProps {
  /** Lucide icon displayed large and muted */
  icon: LucideIcon;
  /** Heading text */
  title: string;
  /** Descriptive text below the title */
  description: string;
  /** Optional call-to-action button */
  action?: EmptyStateAction;
  /** Additional CSS classes */
  className?: string;
  /** Optional extra content */
  children?: ReactNode;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

/**
 * A centered empty-state placeholder with icon, copy, and optional CTA.
 *
 * @example
 * ```tsx
 * <EmptyState
 *   icon={Inbox}
 *   title="No deployments yet"
 *   description="Create your first deployment to get started."
 *   action={{ label: 'New Deployment', onClick: handleCreate }}
 * />
 * ```
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
  children,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center py-16 px-6',
        className,
      )}
    >
      <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-gray-100 dark:bg-gray-800 mb-6">
        <Icon
          size={32}
          className="text-gray-400 dark:text-gray-500"
          strokeWidth={1.5}
        />
      </div>

      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">
        {title}
      </h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md mb-6">
        {description}
      </p>

      {action && (
        action.href ? (
          <a href={action.href}>
            <Button variant="primary" size="md">
              {action.label}
            </Button>
          </a>
        ) : (
          <Button variant="primary" size="md" onClick={action.onClick}>
            {action.label}
          </Button>
        )
      )}

      {children}
    </div>
  );
}

EmptyState.displayName = 'EmptyState';
