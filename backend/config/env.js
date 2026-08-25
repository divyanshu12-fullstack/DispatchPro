import 'dotenv/config';

// Centralized env access for the email and notification subsystem.
// Importing from here provides a single place to validate, normalize, and
// surface optional-with-default values.

export function getFrontendUrl() {
  const raw =
    process.env.FRONTEND_URL ||
    process.env.CLIENT_URL ||
    process.env.APP_URL ||
    process.env.SITE_URL ||
    'http://localhost:5173';
  return raw.replace(/\/+$/, '');
}

export const FRONTEND_URL = getFrontendUrl();
export const RESEND_API_KEY = process.env.RESEND_API_KEY || '';
export const EMAIL_FROM =
  process.env.EMAIL_FROM || (process.env.EMAIL_STUB === 'true' ? 'stub@example.com' : '');
export const EMAIL_STUB = process.env.EMAIL_STUB === 'true';
export const APP_TIMEZONE = process.env.APP_TIMEZONE || 'Asia/Kolkata';
export const SUPPORT_EMAIL = process.env.SUPPORT_EMAIL || 'support@dispatchpro.com';
export const APP_NAME = 'DispatchPro';


