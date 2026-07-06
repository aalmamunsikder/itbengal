'use client';

import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '../utils';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface TabItem {
  /** Unique tab identifier */
  id: string;
  /** Display label */
  label: string;
  /** Optional icon component */
  icon?: LucideIcon;
  /** Optional badge count/text */
  badge?: string | number;
}

export type TabsVariant = 'underline' | 'pill';

export interface TabsProps {
  /** Tab definitions */
  tabs: TabItem[];
  /** Currently active tab id */
  activeTab: string;
  /** Called when a tab is clicked */
  onChange: (tabId: string) => void;
  /** Visual variant */
  variant?: TabsVariant;
  /** Additional CSS classes for the wrapper */
  className?: string;
  /** Render function for the tab content panel (optional) */
  children?: ReactNode;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

/**
 * Horizontal tabs with underline or pill variants, icon + badge support,
 * and responsive horizontal scrolling on mobile.
 *
 * @example
 * ```tsx
 * <Tabs
 *   tabs={[
 *     { id: 'overview', label: 'Overview', icon: LayoutDashboard },
 *     { id: 'logs', label: 'Logs', badge: 12 },
 *     { id: 'settings', label: 'Settings', icon: Settings },
 *   ]}
 *   activeTab={tab}
 *   onChange={setTab}
 * />
 * ```
 */
export function Tabs({
  tabs,
  activeTab,
  onChange,
  variant = 'underline',
  className,
  children,
}: TabsProps) {
  const isUnderline = variant === 'underline';

  return (
    <div className={className}>
      <div
        role="tablist"
        className={cn(
          'flex overflow-x-auto scrollbar-none',
          isUnderline
            ? 'border-b border-gray-200 dark:border-gray-700 gap-0'
            : 'gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1',
        )}
      >
        {tabs.map((tab) => {
          const isActive = tab.id === activeTab;
          const TabIcon = tab.icon;

          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              aria-controls={`panel-${tab.id}`}
              onClick={() => onChange(tab.id)}
              className={cn(
                'relative inline-flex items-center gap-2 shrink-0 font-medium transition-all duration-200',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-1',
                isUnderline
                  ? [
                      'px-4 py-2.5 text-sm -mb-px border-b-2',
                      isActive
                        ? 'border-primary-600 text-primary-600 dark:border-primary-400 dark:text-primary-400'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:border-gray-600',
                    ]
                  : [
                      'px-3 py-1.5 text-sm rounded-md',
                      isActive
                        ? 'bg-white text-gray-900 shadow-sm dark:bg-gray-700 dark:text-gray-100'
                        : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200',
                    ],
              )}
            >
              {TabIcon && (
                <TabIcon size={16} className={isActive ? '' : 'opacity-70'} />
              )}
              {tab.label}
              {tab.badge !== undefined && (
                <span
                  className={cn(
                    'inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-semibold',
                    isActive
                      ? 'bg-primary-100 text-primary-700 dark:bg-primary-500/20 dark:text-primary-300'
                      : 'bg-gray-200 text-gray-600 dark:bg-gray-600 dark:text-gray-300',
                  )}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {children && (
        <div
          role="tabpanel"
          id={`panel-${activeTab}`}
          aria-labelledby={activeTab}
          className="mt-4"
        >
          {children}
        </div>
      )}
    </div>
  );
}

Tabs.displayName = 'Tabs';
