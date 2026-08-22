import { ApiError } from '../utils/ApiError.js';

const EMAIL_RE = /^\S+@\S+\.\S+$/;
const PINCODE_RE = /^\d{4,8}$/;
// India GSTIN: 15 chars, fixed pattern. Format check only, not verification.
const GSTIN_RE = /^\d{2}[A-Z]{5}\d{4}[A-Z]{1}[A-Z\d]{1}Z[A-Z\d]{1}$/;

function asString(v) {
  return typeof v === 'string' ? v.trim() : '';
}
function asNumber(v) {
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  if (typeof v === 'string' && v.trim() !== '' && Number.isFinite(Number(v))) return Number(v);
  return null;
}
function asBool(v, dflt = false) {
  if (typeof v === 'boolean') return v;
  if (v === 'true') return true;
  if (v === 'false') return false;
  return dflt;
}

function validateB2BBusiness(body, errors) {
  if (body?.orderType !== 'B2B') return null;
  const pickupCompanyName = asString(body?.pickupCompanyName);
  const pickupGstin = asString(body?.pickupGstin).toUpperCase();
  const dropCompanyName = asString(body?.dropCompanyName);
  const dropGstin = asString(body?.dropGstin).toUpperCase();

  if (!pickupCompanyName) errors.pickupCompanyName = 'pickupCompanyName is required for B2B orders';
  if (!pickupGstin) {
    errors.pickupGstin = 'pickupGstin is required for B2B orders';
  } else if (!GSTIN_RE.test(pickupGstin)) {
    errors.pickupGstin = 'pickupGstin format is invalid (expected 15-char Indian GSTIN)';
  }
  if (!dropCompanyName) errors.dropCompanyName = 'dropCompanyName is required for B2B orders';
  if (!dropGstin) {
    errors.dropGstin = 'dropGstin is required for B2B orders';
  } else if (!GSTIN_RE.test(dropGstin)) {
    errors.dropGstin = 'dropGstin format is invalid (expected 15-char Indian GSTIN)';
  }

  return { pickupCompanyName, pickupGstin, dropCompanyName, dropGstin };
}

function validateDimensions(dim) {
  const errors = {};
  const lengthCm = asNumber(dim?.lengthCm);
  const breadthCm = asNumber(dim?.breadthCm);
  const heightCm = asNumber(dim?.heightCm);
  if (lengthCm == null || lengthCm <= 0) errors.lengthCm = 'lengthCm is required and must be > 0';
  if (breadthCm == null || breadthCm <= 0) errors.breadthCm = 'breadthCm is required and must be > 0';
  if (heightCm == null || heightCm <= 0) errors.heightCm = 'heightCm is required and must be > 0';
  return { errors, dimensions: { lengthCm, breadthCm, heightCm } };
}

function validatePincodes({ pickupPincode, dropPincode }) {
  const errors = {};
  const p = asString(pickupPincode);
  const d = asString(dropPincode);
  if (!p) errors.pickupPincode = 'pickupPincode is required';
  else if (!PINCODE_RE.test(p)) errors.pickupPincode = 'pickupPincode must be 4–8 digits';
  if (!d) errors.dropPincode = 'dropPincode is required';
  else if (!PINCODE_RE.test(d)) errors.dropPincode = 'dropPincode must be 4–8 digits';
  return { errors, pickupPincode: p, dropPincode: d };
}

