import { Router } from 'express';
import tablesController from './tables.controller';
import { authenticate, optionalAuth } from '../../middleware/auth.middleware';

const router = Router();

// Public route (for public booking page)
router.get('/public/restaurant/:restaurantId', optionalAuth, tablesController.findByRestaurant);

// Protected routes
router.use(authenticate);

router.post('/', tablesController.create);
router.get('/', tablesController.findAll);
router.get('/:id', tablesController.findById);
router.put('/:id', tablesController.update);
router.delete('/:id', tablesController.delete);

export default router;

