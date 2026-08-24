import { ApiError, flattenDetails } from '../lib/errors.js';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

/**
 * Universal Native Fetch Client with Bearer token injection,
 * response envelope unwrapping, and structured ApiError throwing.
 *
 * @param {string} path - Path relative to /api (e.g. "/orders", "/auth/login")
 * @param {RequestInit & { params?: Record<string, any> }} [options={}]
 * @returns {Promise<any>} Unwrapped data payload
 */
export async function apiClient(path, options = {}) {
  const { params, headers = {}, body, ...fetchOptions } = options;

  let url = `${BASE_URL.replace(/\/+$/, '')}/${path.replace(/^\/+/, '')}`;

  if (params) {
    const searchParams = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null && value !== '') {
        searchParams.append(key, String(value));
      }
    }
    const queryString = searchParams.toString();
    if (queryString) {
      url += (url.includes('?') ? '&' : '?') + queryString;
    }
  }

  const token = localStorage.getItem('dispatchpro_token');
  const finalHeaders = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...headers,
  };

  if (token) {
    finalHeaders.Authorization = `Bearer ${token}`;
  }

  let finalBody = body;
  if (body && typeof body === 'object' && !(body instanceof FormData)) {
    finalBody = JSON.stringify(body);
  }

  let response;
  try {
    response = await fetch(url, {
      ...fetchOptions,
      headers: finalHeaders,
      body: finalBody,
    });
  } catch {
    throw new ApiError(0, 'Unable to connect to the DispatchPro server. Please check your connection.');
  }

  let payload = null;
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    try {
      payload = await response.json();
    } catch {
      payload = null;
    }
  } else {
    const text = await response.text();
    payload = { message: text };
  }

  if (!response.ok || (payload && payload.success === false)) {
    const status = response.status;
    const message = payload?.message || `Request failed with status ${status}`;
    const details = flattenDetails(payload?.details);

    if (status === 401 && !path.includes('/auth/login') && !path.includes('/auth/register')) {
      window.dispatchEvent(new CustomEvent('dispatchpro:unauthorized'));
    }

    throw new ApiError(status, message, details);
  }

  return payload ? payload.data : null;
}

apiClient.get = (path, options = {}) => apiClient(path, { ...options, method: 'GET' });
apiClient.post = (path, body, options = {}) => apiClient(path, { ...options, method: 'POST', body });
apiClient.patch = (path, body, options = {}) => apiClient(path, { ...options, method: 'PATCH', body });
apiClient.delete = (path, options = {}) => apiClient(path, { ...options, method: 'DELETE' });
