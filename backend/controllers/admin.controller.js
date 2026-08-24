import { createAgent, updateAgent, listAgents, listZones } from '../services/agent.service.js';
import { listRateCards, updateRateCard } from '../services/rate.service.js';
import { validateCreateAgent, validateUpdateAgent } from '../validation/agent.validation.js';
import { validateUpdateRateCard } from '../validation/rate.validation.js';
import { validateObjectId } from '../validation/dispatch.validation.js';

function publicAgent(u) {
  return {
    id: u._id,
    email: u.email,
    fullName: u.fullName,
    phone: u.phone,
    role: u.role,
    assignedZone: u.assignedZoneId
      ? {
          id: u.assignedZoneId._id ?? u.assignedZoneId,
          name: u.assignedZoneId.name ?? null,
          code: u.assignedZoneId.code ?? null,
        }
      : null,
    isAvailable: u.isAvailable,
    currentActiveDeliveriesCount: u.currentActiveDeliveriesCount,
    maxCapacity: u.maxCapacity,
    createdAt: u.createdAt,
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

  async updateAgent(req, res) {
    const agentId = validateObjectId(req.params.id, 'agentId');
    const update = validateUpdateAgent(req.body);
    const agent = await updateAgent({ agentId, input: update });
    res.json({
      success: true,
      data: publicAgent(agent),
      message: 'Agent updated',
    });
  },

  async listAgents(req, res) {
    const agents = await listAgents({ query: req.query });
    res.json({
      success: true,
      data: {
        items: agents.map(publicAgent),
        total: agents.length,
      },
      message: 'Agents listed',
    });
  },

  async listZones(_req, res) {
    const zones = await listZones();
    res.json({
      success: true,
      data: zones.map((z) => ({
        id: z._id,
        name: z.name,
        code: z.code,
      })),
      message: 'Zones listed',
    });
  },

  async listRateCards(_req, res) {
    const rateCards = await listRateCards();
    res.json({
      success: true,
      data: {
        items: rateCards.map((r) => ({
          id: r._id,
          orderType: r.orderType,
          tripType: r.tripType,
          baseWeight: r.baseWeight,
          baseRate: r.baseRate,
          additionalPerKgRate: r.additionalPerKgRate,
          codSurchargeFixed: r.codSurchargeFixed,
          codSurchargePercent: r.codSurchargePercent,
          isActive: r.isActive,
          createdAt: r.createdAt,
          updatedAt: r.updatedAt,
        })),
        total: rateCards.length,
      },
      message: 'Rate cards listed',
    });
  },

  async updateRateCard(req, res) {
    const rateCardId = validateObjectId(req.params.id, 'rateCardId');
    const update = validateUpdateRateCard(req.body);
    const rateCard = await updateRateCard({ rateCardId, input: update });
    res.json({
      success: true,
      data: {
        id: rateCard._id,
        orderType: rateCard.orderType,
        tripType: rateCard.tripType,
        baseWeight: rateCard.baseWeight,
        baseRate: rateCard.baseRate,
        additionalPerKgRate: rateCard.additionalPerKgRate,
        codSurchargeFixed: rateCard.codSurchargeFixed,
        codSurchargePercent: rateCard.codSurchargePercent,
        isActive: rateCard.isActive,
        updatedAt: rateCard.updatedAt,
      },
      message: 'Rate card updated',
    });
  },
};
