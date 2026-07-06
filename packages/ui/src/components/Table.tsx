'use client';

import { useState, useCallback } from 'react';
import type { ReactNode } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { cn } from '../utils';
import { Skeleton } from './Skeleton';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export type SortDirection = 'asc' | 'desc';

export interface SortState {
  key: string;
  direction: SortDirection;
}

export interface TableColumn<T> {
  /** Unique key matching a property in the data objects */
  key: string;
  /** Display header text */
  header: string;
  /** Custom render function for the cell */
  render?: (row: T, index: number) => ReactNode;
  /** Whether this column is sortable */
  sortable?: boolean;
  /** Additional header cell class */
  headerClassName?: string;
  /** Additional body cell class */
  cellClassName?: string;
}

export interface TableProps<T> {
  /** Column definitions */
  columns: TableColumn<T>[];
  /** Array of data rows */
  data: T[];
  /** Show loading skeleton */
  isLoading?: boolean;
  /** Message shown when data is empty */
  emptyMessage?: string;
  /** Callback when a sortable column header is clicked */
  onSort?: (sort: SortState) => void;
  /** Show striped row backgrounds */
  striped?: boolean;
  /** Number of skeleton rows to show while loading */
  skeletonRows?: number;
  /** Additional CSS classes for the wrapper */
  className?: string;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

/**
 * A data table with sortable columns, loading skeletons, striped rows,
 * and responsive horizontal scrolling.
 *
 * @example
 * ```tsx
 * <Table
 *   columns={[
 *     { key: 'name', header: 'Name', sortable: true },
 *     { key: 'status', header: 'Status', render: (row) => <Badge>{row.status}</Badge> },
 *   ]}
 *   data={users}
 *   isLoading={isLoading}
 *   striped
 *   onSort={(sort) => console.log(sort)}
 * />
 * ```
 */
export function Table<T extends Record<string, unknown>>({
  columns,
  data,
  isLoading = false,
  emptyMessage = 'No data available',
  onSort,
  striped = false,
  skeletonRows = 5,
  className,
}: TableProps<T>) {
  const [sortState, setSortState] = useState<SortState | null>(null);

  const handleSort = useCallback(
    (key: string) => {
      const newDirection: SortDirection =
        sortState?.key === key && sortState.direction === 'asc' ? 'desc' : 'asc';
      const newSort: SortState = { key, direction: newDirection };
      setSortState(newSort);
      onSort?.(newSort);
    },
    [sortState, onSort],
  );

  const renderSortIcon = (column: TableColumn<T>) => {
    if (!column.sortable) return null;
    const isActive = sortState?.key === column.key;

    return (
      <span className="ml-1 inline-flex flex-col -space-y-1">
        <ChevronUp
          size={12}
          className={cn(
            'transition-colors',
            isActive && sortState?.direction === 'asc'
              ? 'text-primary-600 dark:text-primary-400'
              : 'text-gray-300 dark:text-gray-600',
          )}
        />
        <ChevronDown
          size={12}
          className={cn(
            'transition-colors',
            isActive && sortState?.direction === 'desc'
              ? 'text-primary-600 dark:text-primary-400'
              : 'text-gray-300 dark:text-gray-600',
          )}
        />
      </span>
    );
  };

  return (
    <div
      className={cn(
        'overflow-x-auto rounded-2xl border border-slate-100 dark:border-gray-800/80',
        className,
      )}
    >
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        {/* ---- Head ---- */}
        <thead className="bg-gray-50 dark:bg-gray-800/60">
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                scope="col"
                className={cn(
                  'px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider',
                  'text-gray-500 dark:text-gray-400',
                  col.sortable && 'cursor-pointer select-none hover:text-gray-700 dark:hover:text-gray-200',
                  col.headerClassName,
                )}
                onClick={col.sortable ? () => handleSort(col.key) : undefined}
                aria-sort={
                  sortState?.key === col.key
                    ? sortState.direction === 'asc'
                      ? 'ascending'
                      : 'descending'
                    : undefined
                }
              >
                <div className="flex items-center">
                  {col.header}
                  {renderSortIcon(col)}
                </div>
              </th>
            ))}
          </tr>
        </thead>

        {/* ---- Body ---- */}
        <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50 bg-white dark:bg-gray-800">
          {isLoading
            ? Array.from({ length: skeletonRows }, (_, rowIdx) => (
                <tr key={`skeleton-${rowIdx}`}>
                  {columns.map((col) => (
                    <td key={col.key} className="px-4 py-3">
                      <Skeleton variant="text" width="80%" />
                    </td>
                  ))}
                </tr>
              ))
            : data.length === 0
              ? (
                <tr>
                  <td
                    colSpan={columns.length}
                    className="px-4 py-12 text-center text-sm text-gray-500 dark:text-gray-400"
                  >
                    {emptyMessage}
                  </td>
                </tr>
              )
              : data.map((row, rowIdx) => (
                <tr
                  key={rowIdx}
                  className={cn(
                    'transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/30',
                    striped && rowIdx % 2 === 1 && 'bg-gray-50/50 dark:bg-gray-800/50',
                  )}
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={cn(
                        'px-4 py-3 text-sm text-gray-700 dark:text-gray-300',
                        'whitespace-nowrap',
                        col.cellClassName,
                      )}
                    >
                      {col.render
                        ? col.render(row, rowIdx)
                        : (row[col.key] as ReactNode) ?? '—'}
                    </td>
                  ))}
                </tr>
              ))}
        </tbody>
      </table>
    </div>
  );
}

Table.displayName = 'Table';
