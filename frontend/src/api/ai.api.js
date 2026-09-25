import { apiClient } from './client.js';

export const aiApi = {
  /**
   * Customer/agency RAG chat — grounded on faq.md.
   * @param {{ query: string, orderNumber?: string }} payload
   */
  chat(payload) {
    return apiClient.post('/ai/chat', payload);
  },
  /**
   * Admin ops copilot — read-only aggregations + RAG.
   * @param {{ query: string, zone?: string }} payload
   */
  ops(payload) {
    return apiClient.post('/ai/ops', payload);
  },
  /**
   * Debug retrieval without LLM cost (ADMIN only).
   */
  retrieve(q, topK = 3) {
    return apiClient.get('/ai/retrieve', { params: { q, topK } });
  },
};
