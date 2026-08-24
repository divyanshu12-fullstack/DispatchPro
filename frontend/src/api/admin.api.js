import { apiClient } from './client.js';

export const adminApi = {
  /**
   * List delivery agents with workload and zone details.
   * @param {{ available?: boolean | string }} [params={}]
   * @returns {Promise<{ items: Array<{ id: string, email: string, fullName: string, phone: string, role: string, assignedZone: { id: string, name: string, code: string } | null, isAvailable: boolean, currentActiveDeliveriesCount: number, maxCapacity: number, createdAt: string }>, total: number }>}
   */
  listAgents(params = {}) {
    return apiClient.get('/admin/agents', { params });
  },

  /**
   * Create a new delivery agent account.
   * @param {{
   *   email: string,
   *   password: string,
   *   fullName: string,
   *   phone: string,
   *   assignedZoneId: string,
   *   maxCapacity: number
   * }} payload
   * @returns {Promise<any>}
   */
  createAgent(payload) {
    return apiClient.post('/admin/agents', payload);
  },

  /**
   * Update agent availability, max capacity, or assigned zone.
   * @param {string} id
   * @param {{
   *   isAvailable?: boolean,
   *   maxCapacity?: number,
   *   assignedZoneId?: string
   * }} payload
   * @returns {Promise<any>}
   */
  updateAgent(id, payload) {
    return apiClient.patch(`/admin/agents/${id}`, payload);
  },

  /**
   * Fetch active zones for selection dropdowns.
   * @returns {Promise<Array<{ id: string, name: string, code: string }>>}
   */
  listZones() {
    return apiClient.get('/admin/zones');
  },
};
