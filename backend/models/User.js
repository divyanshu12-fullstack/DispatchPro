const mongoose = require('mongoose');
const { ORDER_STATUS } = require('./constants/OrderStatus');

/**
 * User
 *
 * Holds CUSTOMER, ADMIN, and AGENT accounts. The fields used purely for
 * authentication are kept on every role; agent-workload fields are only
 * populated for role === 'AGENT'.
 *
 * OTP fields are kept here (per Step 1 design decision) and stored as a hash.
 * `select: false` ensures otpHash is never returned by default — verification
 * flows must explicitly opt in with `.select('+otpHash')`.
 */
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
      select: false, // never returned in normal reads
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
      enum: {
        values: ['CUSTOMER', 'AGENT', 'ADMIN'],
        message: 'Role must be CUSTOMER, AGENT, or ADMIN',
      },
      required: [true, 'Role is required'],
      index: true,
    },

    isEmailVerified: {
      type: Boolean,
      default: false,
    },

    // --- OTP (login / verify-email flows) ---
    // Hashed at rest. select:false so it never leaks.
    otpHash: {
      type: String,
      default: null,
      select: false,
    },
    otpExpiresAt: {
      type: Date,
      default: null,
    },
    otpPurpose: {
      type: String,
      enum: ['LOGIN', 'VERIFY_EMAIL'],
      default: null,
    },

    // --- Agent-only workload fields (ignored for other roles at the service layer) ---
    assignedZoneId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Zone',
      default: null,
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },
    currentActiveDeliveriesCount: {
      type: Number,
      default: 0,
      min: [0, 'Active deliveries cannot be negative'],
    },
    maxCapacity: {
      type: Number,
      default: null, // null/undefined means "no upper bound" for non-agents
      min: [1, 'Max capacity must be at least 1'],
    },
  },
  {
    timestamps: true, // createdAt / updatedAt
    toJSON: {
      transform: (_doc, ret) => {
        // Defense in depth: never serialize sensitive fields even if a caller
        // forgets .select('-otpHash'). passwordHash/otpHash have select:false,
        // but belt-and-braces here.
        delete ret.passwordHash;
        delete ret.otpHash;
        delete ret.otpExpiresAt;
        delete ret.otpPurpose;
        return ret;
      },
    },
  }
);

// Compound index for the assignment hot path:
// "Find an available agent in zone Z with spare capacity."
// Service layer will run: findOneAndUpdate({ role:'AGENT', isAvailable:true,
// assignedZoneId: Z, currentActiveDeliveriesCount:{ $lt: maxCapacity } }, ...)
userSchema.index({
  role: 1,
  isAvailable: 1,
  assignedZoneId: 1,
  currentActiveDeliveriesCount: 1,
});

module.exports = mongoose.model('User', userSchema);
