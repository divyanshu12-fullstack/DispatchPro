import User from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';

export async function getUserById(id) {
  try {
    return await User.findById(id);
  } catch (e) {
    throw ApiError.badRequest('Invalid user id');
  }
}