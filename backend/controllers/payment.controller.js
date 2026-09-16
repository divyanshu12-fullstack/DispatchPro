import mongoose from 'mongoose';

import Order from '../models/Order.js';
import OrderTimeline from '../models/OrderTimeline.js';
import User from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';
import { validateObjectId } from '../validation/dispatch.validation.js';
import {
  createRazorpayOrder as createRazorpayOrderForDoc,
  isPaymentGatewayConfigured,
  paymentAmountForOrder,
  verifyPaymentSignature,
} from '../services/payment.service.js';
import { RAZORPAY_KEY_ID } from '../config/env.js';
import { attemptAssignment } from '../services/dispatch.service.js';

function shapePaymentInit(order) {
  const { amount, currency, totalAmount } = paymentAmountForOrder(order);
  return {
    orderId: order._id,
    orderNumber: order.orderNumber,
    razorpayOrderId: order.razorpayOrderId,
    amount,
    currency,
    totalAmount,
    keyId: RAZORPAY_KEY_ID,
  };
}

/**
 * Same visibility rule as getOrderForUser: ADMIN everything, CUSTOMER own
 * orders only. Agents can never pay for an order.
 */
function assertCanPay({ caller, order }) {
  if (caller.role === 'ADMIN') return;
  if (caller.role === 'CUSTOMER') {
    if (order.customer.toString() !== caller.id) {
      throw ApiError.forbidden('You do not have access to this order');
    }
    return;
  }
  throw ApiError.forbidden('You do not have access to this order');
}

export const paymentController = {
  async createRazorpayOrder(req, res) {
    const orderId = validateObjectId(req.params.orderId, 'orderId');

    const order = await Order.findById(orderId);
    if (!order) throw ApiError.notFound('Order not found');
    assertCanPay({ caller: req.user, order });

    if (order.isCOD) {
      throw ApiError.unprocessable('COD orders do not require online payment');
    }
    if (order.paymentStatus === 'PAID') {
      throw ApiError.conflict('Order payment is already captured');
    }
    if (!isPaymentGatewayConfigured()) {
      throw ApiError.unprocessable('Payment gateway not configured');
    }

    await createRazorpayOrderForDoc({ order });

    res.status(201).json({
      success: true,
      data: shapePaymentInit(order),
      message: 'Razorpay order created',
    });
  },

  async verify(req, res) {
    const orderId = validateObjectId(req.params.orderId, 'orderId');
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body || {};

    if (!razorpayPaymentId || !razorpaySignature) {
      throw ApiError.unprocessable('Validation failed', {
        razorpayPaymentId: !razorpayPaymentId ? 'razorpayPaymentId is required' : undefined,
        razorpaySignature: !razorpaySignature ? 'razorpaySignature is required' : undefined,
      });
    }

    const order = await Order.findById(orderId);
    if (!order) throw ApiError.notFound('Order not found');
    assertCanPay({ caller: req.user, order });

    if (order.isCOD) {
      throw ApiError.unprocessable('COD orders do not require online payment');
    }
    if (order.paymentStatus === 'PAID') {
      throw ApiError.conflict('Order payment is already captured');
    }
    if (!order.razorpayOrderId) {
      throw ApiError.unprocessable('No Razorpay order exists for this order yet');
    }
    // If the client echoes the razorpay order id, it must match our record.
    if (razorpayOrderId && razorpayOrderId !== order.razorpayOrderId) {
      throw ApiError.unprocessable('Payment signature verification failed');
    }

    const ok = verifyPaymentSignature({
      razorpayOrderId: order.razorpayOrderId,
      razorpayPaymentId,
      signature: razorpaySignature,
    });

    if (!ok) {
      order.paymentStatus = 'FAILED';
      await order.save();
      throw ApiError.unprocessable('Payment signature verification failed');
    }

    const customer = await User.findById(order.customer).lean();

    const session = await mongoose.startSession();
    let updatedOrder;
    try {
      await session.withTransaction(async () => {
        updatedOrder = await Order.findOneAndUpdate(
          { _id: orderId },
          {
            $set: {
              paymentStatus: 'PAID',
              razorpayPaymentId,
            },
          },
          { session, new: true },
        );

        if (!updatedOrder) {
          throw ApiError.conflict('Order changed concurrently — retry');
        }

        await OrderTimeline.create([{
          orderId: order._id,
          fromStatus: order.currentStatus,
          toStatus: order.currentStatus,
          actorId: req.user.id,
          actorRole: req.user.role,
          note: 'Payment captured via Razorpay (test mode)',
          customerEmail: order.customerEmail || customer?.email || '',
          orderNumber: order.orderNumber,
          scheduledDeliveryDate: order.scheduledDeliveryDate,
        }], { session });
      });
    } finally {
      await session.endSession();
    }

    // Post-commit: try to assign an agent right away (same pattern as
    // reschedule). No free agent is graceful — the sweep retries. Unpaid-guard
    // races surface as 409 and must not fail the payment response.
    let assignment = null;
    try {
      assignment = await attemptAssignment(orderId, req.user.id, req.user.role);
    } catch (e) {
      if (e.statusCode !== 409) throw e;
    }

    res.json({
      success: true,
      data: {
        orderId: updatedOrder._id,
        orderNumber: updatedOrder.orderNumber,
        paymentStatus: updatedOrder.paymentStatus,
        razorpayPaymentId: updatedOrder.razorpayPaymentId,
        assigned: Boolean(assignment),
      },
      message: assignment
        ? 'Payment verified and agent assigned'
        : 'Payment verified — awaiting agent assignment',
    });
  },
};
