import { createOrder, getOrderForUser, listOrdersForUser, getTimelineForUser } from '../services/order.service.js';
import { dispatchOrder } from '../services/dispatch.service.js';
import { transitionOrder } from '../services/lifecycle.service.js';
import { rescheduleOrder } from '../services/reschedule.service.js';
import { validateCreateOrder } from '../validation/order.validation.js';
import { validateObjectId } from '../validation/dispatch.validation.js';
import { validateStatusUpdate } from '../validation/lifecycle.validation.js';
import { validateReschedule } from '../validation/reschedule.validation.js';

function shapeOrder(o) {
  return {
    id: o._id,
    orderNumber: o.orderNumber,
    placedBy: o.placedBy,
    customer: o.customer,
    assignedAgent: o.assignedAgent,
    pickup: {
      pincode: o.pickupPincode,
      address: o.pickupAddress,
      zoneId: o.pickupZoneId,
    },
    drop: {
      pincode: o.dropPincode,
      address: o.dropAddress,
      zoneId: o.dropZoneId,
    },
    actualWeightKg: o.actualWeightKg,
    dimensions: o.dimensions,
    orderType: o.orderType,
    isCOD: o.isCOD,
    declaredValue: o.declaredValue,
    pickupCompanyName: o.pickupCompanyName,
    pickupGstin: o.pickupGstin,
    dropCompanyName: o.dropCompanyName,
    dropGstin: o.dropGstin,
    pricing: o.pricing,
    currentStatus: o.currentStatus,
    scheduledDeliveryDate: o.scheduledDeliveryDate,
    lastFailureReason: o.lastFailureReason,
    createdAt: o.createdAt,
    updatedAt: o.updatedAt,
  };
}

export const orderController = {
  async quote(req, res) {
    const { validateQuote } = await import('../validation/order.validation.js');
    const { quoteForPincodes } = await import('../services/rate.service.js');
    const input = validateQuote(req.body);
    const result = await quoteForPincodes(input);
    res.json({
      success: true,
      data: {
        pickupZoneId: result.pickupZoneId,
        dropZoneId: result.dropZoneId,
        pricing: result.pricing,
      },
      message: 'Quote generated',
    });
  },

  async create(req, res) {
    if (!req.body.customerEmail && req.user?.email) {
      req.body.customerEmail = req.user.email;
    }
    const input = validateCreateOrder(req.body);
    const order = await createOrder({ caller: req.user, input });
    res.status(201).json({
      success: true,
      data: shapeOrder(order),
      message: 'Order created',
    });
  },

  async getById(req, res) {
    const order = await getOrderForUser({
      caller: req.user,
      orderId: req.params.id,
    });
    res.json({ success: true, data: shapeOrder(order) });
  },

  async list(req, res) {
    const { items, total, page, limit, pages } = await listOrdersForUser({
      caller: req.user,
      query: req.query,
    });
    res.json({
      success: true,
      data: {
        items: items.map(shapeOrder),
        pagination: { total, page, limit, pages },
      },
    });
  },

  async timeline(req, res) {
    const events = await getTimelineForUser({
      caller: req.user,
      orderId: req.params.id,
    });
    res.json({
      success: true,
      data: {
        items: events.map((t) => ({
          id: t._id,
          fromStatus: t.fromStatus,
          toStatus: t.toStatus,
          actorRole: t.actorRole,
          location: t.location,
          failureReason: t.failureReason,
          note: t.note,
          changedAt: t.changedAt,
          scheduledDeliveryDate: t.scheduledDeliveryDate,
        })),
      },
    });
  },

  async dispatch(req, res) {
    const orderId = validateObjectId(req.params.id, 'orderId');
    const order = await dispatchOrder({ caller: req.user, orderId });
    res.json({
      success: true,
      data: shapeOrder(order),
      message: 'Order dispatched',
    });
  },

  async updateStatus(req, res) {
    const orderId = validateObjectId(req.params.id, 'orderId');
    const input = validateStatusUpdate(req.body);
    const order = await transitionOrder({
      caller: req.user,
      orderId,
      toStatus: input.status,
      failureReason: input.failureReason,
      location: input.location,
      note: input.note,
      deliveryOtp: input.deliveryOtp,
    });
    res.json({
      success: true,
      data: shapeOrder(order),
      message: 'Status updated',
    });
  },

  async reschedule(req, res) {
    const orderId = validateObjectId(req.params.id, 'orderId');
    const { newDeliveryDate } = validateReschedule(req.body);
    const { order, reassigned } = await rescheduleOrder({
      caller: req.user,
      orderId,
      newDeliveryDate,
    });
    res.json({
      success: true,
      data: {
        ...shapeOrder(order),
        reassigned,
      },
      message: reassigned
        ? 'Order rescheduled and assigned to a new agent'
        : 'Order rescheduled — awaiting agent assignment',
    });
  },
};