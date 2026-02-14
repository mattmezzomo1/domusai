import { Router } from 'express';
import shiftsController from './shifts.controller';
import { authenticate } from '../../middleware/auth.middleware';

const router = Router();
router.use(authenticate);

router.post('/', shiftsController.create);
router.get('/', shiftsController.findAll);
router.get('/:id', shiftsController.findById);
router.put('/:id', shiftsController.update);
router.delete('/:id', shiftsController.delete);

export default router;

