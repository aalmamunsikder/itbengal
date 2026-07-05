import { Router } from 'express';
import { authenticate } from '../../middleware/auth.js';
import * as sslController from '../../controllers/ssl.controller.js';

const router = Router();

// Apply auth middleware
router.use(authenticate);

router.get('/', sslController.listApplications);
router.get('/:applicationId', sslController.getCertificates);
router.post('/check-dns', sslController.checkDns);
router.post('/provision', sslController.provisionCertificate);
router.post('/renew/:certificateId', sslController.renewCertificate);

export default router;
