import { Router } from 'express';
import { authenticate } from '../../middleware/auth.js';
import * as billingController from '../../controllers/billing.controller.js';

const router = Router();

// Apply auth middleware
router.use(authenticate);

router.get('/plans', billingController.getPlans);
router.get('/subscription', billingController.getSubscription);
router.get('/invoices', billingController.getInvoices);
router.post('/subscribe', billingController.subscribeToPlan);
router.post('/pay-bkash', billingController.payManualBkash);
router.post('/approve-bkash', billingController.approvePayment);

export default router;
