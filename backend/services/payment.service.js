import crypto from 'node:crypto';

import Razorpay from 'razorpay';

import { ApiError } from '../utils/ApiError.js';
import { RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET } from '../config/env.js';

let razorpayClient = null;

export function isPaymentGatewayConfigured() {
  return Boolean(RAZORPAY_KEY_ID && RAZORPAY_KEY_SECRET);
}

/**
 * Lazy gateway init so missing keys don't crash boot — COD still works.
 * Throws 422 only when a payment endpoint is actually hit without keys.
 */
export function initPaymentGateway() {
  if (razorpayClient) return razorpayClient;
  if (!isPaymentGatewayConfigured()) {
    throw ApiError.unprocessable('Payment gateway not configured');
  }
  razorpayClient = new Razorpay({
    key_id: RAZORPAY_KEY_ID,
    key_secret: RAZORPAY_KEY_SECRET,
  });
  return razorpayClient;
}

/**
 * Create (or reuse) the Razorpay order for a prepaid order.
 * Amount is derived server-side from the order's pricing snapshot (paise).
 */
export async function createRazorpayOrder({ order }) {
  const gateway = initPaymentGateway();

  if (order.isCOD) {
    throw ApiError.unprocessable('COD orders do not require online payment');
  }
  if (order.paymentStatus === 'PAID') {
    throw ApiError.conflict('Order payment is already captured');
  }

  // Idempotent: if we already minted one, return it instead of double-charging.
  if (order.razorpayOrderId) {
    return order;
  }

  const amountPaise = Math.round(Number(order.pricing?.totalAmount || 0) * 100);
  if (!Number.isFinite(amountPaise) || amountPaise <= 0) {
    throw ApiError.unprocessable('Order amount is invalid for payment');
  }

  // Razorpay receipt: max 40 chars. orderNumber (LM-YYYY-NNNNNN) is safe.
  const rzpOrder = await gateway.orders.create({
    amount: amountPaise,
    currency: 'INR',
    receipt: String(order.orderNumber).slice(0, 40),
  });

  order.razorpayOrderId = rzpOrder.id;
  await order.save();

  return order;
}

/**
 * HMAC-SHA256 signature check with constant-time comparison.
 */
export function verifyPaymentSignature({ razorpayOrderId, razorpayPaymentId, signature }) {
  if (!razorpayOrderId || !razorpayPaymentId || !signature) return false;
  if (!isPaymentGatewayConfigured()) return false;
  const expected = crypto
    .createHmac('sha256', RAZORPAY_KEY_SECRET)
    .update(`${razorpayOrderId}|${razorpayPaymentId}`)
    .digest('hex');
  const a = Buffer.from(expected, 'utf8');
  const b = Buffer.from(String(signature), 'utf8');
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

/**
 * Amount snapshot for the checkout popup (paise + display).
 */
export function paymentAmountForOrder(order) {
  const amountPaise = Math.round(Number(order.pricing?.totalAmount || 0) * 100);
  return {
    amount: amountPaise,
    currency: order.pricing?.currency || 'INR',
    totalAmount: order.pricing?.totalAmount ?? null,
  };
}
