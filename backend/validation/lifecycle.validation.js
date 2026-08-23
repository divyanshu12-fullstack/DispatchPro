import { ApiError } from '../utils/ApiError.js';
import { ORDER_STATUS_VALUES } from '../models/constants/OrderStatus.js';
import { FAILURE_REASON_VALUES } from '../models/constants/StatusTransitions.js';

function asString(v) {
  return typeof v === 'string' ? v.trim() : '';
}

export function validateStatusUpdate(body) {
  const errors = {};
  const status = asString(body?.status);
  const failureReason = asString(body?.failureReason) || null;
  const location = asString(body?.location) || null;
  const note = asString(body?.note) || null;

  if (!status) {
    errors.status = 'status is required';
  } else if (!ORDER_STATUS_VALUES.includes(status)) {
    errors.status = `status must be one of: ${ORDER_STATUS_VALUES.join(', ')}`;
  }

  if (status === 'FAILED') {
    if (!failureReason) {
      errors.failureReason = 'failureReason is required when status is FAILED';
    } else if (!FAILURE_REASON_VALUES.includes(failureReason)) {
      errors.failureReason = `failureReason must be one of: ${FAILURE_REASON_VALUES.join(', ')}`;
    }
  }

  if (location && location.length > 200) {
    errors.location = 'location must be at most 200 characters';
  }
  if (note && note.length > 500) {
    errors.note = 'note must be at most 500 characters';
  }

  if (Object.keys(errors).length) {
    throw ApiError.unprocessable('Validation failed', errors);
  }

  return { status, failureReason, location, note };
}
