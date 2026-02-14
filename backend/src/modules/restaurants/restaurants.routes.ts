import { Router } from 'express';
import restaurantsController from './restaurants.controller';
import { authenticate, optionalAuth } from '../../middleware/auth.middleware';

const router = Router();

// Public route (for viewing restaurant by slug)
router.get('/slug/:slug', optionalAuth, restaurantsController.findBySlug);

// Protected routes
router.use(authenticate);

router.post('/', restaurantsController.create);
router.get('/', restaurantsController.findAll);
router.get('/:id', restaurantsController.findById);
router.put('/:id', restaurantsController.update);
router.delete('/:id', restaurantsController.delete);

export default router;

