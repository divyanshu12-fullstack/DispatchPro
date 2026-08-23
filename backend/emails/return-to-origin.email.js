import { emailLayout, escapeHtml, formatDate, detailRows } from './email-layout.js';

export function returnToOriginEmail({ timeline }) {
  return {
    subject: `${timeline.orderNumber} is returning to the sender`,
    html: emailLayout({
      preheader: `Order ${timeline.orderNumber} could not be delivered and is heading back to origin.`,
      banner: 'Returning to sender',
      bannerTone: 'warning',
      title: 'Your package is returning to origin',
      intro: `After multiple attempts we were unable to complete delivery of <strong>${escapeHtml(timeline.orderNumber)}</strong>. The package is now on its way back to the sender. If this was unexpected, contact the seller to arrange a fresh shipment.`,
      content: `
        ${timeline.failureReason ? `
        <div style="background:#fff4e5;border-left:4px solid #d97706;border-radius:8px;padding:16px 20px;margin:0 0 22px">
          <p style="margin:0 0 4px;color:#8a4b03;font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase">Reason</p>
          <p style="margin:0;color:#0f1c33;font-size:15px;font-weight:600">${escapeHtml(timeline.failureReason)}</p>
        </div>` : ''}
        ${detailRows([
          ['Order number', escapeHtml(timeline.orderNumber)],
          ['Final attempt', escapeHtml(formatDate(timeline.changedAt))],
        ])}
        <p style="margin:24px 0 0;color:#5b6b83;font-size:13px;line-height:1.6">
          This order can no longer be rescheduled online. Please place a new order once the package reaches the sender.
        </p>`,
      footerEmail: timeline.customerEmail,
    }),
  };
}
