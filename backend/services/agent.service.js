import User from '../models/User.js';
import Zone from '../models/Zone.js';
import { ApiError } from '../utils/ApiError.js';
import { hashPassword } from './auth.service.js';
import { retryAssignmentForZone } from './dispatch.service.js';

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

/**
 * Admin update of an agent's operational fields (partial).
 * - maxCapacity may not drop below current load (would break the $expr
 *   capacity invariant used by claimAgent).
 * - Re-availability triggers the event-driven retry sweep for the zone.
 */
export async function updateAgent({ agentId, input }) {
  const agent = await User.findOne({ _id: agentId, role: 'AGENT' });
  if (!agent) throw ApiError.notFound('Agent not found');

  const { isAvailable, maxCapacity, assignedZoneId } = input;

  if (assignedZoneId && assignedZoneId !== agent.assignedZoneId?.toString()) {
    const zone = await Zone.findById(assignedZoneId).lean();
    if (!zone) throw ApiError.notFound('Zone not found');
    if (!zone.isActive) throw ApiError.unprocessable('Zone is not active');
  }

  if (
    maxCapacity != null &&
    maxCapacity < agent.currentActiveDeliveriesCount
  ) {
    throw ApiError.unprocessable(
      `maxCapacity cannot be lower than the agent's ${agent.currentActiveDeliveriesCount} active deliveries`
    );
  }

  const wasAvailable = agent.isAvailable;
  if (isAvailable !== undefined) agent.isAvailable = isAvailable;
  if (maxCapacity !== undefined) agent.maxCapacity = maxCapacity;
  if (assignedZoneId) agent.assignedZoneId = assignedZoneId;

  await agent.save();

  // Post-commit: a freshly available agent can immediately absorb waiting
  // orders in their zone. Fire-and-log — never blocks the response.
  if (!wasAvailable && agent.isAvailable) {
    retryAssignmentForZone(agent.assignedZoneId).catch((e) =>
      console.error('[agent] unexpected retryAssignmentForZone rejection:', e),
    );
  }

  return agent;
}

/**
 * Admin listing of agents with live workload + zone context.
 */
export async function listAgents({ query = {} }) {
  const filter = { role: 'AGENT' };
  if (query.available === 'true') filter.isAvailable = true;
  if (query.available === 'false') filter.isAvailable = false;

  return User.find(filter)
    .populate('assignedZoneId', 'name code isActive')
    .sort({ fullName: 1 })
    .lean();
}

/**
 * List active zones for admin selection dropdowns.
 */
export async function listZones() {
  return Zone.find({ isActive: true }).sort({ name: 1 }).lean();
}

