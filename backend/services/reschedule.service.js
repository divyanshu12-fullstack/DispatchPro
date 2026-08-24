import mongoose from 'mongoose';

import Order from '../models/Order.js';
import OrderTimeline from '../models/OrderTimeline.js';
import User from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';
import { ORDER_STATUS } from '../models/constants/OrderStatus.js';
import { sendRescheduledEmail } from './email.service.js';
import { attemptAssignment } from './dispatch.service.js';

/**
 * Customer/Admin reschedule of a FAILED delivery.
 *
 * Contract (per spec):
 * 1. Only the owning CUSTOMER or an ADMIN may reschedule; order must be FAILED.
 * 2. One transaction commits: FAILED → RESCHEDULED timeline row + order reset
 *    to CREATED with the new date, cleared agent, and cleared retry state.
 * 3. Post-commit: rescheduled email fires first, then assignment is attempted
 *    in-request. No free agent is a graceful outcome — the sweep retries.
 *
 * Agent-slot bookkeeping is intentionally absent: the assigned agent was
 * already released when the order transitioned to FAILED (lifecycle.service).
 * failedAttemptCount is deliberately NOT reset — it is the lifetime count
 * driving the FAILED vs RETURN_TO_ORIGIN cap.
 */
export async function rescheduleOrder({ caller, orderId, newDeliveryDate }) {
  if (caller.role === 'AGENT') {
    throw ApiError.forbidden('Agents cannot reschedule orders');
  }

  const order = await Order.findById(orderId);
  if (!order) throw ApiError.notFound('Order not found');

  if (
    caller.role === 'CUSTOMER' &&
    order.customer.toString() !== caller.id
  ) {
    throw ApiError.forbidden('You do not have access to this order');
  }

  if (order.currentStatus !== ORDER_STATUS.FAILED) {
    throw ApiError.conflict(
      `Order is ${order.currentStatus} — only FAILED orders can be rescheduled`
    );
  }

  const customer = await User.findById(order.customer).lean();

  const session = await mongoose.startSession();
  let updatedOrder;
  let timeline;
  try {
    await session.withTransaction(async () => {
      // Status guard inside the filter: two concurrent reschedules of the
      // same FAILED order must not both commit.
      updatedOrder = await Order.findOneAndUpdate(
        { _id: orderId, currentStatus: ORDER_STATUS.FAILED },
        {
          $set: {
            currentStatus: ORDER_STATUS.CREATED,
            scheduledDeliveryDate: newDeliveryDate,
            assignedAgent: null,
            assignmentAttempts: 0,
            needsManualAttention: false,
            deliveryOtpHash: null,
            deliveryOtpExpiresAt: null,
          },
        },
        { session, new: true },
      );

      if (!updatedOrder) {
        throw ApiError.conflict('Order status changed concurrently — retry');
      }

      [timeline] = await OrderTimeline.create([{
        orderId: order._id,
        fromStatus: ORDER_STATUS.FAILED,
        toStatus: ORDER_STATUS.RESCHEDULED,
        actorId: caller.id,
        actorRole: caller.role,
        note: `Rescheduled by customer for ${newDeliveryDate.toISOString()}`,
        customerEmail: customer?.email ?? '',
        orderNumber: order.orderNumber,
        scheduledDeliveryDate: newDeliveryDate,
      }], { session });
    });
  } finally {
    await session.endSession();
  }

  // Post-commit: email first (fire-and-log), then assignment in-request.
  sendRescheduledEmail({ timeline }).catch((e) =>
    console.error('[reschedule] unexpected sendRescheduledEmail rejection:', e),
  );

  // The retry sweep may assign this order in the window between our commit
  // and this call; that race must not surface as a failed request.
  let assignment = null;
  try {
    assignment = await attemptAssignment(orderId, caller.id, caller.role);
  } catch (e) {
    if (e.statusCode !== 409) throw e;
  }

  return {
    order: assignment ? assignment.order : updatedOrder,
    reassigned: Boolean(assignment),
  };
}
