'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '../utils';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export type DropdownItemVariant = 'default' | 'danger';

export interface DropdownItem {
  /** Display label */
  label: string;
  /** Optional icon */
  icon?: LucideIcon;
  /** Click handler */
  onClick?: () => void;
  /** Color variant */
  variant?: DropdownItemVariant;
  /** Render a divider before this item */
  divider?: boolean;
  /** Disable the item */
  disabled?: boolean;
}

export interface DropdownProps {
  /** The trigger element that opens the dropdown */
  trigger: ReactNode;
  /** Menu items */
  items: DropdownItem[];
  /** Alignment of the dropdown menu */
  align?: 'left' | 'right';
  /** Additional CSS classes for the wrapper */
  className?: string;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

/**
 * A click-toggled dropdown menu that closes on outside click or item selection.
 *
 * @example
 * ```tsx
 * <Dropdown
 *   trigger={<Button variant="ghost" size="sm">Actions ▾</Button>}
 *   items={[
 *     { label: 'Edit', icon: Pencil, onClick: handleEdit },
 *     { label: 'Duplicate', icon: Copy, onClick: handleDup },
 *     { label: 'Delete', icon: Trash2, onClick: handleDelete, variant: 'danger', divider: true },
 *   ]}
 * />
 * ```
 */
export function Dropdown({
  trigger,
  items,
  align = 'right',
  className,
}: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  const handleClickOutside = useCallback((e: MouseEvent) => {
    if (
      containerRef.current &&
      !containerRef.current.contains(e.target as Node)
    ) {
      setIsOpen(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, handleClickOutside]);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [isOpen]);

  const handleItemClick = (item: DropdownItem) => {
    if (item.disabled) return;
    item.onClick?.();
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className={cn('relative inline-block', className)}>
      {/* Trigger */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => setIsOpen((v) => !v)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setIsOpen((v) => !v);
          }
        }}
        aria-haspopup="menu"
        aria-expanded={isOpen}
      >
        {trigger}
      </div>

      {/* Menu */}
      {isOpen && (
        <div
          role="menu"
          className={cn(
            'absolute z-50 mt-1 min-w-[180px] py-1',
            'rounded-lg border bg-white shadow-xl',
            'dark:bg-gray-800 dark:border-gray-700 dark:shadow-black/40',
            // Animation
            'animate-in fade-in zoom-in-95 duration-150',
            // Alignment
            align === 'right' ? 'right-0' : 'left-0',
          )}
        >
          {items.map((item, idx) => (
            <div key={idx}>
              {item.divider && (
                <div className="my-1 border-t border-gray-100 dark:border-gray-700" />
              )}
              <button
                type="button"
                role="menuitem"
                disabled={item.disabled}
                onClick={() => handleItemClick(item)}
                className={cn(
                  'flex w-full items-center gap-2.5 px-3 py-2 text-sm',
                  'transition-colors duration-100',
                  item.variant === 'danger'
                    ? 'text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10'
                    : 'text-gray-700 hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-gray-700',
                  item.disabled && 'opacity-40 cursor-not-allowed',
                )}
              >
                {item.icon && <item.icon size={15} className="shrink-0 opacity-70" />}
                {item.label}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

Dropdown.displayName = 'Dropdown';
