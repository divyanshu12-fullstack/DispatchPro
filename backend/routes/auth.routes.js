import { Router } from 'express';

import { authController } from '../controllers/auth.controller.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { requireRole } from '../middleware/rbac.middleware.js';
import { getUserById } from '../services/user.service.js';

const router = Router();

router.post('/register', asyncHandler(authController.register));
router.post('/login', asyncHandler(authController.login));
router.post('/request-otp', asyncHandler(authController.requestOtp));
router.post('/verify-otp', asyncHandler(authController.verifyOtp));

// Authenticated sanity check — useful for the frontend to verify a stored
// token is still valid and to hydrate "current user" state.
router.get(
  '/me',
  authenticate,
  asyncHandler(async (req, res) => {
    const user = await getUserById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.json({
      success: true,
      data: {
        id: user._id,
        email: user.email,
        fullName: user.fullName,
        phone: user.phone,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
        isAvailable: user.isAvailable,
      },
    });
  })
);

// Agent self-toggle availability
router.patch(
  '/me/availability',
  authenticate,
  requireRole('AGENT'),
  asyncHandler(async (req, res) => {
    const isAvailable = req.body?.isAvailable;
    if (typeof isAvailable !== 'boolean') {
      return res.status(422).json({ success: false, message: 'isAvailable must be a boolean' });
    }
    const { updateAgent } = await import('../services/agent.service.js');
    const updated = await updateAgent({ agentId: req.user.id, input: { isAvailable } });
    res.json({
      success: true,
      data: {
        id: updated._id,
        isAvailable: updated.isAvailable,
      },
      message: `Duty status updated to ${updated.isAvailable ? 'Available' : 'Off-Duty'}`,
    });
  })
);

// Example of `requireRole` in action — useful for verifying role-guarded
// routing works without a real admin endpoint yet.
router.get(
  '/admin/ping',
  authenticate,
  requireRole('ADMIN'),
  asyncHandler((_req, res) => {
    res.json({ success: true, data: { pong: true }, message: 'admin ok' });
  })
);

export default router;