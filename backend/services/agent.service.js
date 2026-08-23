import User from '../models/User.js';
import Zone from '../models/Zone.js';
import { ApiError } from '../utils/ApiError.js';
import { hashPassword } from './auth.service.js';

export async function createAgent({ input }) {
  const { email, password, fullName, phone, assignedZoneId, maxCapacity } = input;

  const existing = await User.findOne({ email });
  if (existing) throw ApiError.conflict('An account with that email already exists');

  const zone = await Zone.findById(assignedZoneId).lean();
  if (!zone) throw ApiError.notFound('Zone not found');
  if (!zone.isActive) throw ApiError.unprocessable('Zone is not active');

  const passwordHash = await hashPassword(password);

  const agent = await User.create({
    email,
    passwordHash,
    fullName,
    phone,
    role: 'AGENT',
    assignedZoneId,
    isAvailable: true,
    currentActiveDeliveriesCount: 0,
    maxCapacity,
  });

  return agent;
}
