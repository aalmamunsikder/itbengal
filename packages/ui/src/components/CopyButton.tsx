'use client';

import { useState } from 'react';
import type { ReactNode } from 'react';
import { Check, Copy } from 'lucide-react';
import { cn } from '../utils';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface CopyButtonProps {
  /** The text content to copy to clipboard */
  text: string;
  /** Optional label shown next to the icon */
  label?: string;
  /** Additional CSS classes */
  className?: string;
  /** Optional children to use instead of default icon */
  children?: ReactNode;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

/**
 * A button that copies text to the clipboard and shows a brief
 * "Copied!" confirmation with a check icon.
 *
 * @example
 * ```tsx
 * <CopyButton text="npm install @itbengal/ui" label="Copy" />
 * ```
 */
export function CopyButton({
  text,
  label,
  className,
  children,
}: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-md px-2 py-1.5',
        'text-xs font-medium transition-all duration-200',
        copied
          ? 'text-emerald-600 dark:text-emerald-400'
          : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-700',
        className,
      )}
      aria-label={copied ? 'Copied' : `Copy${label ? `: ${label}` : ''}`}
    >
      {children ?? (
        <>
          {copied ? <Check size={14} /> : <Copy size={14} />}
          {label && <span>{copied ? 'Copied!' : label}</span>}
          {!label && copied && <span>Copied!</span>}
        </>
      )}
    </button>
  );
}

CopyButton.displayName = 'CopyButton';
