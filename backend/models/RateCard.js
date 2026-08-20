const mongoose = require('mongoose');

/**
 * RateCard
 *
 * Pure configuration: the rate engine reads from here and nowhere else.
 * No hardcoded rates in services or controllers.
 *
 * The (orderType, tripType, baseWeight) tuple identifies a pricing tier.
 * baseWeight is the lower bound of billable weight this card applies to;
 * weight above that is billed at additionalPerKgRate per kg.
 *
 * tripType is derived from the order: same zone -> INTRA_ZONE, different
 * zones -> INTER_ZONE. The spec also requires B2B vs B2C, so the pair
 * (orderType, tripType) fully scopes a rate card.
 */
const rateCardSchema = new mongoose.Schema(
  {
    orderType: {
      type: String,
      enum: {
        values: ['B2B', 'B2C'],
        message: 'orderType must be B2B or B2C',
      },
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

    // Lower bound of billable weight (kg) this card applies to.
    // Service will pick the card with the highest baseWeight <= billableWeight.
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

// Lookup pattern: find the rate card matching (orderType, tripType) where
// baseWeight <= billableWeight. The service will sort by baseWeight desc and
// pick the first match. Compound index supports that scan.
rateCardSchema.index({
  orderType: 1,
  tripType: 1,
  baseWeight: -1,
  isActive: 1,
});

module.exports = mongoose.model('RateCard', rateCardSchema);
