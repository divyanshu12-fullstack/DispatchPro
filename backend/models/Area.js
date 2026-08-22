import mongoose from 'mongoose';

const PINCODE_REGEX = /^\d{4,8}$/;

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

areaSchema.index({ pincode: 1 }, { unique: true, name: 'pincode_lookup' });
areaSchema.index({ zoneId: 1, pincode: 1 });

export default mongoose.model('Area', areaSchema);