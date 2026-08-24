import { ApiError } from '../utils/ApiError.js';

const EMAIL_RE = /^\S+@\S+\.\S+$/;

function asString(v) {
  return typeof v === 'string' ? v.trim() : '';
}

export function validateRegister(body) {
  const errors = {};
  const email = asString(body?.email).toLowerCase();
  const password = typeof body?.password === 'string' ? body.password : '';
  const fullName = asString(body?.fullName);
  const phone = body?.phone == null ? null : asString(body?.phone);

  if (!email) errors.email = 'Email is required';
  else if (!EMAIL_RE.test(email)) errors.email = 'Email format is invalid';

  if (!password) errors.password = 'Password is required';
  else if (password.length < 8) errors.password = 'Password must be at least 8 characters';

  if (!fullName || fullName.length < 2) errors.fullName = 'Full name is required';

  if (Object.keys(errors).length) {
    throw ApiError.unprocessable('Validation failed', errors);
  }

  return { email, password, fullName, phone };
}

export function validateLogin(body) {
  const errors = {};
  const email = asString(body?.email).toLowerCase();
  const password = typeof body?.password === 'string' ? body.password : '';

  if (!email) errors.email = 'Email is required';
  else if (!EMAIL_RE.test(email)) errors.email = 'Email format is invalid';
  if (!password) errors.password = 'Password is required';

  if (Object.keys(errors).length) {
    throw ApiError.unprocessable('Validation failed', errors);
  }

  return { email, password };
}

export function validateOtpRequest(body) {
  const errors = {};
  const email = asString(body?.email).toLowerCase();
  const purpose = asString(body?.purpose);

  if (!email) errors.email = 'Email is required';
  else if (!EMAIL_RE.test(email)) errors.email = 'Email format is invalid';

  if (!purpose) errors.purpose = 'Purpose is required';
  else if (!['LOGIN', 'VERIFY_EMAIL'].includes(purpose)) {
    errors.purpose = 'Purpose must be LOGIN or VERIFY_EMAIL';
  }

  if (Object.keys(errors).length) {
    throw ApiError.unprocessable('Validation failed', errors);
  }

  return { email, purpose };
}

export function validateOtpVerify(body) {
  const errors = {};
  const email = asString(body?.email).toLowerCase();
  const code =
    typeof body?.code === 'string'
      ? body.code.trim()
      : typeof body?.otp === 'string'
      ? body.otp.trim()
      : '';
  const purpose = asString(body?.purpose);

  if (!email) errors.email = 'Email is required';
  else if (!EMAIL_RE.test(email)) errors.email = 'Email format is invalid';

  if (!code) errors.code = 'Code is required';
  else if (!/^\d{6}$/.test(code)) errors.code = 'Code must be 6 digits';

  if (!purpose) errors.purpose = 'Purpose is required';
  else if (!['LOGIN', 'VERIFY_EMAIL'].includes(purpose)) {
    errors.purpose = 'Purpose must be LOGIN or VERIFY_EMAIL';
  }

  if (Object.keys(errors).length) {
    throw ApiError.unprocessable('Validation failed', errors);
  }

  return { email, code, purpose };
}