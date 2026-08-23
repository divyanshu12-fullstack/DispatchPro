import { ApiError } from '../utils/ApiError.js';

// Validates the reschedule payload. The delivery date must be a parseable
// ISO-8601 timestamp strictly in the future — rescheduling into the past
// would recreate the exact failure we are recovering from.
export function validateReschedule(body) {
  const raw = body?.newDeliveryDate;
  const errors = {};

  if (!raw || typeof raw !== 'string') {
    errors.newDeliveryDate = 'newDeliveryDate is required';
  } else {
    const date = new Date(raw);
    if (Number.isNaN(date.getTime())) {
      errors.newDeliveryDate = 'newDeliveryDate must be a valid ISO 8601 date';
    } else if (date.getTime() <= Date.now()) {
      errors.newDeliveryDate = 'newDeliveryDate must be in the future';
    }
  }

  if (Object.keys(errors).length) {
    throw ApiError.unprocessable('Validation failed', errors);
  }

  return { newDeliveryDate: new Date(raw) };
}
