/**
 * Project service — project lifecycle management.
 *
 * Orchestrates project creation, updates, deletion, and statistics
 * with authorization checks, git token encryption, and automatic
 * framework-based build configuration.
 *
 * @module services/project
 */

import { prisma } from '@itbengal/database';
import type { Framework } from '@itbengal/database';
import { encrypt } from '@itbengal/utils';

import { appConfig } from '../config/app.js';
import {
  ForbiddenError,
  NotFoundError,
} from '../middleware/errorHandler.js';
import * as projectRepository from '../repositories/project.repository.js';
import { triggerDeployment } from './deployment.service.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Input data for creating a project. */
interface CreateProjectInput {
  name: string;
  description?: string;
  framework: Framework;
  gitRepoUrl?: string;
  gitRepoId?: string;
  gitBranch?: string;
  gitAccessToken?: string;
  buildCommand?: string;
  installCommand?: string;
  outputDirectory?: string;
  nodeVersion?: string;
  rootDirectory?: string;
  zipPath?: string;
}

/** Input data for updating a project. */
interface UpdateProjectInput {
  name?: string;
  description?: string;
  framework?: Framework;
  gitRepoUrl?: string;
  gitRepoId?: string;
  gitBranch?: string;
  gitAccessToken?: string;
  buildCommand?: string;
  installCommand?: string;
  outputDirectory?: string;
  nodeVersion?: string;
  rootDirectory?: string;
  autoDeployEnabled?: boolean;
}

/** Filter options for listing projects. */
interface ListProjectsFilters {
  page: number;
  perPage: number;
  status?: string;
  framework?: string;
  search?: string;
}

/** Framework-specific default build configuration. */
interface FrameworkDefaults {
  buildCommand: string | undefined;
  outputDirectory: string;
}

// ---------------------------------------------------------------------------
// Framework defaults
// ---------------------------------------------------------------------------

/**
 * Default build command and output directory for each framework.
 * Used when the user doesn't provide explicit build configuration.
 */
const FRAMEWORK_DEFAULTS: Record<Framework, FrameworkDefaults> = {
  REACT: { buildCommand: 'npm run build', outputDirectory: 'build' },
  NEXTJS: { buildCommand: 'npm run build', outputDirectory: '.next' },
  VITE: { buildCommand: 'npm run build', outputDirectory: 'dist' },
  REMIX: { buildCommand: 'npm run build', outputDirectory: 'public/build' },
  ASTRO: { buildCommand: 'npm run build', outputDirectory: 'dist' },
  GATSBY: { buildCommand: 'npm run build', outputDirectory: 'public' },
  ANGULAR: { buildCommand: 'npm run build', outputDirectory: 'dist' },
  SVELTE: { buildCommand: 'npm run build', outputDirectory: 'public' },
};

// ---------------------------------------------------------------------------
// Authorization helper
// ---------------------------------------------------------------------------
// Service functions
// ---------------------------------------------------------------------------

/**
 * List all projects for an organization with pagination and filtering.
 *
 * @param userId  - Authenticated user ID.
 * @param orgId   - Organization UUID.
 * @param filters - Pagination and filter options.
 * @returns Paginated project list.
 */
export async function listProjects(
  _userId: string,
  orgId: string,
  filters: ListProjectsFilters,
) {
  return projectRepository.findAllByOrganization(orgId, {
    page: filters.page,
    perPage: filters.perPage,
    status: filters.status as Parameters<typeof projectRepository.findAllByOrganization>[1]['status'],
    framework: filters.framework as Parameters<typeof projectRepository.findAllByOrganization>[1]['framework'],
    search: filters.search,
  });
}

/**
 * Get a project by ID with authorization check.
 *
 * @param userId    - Authenticated user ID.
 * @param orgId     - Organization UUID.
 * @param projectId - Project UUID.
 * @returns The project with applications and latest deployment.
 * @throws NotFoundError if the project doesn't exist.
 * @throws ForbiddenError if the user doesn't belong to the project's org.
 */
