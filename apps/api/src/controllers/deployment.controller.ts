/**
 * Deployment controller.
 * Handles deployment lifecycle endpoints: listing, triggering, cancelling, rollback, and logs.
 * @module controllers/deployment
 */

import type { Request, Response } from 'express';

import * as deploymentService from '../services/deployment.service.js';
import { sendPaginated, sendSuccess } from '../utils/apiResponse.js';

// ---------------------------------------------------------------------------
// Deployment endpoints
// ---------------------------------------------------------------------------

/**
 * GET /api/v1/projects/:projectId/deployments
 * List all deployments for a project with pagination.
 */
export async function listDeployments(
  req: Request,
  res: Response,
): Promise<void> {
  const page = parseInt(req.query.page as string || '1', 10);
  const perPage = parseInt(req.query.perPage as string || '10', 10);
  const status = req.query.status as string | undefined;

  const result = await deploymentService.listDeployments(
    req.params.projectId as string,
    { page, perPage, status },
  );

  sendPaginated(
    res,
    result.data,
    result.total,
    page,
    perPage,
    'Deployments retrieved',
  );
}

/**
 * GET /api/v1/deployments/:deploymentId
 * Get a single deployment by ID with logs.
 */
export async function getDeployment(
  req: Request,
  res: Response,
): Promise<void> {
  const deployment = await deploymentService.getDeployment(req.params.deploymentId as string);

  sendSuccess(res, { deployment }, 'Deployment retrieved');
}

/**
 * POST /api/v1/projects/:projectId/deploy
 * Trigger a new deployment for a project.
 */
export async function triggerDeployment(
  req: Request,
  res: Response,
): Promise<void> {
  const deployment = await deploymentService.triggerDeployment(
    req.user!.userId,
    req.params.projectId as string,
    req.body,
  );

  sendSuccess(res, { deployment }, 'Deployment triggered', 202);
}

/**
 * POST /api/v1/deployments/:deploymentId/cancel
 * Cancel a queued deployment.
 */
export async function cancelDeployment(
  req: Request,
  res: Response,
): Promise<void> {
  const deployment = await deploymentService.cancelDeployment(
    req.user!.userId,
    req.params.deploymentId as string,
  );

  sendSuccess(res, { deployment }, 'Deployment cancelled');
}

/**
 * POST /api/v1/deployments/:deploymentId/rollback
 * Rollback to a previous deployment.
 */
export async function rollbackDeployment(
  req: Request,
  res: Response,
): Promise<void> {
  const deployment = await deploymentService.rollbackDeployment(
    req.user!.userId,
    req.params.deploymentId as string,
  );

  sendSuccess(res, { deployment }, 'Rollback deployment triggered', 202);
}

/**
 * GET /api/v1/deployments/:deploymentId/logs
 * Get logs for a specific deployment.
 */
export async function getDeploymentLogs(
  req: Request,
  res: Response,
): Promise<void> {
  const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined;
  const after = req.query.after ? new Date(req.query.after as string) : undefined;

  const logs = await deploymentService.getDeploymentLogs(
    req.params.deploymentId as string,
    { limit, after },
  );

  sendSuccess(res, logs, 'Deployment logs retrieved');
}
