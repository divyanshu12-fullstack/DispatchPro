import { Router } from 'express';

import { orderController } from '../controllers/order.controller.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { requireRole } from '../middleware/rbac.middleware.js';

const router = Router();

// Public — anyone can price-check before signing up.
router.post('/quote', asyncHandler(orderController.quote));

// Authenticated — every other order endpoint requires a JWT.
router.use(authenticate);

router.post('/', asyncHandler(orderController.create));
router.get('/', asyncHandler(orderController.list));
router.get('/:id', asyncHandler(orderController.getById));
router.get('/:id/timeline', asyncHandler(orderController.timeline));
router.post('/:id/dispatch', requireRole('ADMIN'), asyncHandler(orderController.dispatch));
router.post('/:id/status', asyncHandler(orderController.updateStatus));
router.post('/:id/reschedule', asyncHandler(orderController.reschedule));

export default router;
