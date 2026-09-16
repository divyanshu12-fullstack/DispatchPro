/**
 * Razorpay checkout helper (test mode).
 * Wraps `window.Razorpay` (loaded via index.html) in a Promise.
 *
 * Resolves with the Razorpay handler response:
 *   { razorpay_order_id, razorpay_payment_id, razorpay_signature }
 * Rejects with `{ dismissed: true }` when the user closes the popup,
 * or `{ failed: true, error }` when Razorpay reports payment.failed.
 */

/**
 * @param {{
 *   keyId: string,
 *   amount: number,
 *   currency?: string,
 *   razorpayOrderId: string,
 *   orderNumber?: string,
 *   prefill?: { name?: string, email?: string, contact?: string },
 *   notes?: Record<string, string>,
 * }} args
 * @returns {Promise<{ razorpay_order_id: string, razorpay_payment_id: string, razorpay_signature: string }>}
 */
export function openRazorpayCheckout({
  keyId,
  amount,
  currency = 'INR',
  razorpayOrderId,
  orderNumber = '',
  prefill = {},
  notes = {},
}) {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || typeof window.Razorpay === 'undefined') {
      reject(new Error('Razorpay checkout is not loaded. Check your connection and retry.'));
      return;
    }
    if (!keyId || !razorpayOrderId || !amount) {
      reject(new Error('Payment is not initialized. Please retry.'));
      return;
    }

    let settled = false;
    const settleResolve = (value) => {
      if (!settled) {
        settled = true;
        resolve(value);
      }
    };
    const settleReject = (err) => {
      if (!settled) {
        settled = true;
        reject(err);
      }
    };

    const rzp = new window.Razorpay({
      key: keyId,
      amount,
      currency,
      order_id: razorpayOrderId,
      name: 'DispatchPro',
      description: orderNumber ? `Shipment ${orderNumber} (test mode)` : 'Shipment payment (test mode)',
      prefill: {
        name: prefill.name || '',
        email: prefill.email || '',
        contact: prefill.contact || '',
      },
      notes,
      theme: { color: '#1a56db' },
      modal: {
        ondismiss: () => settleReject({ dismissed: true }),
      },
      handler: (response) => settleResolve(response),
    });

    rzp.on('payment.failed', (resp) => {
      settleReject({ failed: true, error: resp?.error || null });
    });

    rzp.open();
  });
}
