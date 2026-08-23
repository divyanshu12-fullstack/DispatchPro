import { createOrder, getOrderForUser } from '../services/order.service.js';
import { dispatchOrder } from '../services/dispatch.service.js';
import { validateCreateOrder } from '../validation/order.validation.js';
import { validateObjectId } from '../validation/dispatch.validation.js';

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

  async dispatch(req, res) {
    const orderId = validateObjectId(req.params.id, 'orderId');
    const order = await dispatchOrder({ caller: req.user, orderId });
    res.json({
      success: true,
      data: shapeOrder(order),
      message: 'Order dispatched',
    });
  },
};