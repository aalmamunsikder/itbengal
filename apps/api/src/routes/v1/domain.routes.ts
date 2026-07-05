import { Router } from 'express';
import { authenticate } from '../../middleware/auth.js';
import * as domainController from '../../controllers/domain.controller.js';

const router = Router();

// Apply auth middleware
router.use(authenticate);

router.get('/', domainController.listDomains);
router.post('/search', domainController.searchDomains);
router.post('/register', domainController.registerDomain);
router.get('/:id', domainController.getDomainDetails);
router.post('/:id/whois', domainController.toggleWhoisPrivacy);

// DNS records CRUD
router.post('/:id/dns', domainController.addDnsRecord);
router.put('/:id/dns/:recordId', domainController.updateDnsRecord);
router.delete('/:id/dns/:recordId', domainController.deleteDnsRecord);

export default router;
