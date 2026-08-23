import { emailLayout, escapeHtml, formatDate, detailRows } from './email-layout.js';

export function rescheduledEmail({ timeline }) {
  return {
    subject: `Confirmed · ${timeline.orderNumber} rescheduled for ${formatDate(timeline.scheduledDeliveryDate)}`,
    html: emailLayout({
      preheader: `Your new delivery window for order ${timeline.orderNumber} is confirmed.`,
      banner: 'Reschedule confirmed',
      bannerTone: 'info',
      title: 'New delivery date confirmed',
      intro: `Your shipment <strong>${escapeHtml(timeline.orderNumber)}</strong> has been rescheduled. We are assigning a fresh delivery agent for your new window — you will receive an update as soon as one is on the way.`,
      content: `
        <div style="background:#eef3ff;border-left:4px solid #165dff;border-radius:8px;padding:16px 20px;margin:0 0 22px">
          <p style="margin:0 0 4px;color:#12379b;font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase">New delivery window</p>
          <p style="margin:0;color:#0f1c33;font-size:17px;font-weight:700">${escapeHtml(formatDate(timeline.scheduledDeliveryDate))}</p>
        </div>
        ${detailRows([
          ['Order number', escapeHtml(timeline.orderNumber)],
          ['Status', 'Preparing for redelivery'],
          ['Updated', escapeHtml(formatDate(timeline.changedAt))],
        ])}`,
      footerEmail: timeline.customerEmail,
    }),
  };
}
