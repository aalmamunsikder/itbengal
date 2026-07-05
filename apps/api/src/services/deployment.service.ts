/**
 * Deployment service — deployment orchestration and lifecycle management.
 *
 * Triggers deployments by creating records and enqueuing BullMQ jobs,
 * handles cancellation and rollback, and provides log access.
 * Status updates and log additions are also exposed for the worker.
 *
 * @module services/deployment
 */

import { prisma } from '@itbengal/database';
import type { DeploymentStatus, LogLevel, LogSource } from '@itbengal/database';

import { NotFoundError, ValidationError } from '../middleware/errorHandler.js';
import * as deploymentRepository from '../repositories/deployment.repository.js';
import * as projectRepository from '../repositories/project.repository.js';
import { addDeploymentJob } from '../jobs/deployment.job.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Options for triggering a deployment. */
interface TriggerDeploymentOptions {
  gitBranch?: string;
  gitCommitSha?: string;
  triggerType?: 'GIT_PUSH' | 'MANUAL' | 'ROLLBACK' | 'ZIP_UPLOAD' | 'WEBHOOK';
  zipPath?: string;
}

/** Filter options for listing deployments. */
interface ListDeploymentsFilters {
  page: number;
  perPage: number;
  status?: string;
}

/** Options for retrieving deployment logs. */
interface GetLogsOptions {
  limit?: number;
  after?: Date;
}

/** Extra fields passed when updating deployment status. */
interface StatusUpdateExtras {
  errorMessage?: string;
  buildDurationMs?: number;
  deployDurationMs?: number;
  imageTag?: string;
}

// ---------------------------------------------------------------------------
// Service functions
// ---------------------------------------------------------------------------

/**
 * List all deployments for a project with pagination.
 *
 * @param projectId - Project UUID.
 * @param filters   - Pagination and filter options.
 * @returns Paginated deployment list.
 */
export async function listDeployments(
  projectId: string,
  filters: ListDeploymentsFilters,
) {
  return deploymentRepository.findAllByProject(projectId, {
    page: filters.page,
    perPage: filters.perPage,
    status: filters.status as Parameters<typeof deploymentRepository.findAllByProject>[1]['status'],
  });
}

/**
 * Get a single deployment by ID with logs.
 *
 * @param deploymentId - Deployment UUID.
 * @returns The deployment with logs.
 * @throws NotFoundError if the deployment doesn't exist.
 */
export async function getDeployment(deploymentId: string) {
  const deployment = await deploymentRepository.findById(deploymentId);

  if (!deployment) {
    throw new NotFoundError('Deployment not found');
  }

  return deployment;
}

/**
 * Trigger a new deployment for a project.
 *
 * 1. Retrieves the project and its application.
 * 2. Creates a deployment record with QUEUED status.
 * 3. Enqueues a deployment job via BullMQ.
 * 4. Creates an audit log entry.
 *
 * @param userId    - Authenticated user ID.
 * @param projectId - Project UUID.
 * @param options   - Optional branch, commit SHA, and trigger type.
 * @returns The created deployment.
 * @throws NotFoundError if the project or application doesn't exist.
 * @throws ValidationError if the project has no application.
 */
export async function triggerDeployment(
  userId: string,
  projectId: string,
  options?: TriggerDeploymentOptions,
) {
  // Get project with application
  const project = await projectRepository.findById(projectId);

  if (!project) {
    throw new NotFoundError('Project not found');
  }

  const application = project.applications[0];

  if (!application) {
    throw new ValidationError(
      'Project has no application configured. Cannot deploy.',
    );
  }

  // Create deployment record
  const deployment = await deploymentRepository.create({
    applicationId: application.id,
    projectId: project.id,
    triggerType: options?.triggerType ?? 'MANUAL',
    gitCommitSha: options?.gitCommitSha,
    gitBranch: options?.gitBranch ?? project.gitBranch ?? 'main',
    triggeredBy: userId,
    metadata: options?.zipPath ? { zipPath: options.zipPath } : undefined,
  });

  // Queue the deployment job
  await addDeploymentJob({
    deploymentId: deployment.id,
    projectId: project.id,
    applicationId: application.id,
  });

  // Audit log
  await prisma.auditLog.create({
    data: {
      userId,
      action: 'DEPLOY',
      resource: 'Deployment',
      resourceId: deployment.id,
      metadata: {
        projectId: project.id,
        projectName: project.name,
        triggerType: deployment.triggerType,
        gitBranch: deployment.gitBranch,
      },
    },
  });

  return deployment;
}

