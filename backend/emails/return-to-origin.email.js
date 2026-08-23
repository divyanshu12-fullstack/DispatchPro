import { emailLayout, escapeHtml, styles } from './email-layout.js';

export function returnToOriginEmail({ timeline }) {
  return {
    subject: `[${timeline.orderNumber}] Package returning to origin`,
    html: emailLayout({
      preheader: `Order ${timeline.orderNumber} is being returned to origin.`,
      eyebrow: 'Delivery update',
      title: 'Package returning to origin',
      intro: `We were unable to complete delivery for order <strong>${escapeHtml(timeline.orderNumber)}</strong>. The package is being returned to the sender.`,
      content: timeline.failureReason
        ? `<div style="${styles.panel}"><p style="margin:0 0 6px;${styles.label}">REASON</p><p style="margin:0;${styles.value}">${escapeHtml(timeline.failureReason)}</p></div>`
        : '',
      footerEmail: timeline.customerEmail,
    }),
  };
}
