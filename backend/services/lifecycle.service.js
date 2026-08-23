import mongoose from 'mongoose';

import Order from '../models/Order.js';
import OrderTimeline from '../models/OrderTimeline.js';
import User from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';
import { ORDER_STATUS } from '../models/constants/OrderStatus.js';
import {
  isValidTransition,
  canActorTransition,
  RESCHEDULABLE_REASONS,
  MAX_FAILED_ATTEMPTS,
} from '../models/constants/StatusTransitions.js';
import {
  sendOrderStatusEmail,
  sendFailedDeliveryEmail,
  sendReturnToOriginEmail,
} from './email.service.js';
import { retryAssignmentForZone } from './dispatch.service.js';

const AGENT_RELEASE_STATUSES = new Set([
  ORDER_STATUS.DELIVERED,
  ORDER_STATUS.FAILED,
  ORDER_STATUS.RETURN_TO_ORIGIN,
]);

/**
 * Resolve the actual destination status when the agent reports FAILED.
 * Non-reschedulable reasons → RETURN_TO_ORIGIN immediately.
 * Reschedulable reasons hitting the cap → RETURN_TO_ORIGIN.
 * Otherwise → FAILED (customer can reschedule).
 */
function resolveFailureStatus(failureReason, currentFailedAttemptCount) {
  if (!RESCHEDULABLE_REASONS.includes(failureReason)) {
    return ORDER_STATUS.RETURN_TO_ORIGIN;
  }
  if (currentFailedAttemptCount + 1 >= MAX_FAILED_ATTEMPTS) {
    return ORDER_STATUS.RETURN_TO_ORIGIN;
  }
  return ORDER_STATUS.FAILED;
}

/**
 * Generic order status transition.
 *
 * - Validates the transition against the state machine
 * - Enforces role-based access (AGENT must be the assigned agent)
 * - Routes FAILED requests through failure-reason logic
 * - Atomic: Order update + OrderTimeline + agent release in one transaction
 * - Post-commit: email notification + event-triggered assignment retry
 */
export async function transitionOrder({ caller, orderId, toStatus, failureReason, location, note }) {
  const order = await Order.findById(orderId);
  if (!order) throw ApiError.notFound('Order not found');

  const fromStatus = order.currentStatus;

  let actualToStatus = toStatus;
  if (toStatus === ORDER_STATUS.FAILED) {
    actualToStatus = resolveFailureStatus(failureReason, order.failedAttemptCount);
  }

  if (!isValidTransition(fromStatus, actualToStatus)) {
    throw ApiError.unprocessable(
      `Cannot transition from ${fromStatus} to ${actualToStatus}`,
    );
  }

  if (!canActorTransition(actualToStatus, caller.role)) {
    throw ApiError.forbidden(`Role ${caller.role} cannot perform this transition`);
  }

  if (caller.role === 'AGENT') {
    if (!order.assignedAgent || order.assignedAgent.toString() !== caller.id) {
      throw ApiError.forbidden('You are not the assigned agent for this order');
    }
  }

  const customer = await User.findById(order.customer).lean();

  const $set = { currentStatus: actualToStatus };
  const $inc = {};

  if (actualToStatus === ORDER_STATUS.FAILED || actualToStatus === ORDER_STATUS.RETURN_TO_ORIGIN) {
    $set.lastFailureReason = failureReason;
    $inc.failedAttemptCount = 1;
  }

  const session = await mongoose.startSession();
  let updatedOrder;
  let timeline;
  try {
    await session.withTransaction(async () => {
      updatedOrder = await Order.findOneAndUpdate(
        { _id: orderId, currentStatus: fromStatus },
        { $set, ...(Object.keys($inc).length ? { $inc } : {}) },
        { session, new: true },
      );

      if (!updatedOrder) {
        throw ApiError.conflict('Order status changed concurrently — retry');
      }

      [timeline] = await OrderTimeline.create([{
        orderId: order._id,
        fromStatus,
        toStatus: actualToStatus,
        actorId: caller.id,
        actorRole: caller.role,
        location,
        failureReason: failureReason || null,
        note: note || null,
        customerEmail: customer?.email ?? '',
        orderNumber: order.orderNumber,
        scheduledDeliveryDate: order.scheduledDeliveryDate,
      }], { session });

      if (AGENT_RELEASE_STATUSES.has(actualToStatus) && order.assignedAgent) {
        await User.updateOne(
          { _id: order.assignedAgent },
          { $inc: { currentActiveDeliveriesCount: -1 } },
          { session },
        );
      }
    });
  } finally {
    await session.endSession();
  }

  // Post-commit: email notification (fire-and-log, never blocks response).
  if (actualToStatus === ORDER_STATUS.FAILED) {
    sendFailedDeliveryEmail({ timeline }).catch((e) =>
      console.error('[lifecycle] unexpected sendFailedDeliveryEmail rejection:', e),
    );
  } else if (actualToStatus === ORDER_STATUS.RETURN_TO_ORIGIN) {
    sendReturnToOriginEmail({ timeline }).catch((e) =>
      console.error('[lifecycle] unexpected sendReturnToOriginEmail rejection:', e),
    );
  } else {
    sendOrderStatusEmail({ timeline }).catch((e) =>
      console.error('[lifecycle] unexpected sendOrderStatusEmail rejection:', e),
    );
  }

  // Post-commit: when an agent is freed, try to assign waiting orders in the zone.
  if (AGENT_RELEASE_STATUSES.has(actualToStatus) && order.assignedAgent) {
    retryAssignmentForZone(order.pickupZoneId).catch((e) =>
      console.error('[lifecycle] unexpected retryAssignmentForZone rejection:', e),
    );
  }

  return updatedOrder;
}
