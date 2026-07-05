'use client';

import { useEffect, useRef, useCallback } from 'react';
import type { HTMLAttributes, ReactNode, MouseEvent } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cn } from '../utils';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | 'full';

export interface ModalProps {
  /** Whether the modal is visible */
  isOpen: boolean;
  /** Called when the modal should close */
  onClose: () => void;
  /** Modal title shown in the header */
  title?: string;
  /** Optional description below the title */
  description?: string;
  /** Size preset for max-width */
  size?: ModalSize;
  /** Show the ✕ close button in the header */
  showCloseButton?: boolean;
  /** Modal content — use Modal.Header / Body / Footer for structure */
  children: ReactNode;
}

export interface ModalSectionProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

/* ------------------------------------------------------------------ */
/*  Size map                                                           */
/* ------------------------------------------------------------------ */

const SIZE_CLASSES: Record<ModalSize, string> = {
  sm: 'max-w-sm',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
  full: 'max-w-[calc(100vw-2rem)] max-h-[calc(100vh-2rem)]',
};

/* ------------------------------------------------------------------ */
/*  Modal root                                                         */
/* ------------------------------------------------------------------ */

/**
 * An accessible modal dialog with backdrop blur, keyboard support,
 * basic focus trapping, and portal rendering.
 *
 * Uses compound components: `Modal.Header`, `Modal.Body`, `Modal.Footer`.
 *
 * @example
 * ```tsx
 * <Modal isOpen={open} onClose={() => setOpen(false)} title="Confirm">
 *   <Modal.Body>Are you sure?</Modal.Body>
 *   <Modal.Footer>
 *     <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
 *     <Button variant="danger" onClick={handleDelete}>Delete</Button>
 *   </Modal.Footer>
 * </Modal>
 * ```
 */
function ModalRoot({
  isOpen,
  onClose,
  title,
  description,
  size = 'md',
  showCloseButton = true,
  children,
}: ModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  /* ----- Escape key ----- */
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      }

      // Basic focus trap
      if (e.key === 'Tab' && dialogRef.current) {
        const focusableElements = dialogRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])',
        );
        if (focusableElements.length === 0) return;

        const first = focusableElements[0]!;
        const last = focusableElements[focusableElements.length - 1]!;

        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    },
    [onClose],
  );

  useEffect(() => {
    if (!isOpen) return;

    // Save and restore focus
    previousActiveElement.current = document.activeElement as HTMLElement;
    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    // Focus the dialog
    requestAnimationFrame(() => {
      dialogRef.current?.focus();
    });

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
      previousActiveElement.current?.focus();
    };
  }, [isOpen, handleKeyDown]);

  /* ----- Backdrop click ----- */
  const handleBackdropClick = (e: MouseEvent) => {
    if (e.target === overlayRef.current) {
      onClose();
    }
  };

  if (!isOpen) return null;

  const modal = (
    <div
      ref={overlayRef}
      role="presentation"
      onClick={handleBackdropClick}
      className={cn(
        'fixed inset-0 z-50 flex items-center justify-center p-4',
        'bg-black/50 backdrop-blur-sm',
        // Fade-in
        'animate-in fade-in duration-200',
      )}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        aria-describedby={description ? 'modal-description' : undefined}
        tabIndex={-1}
        className={cn(
          'relative w-full rounded-xl bg-white shadow-2xl',
          'dark:bg-gray-800 dark:shadow-black/40',
          'outline-none',
          // Animate in
          'animate-in zoom-in-95 fade-in duration-200',
          SIZE_CLASSES[size],
        )}
      >
        {/* Default header with title/description */}
        {(title || showCloseButton) && (
          <div className="flex items-start justify-between gap-4 px-6 pt-6 pb-2">
            <div className="flex-1 min-w-0">
              {title && (
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {title}
                </h2>
              )}
              {description && (
                <p
                  id="modal-description"
                  className="mt-1 text-sm text-gray-500 dark:text-gray-400"
                >
                  {description}
                </p>
              )}
            </div>
            {showCloseButton && (
              <button
                type="button"
                onClick={onClose}
                className={cn(
                  'shrink-0 rounded-lg p-1.5',
                  'text-gray-400 hover:text-gray-600 hover:bg-gray-100',
                  'dark:hover:text-gray-300 dark:hover:bg-gray-700',
                  'transition-colors duration-150',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500',
                )}
                aria-label="Close modal"
              >
                <X size={18} />
              </button>
            )}
          </div>
        )}

        {children}
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}

/* ------------------------------------------------------------------ */
/*  Sub-components                                                     */
/* ------------------------------------------------------------------ */

function ModalHeader({ children, className, ...props }: ModalSectionProps) {
  return (
    <div
      className={cn('px-6 pt-6 pb-2', className)}
      {...props}
    >
      {children}
    </div>
  );
}
ModalHeader.displayName = 'Modal.Header';

function ModalBody({ children, className, ...props }: ModalSectionProps) {
  return (
    <div
      className={cn('px-6 py-4 overflow-y-auto', className)}
      {...props}
    >
      {children}
    </div>
  );
}
ModalBody.displayName = 'Modal.Body';

function ModalFooter({ children, className, ...props }: ModalSectionProps) {
  return (
    <div
      className={cn(
        'px-6 py-4 flex items-center justify-end gap-3',
        'border-t border-gray-100 dark:border-gray-700',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
ModalFooter.displayName = 'Modal.Footer';

/* ------------------------------------------------------------------ */
/*  Compound export                                                    */
/* ------------------------------------------------------------------ */

/** Modal compound component with `.Header`, `.Body`, and `.Footer` sub-components */
export const Modal = Object.assign(ModalRoot, {
  Header: ModalHeader,
  Body: ModalBody,
  Footer: ModalFooter,
});

Modal.displayName = 'Modal';
