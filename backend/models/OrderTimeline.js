const mongoose = require('mongoose');
const { ORDER_STATUS_VALUES } = require('./constants/OrderStatus');

/**
 * OrderTimeline
 *
 * Append-only audit log for order lifecycle transitions.
 *
 * Invariant (enforced by convention, not by Mongoose): documents in this
 * collection must NEVER be updated or deleted as part of normal application
 * behavior. Every state change produces a NEW row inside the same MongoDB
 * transaction that updates Order.currentStatus.
 *
 * Why denormalized snapshot fields?
 *   The post-commit notification service (future step) reads the just-
 *   inserted timeline row to render the customer email. By carrying
 *   customerEmail, orderNumber, and scheduledDeliveryDate here, the email
 *   service avoids a fragile re-query against mutable Order/User state.
 *
 * Timestamps:
 *   Only `changedAt` is meaningful — append-only docs don't have a useful
 *   "updatedAt" and including one would mislead readers.
 */
const orderTimelineSchema = new mongoose.Schema(
  {
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: [true, 'orderId is required'],
      index: true,
    },

    fromStatus: {
      type: String,
      enum: {
        values: [null, ...ORDER_STATUS_VALUES],
        message: `fromStatus must be null or one of: ${ORDER_STATUS_VALUES.join(', ')}`,
      },
      default: null,
      // null on the very first timeline row (CREATED with no prior status)
    },

    toStatus: {
      type: String,
      enum: {
        values: ORDER_STATUS_VALUES,
        message: `toStatus must be one of: ${ORDER_STATUS_VALUES.join(', ')}`,
      },
      required: [true, 'toStatus is required'],
    },

    actorId: {
      // Admin / Agent / System that caused the transition
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },

    actorRole: {
      type: String,
      enum: ['CUSTOMER', 'AGENT', 'ADMIN', 'SYSTEM'],
      default: 'SYSTEM',
    },

    location: {
      // Free-form when available (e.g. "Warehouse A", GPS later)
      type: String,
      default: null,
      trim: true,
      maxlength: [200, 'location is too long'],
    },

    failureReason: {
      type: String,
      default: null,
      trim: true,
      maxlength: [500, 'failureReason is too long'],
    },

    note: {
      type: String,
      default: null,
      trim: true,
      maxlength: [500, 'note is too long'],
    },

    changedAt: {
      type: Date,
      default: () => new Date(),
      required: true,
    },

    // --- Denormalized snapshot for post-commit email rendering ---
    customerEmail: {
      type: String,
      required: [true, 'customerEmail snapshot is required'],
      trim: true,
      lowercase: true,
    },
    orderNumber: {
      type: String,
      required: [true, 'orderNumber snapshot is required'],
      trim: true,
    },
    scheduledDeliveryDate: {
      type: Date,
      default: null,
    },
  },
  {
    // No `timestamps: true` — only `changedAt` exists by design.
    toJSON: {
      transform: (_doc, ret) => {
        delete ret.__v;
        // updatedAt is intentionally never present.
        return ret;
      },
    },
  }
);

// Hot read: "full history for order X, newest first"
orderTimelineSchema.index({ orderId: 1, changedAt: -1 });
// Useful for ops queries: "all events of type X in a time window"
orderTimelineSchema.index({ toStatus: 1, changedAt: -1 });

module.exports = mongoose.model('OrderTimeline', orderTimelineSchema);
