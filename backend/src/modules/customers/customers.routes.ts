import { Router } from 'express';
import customersController from './customers.controller';
import { authenticate, optionalAuth } from '../../middleware/auth.middleware';

const router = Router();

// Public routes (for public booking page)
router.get('/public/phone/:phone/restaurant/:restaurantId', optionalAuth, customersController.findByPhoneAndRestaurant);
router.post('/public', optionalAuth, customersController.createPublic);
router.put('/public/:id', optionalAuth, customersController.updatePublic);

// Protected routes
router.use(authenticate);

router.post('/', customersController.create);
router.get('/', customersController.findAll);
router.get('/:id', customersController.findById);
router.put('/:id', customersController.update);
router.delete('/:id', customersController.delete);

export default router;

