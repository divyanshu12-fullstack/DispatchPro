const mongoose = require('mongoose');

/**
 * Area
 *
 * Represents a pincode and its parent zone. Pincodes are the input to
 * zone resolution — both for rate calculation and for matching an order's
 * pickup zone to an agent's assignedZoneId. The pincode field is therefore
 * uniquely indexed for O(1) lookup.
 *
 * Per the spec: pincode mappings are NOT hardcoded in application logic.
 * Everything resolves through this collection.
 */
const PINCODE_REGEX = /^\d{4,8}$/; // 4–8 digits; loose enough to cover international if needed

const areaSchema = new mongoose.Schema(
  {
    pincode: {
      type: String,
      required: [true, 'Pincode is required'],
      unique: true,
      trim: true,
      match: [PINCODE_REGEX, 'Pincode must be 4–8 digits'],
    },

    zoneId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Zone',
      required: [true, 'Area must belong to a Zone'],
      index: true,
    },

    city: {
      type: String,
      trim: true,
      default: null,
    },

    state: {
      type: String,
      trim: true,
      default: null,
    },

    isServiceable: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// Pincode is already `unique: true` which creates an index; explicit name
// documents intent so future readers know the lookup hot path.
areaSchema.index({ pincode: 1 }, { unique: true, name: 'pincode_lookup' });
// Reverse lookup "all pincodes in zone X" is also useful.
areaSchema.index({ zoneId: 1, pincode: 1 });

module.exports = mongoose.model('Area', areaSchema);
