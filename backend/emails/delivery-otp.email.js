import { emailLayout, escapeHtml, formatDate, detailRows } from './email-layout.js';

// Sent when the order enters OUT_FOR_DELIVERY. The customer shares this code
// with the delivery agent to confirm handover — the agent cannot mark the
// shipment DELIVERED without it.
export function deliveryOtpEmail({ timeline, otp, expiresAt }) {
  return {
    subject: `${otp} is your delivery verification code · ${timeline.orderNumber}`,
    html: emailLayout({
      preheader: `Your package is out for delivery. Share code ${otp} with the agent to receive it.`,
      banner: 'Out for delivery',
      bannerTone: 'warning',
      title: 'Your package arrives today',
      intro: `Good news — order <strong>${escapeHtml(timeline.orderNumber)}</strong> is on its way and will reach you shortly. To make sure it lands in the right hands, share this one-time code with the delivery agent <strong>only when you receive your package</strong>.`,
      content: `
        <div style="text-align:center;margin:28px 0 22px">
          <div style="display:inline-block;background:#0f1c33;border-radius:14px;padding:20px 36px">
            <span style="color:#ffffff;font-size:38px;font-weight:800;letter-spacing:12px;line-height:1">${escapeHtml(otp)}</span>
          </div>
          <p style="margin:16px 0 0;color:#5b6b83;font-size:13px">Give this code to the agent at handover — never before</p>
        </div>
        ${detailRows([
          ['Order number', escapeHtml(timeline.orderNumber)],
          ['Scheduled for', escapeHtml(formatDate(timeline.scheduledDeliveryDate))],
          ['Code expires', escapeHtml(formatDate(expiresAt))],
        ])}
        <p style="margin:24px 0 0;color:#5b6b83;font-size:13px;line-height:1.6">
          DispatchPro will never call or email asking for this code. If a stranger asks for it before your package arrives, refuse and contact support.
        </p>`,
      footerEmail: timeline.customerEmail,
    }),
  };
}
