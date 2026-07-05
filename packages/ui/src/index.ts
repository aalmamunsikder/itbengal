/**
 * @itbengal/ui — Shared React UI component library
 *
 * All components are `'use client'` and designed for use with
 * Tailwind CSS, dark mode (`dark:` prefix), and React 19.
 *
 * @packageDocumentation
 */

/* ---- Utilities ---- */
export { cn } from './utils';

/* ---- Components ---- */
export { Button } from './components/Button';
export type { ButtonProps, ButtonVariant, ButtonSize } from './components/Button';

export { Input } from './components/Input';
export type { InputProps, InputSize } from './components/Input';

export { Card } from './components/Card';
export type {
  CardProps,
  CardSectionProps,
  CardVariant,
  CardPadding,
} from './components/Card';

export { Modal } from './components/Modal';
export type { ModalProps, ModalSectionProps, ModalSize } from './components/Modal';

export { Table } from './components/Table';
export type {
  TableProps,
  TableColumn,
  SortState,
  SortDirection,
} from './components/Table';

export { Badge } from './components/Badge';
export type { BadgeProps, BadgeVariant, BadgeSize } from './components/Badge';

export { ToastProvider, toast, useToast } from './components/Toast';
export type {
  ToastProviderProps,
  ToastType,
  ToastData,
} from './components/Toast';

export { Skeleton } from './components/Skeleton';
export type { SkeletonProps, SkeletonVariant } from './components/Skeleton';

export { Tabs } from './components/Tabs';
export type { TabsProps, TabItem, TabsVariant } from './components/Tabs';

export { CodeBlock } from './components/CodeBlock';
export type {
  CodeBlockProps,
  CodeLine,
  CodeLineType,
} from './components/CodeBlock';

export { CopyButton } from './components/CopyButton';
export type { CopyButtonProps } from './components/CopyButton';

export { EmptyState } from './components/EmptyState';
export type {
  EmptyStateProps,
  EmptyStateAction,
} from './components/EmptyState';

export { Select } from './components/Select';
export type { SelectProps, SelectOption } from './components/Select';

export { Dropdown } from './components/Dropdown';
export type {
  DropdownProps,
  DropdownItem,
  DropdownItemVariant,
} from './components/Dropdown';

export { Avatar } from './components/Avatar';
export type { AvatarProps, AvatarSize } from './components/Avatar';

export { Breadcrumbs } from './components/Breadcrumbs';
export type { BreadcrumbsProps, BreadcrumbItem } from './components/Breadcrumbs';

export { Pagination } from './components/Pagination';
export type { PaginationProps } from './components/Pagination';
