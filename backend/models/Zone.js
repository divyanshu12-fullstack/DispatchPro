const mongoose = require('mongoose');

/**
 * Zone
 *
 * A logical grouping of pincodes (Areas). Agents are assigned to a zone; orders
 * resolve pickup/drop pincodes into a zone for both rate calculation and
 * automatic agent assignment. Zone NAMES are not hardcoded anywhere — they
 * live here, in the database.
 */
const zoneSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Zone name is required'],
      unique: true,
      trim: true,
      maxlength: [80, 'Zone name is too long'],
    },

    code: {
      type: String,
      required: [true, 'Zone code is required'],
      unique: true,
      trim: true,
      uppercase: true,
      maxlength: [16, 'Zone code is too long'],
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Zone', zoneSchema);