/**
 * Cancel a deployment if it is currently in QUEUED status.
 *
 * @param userId       - Authenticated user ID.
 * @param deploymentId - Deployment UUID.
 * @returns The cancelled deployment.
 * @throws NotFoundError if the deployment doesn't exist.
 * @throws ValidationError if the deployment cannot be cancelled.
 */
export async function cancelDeployment(
  userId: string,
  deploymentId: string,
) {
  const cancelled = await deploymentRepository.cancelQueued(deploymentId);

  if (!cancelled) {
    // Check if deployment exists at all
    const existing = await deploymentRepository.findById(deploymentId);
    if (!existing) {
      throw new NotFoundError('Deployment not found');
    }
    throw new ValidationError(
      `Cannot cancel deployment in '${existing.status}' status. Only QUEUED deployments can be cancelled.`,
    );
  }

  // Audit log
  await prisma.auditLog.create({
    data: {
      userId,
      action: 'UPDATE',
      resource: 'Deployment',
      resourceId: deploymentId,
      metadata: { action: 'cancel' },
    },
  });

  return cancelled;
}

/**
 * Rollback to a previous deployment.
 *
 * 1. Retrieves the target deployment (must exist and have a valid state).
 * 2. Creates a new deployment with triggerType ROLLBACK and previousDeploymentId set.
 * 3. Queues the deployment job.
 *
 * @param userId       - Authenticated user ID.
 * @param deploymentId - The deployment UUID to rollback to.
 * @returns The new rollback deployment.
 * @throws NotFoundError if the deployment doesn't exist.
 * @throws ValidationError if the deployment is not in a rollback-eligible state.
 */
export async function rollbackDeployment(
  userId: string,
  deploymentId: string,
) {
  const targetDeployment = await deploymentRepository.findById(deploymentId);

  if (!targetDeployment) {
    throw new NotFoundError('Deployment not found');
  }

  // Only allow rollback to deployments that were (or are) ACTIVE
  const rollbackEligible: DeploymentStatus[] = ['ACTIVE', 'ROLLED_BACK'];
  if (!rollbackEligible.includes(targetDeployment.status as DeploymentStatus)) {
    throw new ValidationError(
      `Cannot rollback to deployment in '${targetDeployment.status}' status. Only ACTIVE or previously rolled-back deployments are eligible.`,
    );
  }

  // Create new rollback deployment
  const rollbackDeployment = await deploymentRepository.create({
    applicationId: targetDeployment.applicationId,
    projectId: targetDeployment.projectId,
    triggerType: 'ROLLBACK',
    gitCommitSha: targetDeployment.gitCommitSha ?? undefined,
    gitBranch: targetDeployment.gitBranch ?? undefined,
    triggeredBy: userId,
    previousDeploymentId: targetDeployment.id,
  });

  // Queue the deployment job
  await addDeploymentJob({
    deploymentId: rollbackDeployment.id,
    projectId: targetDeployment.projectId,
    applicationId: targetDeployment.applicationId,
  });

  // Audit log
  await prisma.auditLog.create({
    data: {
      userId,
      action: 'DEPLOY',
      resource: 'Deployment',
      resourceId: rollbackDeployment.id,
      metadata: {
        action: 'rollback',
        previousDeploymentId: targetDeployment.id,
      },
    },
  });

  return rollbackDeployment;
}

/**
 * Get logs for a deployment.
 *
 * @param deploymentId - Deployment UUID.
 * @param options      - Optional limit and after-timestamp filter.
 * @returns Array of deployment logs.
 */
export async function getDeploymentLogs(
  deploymentId: string,
  options?: GetLogsOptions,
) {
  // Verify deployment exists
  const deployment = await deploymentRepository.findById(deploymentId);

  if (!deployment) {
    throw new NotFoundError('Deployment not found');
  }

  return deploymentRepository.getLogs(deploymentId, options);
}

/**
 * Update a deployment's status. Used by the deployment worker.
 *
 * @param deploymentId - Deployment UUID.
 * @param status       - New deployment status.
 * @param extra        - Optional additional fields to update.
 * @returns The updated deployment.
 */
export async function updateDeploymentStatus(
  deploymentId: string,
  status: DeploymentStatus,
  extra?: StatusUpdateExtras,
) {
  return deploymentRepository.updateStatus(deploymentId, status, extra);
}

/**
 * Add a log entry to a deployment. Used by the deployment worker.
 *
 * @param deploymentId - Deployment UUID.
 * @param level        - Log severity level.
 * @param message      - Log message text.
 * @param source       - Log source (BUILD, DEPLOY, HEALTH).
 * @returns The created log entry.
 */
export async function addDeploymentLog(
  deploymentId: string,
  level: LogLevel,
  message: string,
  source: LogSource,
) {
  return deploymentRepository.addLog(deploymentId, level, message, source);
}
