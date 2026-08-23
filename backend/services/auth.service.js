import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'node:crypto';

import User from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';
import { sendOtpEmail, sendWelcomeEmail } from './email.service.js';

const BCRYPT_COST = 12;
const OTP_TTL_MS = 10 * 60 * 1000; // 10 minutes
const OTP_LENGTH = 6;

export async function hashPassword(plain) {
  if (typeof plain !== 'string' || plain.length < 8) {
    throw ApiError.badRequest('Password must be at least 8 characters');
  }
  return bcrypt.hash(plain, BCRYPT_COST);
}

export async function verifyPassword(plain, hash) {
  if (!plain || !hash) return false;
  return bcrypt.compare(plain, hash);
}

export function signToken(user) {
  return jwt.sign(
    { sub: user._id.toString(), role: user.role, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

function generateOtpCode() {
  // crypto.randomInt is unbiased; avoids Math.random predictability.
  const max = 10 ** OTP_LENGTH;
  const code = crypto.randomInt(0, max).toString().padStart(OTP_LENGTH, '0');
  return code;
}

export async function issueOtp({ email, purpose }) {
  if (!['LOGIN', 'VERIFY_EMAIL'].includes(purpose)) {
    throw ApiError.badRequest('Invalid OTP purpose');
  }

  const user = await User.findOne({ email });
  // Always return ok to the controller; never reveal whether the email exists.
  if (!user) return { delivered: true };

  const code = generateOtpCode();
  const otpHash = await bcrypt.hash(code, BCRYPT_COST);

  user.otpHash = otpHash;
  user.otpExpiresAt = new Date(Date.now() + OTP_TTL_MS);
  user.otpPurpose = purpose;
  await user.save();

  // Fire-and-log: per spec, email failure must not roll back business state.
  sendOtpEmail({
    email,
    code,
    purpose,
    expiresAt: user.otpExpiresAt.toISOString(),
  }).catch((e) => console.error('[auth] unexpected sendOtpEmail rejection:', e));

  return { delivered: true };
}

export async function verifyOtp({ email, code, purpose }) {
  if (!['LOGIN', 'VERIFY_EMAIL'].includes(purpose)) {
    throw ApiError.badRequest('Invalid OTP purpose');
  }
  if (typeof code !== 'string' || code.length !== OTP_LENGTH) {
    throw ApiError.badRequest('Invalid OTP format');
  }

  const user = await User.findOne({ email }).select('+otpHash');
  if (!user || !user.otpHash || !user.otpExpiresAt || !user.otpPurpose) {
    throw ApiError.unauthorized('Invalid or expired OTP');
  }

  if (user.otpPurpose !== purpose) {
    throw ApiError.unauthorized('Invalid or expired OTP');
  }

  if (user.otpExpiresAt.getTime() < Date.now()) {
    throw ApiError.unauthorized('Invalid or expired OTP');
  }

  const ok = await bcrypt.compare(code, user.otpHash);
  if (!ok) throw ApiError.unauthorized('Invalid or expired OTP');

  // One-shot: clear OTP fields so the same code can't be reused.
  user.otpHash = null;
  user.otpExpiresAt = null;
  user.otpPurpose = null;

  if (purpose === 'VERIFY_EMAIL' && !user.isEmailVerified) {
    user.isEmailVerified = true;
  }

  await user.save();
  return user;
}

export async function registerCustomer({ email, password, fullName, phone }) {
  const existing = await User.findOne({ email });
  if (existing) throw ApiError.conflict('An account with that email already exists');

  const passwordHash = await hashPassword(password);
  const user = await User.create({
    email,
    passwordHash,
    fullName,
    phone: phone ?? null,
    role: 'CUSTOMER',
  });

  sendWelcomeEmail({ user }).catch((e) =>
    console.error('[auth] unexpected sendWelcomeEmail rejection:', e)
  );

  return user;
}

export async function loginWithPassword({ email, password }) {
  const user = await User.findOne({ email }).select('+passwordHash');
  if (!user) throw ApiError.unauthorized('Invalid credentials');

  const ok = await verifyPassword(password, user.passwordHash);
  if (!ok) throw ApiError.unauthorized('Invalid credentials');

  return user;
}