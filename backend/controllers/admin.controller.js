import { createAgent } from '../services/agent.service.js';
import { validateCreateAgent } from '../validation/agent.validation.js';

function publicAgent(u) {
  return {
    id: u._id,
    email: u.email,
    fullName: u.fullName,
    phone: u.phone,
    role: u.role,
    assignedZoneId: u.assignedZoneId,
    isAvailable: u.isAvailable,
    currentActiveDeliveriesCount: u.currentActiveDeliveriesCount,
    maxCapacity: u.maxCapacity,
  };
}

export const adminController = {
  async createAgent(req, res) {
    const input = validateCreateAgent(req.body);
    const agent = await createAgent({ input });
    res.status(201).json({
      success: true,
      data: publicAgent(agent),
      message: 'Agent created',
    });
  },
};
