import { Router } from 'express';
import paymentsController from './payments.controller';
import { authenticate } from '../../middleware/auth.middleware';

const router = Router();

// Webhook route (no auth, verified by Stripe signature)
router.post('/webhook', paymentsController.handleWebhook);

// Protected routes
router.use(authenticate);

router.post('/create-checkout', paymentsController.createCheckout);

export default router;

