import { Router } from 'express';
import tablesController from './tables.controller';
import { authenticate } from '../../middleware/auth.middleware';

const router = Router();
router.use(authenticate);

router.post('/', tablesController.create);
router.get('/', tablesController.findAll);
router.get('/:id', tablesController.findById);
router.put('/:id', tablesController.update);
router.delete('/:id', tablesController.delete);

export default router;

