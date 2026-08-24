import { apiClient } from './client.js';

export const ordersApi = {
  /**
   * Request a dynamic price quote for given pickup/drop pincodes and parcel dimensions.
   * @param {{
   *   orderType: 'B2B' | 'B2C',
   *   pickupPincode: string,
   *   dropPincode: string,
   *   actualWeightKg: number,
   *   lengthCm: number,
   *   breadthCm: number,
   *   heightCm: number,
   *   isCOD: boolean,
   *   declaredValue?: number
   * }} payload
   * @returns {Promise<{
   *   pickupZoneId: string,
   *   dropZoneId: string,
   *   pricing: {
   *     tripType: 'INTRA_ZONE' | 'INTER_ZONE',
   *     billableWeightKg: number,
   *     volumetricWeightKg: number,
   *     baseRate: number,
   *     additionalWeightCharge: number,
   *     codSurcharge: number,
   *     totalAmount: number
   *   }
   * }>}
   */
  getQuote(payload) {
    const dimensions = payload.dimensions || {
      lengthCm: payload.lengthCm,
      breadthCm: payload.breadthCm,
      heightCm: payload.heightCm,
    };
    return apiClient.post('/orders/quote', {
      ...payload,
      dimensions,
    });
  },

  /**
   * Create a new shipment order.
   * @param {Record<string, any>} payload
   * @returns {Promise<any>}
   */
  createOrder(payload) {
    const dimensions = payload.dimensions || {
      lengthCm: payload.lengthCm,
      breadthCm: payload.breadthCm,
      heightCm: payload.heightCm,
    };
    return apiClient.post('/orders', {
      ...payload,
      dimensions,
    });
  },

  /**
   * List orders with optional server-side pagination and status filtering.
   * @param {{ page?: number, limit?: number, status?: string }} [params={}]
   * @returns {Promise<{ items: any[], pagination: { total: number, page: number, limit: number, pages: number } }>}
   */
  listOrders(params = {}) {
    return apiClient.get('/orders', { params });
  },

  /**
   * Get single order by ID.
   * @param {string} id
   * @returns {Promise<any>}
   */
  getOrder(id) {
    return apiClient.get(`/orders/${id}`);
  },

  /**
   * Fetch immutable timeline audit trail for an order.
   * @param {string} id
   * @returns {Promise<{ items: Array<{ id: string, fromStatus: string, toStatus: string, actorRole: string, location?: string, failureReason?: string, note?: string, changedAt: string, scheduledDeliveryDate?: string }> }>}
   */
  getOrderTimeline(id) {
    return apiClient.get(`/orders/${id}/timeline`);
  },

  /**
   * Auto-assign eligible agent and dispatch order (Admin only).
   * @param {string} id
   * @returns {Promise<any>}
   */
  dispatchOrder(id) {
    return apiClient.post(`/orders/${id}/dispatch`);
  },

  /**
   * Transition order to a new lifecycle status.
   * @param {string} id
   * @param {{
   *   status: string,
   *   failureReason?: string,
   *   location?: string,
   *   note?: string,
   *   deliveryOtp?: string
   * }} payload
   * @returns {Promise<any>}
   */
  updateStatus(id, payload) {
    return apiClient.post(`/orders/${id}/status`, payload);
  },

  /**
   * Reschedule a FAILED order for a new future delivery date (Customer or Admin).
   * @param {string} id
   * @param {{ newDeliveryDate: string }} payload
   * @returns {Promise<{ reassigned: boolean } & any>}
   */
  rescheduleOrder(id, payload) {
    return apiClient.post(`/orders/${id}/reschedule`, payload);
  },
};
