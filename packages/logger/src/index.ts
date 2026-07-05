/**
 * @itbengal/logger — Structured logging with Winston.
 *
 * Provides a factory function to create service-scoped loggers with
 * console and optional Loki transports. In development, logs are
 * colourised for readability; in production, they emit JSON.
 *
 * @module @itbengal/logger
 */

import winston from 'winston';
import type { Logger } from 'winston';
import LokiTransport from 'winston-loki';

/**
 * Options accepted by {@link createLogger}.
 */
export interface LoggerOptions {
  /** Name of the service producing logs (e.g. "api", "deploy-worker"). */
  service: string;
  /** Minimum log level. Defaults to "info" in production, "debug" in development. */
  level?: string;
  /** Grafana Loki push URL. When provided, logs are also shipped to Loki. */
  lokiUrl?: string;
}

/**
 * Detect whether the process is running in production.
 */
function isProduction(): boolean {
  return process.env['NODE_ENV'] === 'production';
}

/**
 * Create a structured Winston logger for a specific service.
 *
 * - **Development**: Colourised, human-readable console output.
 * - **Production**: JSON-formatted console output for log aggregators.
 * - **Optional**: Loki transport for Grafana log aggregation.
 *
 * @param options - Logger configuration.
 * @returns A configured Winston {@link Logger} instance.
 *
 * @example
 * ```ts
 * import { createLogger } from '@itbengal/logger';
 *
 * const logger = createLogger({ service: 'api' });
 * logger.info('Server started', { port: 3000 });
 * ```
 */
export function createLogger(options: LoggerOptions): Logger {
  const { service, level, lokiUrl } = options;
  const prod = isProduction();

  const defaultLevel = level ?? (prod ? 'info' : 'debug');

  // ─── Formats ─────────────────────────────────────────────────────────

  /** Base format: attach timestamp and service name. */
  const baseFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
    winston.format.errors({ stack: true }),
    winston.format((info) => {
      info['service'] = service;
      return info;
    })(),
  );

  /** Console format for development: colourised, aligned, human-readable. */
  const devConsoleFormat = winston.format.combine(
    baseFormat,
    winston.format.colorize({ all: true }),
    winston.format.printf(({ timestamp, level: lvl, message, service: svc, ...meta }) => {
      const metaStr = Object.keys(meta).length > 0
        ? ` ${JSON.stringify(meta)}`
        : '';
      return `${String(timestamp)} [${String(svc)}] ${lvl}: ${String(message)}${metaStr}`;
    }),
  );

  /** Console format for production: structured JSON. */
  const prodConsoleFormat = winston.format.combine(
    baseFormat,
    winston.format.json(),
  );

  // ─── Transports ──────────────────────────────────────────────────────

  const transports: winston.transport[] = [
    new winston.transports.Console({
      format: prod ? prodConsoleFormat : devConsoleFormat,
    }),
  ];

  // Optional Loki transport
  if (lokiUrl) {
    transports.push(
      new LokiTransport({
        host: lokiUrl,
        labels: { service },
        json: true,
        format: winston.format.combine(
          baseFormat,
          winston.format.json(),
        ),
        onConnectionError: (err: unknown) => {
          // eslint-disable-next-line no-console
          console.error('[Logger] Loki connection error:', err);
        },
      }),
    );
  }

  // ─── Logger Instance ─────────────────────────────────────────────────

  return winston.createLogger({
    level: defaultLevel,
    transports,
    // Do not exit on uncaught exceptions — let the process manager handle it.
    exitOnError: false,
  });
}

/**
 * Create a child logger that inherits configuration from a parent
 * but includes additional default metadata (e.g. a request ID).
 *
 * Useful for request-scoped logging where every log line should
 * carry the request's correlation ID.
 *
 * @param parent   - The parent {@link Logger} to derive from.
 * @param metadata - Default metadata to attach to every log entry.
 * @returns A child {@link Logger} instance.
 *
 * @example
 * ```ts
 * const requestLogger = createChildLogger(logger, { requestId: 'abc-123' });
 * requestLogger.info('Processing request'); // includes requestId automatically
 * ```
 */
export function createChildLogger(
  parent: Logger,
  metadata: Record<string, unknown>,
): Logger {
  return parent.child(metadata);
}

// Re-export the Winston Logger type for consumers who need to type-hint.
export type { Logger } from 'winston';
