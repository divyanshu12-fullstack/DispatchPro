import { FRONTEND_URL } from '../config/env.js';
import {
  emailLayout,
  escapeHtml,
  formatDate,
  formatDateTime,
  detailRows,
  calloutBox,
  ctaButton,
} from './email-layout.js';

export function rescheduledEmail({ timeline }) {
  const trackingUrl = `${FRONTEND_URL}/app`;

  return {
    subject: `Confirmed · ${timeline.orderNumber} rescheduled for ${formatDate(timeline.scheduledDeliveryDate)}`,
    html: emailLayout({
      preheader: `Your new delivery window for order ${timeline.orderNumber} is confirmed for ${formatDate(timeline.scheduledDeliveryDate)}.`,
      chipLabel: 'Reschedule Confirmed',
      chipTone: 'neutral',
      title: 'New delivery date confirmed',
      intro: `Your shipment <strong style="color: #121212;">${escapeHtml(timeline.orderNumber)}</strong> has been successfully rescheduled. We will allocate a delivery agent for your new delivery window.`,
      content: `
        ${calloutBox({
          label: 'Confirmed Delivery Window',
          text: formatDate(timeline.scheduledDeliveryDate),
          tone: 'neutral',
        })}
        ${detailRows([
          ['Order Number', escapeHtml(timeline.orderNumber)],
          ['Operational Status', 'Preparing for Re-dispatch'],
          ['Rescheduled At', escapeHtml(formatDateTime(timeline.changedAt))],
        ])}
        ${ctaButton(trackingUrl, 'Track Order in Dashboard')}`,
      footerEmail: timeline.customerEmail,
    }),
  };
}

