'use client';

import { useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '../utils';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface PaginationProps {
  /** Current active page (1-indexed) */
  currentPage: number;
  /** Total number of pages */
  totalPages: number;
  /** Called when a page button is clicked */
  onPageChange: (page: number) => void;
  /** Number of sibling pages shown on each side of the current page */
  siblingsCount?: number;
  /** Additional CSS classes */
  className?: string;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

const ELLIPSIS = '…';

/**
 * Generates the page number array with ellipsis markers.
 */
function generatePages(
  current: number,
  total: number,
  siblings: number,
): (number | typeof ELLIPSIS)[] {
  // If total pages is small enough, show all
  const totalSlots = siblings * 2 + 5; // siblings + boundaries + ellipsis + current
  if (total <= totalSlots) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const leftSibling = Math.max(current - siblings, 1);
  const rightSibling = Math.min(current + siblings, total);

  const showLeftDots = leftSibling > 2;
  const showRightDots = rightSibling < total - 1;

  const pages: (number | typeof ELLIPSIS)[] = [];

  // Always show page 1
  pages.push(1);

  if (showLeftDots) {
    pages.push(ELLIPSIS);
  } else {
    // Fill in pages 2..leftSibling-1
    for (let i = 2; i < leftSibling; i++) pages.push(i);
  }

  // Sibling range
  for (let i = leftSibling; i <= rightSibling; i++) {
    if (i !== 1 && i !== total) pages.push(i);
  }

  if (showRightDots) {
    pages.push(ELLIPSIS);
  } else {
    for (let i = rightSibling + 1; i < total; i++) pages.push(i);
  }

  // Always show last page
  if (total > 1) pages.push(total);

  return pages;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

/**
 * Page navigation with numbered buttons, ellipsis, and prev/next controls.
 *
 * @example
 * ```tsx
 * <Pagination
 *   currentPage={page}
 *   totalPages={20}
 *   onPageChange={setPage}
 *   siblingsCount={1}
 * />
 * ```
 */
export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  siblingsCount = 1,
  className,
}: PaginationProps) {
  const pages = useMemo(
    () => generatePages(currentPage, totalPages, siblingsCount),
    [currentPage, totalPages, siblingsCount],
  );

  if (totalPages <= 1) return null;

  const buttonBase = cn(
    'inline-flex items-center justify-center rounded-lg text-sm font-medium',
    'h-9 min-w-[36px] px-2',
    'transition-all duration-150',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500',
  );

  return (
    <nav aria-label="Pagination" className={cn('flex items-center gap-1', className)}>
      {/* Previous */}
      <button
        type="button"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage <= 1}
        className={cn(
          buttonBase,
          'text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700',
          currentPage <= 1 && 'opacity-40 pointer-events-none',
        )}
        aria-label="Previous page"
      >
        <ChevronLeft size={16} />
      </button>

      {/* Page numbers */}
      {pages.map((page, idx) =>
        page === ELLIPSIS ? (
          <span
            key={`ellipsis-${idx}`}
            className="inline-flex items-center justify-center h-9 min-w-[36px] text-sm text-gray-400 dark:text-gray-500 select-none"
          >
            {ELLIPSIS}
          </span>
        ) : (
          <button
            key={page}
            type="button"
            onClick={() => onPageChange(page)}
            aria-current={page === currentPage ? 'page' : undefined}
            className={cn(
              buttonBase,
              page === currentPage
                ? 'bg-primary-600 text-white shadow-sm dark:bg-primary-500'
                : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700',
            )}
          >
            {page}
          </button>
        ),
      )}

      {/* Next */}
      <button
        type="button"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage >= totalPages}
        className={cn(
          buttonBase,
          'text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700',
          currentPage >= totalPages && 'opacity-40 pointer-events-none',
        )}
        aria-label="Next page"
      >
        <ChevronRight size={16} />
      </button>
    </nav>
  );
}

Pagination.displayName = 'Pagination';
