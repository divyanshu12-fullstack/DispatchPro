import jwt from 'jsonwebtoken';
import { ApiError } from '../utils/ApiError.js';

// Expected JWT payload: { sub: <userId>, role, email, iat, exp }.
// Downstream code reads `req.user` only — never `req.body.userId` — to satisfy
// the "never trust role/user IDs from the client" rule.
export function authenticate(req, _res, next) {
  const header = req.headers.authorization || '';

  if (!header.startsWith('Bearer ')) {
    return next(ApiError.unauthorized('Missing or malformed Authorization header'));
  }

  const token = header.slice('Bearer '.length).trim();
  if (!token) {
    return next(ApiError.unauthorized('Missing token'));
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = {
      id: payload.sub,
      role: payload.role,
      email: payload.email,
    };
    return next();
  } catch (e) {
    return next(ApiError.unauthorized('Invalid or expired token'));
  }
}