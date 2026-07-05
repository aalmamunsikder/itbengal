/**
 * Deployment repository — Prisma-based data access for Deployment and DeploymentLog models.
 *
 * Provides CRUD operations, status transitions, and log management
 * for the deployment pipeline.
 *
 * @module repositories/deployment
 */

import { prisma } from '@itbengal/database';
import type {
  Deployment,
  DeploymentLog,
  DeploymentStatus,
  DeploymentTrigger,
  LogLevel,
  LogSource,
  Prisma,
} from '@itbengal/database';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Paginated query options for deployment listing. */
interface DeploymentListOptions {
  page: number;
  perPage: number;
  status?: DeploymentStatus;
}

/** Return type for paginated deployment queries. */
export interface PaginatedDeployments {
  data: Array<
    Deployment & {
      triggeredByUser: {
        id: string;
        firstName: string;
        lastName: string;
        email: string;
      } | null;
    }
  >;
  total: number;
}

/** Additional fields to set when updating deployment status. */
interface StatusUpdateExtras {
  errorMessage?: string;
  buildDurationMs?: number;
  deployDurationMs?: number;
  imageTag?: string;
}

/** Data required to create a new deployment. */
interface CreateDeploymentData {
  applicationId: string;
  projectId: string;
  triggerType: 'GIT_PUSH' | 'MANUAL' | 'ROLLBACK' | 'ZIP_UPLOAD' | 'WEBHOOK';
  gitCommitSha?: string;
  gitCommitMessage?: string;
  gitBranch?: string;
  triggeredBy: string;
  previousDeploymentId?: string;
  metadata?: any;
}

/** Options for retrieving deployment logs. */
interface GetLogsOptions {
  limit?: number;
  after?: Date;
}

// ---------------------------------------------------------------------------
// Read operations
// ---------------------------------------------------------------------------

/**
 * List all deployments for a project with pagination.
 * Ordered by creation date, newest first.
 *
 * @param projectId - Project UUID.
 * @param options   - Pagination and filter options.
 * @returns Paginated deployments with triggered-by user info.
 */
export async function findAllByProject(
  projectId: string,
  options: DeploymentListOptions,
): Promise<PaginatedDeployments> {
  const { page, perPage, status } = options;
  const offset = (page - 1) * perPage;

  const where: Prisma.DeploymentWhereInput = {
    projectId,
    ...(status && { status }),
  };

  const [data, total] = await Promise.all([
    prisma.deployment.findMany({
      where,
      include: {
        triggeredByUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip: offset,
      take: perPage,
    }),
    prisma.deployment.count({ where }),
  ]);

  return { data, total };
}

/**
 * Find a deployment by ID with all associated logs.
 *
 * @param id - Deployment UUID.
 * @returns The deployment with logs, or `null`.
 */
export async function findById(
  id: string,
): Promise<(Deployment & { logs: DeploymentLog[] }) | null> {
  return prisma.deployment.findUnique({
    where: { id },
    include: {
      logs: {
        orderBy: { timestamp: 'asc' },
      },
    },
  });
}

/**
 * Find the latest LIVE deployment for an application.
 *
 * @param applicationId - Application UUID.
 * @returns The latest LIVE deployment, or `null`.
 */
export async function findLatestLive(
  applicationId: string,
): Promise<Deployment | null> {
  return prisma.deployment.findFirst({
    where: {
      applicationId,
      status: 'ACTIVE',
    },
    orderBy: { createdAt: 'desc' },
  });
}

// ---------------------------------------------------------------------------
// Write operations
// ---------------------------------------------------------------------------

/**
 * Create a new deployment record with status QUEUED.
 *
 * @param data - Deployment creation payload.
 * @returns The created deployment.
 */
export async function create(
  data: CreateDeploymentData,
): Promise<Deployment> {
  const triggerMap: Record<string, DeploymentTrigger> = {
    GIT_PUSH: 'GIT_PUSH',
    MANUAL: 'MANUAL',
    ROLLBACK: 'ROLLBACK',
    ZIP_UPLOAD: 'API',
    WEBHOOK: 'API',
  };

  const triggerType = triggerMap[data.triggerType] || 'MANUAL';

  return prisma.deployment.create({
    data: {
      applicationId: data.applicationId,
      projectId: data.projectId,
      triggerType,
      gitCommitSha: data.gitCommitSha,
      gitCommitMessage: data.gitCommitMessage,
      gitBranch: data.gitBranch,
      status: 'QUEUED',
      triggeredBy: data.triggeredBy,
      previousDeploymentId: data.previousDeploymentId,
      metadata: data.metadata,
    },
  });
}

/**
 * Update a deployment's status and optional associated fields.
 *
 * @param id     - Deployment UUID.
 * @param status - New deployment status.
 * @param extra  - Optional additional fields to update.
 * @returns The updated deployment.
 */
export async function updateStatus(
  id: string,
  status: DeploymentStatus,
  extra?: StatusUpdateExtras,
): Promise<Deployment> {
  return prisma.deployment.update({
    where: { id },
    data: {
      status,
      ...(extra?.errorMessage !== undefined && { errorMessage: extra.errorMessage }),
      ...(extra?.buildDurationMs !== undefined && { buildDurationMs: extra.buildDurationMs }),
      ...(extra?.deployDurationMs !== undefined && { deployDurationMs: extra.deployDurationMs }),
      ...(extra?.imageTag !== undefined && { imageTag: extra.imageTag }),
    },
  });
}

/**
 * Cancel a deployment if it is currently in QUEUED status.
 *
 * @param deploymentId - Deployment UUID.
 * @returns The updated deployment, or `null` if not in QUEUED status.
 */
export async function cancelQueued(
  deploymentId: string,
): Promise<Deployment | null> {
  const deployment = await prisma.deployment.findUnique({
    where: { id: deploymentId },
  });

  if (!deployment || deployment.status !== 'QUEUED') {
    return null;
  }

  return prisma.deployment.update({
    where: { id: deploymentId },
    data: { status: 'CANCELLED' },
  });
}

// ---------------------------------------------------------------------------
// Log operations
// ---------------------------------------------------------------------------

/**
 * Insert a log entry for a deployment.
 *
 * @param deploymentId - Deployment UUID.
 * @param level        - Log severity level.
 * @param message      - Log message text.
 * @param source       - Log source (BUILD, DEPLOY, or HEALTH).
 * @returns The created deployment log.
 */
export async function addLog(
  deploymentId: string,
  level: LogLevel,
  message: string,
  source: LogSource,
): Promise<DeploymentLog> {
  return prisma.deploymentLog.create({
    data: {
      deploymentId,
      level,
      message,
      source,
      timestamp: new Date(),
    },
  });
}

/**
 * Retrieve logs for a deployment, ordered by timestamp.
 *
 * @param deploymentId - Deployment UUID.
 * @param options      - Optional limit and after-timestamp filter.
 * @returns Array of deployment logs.
 */
export async function getLogs(
  deploymentId: string,
  options?: GetLogsOptions,
): Promise<DeploymentLog[]> {
  return prisma.deploymentLog.findMany({
    where: {
      deploymentId,
      ...(options?.after && { timestamp: { gt: options.after } }),
    },
    orderBy: { timestamp: 'asc' },
    ...(options?.limit && { take: options.limit }),
  });
}
