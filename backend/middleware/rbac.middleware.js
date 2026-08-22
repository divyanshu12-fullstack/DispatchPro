import { ApiError } from '../utils/ApiError.js';

// Role guard. Use AFTER `authenticate`.
//   router.get('/admin/...', authenticate, requireRole('ADMIN'), handler);
export function requireRole(...roles) {
  return function (req, _res, next) {
    if (!req.user) return next(ApiError.unauthorized());
    if (!roles.includes(req.user.role)) {
      return next(ApiError.forbidden('You do not have access to this resource'));
    }
    return next();
  };
}

// Ownership helper for resource-scoped routes. The route handler loads the
// resource and passes a function that returns the owner's user id. We compare
// it to `req.user.id`; ADMIN always passes.
//
// Usage in controller:
//   const order = await Order.findById(req.params.id);
//   assertOwnerOrAdmin(req, () => order?.customer?.toString());
export function assertOwnerOrAdmin(req, getOwnerId) {
  if (!req.user) throw ApiError.unauthorized();
  if (req.user.role === 'ADMIN') return;
  const ownerId = getOwnerId();
  if (!ownerId || ownerId !== req.user.id) {
    throw ApiError.forbidden('You do not have access to this resource');
  }
}