import mongoose from 'mongoose';

import Order from '../models/Order.js';
import OrderTimeline from '../models/OrderTimeline.js';
import User from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';
import { ORDER_STATUS } from '../models/constants/OrderStatus.js';
import { quoteForPincodes } from './rate.service.js';
import { nextOrderNumber } from './orderNumber.service.js';

export async function createOrder({ caller, input }) {
  const { orderType, pickupPincode, dropPincode, pickupAddress, dropAddress,
    customerEmail, scheduledDeliveryDate, parcel, isCOD, declaredValue,
    pickupCompanyName, pickupGstin, dropCompanyName, dropGstin } = input;

  // Resolve customer: CUSTOMER creates for self; ADMIN can place on behalf via email.
  let customer;
  if (caller.role === 'CUSTOMER') {
    customer = await User.findById(caller.id);
    if (!customer) throw ApiError.unauthorized();
    // Defense: ensure the body didn't try to spoof a different email.
    if (customerEmail && customerEmail !== customer.email) {
      throw ApiError.forbidden('customerEmail does not match the authenticated customer');
    }
  } else if (caller.role === 'ADMIN') {
    customer = await User.findOne({ email: customerEmail });
    if (!customer) throw ApiError.notFound('Customer not found');
  } else {
    throw ApiError.forbidden('Only CUSTOMER or ADMIN can create orders');
  }

  // Re-quote for the canonical pricing snapshot. We do not trust the client
  // to send price; we recompute from RateCards.
  const { pickupZoneId, dropZoneId, pricing } = await quoteForPincodes({
    orderType,
    parcel,
    isCOD,
    declaredValue,
    pickupPincode,
    dropPincode,
  });

  const orderNumber = await nextOrderNumber();

  const orderDoc = {
    orderNumber,
    placedBy: new mongoose.Types.ObjectId(caller.id),
    customer: customer._id,
    pickupPincode,
    pickupAddress,
    pickupZoneId,
    dropPincode,
    dropAddress,
    dropZoneId,
    actualWeightKg: parcel.actualWeightKg,
    dimensions: parcel.dimensions,
    orderType,
    isCOD,
    declaredValue: isCOD ? declaredValue : null,
    pickupCompanyName: orderType === 'B2B' ? pickupCompanyName : null,
    pickupGstin: orderType === 'B2B' ? pickupGstin : null,
    dropCompanyName: orderType === 'B2B' ? dropCompanyName : null,
    dropGstin: orderType === 'B2B' ? dropGstin : null,
    pricing,
    currentStatus: ORDER_STATUS.CREATED,
    scheduledDeliveryDate,
    lastFailureReason: null,
  };

  // Atomic: Order create + OrderTimeline insert must commit together.
  const session = await mongoose.startSession();
  let createdOrder;
  try {
    await session.withTransaction(async () => {
      const [order] = await Order.create([orderDoc], { session });
      createdOrder = order;

      await OrderTimeline.create([{
        orderId: order._id,
        fromStatus: null,
        toStatus: ORDER_STATUS.CREATED,
        actorId: caller.id,
        actorRole: caller.role,
        customerEmail: customer.email,
        orderNumber: order.orderNumber,
        scheduledDeliveryDate: order.scheduledDeliveryDate,
      }], { session });
    });
  } finally {
    await session.endSession();
  }

  return createdOrder;
}

export async function getOrderForUser({ caller, orderId }) {
  let order;
  try {
    order = await Order.findById(orderId);
  } catch (e) {
    throw ApiError.badRequest('Invalid order id');
  }
  if (!order) throw ApiError.notFound('Order not found');

  // ADMIN sees everything.
  if (caller.role === 'ADMIN') return order;

  // CUSTOMER sees only their own orders.
  if (caller.role === 'CUSTOMER') {
    if (order.customer.toString() !== caller.id) {
      throw ApiError.forbidden('You do not have access to this order');
    }
    return order;
  }

  // AGENT sees only orders assigned to them.
  if (caller.role === 'AGENT') {
    if (!order.assignedAgent || order.assignedAgent.toString() !== caller.id) {
      throw ApiError.forbidden('You do not have access to this order');
    }
    return order;
  }

  throw ApiError.forbidden('You do not have access to this order');
}
