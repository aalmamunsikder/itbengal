'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X, CheckCircle2, AlertCircle, AlertTriangle, Info } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '../utils';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastData {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

interface ToastContextValue {
  addToast: (type: ToastType, message: string, duration?: number) => void;
  removeToast: (id: string) => void;
}

/* ------------------------------------------------------------------ */
/*  Context                                                            */
/* ------------------------------------------------------------------ */

const ToastContext = createContext<ToastContextValue | null>(null);

/* ------------------------------------------------------------------ */
/*  Config                                                             */
/* ------------------------------------------------------------------ */

const MAX_VISIBLE = 5;
const DEFAULT_DURATION = 5000;

const TOAST_ICONS: Record<ToastType, LucideIcon> = {
  success: CheckCircle2,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
};

const TOAST_STYLES: Record<ToastType, string> = {
  success:
    'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-200',
  error:
    'border-red-200 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-950/80 dark:text-red-200',
  warning:
    'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950/80 dark:text-amber-200',
  info: 'border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-800 dark:bg-blue-950/80 dark:text-blue-200',
};

const ICON_STYLES: Record<ToastType, string> = {
  success: 'text-emerald-500 dark:text-emerald-400',
  error: 'text-red-500 dark:text-red-400',
  warning: 'text-amber-500 dark:text-amber-400',
  info: 'text-blue-500 dark:text-blue-400',
};

/* ------------------------------------------------------------------ */
/*  Single toast item                                                  */
/* ------------------------------------------------------------------ */

function ToastItem({
  toast,
  onRemove,
}: {
  toast: ToastData;
  onRemove: (id: string) => void;
}) {
  const [isExiting, setIsExiting] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const Icon = TOAST_ICONS[toast.type];

  const dismiss = useCallback(() => {
    setIsExiting(true);
    setTimeout(() => onRemove(toast.id), 200);
  }, [toast.id, onRemove]);

  useEffect(() => {
    const duration = toast.duration ?? DEFAULT_DURATION;
    timerRef.current = setTimeout(dismiss, duration);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [toast.duration, dismiss]);

  return (
    <div
      role="alert"
      className={cn(
        'pointer-events-auto flex items-start gap-3 w-full max-w-sm rounded-lg border px-4 py-3 shadow-lg',
        'transition-all duration-200 ease-out',
        isExiting
          ? 'translate-x-full opacity-0'
          : 'translate-x-0 opacity-100 animate-in slide-in-from-right-full',
        TOAST_STYLES[toast.type],
      )}
    >
      <Icon size={18} className={cn('shrink-0 mt-0.5', ICON_STYLES[toast.type])} />
      <p className="flex-1 text-sm font-medium leading-snug">{toast.message}</p>
      <button
        type="button"
        onClick={dismiss}
        className={cn(
          'shrink-0 rounded p-0.5 opacity-60 hover:opacity-100',
          'transition-opacity duration-150',
        )}
        aria-label="Dismiss notification"
      >
        <X size={14} />
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Provider                                                           */
/* ------------------------------------------------------------------ */

export interface ToastProviderProps {
  children: ReactNode;
}

/**
 * Provides toast notification context. Wrap your app root with this provider,
 * then use the `toast()` function to trigger notifications.
 *
 * @example
 * ```tsx
 * // layout.tsx
 * <ToastProvider>
 *   {children}
 * </ToastProvider>
 *
 * // any component
 * import { toast } from '@itbengal/ui';
 * toast.success('Saved successfully!');
 * ```
 */
export function ToastProvider({ children }: ToastProviderProps) {
  const [toasts, setToasts] = useState<ToastData[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    (type: ToastType, message: string, duration?: number) => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      setToasts((prev) => {
        const next = [...prev, { id, type, message, duration }];
        // Trim oldest if over limit
        return next.length > MAX_VISIBLE ? next.slice(-MAX_VISIBLE) : next;
      });
    },
    [],
  );

  // Register global reference for the `toast` function
  useEffect(() => {
    _toastRef.current = addToast;
    return () => {
      _toastRef.current = null;
    };
  }, [addToast]);

  return (
    <ToastContext.Provider value={{ addToast, removeToast }}>
      {children}
      {typeof document !== 'undefined' &&
        createPortal(
          <div
            aria-live="polite"
            aria-label="Notifications"
            className="fixed top-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none"
          >
            {toasts.map((t) => (
              <ToastItem key={t.id} toast={t} onRemove={removeToast} />
            ))}
          </div>,
          document.body,
        )}
    </ToastContext.Provider>
  );
}

ToastProvider.displayName = 'ToastProvider';

/* ------------------------------------------------------------------ */
/*  Imperative toast() function                                        */
/* ------------------------------------------------------------------ */

/** Ref to the provider's addToast — set when ToastProvider mounts */
const _toastRef: {
  current: ((type: ToastType, message: string, duration?: number) => void) | null;
} = { current: null };

function assertProvider(): asserts _toastRef is {
  current: NonNullable<typeof _toastRef.current>;
} {
  if (!_toastRef.current) {
    throw new Error(
      '[@itbengal/ui] toast() called without a <ToastProvider>. Wrap your app root with <ToastProvider>.',
    );
  }
}

/**
 * Imperative toast notification function.
 *
 * @example
 * ```ts
 * toast.success('Changes saved');
 * toast.error('Something went wrong', 8000);
 * toast.warning('Disk usage at 90%');
 * toast.info('Deployment started');
 * ```
 */
export const toast = {
  success: (message: string, duration?: number) => {
    assertProvider();
    _toastRef.current('success', message, duration);
  },
  error: (message: string, duration?: number) => {
    assertProvider();
    _toastRef.current('error', message, duration);
  },
  warning: (message: string, duration?: number) => {
    assertProvider();
    _toastRef.current('warning', message, duration);
  },
  info: (message: string, duration?: number) => {
    assertProvider();
    _toastRef.current('info', message, duration);
  },
} as const;

/* ------------------------------------------------------------------ */
/*  Hook (optional)                                                    */
/* ------------------------------------------------------------------ */

/**
 * React hook to access toast functions from within the component tree.
 * Prefer the imperative `toast` object for simplicity.
 */
export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error(
      '[@itbengal/ui] useToast() must be used inside <ToastProvider>.',
    );
  }
  return ctx;
}
