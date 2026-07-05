/**
 * Project routes.
 * All project CRUD, environment variable, and GitHub integration endpoints.
 * @module routes/v1/project
 */

import { Router } from 'express';

import {
  bulkSetEnvVars,
  createProject,
  deleteEnvVar,
  deleteProject,
  detectFramework,
  getGithubAuthUrl,
  getProject,
  getProjectStats,
  githubCallback,
  listEnvVars,
  listGithubBranches,
  listGithubRepos,
  listProjects,
  setEnvVar,
  updateProject,
  uploadZip,
  githubWebhook,
} from '../../controllers/project.controller.js';
import { authenticate } from '../../middleware/auth.js';
import multer from 'multer';
import os from 'os';

const upload = multer({ dest: os.tmpdir() });
import { pagination } from '../../middleware/pagination.js';
import { validate } from '../../middleware/validator.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import {
  bulkSetEnvVarsSchema,
  createProjectSchema,
  projectIdParamSchema,
  setEnvVarSchema,
  updateProjectSchema,
} from '../../validators/project.validator.js';

const router = Router();

/**
 * POST /api/v1/projects/github/webhook
 * Public webhook endpoint for GitHub push events.
 */
router.post('/github/webhook', asyncHandler(githubWebhook));

// All project routes require authentication
router.use(authenticate);

// ─── GitHub Integration ──────────────────────────────────────────────────────
// These must come before /:projectId to avoid path conflicts

/**
 * POST /api/v1/projects/upload-zip
 * Upload a static/React project ZIP archive.
 */
router.post('/upload-zip', upload.single('file'), asyncHandler(uploadZip));

/**
 * GET /api/v1/projects/github/authorize
 * Generate a GitHub OAuth authorization URL.
 */
router.get('/github/authorize', asyncHandler(getGithubAuthUrl));

/**
 * GET /api/v1/projects/github/callback
 * Handle the GitHub OAuth callback.
 */
router.get('/github/callback', asyncHandler(githubCallback));

/**
 * GET /api/v1/projects/github/repos
 * List the user's GitHub repositories.
 */
router.get('/github/repos', asyncHandler(listGithubRepos));

/**
 * GET /api/v1/projects/github/repos/:owner/:repo/branches
 * List branches for a GitHub repository.
 */
router.get('/github/repos/:owner/:repo/branches', asyncHandler(listGithubBranches));

/**
 * GET /api/v1/projects/github/repos/:owner/:repo/detect
 * Detect the framework used in a GitHub repository.
 */
router.get('/github/repos/:owner/:repo/detect', asyncHandler(detectFramework));

// ─── Project Statistics ──────────────────────────────────────────────────────

/**
 * GET /api/v1/projects/stats
 * Get project statistics for the organization dashboard.
 */
router.get('/stats', asyncHandler(getProjectStats));

// ─── Project CRUD ────────────────────────────────────────────────────────────

/**
 * GET /api/v1/projects
 * List all projects with pagination and filtering.
 */
router.get('/', pagination, asyncHandler(listProjects));

/**
 * POST /api/v1/projects
 * Create a new project.
 */
router.post(
  '/',
  validate(createProjectSchema),
  asyncHandler(createProject),
);

/**
 * GET /api/v1/projects/:projectId
 * Get a single project by ID.
 */
router.get(
  '/:projectId',
  validate(projectIdParamSchema, 'params'),
  asyncHandler(getProject),
);

/**
 * PATCH /api/v1/projects/:projectId
 * Update an existing project.
 */
router.patch(
  '/:projectId',
  validate(projectIdParamSchema, 'params'),
  validate(updateProjectSchema),
  asyncHandler(updateProject),
);

/**
 * DELETE /api/v1/projects/:projectId
 * Soft-delete a project.
 */
router.delete(
  '/:projectId',
  validate(projectIdParamSchema, 'params'),
  asyncHandler(deleteProject),
);

// ─── Environment Variables ───────────────────────────────────────────────────

/**
 * GET /api/v1/projects/:projectId/env
 * List all environment variables for a project (masked values).
 */
router.get('/:projectId/env', asyncHandler(listEnvVars));

/**
 * POST /api/v1/projects/:projectId/env
 * Set a single environment variable.
 */
router.post(
  '/:projectId/env',
  validate(setEnvVarSchema),
  asyncHandler(setEnvVar),
);

/**
 * POST /api/v1/projects/:projectId/env/bulk
 * Bulk set multiple environment variables.
 */
router.post(
  '/:projectId/env/bulk',
  validate(bulkSetEnvVarsSchema),
  asyncHandler(bulkSetEnvVars),
);

/**
 * DELETE /api/v1/projects/:projectId/env/:envVarId
 * Delete a single environment variable.
 */
router.delete('/:projectId/env/:envVarId', asyncHandler(deleteEnvVar));

export default router;
