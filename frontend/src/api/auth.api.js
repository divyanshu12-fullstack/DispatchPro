import { apiClient } from './client.js';

export const authApi = {
  /**
   * Register a new customer account.
   * @param {{ email: string, password: string, fullName: string, phone: string }} payload
   * @returns {Promise<{ token: string, user: { id: string, email: string, fullName: string, phone: string, role: string, isEmailVerified: boolean } }>}
   */
  register(payload) {
    return apiClient.post('/auth/register', payload);
  },

  /**
   * Authenticate with email & password.
   * @param {{ email: string, password: string }} payload
   * @returns {Promise<{ token: string, user: { id: string, email: string, fullName: string, phone: string, role: string, isEmailVerified: boolean } }>}
   */
  login(payload) {
    return apiClient.post('/auth/login', payload);
  },

  /**
   * Request a 6-digit verification or login OTP.
   * @param {{ email: string, purpose: 'LOGIN' | 'VERIFY_EMAIL' }} payload
   * @returns {Promise<{}>}
   */
  requestOtp(payload) {
    return apiClient.post('/auth/request-otp', payload);
  },

  /**
   * Verify OTP and receive authentication token.
   * @param {{ email: string, code?: string, otp?: string, purpose: 'LOGIN' | 'VERIFY_EMAIL' }} payload
   * @returns {Promise<{ token: string, user: { id: string, email: string, fullName: string, phone: string, role: string, isEmailVerified: boolean } }>}
   */
  verifyOtp(payload) {
    const code = String(payload.code || payload.otp || '').trim();
    return apiClient.post('/auth/verify-otp', {
      email: payload.email,
      code,
      otp: code,
      purpose: payload.purpose,
    });
  },

  /**
   * Fetch current authenticated session profile.
   * @returns {Promise<{ id: string, email: string, fullName: string, phone: string, role: string, isEmailVerified: boolean }>}
   */
  getMe() {
    return apiClient.get('/auth/me');
  },
};
