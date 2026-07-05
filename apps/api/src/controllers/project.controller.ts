/**
 * Project controller.
 * Handles project CRUD, environment variable management, and GitHub integration endpoints.
 * @module controllers/project
 */

import crypto from 'node:crypto';

import type { Request, Response } from 'express';

import * as envVarService from '../services/env-var.service.js';
import * as githubService from '../services/github.service.js';
import * as projectService from '../services/project.service.js';
import { sendPaginated, sendSuccess } from '../utils/apiResponse.js';

// ---------------------------------------------------------------------------
// Project CRUD
// ---------------------------------------------------------------------------

/**
 * GET /api/v1/projects
 * List all projects for the authenticated user's organization.
 */
export async function listProjects(
  req: Request,
  res: Response,
): Promise<void> {
  const { userId, organizationId } = req.user!;
  
  const page = parseInt(req.query.page as string || '1', 10);
  const perPage = parseInt(req.query.perPage as string || '10', 10);
  const status = req.query.status as any;
  const framework = req.query.framework as any;
  const search = req.query.search as string | undefined;

  const result = await projectService.listProjects(userId, organizationId!, {
    page,
    perPage,
    status,
    framework,
    search,
  });

  sendPaginated(
    res,
    result.data,
    result.total,
    page,
    perPage,
    'Projects retrieved',
  );
}

/**
 * GET /api/v1/projects/:projectId
 * Get a single project by ID.
 */
export async function getProject(
  req: Request,
  res: Response,
): Promise<void> {
  const { userId, organizationId } = req.user!;
  const project = await projectService.getProject(userId, organizationId!, req.params.projectId as string);

  sendSuccess(res, { project }, 'Project retrieved');
}

/**
 * POST /api/v1/projects
 * Create a new project.
 */
export async function createProject(
  req: Request,
  res: Response,
): Promise<void> {
  const { userId, organizationId } = req.user!;
  const project = await projectService.createProject(userId, organizationId!, req.body);

  sendSuccess(res, { project }, 'Project created', 201);
}

/**
 * PATCH /api/v1/projects/:projectId
 * Update an existing project.
 */
export async function updateProject(
  req: Request,
  res: Response,
): Promise<void> {
  const { userId, organizationId } = req.user!;
  const project = await projectService.updateProject(userId, organizationId!, req.params.projectId as string, req.body);

  sendSuccess(res, { project }, 'Project updated');
}

/**
 * DELETE /api/v1/projects/:projectId
 * Soft-delete a project.
 */
export async function deleteProject(
  req: Request,
  res: Response,
): Promise<void> {
  const { userId, organizationId } = req.user!;
  await projectService.deleteProject(userId, organizationId!, req.params.projectId as string);

  sendSuccess(res, null, 'Project deleted');
}

/**
 * GET /api/v1/projects/stats
 * Get project statistics for the organization dashboard.
 */
export async function getProjectStats(
  req: Request,
  res: Response,
): Promise<void> {
  const { organizationId } = req.user!;
  const stats = await projectService.getProjectStats(organizationId!);

  sendSuccess(res, { stats }, 'Project statistics retrieved');
}

// ---------------------------------------------------------------------------
// Environment Variables
// ---------------------------------------------------------------------------

/**
 * GET /api/v1/projects/:projectId/env
 * List all environment variables for a project (values are masked).
 */
export async function listEnvVars(
  req: Request,
  res: Response,
): Promise<void> {
  const envVars = await envVarService.listEnvVars(
    req.params.projectId as string,
    req.query.target as string | undefined,
  );

  sendSuccess(res, { envVars }, 'Environment variables retrieved');
}

/**
 * POST /api/v1/projects/:projectId/env
 * Set a single environment variable.
 */
export async function setEnvVar(
  req: Request,
  res: Response,
): Promise<void> {
  const envVar = await envVarService.setEnvVar(
    req.params.projectId as string,
    req.body.key,
    req.body.value,
    req.body.target,
  );

  sendSuccess(res, { envVar }, 'Environment variable set', 201);
}

