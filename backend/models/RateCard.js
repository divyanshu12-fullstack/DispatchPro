import mongoose from 'mongoose';

const rateCardSchema = new mongoose.Schema(
  {
    orderType: {
      type: String,
      enum: { values: ['B2B', 'B2C'], message: 'orderType must be B2B or B2C' },
      required: [true, 'orderType is required'],
    },
    tripType: {
      type: String,
      enum: {
        values: ['INTRA_ZONE', 'INTER_ZONE'],
        message: 'tripType must be INTRA_ZONE or INTER_ZONE',
      },
      required: [true, 'tripType is required'],
    },
    baseWeight: {
      type: Number,
      required: [true, 'baseWeight is required'],
      min: [0, 'baseWeight cannot be negative'],
    },
    baseRate: {
      type: Number,
      required: [true, 'baseRate is required'],
      min: [0, 'baseRate cannot be negative'],
    },
    additionalPerKgRate: {
      type: Number,
      required: [true, 'additionalPerKgRate is required'],
      min: [0, 'additionalPerKgRate cannot be negative'],
    },
    codSurchargeFixed: {
      type: Number,
      required: [true, 'codSurchargeFixed is required'],
      min: [0, 'codSurchargeFixed cannot be negative'],
    },
    codSurchargePercent: {
      type: Number,
      required: [true, 'codSurchargePercent is required'],
      min: [0, 'codSurchargePercent cannot be negative'],
      max: [100, 'codSurchargePercent must be 0–100'],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

rateCardSchema.index({
  orderType: 1,
  tripType: 1,
  baseWeight: -1,
  isActive: 1,
});

export default mongoose.model('RateCard', rateCardSchema);