/**
 * Deployment routes.
 * All deployment lifecycle endpoints: listing, triggering, cancelling, rollback, and logs.
 * @module routes/v1/deployment
 */

import { Router } from 'express';

import {
  cancelDeployment,
  getDeployment,
  getDeploymentLogs,
  listDeployments,
  rollbackDeployment,
  triggerDeployment,
} from '../../controllers/deployment.controller.js';
import { authenticate } from '../../middleware/auth.js';
import { pagination } from '../../middleware/pagination.js';
import { validate } from '../../middleware/validator.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import {
  deploymentIdParamSchema,
  triggerDeploymentSchema,
} from '../../validators/deployment.validator.js';

const router = Router();

// All deployment routes require authentication
router.use(authenticate);

// ─── Project-scoped deployment endpoints ─────────────────────────────────────

/**
 * GET /api/v1/projects/:projectId/deployments
 * List all deployments for a project with pagination.
 */
router.get(
  '/projects/:projectId/deployments',
  pagination,
  asyncHandler(listDeployments),
);

/**
 * POST /api/v1/projects/:projectId/deploy
 * Trigger a new deployment for a project.
 */
router.post(
  '/projects/:projectId/deploy',
  validate(triggerDeploymentSchema),
  asyncHandler(triggerDeployment),
);

// ─── Direct deployment endpoints ─────────────────────────────────────────────

/**
 * GET /api/v1/deployments/:deploymentId
 * Get a single deployment by ID with logs.
 */
router.get(
  '/deployments/:deploymentId',
  validate(deploymentIdParamSchema, 'params'),
  asyncHandler(getDeployment),
);

/**
 * POST /api/v1/deployments/:deploymentId/cancel
 * Cancel a queued deployment.
 */
router.post(
  '/deployments/:deploymentId/cancel',
  validate(deploymentIdParamSchema, 'params'),
  asyncHandler(cancelDeployment),
);

/**
 * POST /api/v1/deployments/:deploymentId/rollback
 * Rollback to a previous deployment.
 */
router.post(
  '/deployments/:deploymentId/rollback',
  validate(deploymentIdParamSchema, 'params'),
  asyncHandler(rollbackDeployment),
);

/**
 * GET /api/v1/deployments/:deploymentId/logs
 * Get logs for a specific deployment.
 */
router.get(
  '/deployments/:deploymentId/logs',
  validate(deploymentIdParamSchema, 'params'),
  asyncHandler(getDeploymentLogs),
);

export default router;
