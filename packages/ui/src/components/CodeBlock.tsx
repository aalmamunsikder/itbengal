'use client';

import { useEffect, useRef } from 'react';
import { cn } from '../utils';
import { CopyButton } from './CopyButton';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export type CodeLineType = 'info' | 'error' | 'warn' | 'success' | 'system';

export interface CodeLine {
  /** The text content of the line */
  text: string;
  /** Semantic type controlling text color */
  type: CodeLineType;
}

export interface CodeBlockProps {
  /** Array of terminal output lines */
  lines: CodeLine[];
  /** Title shown in the top bar (e.g. "Deploy Log") */
  title?: string;
  /** When true, auto-scrolls to the bottom as lines are added */
  isLive?: boolean;
  /** Show line numbers in the gutter */
  showLineNumbers?: boolean;
  /** Additional CSS classes */
  className?: string;
}

/* ------------------------------------------------------------------ */
/*  Color map                                                          */
/* ------------------------------------------------------------------ */

const LINE_COLORS: Record<CodeLineType, string> = {
  info: 'text-gray-300',
  error: 'text-red-400',
  warn: 'text-amber-400',
  success: 'text-emerald-400',
  system: 'text-primary-400',
};

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

/**
 * A terminal/code-block style component for displaying log output,
 * CLI commands, or deployment streams.
 *
 * @example
 * ```tsx
 * <CodeBlock
 *   title="Deploy Log"
 *   isLive
 *   showLineNumbers
 *   lines={[
 *     { text: '$ npm run build', type: 'system' },
 *     { text: 'Building project...', type: 'info' },
 *     { text: 'Build succeeded', type: 'success' },
 *   ]}
 * />
 * ```
 */
export function CodeBlock({
  lines,
  title,
  isLive = false,
  showLineNumbers = false,
  className,
}: CodeBlockProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom in live mode
  useEffect(() => {
    if (isLive && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [lines, isLive]);

  const fullText = lines.map((l) => l.text).join('\n');
  const gutterWidth = showLineNumbers ? String(lines.length).length : 0;

  return (
    <div
      className={cn(
        'rounded-xl overflow-hidden border border-gray-700',
        'bg-gray-900 dark:bg-gray-950',
        'shadow-lg',
        className,
      )}
    >
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-800/80 border-b border-gray-700">
        <div className="flex items-center gap-2">
          {/* Traffic light dots */}
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500/80" />
            <div className="w-3 h-3 rounded-full bg-amber-500/80" />
            <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
          </div>
          {title && (
            <span className="ml-2 text-xs font-medium text-gray-400">
              {title}
            </span>
          )}
          {isLive && (
            <span className="flex items-center gap-1 ml-2">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] uppercase font-semibold text-emerald-500">
                Live
              </span>
            </span>
          )}
        </div>
        <CopyButton text={fullText} className="text-gray-500 hover:text-gray-300" />
      </div>

      {/* Code area */}
      <div
        ref={scrollRef}
        className="overflow-y-auto max-h-96 p-4 font-mono text-sm leading-relaxed"
      >
        {lines.length === 0 ? (
          <span className="text-gray-600 italic">No output yet...</span>
        ) : (
          lines.map((line, idx) => (
            <div key={idx} className="flex">
              {showLineNumbers && (
                <span
                  className="select-none pr-4 text-right text-gray-600 shrink-0"
                  style={{ minWidth: `${gutterWidth + 1}ch` }}
                >
                  {idx + 1}
                </span>
              )}
              <span className={cn('whitespace-pre-wrap break-all', LINE_COLORS[line.type])}>
                {line.text}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

CodeBlock.displayName = 'CodeBlock';
