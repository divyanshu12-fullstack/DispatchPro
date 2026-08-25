import { FRONTEND_URL } from '../config/env.js';
import {
  emailLayout,
  escapeHtml,
  formatDateTime,
  detailRows,
  calloutBox,
  ctaButton,
} from './email-layout.js';

export function returnToOriginEmail({ timeline }) {
  const trackingUrl = `${FRONTEND_URL}/app`;

  return {
    subject: `${timeline.orderNumber} is returning to origin`,
    html: emailLayout({
      preheader: `Shipment ${timeline.orderNumber} could not be delivered and is returning to sender.`,
      chipLabel: 'Returning to Sender',
      chipTone: 'danger',
      title: 'Shipment returning to origin',
      intro: `Following unsuccessful delivery attempts, package <strong style="color: #121212;">${escapeHtml(timeline.orderNumber)}</strong> could not be handed over and is now returning to the sender. If this was unexpected, please contact the merchant or our support desk.`,
      content: `
        ${
          timeline.failureReason
            ? calloutBox({
                label: 'Return Reason Recorded',
                text: timeline.failureReason,
                tone: 'danger',
              })
            : ''
        }
        ${detailRows([
          ['Order Number', escapeHtml(timeline.orderNumber)],
          ['Final Attempt At', escapeHtml(formatDateTime(timeline.changedAt))],
          ['Status', 'Return to Origin in Progress'],
        ])}
        ${ctaButton(trackingUrl, 'View Order in Dashboard')}
        <p style="margin: 20px 0 0 0; font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 13px; line-height: 1.6; color: #747878; text-align: center;">
          This order can no longer be rescheduled online. Once returned to the merchant, a new dispatch may be arranged.
        </p>`,
      footerEmail: timeline.customerEmail,
    }),
  };
}

