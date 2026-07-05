/**
 * API v1 route aggregator.
 * Mounts all v1 route modules under their respective path prefixes.
 * @module routes/v1
 */

import { Router } from 'express';

import { NotFoundError } from '../../middleware/errorHandler.js';
import authRoutes from './auth.routes.js';
import deploymentRoutes from './deployment.routes.js';
import healthRoutes from './health.routes.js';
import projectRoutes from './project.routes.js';
import userRoutes from './user.routes.js';
import adminRoutes from './admin.routes.js';
import wordpressRoutes from './wordpress.routes.js';
import billingRoutes from './billing.routes.js';
import monitoringRoutes from './monitoring.routes.js';
import sslRoutes from './ssl.routes.js';
import domainRoutes from './domain.routes.js';

const router = Router();

// ---- Mount route modules ----
router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/projects', projectRoutes);
router.use('/admin', adminRoutes);
router.use('/wordpress', wordpressRoutes);
router.use('/billing', billingRoutes);
router.use('/monitoring', monitoringRoutes);
router.use('/ssl', sslRoutes);
router.use('/domains', domainRoutes);
router.use('/', deploymentRoutes);

// ---- Catch-all for unknown v1 routes ----
router.all('*', (req, _res, next) => {
  next(new NotFoundError(`Route ${req.method} ${req.originalUrl} not found`));
});

export default router;
