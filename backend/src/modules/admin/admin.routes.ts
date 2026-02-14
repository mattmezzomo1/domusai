import { Router } from 'express';
import adminController from './admin.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { requireAdmin } from '../../middleware/admin.middleware';

const router = Router();

// All admin routes require authentication and admin role
router.use(authenticate);
router.use(requireAdmin);

router.post('/create-freetrial-account', adminController.createFreetrialAccount);
router.post('/grant-free-plan', adminController.grantFreePlan);
router.post('/revoke-access', adminController.revokeAccess);
router.post('/upgrade-to-paid', adminController.upgradeToPaid);
router.post('/create-discount-code', adminController.createDiscountCode);

export default router;

