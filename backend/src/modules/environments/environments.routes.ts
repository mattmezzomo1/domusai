import { Router } from 'express';
import environmentsController from './environments.controller';
import { authenticate } from '../../middleware/auth.middleware';

const router = Router();
router.use(authenticate);

router.post('/', environmentsController.create);
router.get('/', environmentsController.findAll);
router.get('/:id', environmentsController.findById);
router.put('/:id', environmentsController.update);
router.delete('/:id', environmentsController.delete);

export default router;

