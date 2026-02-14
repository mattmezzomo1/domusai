import { Router } from 'express';
import usersController from './users.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { requireAdmin } from '../../middleware/admin.middleware';

const router = Router();

// All user routes require authentication and admin role
router.use(authenticate);
router.use(requireAdmin);

router.post('/invite', usersController.inviteUser);
router.get('/', usersController.listUsers);
router.get('/:id', usersController.getUserById);
router.delete('/:id', usersController.deleteUser);

export default router;