export async function getProject(
  _userId: string,
  orgId: string,
  projectId: string,
) {
  const project = await projectRepository.findById(projectId);

  if (!project) {
    throw new NotFoundError('Project not found');
  }

  if (project.organizationId !== orgId) {
    throw new ForbiddenError('You do not have access to this project');
  }

  return project;
}

/**
 * Get a project by slug with authorization check.
 *
 * @param userId - Authenticated user ID.
 * @param orgId  - Organization UUID.
 * @param slug   - Project slug.
 * @returns The project with applications and latest deployment.
 * @throws NotFoundError if the project doesn't exist.
 */
export async function getProjectBySlug(
  _userId: string,
  orgId: string,
  slug: string,
) {
  const project = await projectRepository.findBySlug(orgId, slug);

  if (!project) {
    throw new NotFoundError('Project not found');
  }

  return project;
}

/**
 * Create a new project with automatic build configuration and audit logging.
 *
 * 1. Encrypts the git access token if provided.
 * 2. Auto-detects build command and output directory from framework.
 * 3. Creates the project and application via repository (transactional).
 * 4. Logs the creation in the audit log.
 *
 * @param userId - Authenticated user ID.
 * @param orgId  - Organization UUID.
 * @param data   - Project creation input.
 * @returns The created project with application.
 */
export async function createProject(
  userId: string,
  orgId: string,
  data: CreateProjectInput,
) {
  // Resolve framework defaults
  const defaults = FRAMEWORK_DEFAULTS[data.framework] || { buildCommand: 'npm run build', outputDirectory: 'dist' };
  const buildCommand = data.buildCommand ?? defaults.buildCommand;
  const outputDirectory = data.outputDirectory ?? defaults.outputDirectory;

  // Encrypt git access token if provided
  let encryptedToken: string | undefined;
  if (data.gitAccessToken) {
    encryptedToken = encrypt(data.gitAccessToken, appConfig.encryptionKey);
  }

  // Create project + application in a transaction
  const project = await projectRepository.create({
    organizationId: orgId,
    name: data.name,
    description: data.description,
    framework: data.framework,
    gitProvider: data.gitRepoUrl ? 'GITHUB' : undefined,
    gitRepoUrl: data.gitRepoUrl,
    gitRepoId: data.gitRepoId,
    gitBranch: data.gitBranch,
    gitAccessToken: encryptedToken,
    buildCommand,
    installCommand: data.installCommand ?? 'npm install',
    outputDirectory,
    nodeVersion: data.nodeVersion ?? '20',
    rootDirectory: data.rootDirectory ?? '.',
  });

  // Create audit log
  await prisma.auditLog.create({
    data: {
      userId,
      action: 'CREATE',
      resource: 'Project',
      resourceId: project.id,
      metadata: {
        name: project.name,
        slug: project.slug,
        framework: project.framework,
      },
    },
  });

  // If zipPath is provided, trigger ZIP_UPLOAD deployment immediately
  if (data.zipPath) {
    try {
      await triggerDeployment(userId, project.id, {
        triggerType: 'ZIP_UPLOAD',
        zipPath: data.zipPath,
      });
    } catch (err) {
      console.error('[ProjectService] Failed to trigger ZIP deployment:', err);
    }
  }

  return project;
}

/**
 * Update a project with authorization and optional token encryption.
 *
 * @param userId    - Authenticated user ID.
 * @param orgId     - Organization UUID.
 * @param projectId - Project UUID.
 * @param data      - Fields to update.
 * @returns The updated project.
 * @throws NotFoundError if the project doesn't exist.
 * @throws ForbiddenError if the user doesn't belong to the project's org.
 */
export async function updateProject(
  userId: string,
  orgId: string,
  projectId: string,
  data: UpdateProjectInput,
) {
  const project = await projectRepository.findById(projectId);

  if (!project) {
    throw new NotFoundError('Project not found');
  }

  if (project.organizationId !== orgId) {
    throw new ForbiddenError('You do not have access to this project');
  }

  // Encrypt new git access token if changed
  const updateData: Record<string, unknown> = { ...data };
  if (data.gitAccessToken) {
    updateData['gitAccessToken'] = encrypt(
      data.gitAccessToken,
      appConfig.encryptionKey,
    );
  }

  const updated = await projectRepository.updateById(projectId, updateData);

  // Audit log
  await prisma.auditLog.create({
    data: {
      userId,
      action: 'UPDATE',
      resource: 'Project',
      resourceId: projectId,
      metadata: { fields: Object.keys(data) },
    },
  });

  return updated;
}