/**
 * POST /api/v1/projects/:projectId/env/bulk
 * Bulk set multiple environment variables.
 */
export async function bulkSetEnvVars(
  req: Request,
  res: Response,
): Promise<void> {
  const envVars = await envVarService.bulkSetEnvVars(
    req.params.projectId as string,
    req.body.variables,
  );

  sendSuccess(res, { envVars }, 'Environment variables set');
}

/**
 * DELETE /api/v1/projects/:projectId/env/:envVarId
 * Delete a single environment variable.
 */
export async function deleteEnvVar(
  req: Request,
  res: Response,
): Promise<void> {
  await envVarService.deleteEnvVar(req.params.envVarId as string);

  sendSuccess(res, null, 'Environment variable deleted');
}

// ---------------------------------------------------------------------------
// GitHub Integration
// ---------------------------------------------------------------------------

/**
 * GET /api/v1/projects/github/authorize
 * Generate a GitHub OAuth authorization URL with CSRF state token.
 */
export async function getGithubAuthUrl(
  _req: Request,
  res: Response,
): Promise<void> {
  const state = crypto.randomBytes(32).toString('hex');
  const url = githubService.getAuthorizationUrl(state);

  sendSuccess(res, { url, state }, 'GitHub authorization URL generated');
}

/**
 * GET /api/v1/projects/github/callback
 * Exchange a GitHub OAuth authorization code for an access token.
 */
export async function githubCallback(
  req: Request,
  res: Response,
): Promise<void> {
  const accessToken = await githubService.exchangeCode(req.query.code as string);

  sendSuccess(res, { accessToken }, 'GitHub authorization successful');
}

/**
 * GET /api/v1/projects/github/repos
 * List the authenticated user's GitHub repositories.
 */
export async function listGithubRepos(
  req: Request,
  res: Response,
): Promise<void> {
  const token =
    (req.query.accessToken as string | undefined) ??
    (req.headers['x-github-token'] as string | undefined);

  const repos = await githubService.listRepositories(token!, req.query as Record<string, string>);

  sendSuccess(res, { repos }, 'GitHub repositories retrieved');
}

/**
 * GET /api/v1/projects/github/repos/:owner/:repo/branches
 * List branches for a specific GitHub repository.
 */
export async function listGithubBranches(
  req: Request,
  res: Response,
): Promise<void> {
  const token =
    (req.query.accessToken as string | undefined) ??
    (req.headers['x-github-token'] as string | undefined);

  const branches = await githubService.listBranches(
    token!,
    req.params.owner as string,
    req.params.repo as string,
  );

  sendSuccess(res, { branches }, 'GitHub branches retrieved');
}

/**
 * GET /api/v1/projects/github/repos/:owner/:repo/detect
 * Detect the framework used in a GitHub repository.
 */
export async function detectFramework(
  req: Request,
  res: Response,
): Promise<void> {
  const token =
    (req.query.accessToken as string | undefined) ??
    (req.headers['x-github-token'] as string | undefined);

  const framework = await githubService.detectFramework(
    token!,
    req.params.owner as string,
    req.params.repo as string,
    req.query.branch as string | undefined,
  );

  sendSuccess(res, { framework }, 'Framework detected');
}

/**
 * POST /api/v1/projects/upload-zip
 * Upload a static/React project ZIP file.
 */
export async function uploadZip(
  req: Request,
  res: Response,
): Promise<void> {
  if (!req.file) {
    throw new Error('No file uploaded');
  }

  sendSuccess(res, { zipPath: req.file.path }, 'ZIP file uploaded successfully', 201);
}

/**
 * POST /api/v1/projects/github/webhook
 * Public webhook endpoint for GitHub push events.
 */
export async function githubWebhook(
  req: Request,
  res: Response,
): Promise<void> {
  // Process webhook payload asynchronously so that GitHub gets a fast 200 response
  projectService.handleGithubWebhook(req.body).catch((err) => {
    console.error('[Webhook] Error handling webhook payload:', err);
  });

  // Fast response to GitHub
  sendSuccess(res, null, 'Webhook payload received', 200);
}
