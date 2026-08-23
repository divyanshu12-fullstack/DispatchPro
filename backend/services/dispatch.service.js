import mongoose from 'mongoose';

import Order from '../models/Order.js';
import OrderTimeline from '../models/OrderTimeline.js';
import User from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';
import { ORDER_STATUS } from '../models/constants/OrderStatus.js';
import { sendOrderStatusEmail } from './email.service.js';

const MAX_ASSIGNMENT_ATTEMPTS = 3;
const SWEEP_INTERVAL_MS = 5 * 60 * 1000;

/**
 * Atomically claim the least-loaded available agent in the given zone.
 * Returns the agent document (post-increment) or null if none available.
 *
 * Race-safety: findOneAndUpdate is document-level atomic in MongoDB.
 * Two concurrent calls competing for the same agent will serialize —
 * the loser either sees the updated count (and skips if at capacity)
 * or picks a different agent.
 */
async function claimAgent(pickupZoneId) {
  return User.findOneAndUpdate(
    {
      role: 'AGENT',
      isAvailable: true,
      assignedZoneId: pickupZoneId,
      $expr: { $lt: ['$currentActiveDeliveriesCount', '$maxCapacity'] },
    },
    { $inc: { currentActiveDeliveriesCount: 1 } },
    { new: true, sort: { currentActiveDeliveriesCount: 1 } },
  );
}

/**
 * Compensating decrement — called when the Order+Timeline transaction fails
 * after the agent was already claimed.
 */
async function releaseAgentSlot(agentId) {
  await User.updateOne(
    { _id: agentId },
    { $inc: { currentActiveDeliveriesCount: -1 } },
  );
}

/**
 * Core assignment logic. Safe to call repeatedly and concurrently.
 * Returns { order, timeline } on success, or null if no agent is available.
 * Throws on unexpected errors (order not found, wrong status, DB failure).
 */
export async function attemptAssignment(orderId, actorId = null, actorRole = 'SYSTEM') {
  const order = await Order.findById(orderId);
  if (!order) throw ApiError.notFound('Order not found');

  if (order.currentStatus !== ORDER_STATUS.CREATED) {
    throw ApiError.conflict(`Order is ${order.currentStatus}, expected CREATED`);
  }

  const agent = await claimAgent(order.pickupZoneId);
  if (!agent) return null;

  const session = await mongoose.startSession();
  let updatedOrder;
  let timeline;
  try {
    await session.withTransaction(async () => {
      updatedOrder = await Order.findOneAndUpdate(
        { _id: orderId, currentStatus: ORDER_STATUS.CREATED },
        {
          $set: {
            assignedAgent: agent._id,
            currentStatus: ORDER_STATUS.ASSIGNED,
          },
        },
        { session, new: true },
      );

      if (!updatedOrder) {
        await releaseAgentSlot(agent._id);
        throw ApiError.conflict('Order was already assigned by another dispatch');
      }

      const customer = await User.findById(order.customer).lean();

      [timeline] = await OrderTimeline.create([{
        orderId: order._id,
        fromStatus: ORDER_STATUS.CREATED,
        toStatus: ORDER_STATUS.ASSIGNED,
        actorId,
        actorRole,
        customerEmail: customer?.email ?? '',
        orderNumber: order.orderNumber,
        scheduledDeliveryDate: order.scheduledDeliveryDate,
        note: `Assigned to agent ${agent.fullName}`,
      }], { session });
    });
  } catch (err) {
    if (!updatedOrder) {
      await releaseAgentSlot(agent._id);
    }
    throw err;
  } finally {
    await session.endSession();
  }

  sendOrderStatusEmail({ timeline }).catch((e) =>
    console.error('[dispatch] unexpected sendOrderStatusEmail rejection:', e),
  );

  return { order: updatedOrder, timeline };
}

/**
 * Admin-triggered dispatch. Validates the order and delegates to attemptAssignment.
 */
export async function dispatchOrder({ caller, orderId }) {
  const result = await attemptAssignment(orderId, caller.id, caller.role);
  if (!result) {
    throw ApiError.unprocessable('No available agent in the pickup zone');
  }
  return result.order;
}

/**
 * Sweep: re-attempt assignment for CREATED orders that haven't exhausted retries.
 * Increments assignmentAttempts on each pass. After MAX_ASSIGNMENT_ATTEMPTS
 * consecutive failures, sets needsManualAttention so admins can intervene.
 */
export async function sweepUnassignedOrders() {
  const orders = await Order.find({
    currentStatus: ORDER_STATUS.CREATED,
    assignmentAttempts: { $lt: MAX_ASSIGNMENT_ATTEMPTS },
    needsManualAttention: false,
  }).lean();

  for (const order of orders) {
    try {
      const result = await attemptAssignment(order._id);
      if (result) {
        console.log(`[sweep] assigned order ${order.orderNumber}`);
      } else {
        const attempts = order.assignmentAttempts + 1;
        const update = { assignmentAttempts: attempts };
        if (attempts >= MAX_ASSIGNMENT_ATTEMPTS) {
          update.needsManualAttention = true;
          console.log(`[sweep] order ${order.orderNumber} exhausted retries, flagged for manual attention`);
        }
        await Order.updateOne({ _id: order._id }, { $set: update });
      }
    } catch (e) {
      if (e.statusCode === 409) continue;
      console.error(`[sweep] failed for order ${order._id}:`, e.message);
    }
  }
}

/**
 * Event-triggered retry: called when an agent becomes available (delivery
 * completed, agent toggled available). Attempts assignment for all CREATED
 * orders in the agent's zone.
 */
export async function retryAssignmentForZone(zoneId) {
  const orders = await Order.find({
    currentStatus: ORDER_STATUS.CREATED,
    pickupZoneId: zoneId,
    needsManualAttention: false,
  }).lean();

  for (const order of orders) {
    try {
      const result = await attemptAssignment(order._id);
      if (result) {
        console.log(`[event-retry] assigned order ${order.orderNumber}`);
      }
    } catch (e) {
      if (e.statusCode === 409) continue;
      console.error(`[event-retry] failed for order ${order._id}:`, e.message);
    }
  }
}

let sweepTimer = null;

export function startAssignmentSweep() {
  if (sweepTimer) return;
  console.log(`[sweep] started, interval=${SWEEP_INTERVAL_MS}ms`);
  sweepTimer = setInterval(() => {
    sweepUnassignedOrders().catch((e) =>
      console.error('[sweep] unexpected rejection:', e),
    );
  }, SWEEP_INTERVAL_MS);
  sweepTimer.unref();
}

export function stopAssignmentSweep() {
  if (sweepTimer) {
    clearInterval(sweepTimer);
    sweepTimer = null;
  }
}
