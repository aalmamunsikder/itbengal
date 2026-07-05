/**
 * Deployment validators — Zod schemas for deployment endpoints.
 *
 * Provides request body and params validation for all deployment-related routes.
 * Used with the `validate` middleware to enforce type-safe inputs.
 *
 * @module validators/deployment
 */

import { z } from 'zod';

// ---------------------------------------------------------------------------
// Schemas
// ---------------------------------------------------------------------------

/**
 * Schema for triggering a new deployment.
 *
 * Both fields are optional — defaults are pulled from the project configuration.
 *
 * @example
 * ```json
 * { "gitBranch": "develop", "gitCommitSha": "abc1234" }
 * ```
 */
export const triggerDeploymentSchema = z.object({
  gitBranch: z
    .string()
    .trim()
    .max(255, 'Branch name must be at most 255 characters')
    .optional(),
  gitCommitSha: z
    .string()
    .trim()
    .regex(
      /^[0-9a-f]{7,40}$/i,
      'Commit SHA must be 7-40 hexadecimal characters',
    )
    .optional(),
});

/**
 * Schema for the deploymentId URL parameter.
 */
export const deploymentIdParamSchema = z.object({
  deploymentId: z.string().uuid('Deployment ID must be a valid UUID'),
});

// ---------------------------------------------------------------------------
// Inferred types
// ---------------------------------------------------------------------------

export type TriggerDeploymentInput = z.infer<typeof triggerDeploymentSchema>;
