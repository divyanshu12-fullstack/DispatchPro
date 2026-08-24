import { Router } from 'express';

import { adminController } from '../controllers/admin.controller.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { requireRole } from '../middleware/rbac.middleware.js';

const router = Router();

router.use(authenticate);
router.use(requireRole('ADMIN'));

router.post('/agents', asyncHandler(adminController.createAgent));
router.get('/agents', asyncHandler(adminController.listAgents));
router.patch('/agents/:id', asyncHandler(adminController.updateAgent));
router.get('/zones', asyncHandler(adminController.listZones));

export default router;
