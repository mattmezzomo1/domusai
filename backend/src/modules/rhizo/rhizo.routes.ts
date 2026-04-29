import { Router } from 'express';
import rhizoController from './rhizo.controller';
import { rhizoAuth } from '../../middleware/rhizo-auth.middleware';

const router = Router();

// Single webhook endpoint — bearer-secret auth, no JWT.
router.post('/', rhizoAuth, rhizoController.handleWebhook);

export default router;
