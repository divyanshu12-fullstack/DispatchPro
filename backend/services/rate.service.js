import RateCard from '../models/RateCard.js';
import { ApiError } from '../utils/ApiError.js';
import { arePincodesSameZone } from './zone.service.js';

// Standard courier industry divisor.
const VOLUMETRIC_DIVISOR = 5000;

function round2(n) {
  return Math.round(n * 100) / 100;
}

export function computeVolumetricWeight({ lengthCm, breadthCm, heightCm }) {
  if ([lengthCm, breadthCm, heightCm].some((v) => v == null || v < 0)) {
    throw ApiError.badRequest('Dimensions are required and must be non-negative');
  }
  return (lengthCm * breadthCm * heightCm) / VOLUMETRIC_DIVISOR;
}

export function computeBillableWeight(actualWeightKg, volumetricWeightKg) {
  if (actualWeightKg == null || actualWeightKg < 0) {
    throw ApiError.badRequest('actualWeightKg must be non-negative');
  }
  if (volumetricWeightKg == null || volumetricWeightKg < 0) {
    throw ApiError.badRequest('volumetricWeightKg must be non-negative');
  }
  return Math.max(actualWeightKg, volumetricWeightKg);
}

export function resolveTripType({ sameZone }) {
  return sameZone ? 'INTRA_ZONE' : 'INTER_ZONE';
}

export async function resolveRateCard({ orderType, tripType, billableWeightKg }) {
  const cards = await RateCard.find({
    orderType,
    tripType,
    isActive: true,
    baseWeight: { $lte: billableWeightKg },
  })
    .sort({ baseWeight: -1 })
    .lean();

  if (!cards.length) {
    throw ApiError.conflict(
      `No rate card configured for ${orderType}/${tripType} at billable weight ${billableWeightKg}kg`
    );
  }
  return cards[0];
}

export function calculateQuote({
  orderType,
  parcel,
  isCOD,
  declaredValue,
  sameZone,
  rateCard,
}) {
  const volumetricWeightKg = computeVolumetricWeight(parcel.dimensions);
  const billableWeightKg = computeBillableWeight(parcel.actualWeightKg, volumetricWeightKg);
  const tripType = resolveTripType({ sameZone });

  // baseRate covers up to baseWeight; weight above that is billed per-kg.
  const extraKg = Math.max(0, billableWeightKg - rateCard.baseWeight);
  const additionalWeightCharge = round2(extraKg * rateCard.additionalPerKgRate);

  let codSurcharge = 0;
  if (isCOD) {
    const declared = Number(declaredValue);
    if (!Number.isFinite(declared) || declared < 0) {
      throw ApiError.badRequest('declaredValue is required and must be non-negative for COD orders');
    }
    codSurcharge = round2(
      rateCard.codSurchargeFixed + (declared * rateCard.codSurchargePercent) / 100
    );
  }

  const totalAmount = round2(rateCard.baseRate + additionalWeightCharge + codSurcharge);

  return {
    volumetricWeightKg: round2(volumetricWeightKg),
    billableWeightKg: round2(billableWeightKg),
    tripType,
    baseRate: rateCard.baseRate,
    additionalWeightCharge,
    codSurcharge,
    totalAmount,
    currency: 'INR',
    rateCardId: rateCard._id,
  };
}

export async function quoteForPincodes({
  orderType,
  parcel,
  isCOD,
  declaredValue,
  pickupPincode,
  dropPincode,
}) {
  const { pickupZoneId, dropZoneId, sameZone } = await arePincodesSameZone(
    pickupPincode,
    dropPincode
  );

  const tripType = resolveTripType({ sameZone });
  const volumetricWeightKg = computeVolumetricWeight(parcel.dimensions);
  const billableWeightKg = computeBillableWeight(parcel.actualWeightKg, volumetricWeightKg);

  const rateCard = await resolveRateCard({ orderType, tripType, billableWeightKg });

  const pricing = calculateQuote({
    orderType,
    parcel,
    isCOD,
    declaredValue,
    sameZone,
    rateCard,
  });

  return {
    pickupZoneId,
    dropZoneId,
    pricing,
  };
}