import { Router } from 'express';
import shiftsController from './shifts.controller';
import { authenticate, optionalAuth } from '../../middleware/auth.middleware';

const router = Router();

// Public route (for viewing shifts by restaurant)
router.get('/public/restaurant/:restaurantId', optionalAuth, shiftsController.findByRestaurant);

// Protected routes
router.use(authenticate);

router.post('/', shiftsController.create);
router.get('/', shiftsController.findAll);
router.get('/:id', shiftsController.findById);
router.put('/:id', shiftsController.update);
router.delete('/:id', shiftsController.delete);

export default router;

