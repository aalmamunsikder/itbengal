/**
 * Health check routes.
 * @module routes/v1/health
 */

import { Router } from 'express';

import { detailedHealthCheck, healthCheck } from '../../controllers/health.controller.js';
import { authenticate, requireRole } from '../../middleware/auth.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

const router = Router();

/**
 * GET /api/v1/health
 * Basic health check — always public.
 */
router.get('/', asyncHandler(healthCheck));

/**
 * GET /api/v1/health/detailed
 * Detailed health check — admin only.
 * Reports database, Redis, memory, and system status.
 */
router.get(
  '/detailed',
  authenticate,
  requireRole('admin'),
  asyncHandler(detailedHealthCheck),
);

export default router;
