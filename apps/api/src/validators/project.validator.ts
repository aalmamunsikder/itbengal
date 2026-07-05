/**
 * Project validators — Zod schemas for project and environment variable endpoints.
 *
 * Provides request body, query, and params validation for all project-related routes.
 * Used with the `validate` middleware to enforce type-safe inputs.
 *
 * @module validators/project
 */

import { z } from 'zod';

// ---------------------------------------------------------------------------
// Shared constants
// ---------------------------------------------------------------------------

/** Valid project framework values matching the Prisma ProjectFramework enum. */
const FRAMEWORK_VALUES = [
  'REACT',
  'NEXTJS',
  'VUE',
  'ANGULAR',
  'SVELTE',
  'ASTRO',
  'VITE',
  'STATIC_HTML',
] as const;

/** Valid environment variable target values. */
const ENV_TARGET_VALUES = ['PRODUCTION', 'PREVIEW', 'ALL'] as const;

// ---------------------------------------------------------------------------
// Project schemas
// ---------------------------------------------------------------------------

/**
 * Schema for creating a new project.
 *
 * @example
 * ```json
 * {
 *   "name": "My Website",
 *   "framework": "NEXTJS",
 *   "gitRepoUrl": "https://github.com/user/repo"
 * }
 * ```
 */
export const createProjectSchema = z.object({
  name: z
    .string({ required_error: 'Project name is required' })
    .trim()
    .min(2, 'Project name must be at least 2 characters')
    .max(100, 'Project name must be at most 100 characters'),
  description: z
    .string()
    .trim()
    .max(500, 'Description must be at most 500 characters')
    .optional(),
  framework: z.enum(FRAMEWORK_VALUES, {
    required_error: 'Framework is required',
    invalid_type_error: `Framework must be one of: ${FRAMEWORK_VALUES.join(', ')}`,
  }),
  gitRepoUrl: z
    .string()
    .url('Git repository URL must be a valid URL')
    .optional(),
  gitRepoId: z
    .string()
    .optional(),
  gitBranch: z
    .string()
    .trim()
    .max(255, 'Branch name must be at most 255 characters')
    .optional(),
  buildCommand: z
    .string()
    .trim()
    .max(500, 'Build command must be at most 500 characters')
    .optional(),
  installCommand: z
    .string()
    .trim()
    .max(500, 'Install command must be at most 500 characters')
    .default('npm install'),
  outputDirectory: z
    .string()
    .trim()
    .max(255, 'Output directory must be at most 255 characters')
    .optional(),
  nodeVersion: z
    .string()
    .trim()
    .max(20, 'Node version must be at most 20 characters')
    .default('20'),
  rootDirectory: z
    .string()
    .trim()
    .max(255, 'Root directory must be at most 255 characters')
    .default('.'),
});

/**
 * Schema for updating an existing project.
 * All fields from create are optional, plus autoDeployEnabled.
 */
export const updateProjectSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Project name must be at least 2 characters')
    .max(100, 'Project name must be at most 100 characters')
    .optional(),
  description: z
    .string()
    .trim()
    .max(500, 'Description must be at most 500 characters')
    .optional(),
  framework: z.enum(FRAMEWORK_VALUES).optional(),
  gitRepoUrl: z
    .string()
    .url('Git repository URL must be a valid URL')
    .optional(),
  gitRepoId: z
    .string()
    .optional(),
  gitBranch: z
    .string()
    .trim()
    .max(255, 'Branch name must be at most 255 characters')
    .optional(),
  gitAccessToken: z
    .string()
    .optional(),
  buildCommand: z
    .string()
    .trim()
    .max(500, 'Build command must be at most 500 characters')
    .optional(),
  installCommand: z
    .string()
    .trim()
    .max(500, 'Install command must be at most 500 characters')
    .optional(),
  outputDirectory: z
    .string()
    .trim()
    .max(255, 'Output directory must be at most 255 characters')
    .optional(),
  nodeVersion: z
    .string()
    .trim()
    .max(20, 'Node version must be at most 20 characters')
    .optional(),
  rootDirectory: z
    .string()
    .trim()
    .max(255, 'Root directory must be at most 255 characters')
    .optional(),
  autoDeployEnabled: z
    .boolean()
    .optional(),
});

/**
 * Schema for setting a single environment variable.
 *
 * Key must be uppercase, alphanumeric with underscores (e.g. `DATABASE_URL`).
 */
export const setEnvVarSchema = z.object({
  key: z
    .string({ required_error: 'Environment variable key is required' })
    .trim()
    .min(1, 'Key must not be empty')
    .max(100, 'Key must be at most 100 characters')
    .regex(
      /^[A-Z][A-Z0-9_]*$/,
      'Key must be uppercase, alphanumeric with underscores, and start with a letter',
    ),
  value: z
    .string({ required_error: 'Environment variable value is required' }),
  target: z.enum(ENV_TARGET_VALUES, {
    required_error: 'Target is required',
    invalid_type_error: `Target must be one of: ${ENV_TARGET_VALUES.join(', ')}`,
  }),
});

/**
 * Schema for bulk-setting environment variables.
 */
export const bulkSetEnvVarsSchema = z.object({
  variables: z
    .array(
      z.object({
        key: z
          .string({ required_error: 'Key is required' })
          .trim()
          .min(1, 'Key must not be empty')
          .max(100, 'Key must be at most 100 characters')
          .regex(
            /^[A-Z][A-Z0-9_]*$/,
            'Key must be uppercase, alphanumeric with underscores, and start with a letter',
          ),
        value: z.string({ required_error: 'Value is required' }),
        target: z.enum(ENV_TARGET_VALUES),
      }),
    )
    .min(1, 'At least one variable is required')
    .max(50, 'At most 50 variables per request'),
});

/**
 * Schema for the projectId URL parameter.
 */
export const projectIdParamSchema = z.object({
  projectId: z.string().uuid('Project ID must be a valid UUID'),
});

// ---------------------------------------------------------------------------
// Inferred types
// ---------------------------------------------------------------------------

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
export type SetEnvVarInput = z.infer<typeof setEnvVarSchema>;
export type BulkSetEnvVarsInput = z.infer<typeof bulkSetEnvVarsSchema>;
