import { FRONTEND_URL } from '../config/env.js';
import {
  emailLayout,
  escapeHtml,
  formatDate,
  formatDateTime,
  detailRows,
  ctaButton,
  COLORS,
} from './email-layout.js';

// Sent when the order enters OUT_FOR_DELIVERY. The customer shares this code
// with the delivery agent to confirm handover.
export function deliveryOtpEmail({ timeline, otp, expiresAt }) {
  const trackingUrl = `${FRONTEND_URL}/app`;

  return {
    subject: `${otp} is your delivery verification code · ${timeline.orderNumber}`,
    html: emailLayout({
      preheader: `Your shipment ${timeline.orderNumber} is out for delivery. Verification code: ${otp}.`,
      chipLabel: 'Doorstep Verification',
      chipTone: 'gold',
      title: 'Your package is out for delivery',
      intro: `Shipment <strong style="color: #121212;">${escapeHtml(timeline.orderNumber)}</strong> is on its way and scheduled for delivery today. To ensure secure handover, please share the 6-digit code below with the delivery agent at your doorstep.`,
      content: `
        <!-- Verification Code Display -->
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin: 24px 0 28px 0;">
          <tr>
            <td align="center">
              <table role="presentation" cellspacing="0" cellpadding="0" align="center">
                <tr>
                  <td align="center" bgcolor="${COLORS.primary}" style="border-radius: 4px; background-color: ${COLORS.primary}; padding: 18px 32px;">
                    <span style="font-family: 'Plus Jakarta Sans', Inter, -apple-system, BlinkMacSystemFont, monospace; font-size: 32px; font-weight: 700; letter-spacing: 8px; color: #ffffff; line-height: 1; text-indent: 8px;">
                      ${escapeHtml(otp)}
                    </span>
                  </td>
                </tr>
              </table>
              <p style="margin: 12px 0 0 0; font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 12px; font-weight: 500; color: #747878;">
                Share only upon physical package inspection and handover
              </p>
            </td>
          </tr>
        </table>

        ${detailRows([
          ['Order Number', escapeHtml(timeline.orderNumber)],
          ['Scheduled For', escapeHtml(formatDate(timeline.scheduledDeliveryDate))],
          ['Code Valid Until', escapeHtml(formatDateTime(expiresAt))],
        ])}

        ${ctaButton(trackingUrl, 'Track Order in Dashboard')}

        <p style="margin: 20px 0 0 0; font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 12px; line-height: 1.6; color: #747878; text-align: center;">
          DispatchPro representatives will never ask for this code prior to doorstep arrival. Never disclose this code over phone or SMS.
        </p>`,
      footerEmail: timeline.customerEmail,
    }),
  };
}

