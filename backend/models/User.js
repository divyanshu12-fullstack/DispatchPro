import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      trim: true,
      lowercase: true,
      index: true,
      match: [/^\S+@\S+\.\S+$/, 'Email format is invalid'],
    },
    passwordHash: {
      type: String,
      required: [true, 'Password hash is required'],
      select: false,
    },
    fullName: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
      minlength: [2, 'Full name is too short'],
      maxlength: [120, 'Full name is too long'],
    },
    phone: {
      type: String,
      trim: true,
      default: null,
    },
    role: {
      type: String,
      enum: { values: ['CUSTOMER', 'AGENT', 'ADMIN'], message: 'Role must be CUSTOMER, AGENT, or ADMIN' },
      required: [true, 'Role is required'],
      index: true,
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },

    // OTP fields are hashed at rest and selected-out by default; verification
    // flows must explicitly opt in with `.select('+otpHash')`.
    otpHash: { type: String, default: null, select: false },
    otpExpiresAt: { type: Date, default: null },
    otpPurpose: { type: String, enum: ['LOGIN', 'VERIFY_EMAIL'], default: null },

    assignedZoneId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Zone',
      default: null,
    },
    isAvailable: { type: Boolean, default: true },
    currentActiveDeliveriesCount: {
      type: Number,
      default: 0,
      min: [0, 'Active deliveries cannot be negative'],
    },
    maxCapacity: {
      type: Number,
      default: null,
      min: [1, 'Max capacity must be at least 1'],
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret) => {
        delete ret.passwordHash;
        delete ret.otpHash;
        delete ret.otpExpiresAt;
        delete ret.otpPurpose;
        return ret;
      },
    },
  }
);

// Supports the assignment hot path:
// findOneAndUpdate({ role, isAvailable, assignedZoneId, currentActiveDeliveriesCount: { $lt: maxCapacity } }, ...)
userSchema.index({
  role: 1,
  isAvailable: 1,
  assignedZoneId: 1,
  currentActiveDeliveriesCount: 1,
});

export default mongoose.model('User', userSchema);