import { Router } from 'express';
import { authenticate } from '../../middleware/auth.js';
import * as monitoringController from '../../controllers/monitoring.controller.js';

const router = Router();

// Apply auth middleware
router.use(authenticate);

router.get('/:siteId', monitoringController.getSiteMetrics);

export default router;
