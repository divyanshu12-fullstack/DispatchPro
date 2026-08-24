/**
 * Unified API Error representation and validation detail flattener.
 */

export class ApiError extends Error {
  /**
   * @param {number} status
   * @param {string} message
   * @param {Record<string, string>} [details={}]
   */
  constructor(status, message, details = {}) {
    super(message || 'An unexpected error occurred');
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

/**
 * Normalizes nested and dotted validation error objects into a flat dictionary.
 * e.g. { "dimensions.lengthCm": "Must be > 0" } -> { lengthCm: "Must be > 0", "dimensions.lengthCm": "Must be > 0" }
 * @param {any} rawDetails
 * @returns {Record<string, string>}
 */
export function flattenDetails(rawDetails) {
  if (!rawDetails) return {};
  const flattened = {};

  if (Array.isArray(rawDetails)) {
    for (const item of rawDetails) {
      if (item && typeof item === 'object') {
        const key = item.field || item.path || item.key;
        const msg = item.message || item.msg || String(item);
        if (key) {
          flattened[key] = msg;
          const shortKey = key.split('.').pop();
          if (shortKey) flattened[shortKey] = msg;
        }
      }
    }
    return flattened;
  }

  if (typeof rawDetails === 'object') {
    for (const [key, value] of Object.entries(rawDetails)) {
      const msg = typeof value === 'string' ? value : value?.message || String(value);
      flattened[key] = msg;
      const shortKey = key.split('.').pop();
      if (shortKey && !flattened[shortKey]) {
        flattened[shortKey] = msg;
      }
    }
  }

  return flattened;
}

/**
 * Safely extracts the user-facing message from an error.
 * @param {unknown} err
 * @param {string} [fallback='Something went wrong']
 * @returns {string}
 */
export function getErrorMessage(err, fallback = 'Something went wrong') {
  if (!err) return fallback;
  if (err instanceof ApiError) return err.message;
  if (err instanceof Error) return err.message;
  if (typeof err === 'string') return err;
  return fallback;
}
