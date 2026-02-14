import { Router } from 'express';
import subscriptionsController from './subscriptions.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { requireAdmin } from '../../middleware/admin.middleware';

const router = Router();
router.use(authenticate);

// User can view their own subscription
router.get('/user/:email', subscriptionsController.findByUserEmail);

// Admin routes
router.use(requireAdmin);

router.post('/', subscriptionsController.create);
router.get('/', subscriptionsController.findAll);
router.get('/:id', subscriptionsController.findById);
router.put('/:id', subscriptionsController.update);
router.delete('/:id', subscriptionsController.delete);

export default router;

