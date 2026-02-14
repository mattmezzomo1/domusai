import { Router } from 'express';
import customersController from './customers.controller';
import { authenticate } from '../../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

router.post('/', customersController.create);
router.get('/', customersController.findAll);
router.get('/:id', customersController.findById);
router.put('/:id', customersController.update);
router.delete('/:id', customersController.delete);

export default router;

