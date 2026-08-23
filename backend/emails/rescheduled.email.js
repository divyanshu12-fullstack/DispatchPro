import { emailLayout, escapeHtml, formatDate, styles } from './email-layout.js';

export function rescheduledEmail({ timeline }) {
  const when = formatDate(timeline.scheduledDeliveryDate);
  return {
    subject: `[${timeline.orderNumber}] Delivery rescheduled`,
    html: emailLayout({
      preheader: `Order ${timeline.orderNumber} has been rescheduled for ${when}.`,
      eyebrow: 'Delivery update',
      title: 'Your delivery is rescheduled',
      intro: `Order <strong>${escapeHtml(timeline.orderNumber)}</strong> has a new delivery window.`,
      content: `<div style="${styles.panel}"><p style="margin:0 0 8px;${styles.label}">NEW DELIVERY TIME</p><p style="margin:0;${styles.value};color:#165dff">${escapeHtml(when)}</p></div>`,
      footerEmail: timeline.customerEmail,
    }),
  };
}
