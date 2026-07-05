/**
 * Request validation middleware using Zod schemas.
 * Provides a factory that validates body, query, or params against a schema,
 * returning structured 400 errors on failure.
 * @module middleware/validator
 */

import type { NextFunction, Request, Response } from 'express';
import type { ZodSchema, ZodError } from 'zod';

import { ValidationError } from './errorHandler.js';

/** Supported request data sources for validation */
type ValidationSource = 'body' | 'query' | 'params';

/**
 * Formats Zod validation issues into a client-friendly structure.
 */
function formatZodErrors(
  error: ZodError,
): Array<{ field: string; message: string }> {
  return error.issues.map((issue) => ({
    field: issue.path.join('.'),
    message: issue.message,
  }));
}

/**
 * Creates a validation middleware for a given Zod schema and data source.
 *
 * @param schema - The Zod schema to validate against
 * @param source - Which part of the request to validate ('body', 'query', or 'params')
 * @returns Express middleware that validates and replaces the source data with parsed output
 *
 * @example
 * ```ts
 * const createUserSchema = z.object({
 *   email: z.string().email(),
 *   password: z.string().min(8),
 * });
 *
 * router.post('/users', validate(createUserSchema, 'body'), handler);
 * ```
 */
export function validate(schema: ZodSchema, source: ValidationSource = 'body') {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req[source]);

    if (!result.success) {
      const errors = formatZodErrors(result.error);
      next(
        new ValidationError(
          `Validation failed for request ${source}`,
          errors,
        ),
      );
      return;
    }

    // Replace with parsed (coerced, defaulted, stripped) data
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    req[source] = result.data;
    next();
  };
}
