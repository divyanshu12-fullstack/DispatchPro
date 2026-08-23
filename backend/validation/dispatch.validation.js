import mongoose from 'mongoose';

import { ApiError } from '../utils/ApiError.js';

export function validateObjectId(value, fieldName = 'id') {
  if (!value || !mongoose.Types.ObjectId.isValid(value)) {
    throw ApiError.badRequest(`${fieldName} must be a valid ObjectId`);
  }
  return value;
}
