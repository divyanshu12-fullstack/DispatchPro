import mongoose from 'mongoose';

import { ApiError } from '../utils/ApiError.js';

const EMAIL_RE = /^\S+@\S+\.\S+$/;

function asString(v) {
  return typeof v === 'string' ? v.trim() : '';
}
function asNumber(v) {
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  if (typeof v === 'string' && v.trim() !== '' && Number.isFinite(Number(v))) return Number(v);
  return null;
}

export function validateCreateAgent(body) {
  const errors = {};
  const email = asString(body?.email).toLowerCase();
  const password = typeof body?.password === 'string' ? body.password : '';
  const fullName = asString(body?.fullName);
  const phone = asString(body?.phone);
  const assignedZoneId = asString(body?.assignedZoneId);
  const maxCapacity = asNumber(body?.maxCapacity);

  if (!email) errors.email = 'Email is required';
  else if (!EMAIL_RE.test(email)) errors.email = 'Email format is invalid';

  if (!password) errors.password = 'Password is required';
  else if (password.length < 8) errors.password = 'Password must be at least 8 characters';

  if (!fullName || fullName.length < 2) errors.fullName = 'Full name is required (min 2 chars)';

  if (!phone) errors.phone = 'Phone is required';

  if (!assignedZoneId) {
    errors.assignedZoneId = 'assignedZoneId is required';
  } else if (!mongoose.Types.ObjectId.isValid(assignedZoneId)) {
    errors.assignedZoneId = 'assignedZoneId must be a valid ObjectId';
  }

  if (maxCapacity == null || maxCapacity < 1) {
    errors.maxCapacity = 'maxCapacity is required and must be >= 1';
  } else if (!Number.isInteger(maxCapacity)) {
    errors.maxCapacity = 'maxCapacity must be a whole number';
  }

  if (Object.keys(errors).length) {
    throw ApiError.unprocessable('Validation failed', errors);
  }

  return { email, password, fullName, phone, assignedZoneId, maxCapacity };
}

// Partial update: at least one of isAvailable / maxCapacity / assignedZoneId.
export function validateUpdateAgent(body) {
  const errors = {};
  const isAvailable = body?.isAvailable;
  const maxCapacity = asNumber(body?.maxCapacity);
  const assignedZoneId = asString(body?.assignedZoneId);

  if (isAvailable !== undefined && typeof isAvailable !== 'boolean') {
    errors.isAvailable = 'isAvailable must be a boolean';
  }

  if (maxCapacity != null && (maxCapacity < 1 || !Number.isInteger(maxCapacity))) {
    errors.maxCapacity = 'maxCapacity must be a whole number >= 1';
  }

  if (assignedZoneId && !mongoose.Types.ObjectId.isValid(assignedZoneId)) {
    errors.assignedZoneId = 'assignedZoneId must be a valid ObjectId';
  }

  if (
    isAvailable === undefined &&
    maxCapacity == null &&
    !assignedZoneId
  ) {
    errors.body = 'Provide at least one of isAvailable, maxCapacity, assignedZoneId';
  }

  if (Object.keys(errors).length) {
    throw ApiError.unprocessable('Validation failed', errors);
  }

  const update = {};
  if (isAvailable !== undefined) update.isAvailable = isAvailable;
  if (maxCapacity != null) update.maxCapacity = maxCapacity;
  if (assignedZoneId) update.assignedZoneId = assignedZoneId;
  return update;
}
