/**
 * Single source of truth for order status values.
 *
 * The kickoff spec mandates EXACTLY these eight values — no aliases, no extras.
 * Both Order.currentStatus and OrderTimeline.{fromStatus,toStatus} import from here,
 * and the future state machine will use the same list to validate transitions.
 *
 * If you ever feel tempted to add a value, stop: the lifecycle below is closed.
 */
const ORDER_STATUS = Object.freeze({
  CREATED: 'CREATED',
  ASSIGNED: 'ASSIGNED',
  PICKED_UP: 'PICKED_UP',
  IN_TRANSIT: 'IN_TRANSIT',
  OUT_FOR_DELIVERY: 'OUT_FOR_DELIVERY',
  DELIVERED: 'DELIVERED',
  FAILED: 'FAILED',
  RESCHEDULED: 'RESCHEDULED',
});

const ORDER_STATUS_VALUES = Object.freeze(Object.values(ORDER_STATUS));

module.exports = { ORDER_STATUS, ORDER_STATUS_VALUES };
