import mongoose from 'mongoose';
import { ORDER_STATUS_VALUES } from './constants/OrderStatus.js';

// Append-only audit log. By convention these docs are never updated or
// deleted in normal application flow. Schema exposes only `changedAt`
// (no `updatedAt`) to reinforce that.
//
// `customerEmail`, `orderNumber`, and `scheduledDeliveryDate` are
// denormalized snapshots so the post-commit email service (Step 8) can
// render from the just-inserted row without re-querying mutable state.
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
    toJSON: {
      transform: (_doc, ret) => {
        delete ret.__v;
        return ret;
      },
    },
  }
);

orderTimelineSchema.index({ orderId: 1, changedAt: -1 });
orderTimelineSchema.index({ toStatus: 1, changedAt: -1 });

export default mongoose.model('OrderTimeline', orderTimelineSchema);