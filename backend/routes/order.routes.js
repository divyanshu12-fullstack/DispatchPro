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
router.get('/:id', asyncHandler(orderController.getById));
router.post('/:id/dispatch', requireRole('ADMIN'), asyncHandler(orderController.dispatch));

export default router;
