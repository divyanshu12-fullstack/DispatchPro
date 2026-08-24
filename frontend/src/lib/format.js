/**
 * Formatting helpers for currency, dates, weights, and logistics specs.
 */

/**
 * Format a number as Indian Rupee currency.
 * @param {number|string|null|undefined} amount
 * @returns {string} e.g. "₹1,250.00"
 */
export function formatCurrency(amount) {
  if (amount == null || isNaN(Number(amount))) return '₹0.00';
  const num = Number(amount);
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
}

/**
 * Format an ISO date string to readable day month year.
 * @param {string|Date|null|undefined} dateInput
 * @returns {string} e.g. "24 Aug 2026"
 */
export function formatDate(dateInput) {
  if (!dateInput) return '—';
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

/**
 * Format an ISO date string to full date & time.
 * @param {string|Date|null|undefined} dateInput
 * @returns {string} e.g. "24 Aug 2026, 03:30 PM"
 */
export function formatDateTime(dateInput) {
  if (!dateInput) return '—';
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(date);
}

/**
 * Format weight in kilograms.
 * @param {number|string|null|undefined} kg
 * @returns {string} e.g. "2.50 kg"
 */
export function formatWeight(kg) {
  if (kg == null || isNaN(Number(kg))) return '0.00 kg';
  return `${Number(kg).toFixed(2)} kg`;
}

/**
 * Format dimensions (L × B × H).
 * @param {{ lengthCm?: number, breadthCm?: number, heightCm?: number }|null|undefined} dims
 * @returns {string} e.g. "20 × 15 × 10 cm"
 */
export function formatDimensions(dims) {
  if (!dims) return '—';
  const { lengthCm = 0, breadthCm = 0, heightCm = 0 } = dims;
  return `${lengthCm} × ${breadthCm} × ${heightCm} cm`;
}

/**
 * Format order tracking number.
 * @param {string|null|undefined} orderNumber
 * @returns {string} e.g. "LM-2026-000001"
 */
export function formatOrderNumber(orderNumber) {
  return orderNumber ? String(orderNumber).trim() : '—';
}