/**
 * Soft-delete a project with authorization.
 *
 * @param userId    - Authenticated user ID.
 * @param orgId     - Organization UUID.
 * @param projectId - Project UUID.
 * @returns The soft-deleted project.
 * @throws NotFoundError if the project doesn't exist.
 * @throws ForbiddenError if the user doesn't belong to the project's org.
 */
export async function deleteProject(
  userId: string,
  orgId: string,
  projectId: string,
) {
  const project = await projectRepository.findById(projectId);

  if (!project) {
    throw new NotFoundError('Project not found');
  }

  if (project.organizationId !== orgId) {
    throw new ForbiddenError('You do not have access to this project');
  }

  const deleted = await projectRepository.softDelete(projectId);

  // Audit log
  await prisma.auditLog.create({
    data: {
      userId,
      action: 'DELETE',
      resource: 'Project',
      resourceId: projectId,
      metadata: { name: project.name, slug: project.slug },
    },
  });

  return deleted;
}

/**
 * Get project statistics for the organization dashboard.
 * Returns counts grouped by status and framework.
 *
 * @param orgId - Organization UUID.
 * @returns Status counts and framework counts.
 */
export async function getProjectStats(orgId: string) {
  const [statusCounts, frameworkCounts, totalCount] = await Promise.all([
    prisma.project.groupBy({
      by: ['status'],
      where: { organizationId: orgId, status: { not: 'DELETED' } },
      _count: { id: true },
    }),
    prisma.project.groupBy({
      by: ['framework'],
      where: { organizationId: orgId, status: { not: 'DELETED' } },
      _count: { id: true },
    }),
    prisma.project.count({
      where: { organizationId: orgId, status: { not: 'DELETED' } },
    }),
  ]);

  const byStatus: Record<string, number> = {};
  for (const row of statusCounts) {
    byStatus[row.status] = row._count.id;
  }

  const byFramework: Record<string, number> = {};
  for (const row of frameworkCounts) {
    byFramework[row.framework] = row._count.id;
  }

  return {
    total: totalCount,
    byStatus,
    byFramework,
  };
}

/**
 * Handle a GitHub push webhook event and trigger auto-deployments.
 */
export async function handleGithubWebhook(payload: any): Promise<void> {
  const repoUrl = payload.repository?.html_url;
  const ref = payload.ref;

  if (!repoUrl || !ref) {
    return;
  }

  const branchName = ref.replace('refs/heads/', '');
  const normalizedUrl = repoUrl.toLowerCase().replace(/\.git$/, '');

  // Find all active projects matching this branch with auto-deploy enabled
  const projects = await prisma.project.findMany({
    where: {
      status: 'ACTIVE',
      autoDeployEnabled: true,
      gitBranch: branchName,
    },
    include: {
      applications: true,
    },
  });

  // Filter projects by matching normalized repository URLs
  const matchedProjects = projects.filter((p) => {
    if (!p.gitRepoUrl) return false;
    const projectUrl = p.gitRepoUrl.toLowerCase().replace(/\.git$/, '');
    return projectUrl === normalizedUrl;
  });

  if (matchedProjects.length === 0) {
    return;
  }

  const commitSha = payload.head_commit?.id || null;

  for (const project of matchedProjects) {
    const orgMembers = await prisma.user.findFirst({
      where: { organizationId: project.organizationId },
    });
    const triggerUserId = orgMembers?.id || 'system';

    try {
      await triggerDeployment(triggerUserId, project.id, {
        triggerType: 'GIT_PUSH',
        gitBranch: branchName,
        gitCommitSha: commitSha,
      });
      console.log(`[Webhook] Triggered auto-deployment for project ${project.id} (${project.name})`);
    } catch (err: any) {
      console.error(`[Webhook] Failed to trigger deployment for project ${project.id}:`, err.message);
    }
  }
}
