import { apiClient } from './client.js';

export const paymentsApi = {
  /**
   * Create (or reuse) a Razorpay order for a prepaid shipment.
   * @param {string} orderId
   * @returns {Promise<{ orderId: string, orderNumber: string, razorpayOrderId: string, amount: number, currency: string, totalAmount: number, keyId: string }>}
   */
  createRazorpayOrder(orderId) {
    return apiClient.post(`/payments/orders/${orderId}/razorpay-order`);
  },

  /**
   * Verify a Razorpay payment signature after checkout.
   * @param {string} orderId
   * @param {{ razorpayOrderId?: string, razorpayPaymentId: string, razorpaySignature: string }} payload
   * @returns {Promise<{ orderId: string, orderNumber: string, paymentStatus: string, razorpayPaymentId: string, assigned: boolean }>}
   */
  verifyPayment(orderId, payload) {
    return apiClient.post(`/payments/orders/${orderId}/verify`, payload);
  },
};
