import { FRONTEND_URL } from '../config/env.js';
import { emailLayout, escapeHtml, formatDate, detailRows, ctaButton } from './email-layout.js';

export function failedDeliveryEmail({ timeline, frontendReschedulePath }) {
  const path = frontendReschedulePath || '/orders/reschedule';
  const url = `${FRONTEND_URL}${path}?order=${encodeURIComponent(timeline.orderNumber)}`;

  return {
    subject: `Action needed · Delivery of ${timeline.orderNumber} could not be completed`,
    html: emailLayout({
      preheader: `We missed you — pick a new delivery time for order ${timeline.orderNumber}.`,
      banner: 'Action needed',
      bannerTone: 'danger',
      title: 'We missed your delivery',
      intro: `Our delivery partner attempted your shipment <strong>${escapeHtml(timeline.orderNumber)}</strong> but could not complete it. Your package is safe with us — choose a new delivery window and we will bring it to you.`,
      content: `
        ${timeline.failureReason ? `
        <div style="background:#fdecec;border-left:4px solid #dc2626;border-radius:8px;padding:16px 20px;margin:0 0 22px">
          <p style="margin:0 0 4px;color:#991b1b;font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase">Reason recorded by the agent</p>
          <p style="margin:0;color:#0f1c33;font-size:15px;font-weight:600">${escapeHtml(timeline.failureReason)}</p>
        </div>` : ''}
        ${detailRows([
          ['Order number', escapeHtml(timeline.orderNumber)],
          ['Attempted at', escapeHtml(formatDate(timeline.changedAt))],
          ...(timeline.scheduledDeliveryDate ? [['Original slot', escapeHtml(formatDate(timeline.scheduledDeliveryDate))]] : []),
        ])}
        ${ctaButton(url, 'Reschedule my delivery')}
        <p style="margin:18px 0 0;color:#5b6b83;font-size:13px;line-height:1.6">
          Rescheduling takes under a minute — pick any future date and we will reassign a delivery agent automatically.
        </p>`,
      footerEmail: timeline.customerEmail,
    }),
  };
}
