import {
  registerCustomer,
  loginWithPassword,
  issueOtp,
  verifyOtp,
  signToken,
} from '../services/auth.service.js';
import {
  validateRegister,
  validateLogin,
  validateOtpRequest,
  validateOtpVerify,
} from '../validation/auth.validation.js';

function publicUser(u) {
  return {
    id: u._id,
    email: u.email,
    fullName: u.fullName,
    phone: u.phone,
    role: u.role,
    isEmailVerified: u.isEmailVerified,
  };
}

export const authController = {
  async register(req, res) {
    const input = validateRegister(req.body);
    const user = await registerCustomer(input);
    const token = signToken(user);
    res.status(201).json({
      success: true,
      data: { token, user: publicUser(user) },
      message: 'Registered',
    });
  },

  async login(req, res) {
    const input = validateLogin(req.body);
    const user = await loginWithPassword(input);
    const token = signToken(user);
    res.json({
      success: true,
      data: { token, user: publicUser(user) },
      message: 'Logged in',
    });
  },

  async requestOtp(req, res) {
    const input = validateOtpRequest(req.body);
    await issueOtp(input);
    // Same response whether or not the email exists — prevents enumeration.
    res.json({ success: true, data: {}, message: 'If that account exists, an OTP has been sent.' });
  },

  async verifyOtp(req, res) {
    const input = validateOtpVerify(req.body);
    const user = await verifyOtp(input);
    const token = signToken(user);
    res.json({
      success: true,
      data: { token, user: publicUser(user) },
      message: 'Verified',
    });
  },
};