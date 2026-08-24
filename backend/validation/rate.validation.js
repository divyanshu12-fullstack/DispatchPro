import { ApiError } from '../utils/ApiError.js';

function asNumber(v) {
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  if (typeof v === 'string' && v.trim() !== '' && Number.isFinite(Number(v))) return Number(v);
  return null;
}

export function validateUpdateRateCard(body) {
  const errors = {};

  const baseWeight = body?.baseWeight != null ? asNumber(body.baseWeight) : undefined;
  const baseRate = body?.baseRate != null ? asNumber(body.baseRate) : undefined;
  const additionalPerKgRate =
    body?.additionalPerKgRate != null ? asNumber(body.additionalPerKgRate) : undefined;
  const codSurchargeFixed =
    body?.codSurchargeFixed != null ? asNumber(body.codSurchargeFixed) : undefined;
  const codSurchargePercent =
    body?.codSurchargePercent != null ? asNumber(body.codSurchargePercent) : undefined;
  const isActive = body?.isActive != null ? Boolean(body.isActive) : undefined;

  if (baseWeight !== undefined && (baseWeight == null || baseWeight <= 0)) {
    errors.baseWeight = 'baseWeight must be a number > 0';
  }

  if (baseRate !== undefined && (baseRate == null || baseRate < 0)) {
    errors.baseRate = 'baseRate must be a non-negative number';
  }

  if (additionalPerKgRate !== undefined && (additionalPerKgRate == null || additionalPerKgRate < 0)) {
    errors.additionalPerKgRate = 'additionalPerKgRate must be a non-negative number';
  }

  if (codSurchargeFixed !== undefined && (codSurchargeFixed == null || codSurchargeFixed < 0)) {
    errors.codSurchargeFixed = 'codSurchargeFixed must be a non-negative number';
  }

  if (
    codSurchargePercent !== undefined &&
    (codSurchargePercent == null || codSurchargePercent < 0 || codSurchargePercent > 100)
  ) {
    errors.codSurchargePercent = 'codSurchargePercent must be between 0 and 100';
  }

  const update = {};
  if (baseWeight !== undefined) update.baseWeight = baseWeight;
  if (baseRate !== undefined) update.baseRate = baseRate;
  if (additionalPerKgRate !== undefined) update.additionalPerKgRate = additionalPerKgRate;
  if (codSurchargeFixed !== undefined) update.codSurchargeFixed = codSurchargeFixed;
  if (codSurchargePercent !== undefined) update.codSurchargePercent = codSurchargePercent;
  if (isActive !== undefined) update.isActive = isActive;

  if (Object.keys(update).length === 0) {
    errors.body = 'At least one tariff parameter must be provided to update';
  }

  if (Object.keys(errors).length) {
    throw ApiError.unprocessable('Validation failed', errors);
  }

  return update;
}
