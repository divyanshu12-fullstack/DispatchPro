import { Router } from 'express';

import { paymentController } from '../controllers/payment.controller.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

// All payment endpoints require a JWT. Ownership (owner CUSTOMER or ADMIN)
// is enforced inside the controller, mirroring getOrderForUser.
router.use(authenticate);

router.post('/orders/:orderId/razorpay-order', asyncHandler(paymentController.createRazorpayOrder));
router.post('/orders/:orderId/verify', asyncHandler(paymentController.verify));

export default router;
