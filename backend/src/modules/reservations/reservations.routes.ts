import { Router } from 'express';
import reservationsController from './reservations.controller';
import { authenticate, optionalAuth } from '../../middleware/auth.middleware';

const router = Router();

// Public route for checking reservation by code
router.get('/code/:code', optionalAuth, reservationsController.findByCode);

// Protected routes
router.use(authenticate);

router.post('/', reservationsController.create);
router.get('/', reservationsController.findAll);
router.get('/:id', reservationsController.findById);
router.put('/:id', reservationsController.update);
router.delete('/:id', reservationsController.delete);

export default router;

