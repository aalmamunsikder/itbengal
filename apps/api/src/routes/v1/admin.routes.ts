/**
 * Admin API Routes.
 * All routes require authentication and SUPER_ADMIN or ADMIN role.
 *
 * @module routes/v1/admin
 */

import { Router } from 'express';
import { authenticate, requireRole } from '../../middleware/auth.js';
import * as adminController from '../../controllers/admin.controller.js';

const router = Router();

// Apply auth middlewares to all admin routes
router.use(authenticate);
router.use(requireRole('SUPER_ADMIN', 'ADMIN'));

// GET /api/v1/admin/containers - List all Docker containers running on host
router.get('/containers', adminController.listContainers);

// GET /api/v1/admin/containers/:id/logs - Get container stdout/stderr logs
router.get('/containers/:id/logs', adminController.getContainerLogs);

// POST /api/v1/admin/containers/:id/restart - Restart a specific container
router.post('/containers/:id/restart', adminController.restartContainer);

// GET /api/v1/admin/system/health - Docker daemon information
router.get('/system/health', adminController.getSystemHealth);

// GET /api/v1/admin/customers - List all customer organizations
router.get('/customers', adminController.listCustomers);

// GET /api/v1/admin/invoices - List all platform invoices
router.get('/invoices', adminController.listAllInvoices);

// GET /api/v1/admin/nodes - List all registered server nodes
router.get('/nodes', adminController.listServerNodes);

export default router;
