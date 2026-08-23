import { emailLayout, escapeHtml, formatDate, styles } from './email-layout.js';

const STATUS_LABELS = {
  CREATED: 'Order placed',
  ASSIGNED: 'Agent assigned',
  PICKED_UP: 'Picked up',
  IN_TRANSIT: 'In transit',
  OUT_FOR_DELIVERY: 'Out for delivery',
  DELIVERED: 'Delivered',
  FAILED: 'Delivery failed',
  RESCHEDULED: 'Rescheduled',
  RETURN_TO_ORIGIN: 'Returning to origin',
};

export function orderStatusEmail({ timeline }) {
  const label = STATUS_LABELS[timeline.toStatus] || timeline.toStatus;
  const fromLabel = timeline.fromStatus ? STATUS_LABELS[timeline.fromStatus] : '—';

  return {
    subject: `[${timeline.orderNumber}] ${label}`,
    html: emailLayout({
      preheader: `Order ${timeline.orderNumber} is now ${label}.`,
      eyebrow: 'Order update',
      title: escapeHtml(label),
      intro: `Your order <strong>${escapeHtml(timeline.orderNumber)}</strong> has a new tracking update.`,
      content: `<div style="${styles.panel}"><table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr><td style="padding-bottom:16px;${styles.label}">PREVIOUS STATUS</td><td style="padding-bottom:16px;text-align:right;${styles.label}">CURRENT STATUS</td></tr><tr><td style="${styles.value}">${escapeHtml(fromLabel)}</td><td style="text-align:right;${styles.value};color:#165dff">${escapeHtml(label)}</td></tr></table><div style="border-top:1px solid ${styles.label.split(':')[1] || '#e4e7ec'};margin:18px 0"></div><p style="margin:0;${styles.label}">UPDATED ${escapeHtml(formatDate(timeline.changedAt).toUpperCase())}</p>${timeline.scheduledDeliveryDate ? `<p style="margin:10px 0 0;${styles.value}">Scheduled for ${escapeHtml(formatDate(timeline.scheduledDeliveryDate))}</p>` : ''}</div>`,
      footerEmail: timeline.customerEmail,
    }),
  };
}
