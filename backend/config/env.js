// Centralized env access for the email subsystem. Importing from here (rather
// than reading process.env directly) gives a single place to validate and
// surface optional-with-default values.

const stubbed = process.env.EMAIL_STUB === 'true';

export const RESEND_API_KEY = process.env.RESEND_API_KEY || '';
export const EMAIL_FROM = process.env.EMAIL_FROM || (stubbed ? 'stub@example.com' : '');
export const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
export const EMAIL_STUB = stubbed;
