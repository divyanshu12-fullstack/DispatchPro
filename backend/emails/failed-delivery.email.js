import { FRONTEND_URL } from '../config/env.js';
import { emailLayout, escapeHtml, styles } from './email-layout.js';

export function failedDeliveryEmail({ timeline, frontendReschedulePath }) {
  const path = frontendReschedulePath || '/orders/reschedule';
  const url = `${FRONTEND_URL}${path}?order=${encodeURIComponent(timeline.orderNumber)}`;
  return {
    subject: `[${timeline.orderNumber}] Delivery failed`,
    html: emailLayout({
      preheader: `We could not complete delivery for order ${timeline.orderNumber}.`,
      eyebrow: 'Action needed',
      title: 'Delivery needs a new plan',
      intro: `We could not complete delivery for order <strong>${escapeHtml(timeline.orderNumber)}</strong>. Choose a new delivery time when it suits you.`,
      content: `${timeline.failureReason ? `<div style="${styles.panel};margin-bottom:24px"><p style="margin:0 0 6px;${styles.label}">DELIVERY NOTE</p><p style="margin:0;${styles.value}">${escapeHtml(timeline.failureReason)}</p></div>` : ''}<a href="${escapeHtml(url)}" style="${styles.button}">Reschedule delivery</a>`,
      footerEmail: timeline.customerEmail,
    }),
  };
}