export function validateQuote(body) {
  const errors = {};
  const orderType = asString(body?.orderType);
  const pickupPincode = asString(body?.pickupPincode);
  const dropPincode = asString(body?.dropPincode);
  const actualWeightKg = asNumber(body?.actualWeightKg);
  const isCOD = asBool(body?.isCOD, false);
  const declaredValue = body?.declaredValue == null ? null : asNumber(body.declaredValue);

  if (!['B2B', 'B2C'].includes(orderType)) errors.orderType = 'orderType must be B2B or B2C';

  const pin = validatePincodes({ pickupPincode, dropPincode });
  Object.assign(errors, pin.errors);

  if (actualWeightKg == null || actualWeightKg <= 0) {
    errors.actualWeightKg = 'actualWeightKg is required and must be > 0';
  }

  const dim = validateDimensions(body?.dimensions);
  Object.assign(errors, dim.errors);

  if (isCOD && (declaredValue == null || declaredValue < 0)) {
    errors.declaredValue = 'declaredValue is required for COD orders';
  }

  // B2B gate — runs BEFORE the rate calc. Order of checks matters.
  const b2b = validateB2BBusiness(body, errors);

  if (Object.keys(errors).length) {
    throw ApiError.unprocessable('Validation failed', errors);
  }

  return {
    orderType,
    pickupPincode: pin.pickupPincode,
    dropPincode: pin.dropPincode,
    parcel: { actualWeightKg, dimensions: dim.dimensions },
    isCOD,
    declaredValue,
    ...(b2b || {}),
  };
}

export function validateCreateOrder(body) {
  // Same shape as quote, plus pickupAddress, dropAddress, customerEmail,
  // scheduledDeliveryDate. Customer id is derived from req.user when the
  // caller is a CUSTOMER, or from body.customer when ADMIN places on behalf.
  const errors = {};
  const orderType = asString(body?.orderType);
  const pickupPincode = asString(body?.pickupPincode);
  const pickupAddress = asString(body?.pickupAddress);
  const dropPincode = asString(body?.dropPincode);
  const dropAddress = asString(body?.dropAddress);
  const customerEmail = asString(body?.customerEmail).toLowerCase();
  const scheduledDeliveryDateRaw = body?.scheduledDeliveryDate;
  const scheduledDeliveryDate = scheduledDeliveryDateRaw
    ? new Date(scheduledDeliveryDateRaw)
    : null;
  const actualWeightKg = asNumber(body?.actualWeightKg);
  const isCOD = asBool(body?.isCOD, false);
  const declaredValue = body?.declaredValue == null ? null : asNumber(body.declaredValue);

  if (!['B2B', 'B2C'].includes(orderType)) errors.orderType = 'orderType must be B2B or B2C';

  const pin = validatePincodes({ pickupPincode, dropPincode });
  Object.assign(errors, pin.errors);

  if (!pickupAddress) errors.pickupAddress = 'pickupAddress is required';
  if (!dropAddress) errors.dropAddress = 'dropAddress is required';

  if (!customerEmail) errors.customerEmail = 'customerEmail is required';
  else if (!EMAIL_RE.test(customerEmail)) errors.customerEmail = 'customerEmail is invalid';

  if (!scheduledDeliveryDate || Number.isNaN(scheduledDeliveryDate.getTime())) {
    errors.scheduledDeliveryDate = 'scheduledDeliveryDate is required (ISO date string)';
  } else if (scheduledDeliveryDate.getTime() < Date.now() - 60_000) {
    // Allow a 60s clock-skew tolerance.
    errors.scheduledDeliveryDate = 'scheduledDeliveryDate must be in the future';
  }

  if (actualWeightKg == null || actualWeightKg <= 0) {
    errors.actualWeightKg = 'actualWeightKg is required and must be > 0';
  }

  const dim = validateDimensions(body?.dimensions);
  Object.assign(errors, dim.errors);

  if (isCOD && (declaredValue == null || declaredValue < 0)) {
    errors.declaredValue = 'declaredValue is required for COD orders';
  }

  // B2B gate — runs BEFORE the rate calc.
  const b2b = validateB2BBusiness(body, errors);

  if (Object.keys(errors).length) {
    throw ApiError.unprocessable('Validation failed', errors);
  }

  return {
    orderType,
    pickupPincode: pin.pickupPincode,
    pickupAddress,
    dropPincode: pin.dropPincode,
    dropAddress,
    customerEmail,
    scheduledDeliveryDate,
    parcel: { actualWeightKg, dimensions: dim.dimensions },
    isCOD,
    declaredValue,
    ...(b2b || {}),
  };
}
