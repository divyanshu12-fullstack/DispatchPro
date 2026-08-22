import mongoose from 'mongoose';
import { ORDER_STATUS, ORDER_STATUS_VALUES } from './constants/OrderStatus.js';

const PINCODE_REGEX = /^\d{4,8}$/;

const orderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: String,
      required: [true, 'orderNumber is required'],
      unique: true,
      trim: true,
      index: true,
    },

    placedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'placedBy is required'],
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'customer is required'],
      index: true,
    },
    assignedAgent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },

    pickupPincode: {
      type: String,
      required: [true, 'pickupPincode is required'],
      trim: true,
      match: [PINCODE_REGEX, 'pickupPincode must be 4–8 digits'],
    },
    pickupAddress: {
      type: String,
      required: [true, 'pickupAddress is required'],
      trim: true,
      maxlength: [500, 'pickupAddress is too long'],
    },
    pickupZoneId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Zone',
      required: [true, 'pickupZoneId is required'],
      index: true,
    },

    dropPincode: {
      type: String,
      required: [true, 'dropPincode is required'],
      trim: true,
      match: [PINCODE_REGEX, 'dropPincode must be 4–8 digits'],
    },
    dropAddress: {
      type: String,
      required: [true, 'dropAddress is required'],
      trim: true,
      maxlength: [500, 'dropAddress is too long'],
    },
    dropZoneId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Zone',
      required: [true, 'dropZoneId is required'],
      index: true,
    },

    actualWeightKg: {
      type: Number,
      required: [true, 'actualWeightKg is required'],
      min: [0, 'actualWeightKg cannot be negative'],
    },
    dimensions: {
      lengthCm: { type: Number, required: true, min: [0, 'lengthCm cannot be negative'] },
      breadthCm: { type: Number, required: true, min: [0, 'breadthCm cannot be negative'] },
      heightCm: { type: Number, required: true, min: [0, 'heightCm cannot be negative'] },
    },

    orderType: {
      type: String,
      enum: { values: ['B2B', 'B2C'], message: 'orderType must be B2B or B2C' },
      required: [true, 'orderType is required'],
    },
    isCOD: {
      type: Boolean,
      default: false,
    },
    declaredValue: {
      type: Number,
      default: null,
      min: [0, 'declaredValue cannot be negative'],
    },

    pricing: {
      volumetricWeightKg: { type: Number, required: true, min: 0 },
      billableWeightKg: { type: Number, required: true, min: 0 },
      tripType: {
        type: String,
        enum: ['INTRA_ZONE', 'INTER_ZONE'],
        required: true,
      },
      baseRate: { type: Number, required: true, min: 0 },
      additionalWeightCharge: { type: Number, required: true, min: 0 },
      codSurcharge: { type: Number, required: true, min: 0 },
      totalAmount: { type: Number, required: true, min: 0 },
      currency: { type: String, default: 'INR', uppercase: true, maxlength: 3 },
    },

    currentStatus: {
      type: String,
      enum: {
        values: ORDER_STATUS_VALUES,
        message: `currentStatus must be one of: ${ORDER_STATUS_VALUES.join(', ')}`,
      },
      default: ORDER_STATUS.CREATED,
      required: true,
      index: true,
    },

    scheduledDeliveryDate: {
      type: Date,
      required: [true, 'scheduledDeliveryDate is required'],
    },

    lastFailureReason: {
      type: String,
      default: null,
      trim: true,
      maxlength: [500, 'lastFailureReason is too long'],
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret) => {
        delete ret.__v;
        return ret;
      },
    },
  }
);

orderSchema.index({ customer: 1, createdAt: -1 });
orderSchema.index({ assignedAgent: 1, createdAt: -1 });
orderSchema.index({ currentStatus: 1, pickupZoneId: 1, createdAt: 1 });

export default mongoose.model('Order', orderSchema);