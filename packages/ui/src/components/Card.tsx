'use client';

import { createContext, useContext } from 'react';
import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '../utils';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export type CardVariant = 'default' | 'bordered' | 'elevated';
export type CardPadding = 'sm' | 'md' | 'lg';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /** Visual style variant */
  variant?: CardVariant;
  /** Inner padding preset */
  padding?: CardPadding;
  /** Add subtle hover lift effect */
  hoverable?: boolean;
  /** Card content */
  children: ReactNode;
}

export interface CardSectionProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

/* ------------------------------------------------------------------ */
/*  Context                                                            */
/* ------------------------------------------------------------------ */

interface CardContextValue {
  padding: CardPadding;
}

const CardContext = createContext<CardContextValue>({ padding: 'md' });

/* ------------------------------------------------------------------ */
/*  Style maps                                                         */
/* ------------------------------------------------------------------ */

const VARIANT_STYLES: Record<CardVariant, string> = {
  default:
    'bg-white border border-gray-200 shadow-sm dark:bg-gray-800 dark:border-gray-700',
  bordered:
    'bg-white border-2 border-gray-300 dark:bg-gray-800 dark:border-gray-600',
  elevated:
    'bg-white shadow-lg shadow-gray-200/50 dark:bg-gray-800 dark:shadow-black/20',
};

const PADDING_MAP: Record<CardPadding, string> = {
  sm: 'px-4 py-3',
  md: 'px-6 py-4',
  lg: 'px-8 py-6',
};

/* ------------------------------------------------------------------ */
/*  Card root                                                          */
/* ------------------------------------------------------------------ */

/**
 * A composable card container with header/body/footer sub-components.
 * Uses the compound component pattern via `Card.Header`, `Card.Body`, `Card.Footer`.
 *
 * @example
 * ```tsx
 * <Card variant="elevated" hoverable>
 *   <Card.Header>
 *     <h3>Title</h3>
 *   </Card.Header>
 *   <Card.Body>Content here</Card.Body>
 *   <Card.Footer>
 *     <Button>Action</Button>
 *   </Card.Footer>
 * </Card>
 * ```
 */
function CardRoot({
  variant = 'default',
  padding = 'md',
  hoverable = false,
  children,
  className,
  ...props
}: CardProps) {
  return (
    <CardContext.Provider value={{ padding }}>
      <div
        className={cn(
          'rounded-xl overflow-hidden',
          'transition-all duration-200 ease-out',
          VARIANT_STYLES[variant],
          hoverable && [
            'hover:shadow-md hover:-translate-y-0.5',
            'dark:hover:shadow-black/30',
            'cursor-pointer',
          ],
          className,
        )}
        {...props}
      >
        {children}
      </div>
    </CardContext.Provider>
  );
}

/* ------------------------------------------------------------------ */
/*  Sub-components                                                     */
/* ------------------------------------------------------------------ */

function CardHeader({ children, className, ...props }: CardSectionProps) {
  const { padding } = useContext(CardContext);

  return (
    <div
      className={cn(
        PADDING_MAP[padding],
        'border-b border-gray-100 dark:border-gray-700',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
CardHeader.displayName = 'Card.Header';

function CardBody({ children, className, ...props }: CardSectionProps) {
  const { padding } = useContext(CardContext);

  return (
    <div className={cn(PADDING_MAP[padding], className)} {...props}>
      {children}
    </div>
  );
}
CardBody.displayName = 'Card.Body';

function CardFooter({ children, className, ...props }: CardSectionProps) {
  const { padding } = useContext(CardContext);

  return (
    <div
      className={cn(
        PADDING_MAP[padding],
        'border-t border-gray-100 dark:border-gray-700',
        'bg-gray-50/50 dark:bg-gray-900/30',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
CardFooter.displayName = 'Card.Footer';

/* ------------------------------------------------------------------ */
/*  Compound export                                                    */
/* ------------------------------------------------------------------ */

/** Card compound component with `.Header`, `.Body`, and `.Footer` sub-components */
export const Card = Object.assign(CardRoot, {
  Header: CardHeader,
  Body: CardBody,
  Footer: CardFooter,
});

Card.displayName = 'Card';
