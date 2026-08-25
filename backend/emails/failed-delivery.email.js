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

export function failedDeliveryEmail({ timeline, frontendReschedulePath }) {
  const path = frontendReschedulePath || '/app/reschedule';
  const url = `${FRONTEND_URL}${path}?order=${encodeURIComponent(timeline.orderNumber)}`;

  return {
    subject: `Action needed · Delivery of ${timeline.orderNumber} could not be completed`,
    html: emailLayout({
      preheader: `Delivery attempt for shipment ${timeline.orderNumber} was unsuccessful. Choose a new delivery window.`,
      chipLabel: 'Action Needed',
      chipTone: 'danger',
      title: 'We missed your delivery',
      intro: `Our delivery partner attempted your shipment <strong style="color: #121212;">${escapeHtml(timeline.orderNumber)}</strong> but could not complete handover. Your package is securely held in our network — select a new delivery window and we will re-dispatch it.`,
      content: `
        ${
          timeline.failureReason
            ? calloutBox({
                label: 'Reason recorded by delivery agent',
                text: timeline.failureReason,
                tone: 'danger',
              })
            : ''
        }
        ${detailRows([
          ['Order Number', escapeHtml(timeline.orderNumber)],
          ['Attempted At', escapeHtml(formatDateTime(timeline.changedAt))],
          ...(timeline.scheduledDeliveryDate
            ? [['Original Slot', escapeHtml(formatDate(timeline.scheduledDeliveryDate))]]
            : []),
        ])}
        ${ctaButton(url, 'Reschedule Delivery Window')}
        <p style="margin: 20px 0 0 0; font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 13px; line-height: 1.6; color: #747878; text-align: center;">
          Rescheduling takes under a minute. Pick any available future date and our system will automatically allocate a delivery agent.
        </p>`,
      footerEmail: timeline.customerEmail,
    }),
  };
}

