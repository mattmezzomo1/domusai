import { Router } from 'express';
import environmentsController from './environments.controller';
import { authenticate, optionalAuth } from '../../middleware/auth.middleware';

const router = Router();

// Public route (for viewing environments by restaurant)
router.get('/public/restaurant/:restaurantId', optionalAuth, environmentsController.findByRestaurant);

// Protected routes
router.use(authenticate);

router.post('/', environmentsController.create);
router.get('/', environmentsController.findAll);
router.get('/:id', environmentsController.findById);
router.put('/:id', environmentsController.update);
router.delete('/:id', environmentsController.delete);

export default router;

