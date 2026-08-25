import { FRONTEND_URL } from '../config/env.js';
import { emailLayout, escapeHtml, ctaButton, detailRows } from './email-layout.js';

export function welcomeEmail({ fullName, email }) {
  const firstName = escapeHtml((fullName || '').trim().split(/\s+/)[0] || 'there');
  const loginUrl = `${FRONTEND_URL}/login`;

  return {
    subject: 'Welcome to DispatchPro — Precision Last-Mile Logistics',
    html: emailLayout({
      preheader: 'Your DispatchPro account is verified. Start managing and tracking shipments.',
      chipLabel: 'Account Activated',
      chipTone: 'success',
      title: `Welcome aboard, ${firstName}`,
      intro: `Your DispatchPro account is verified and ready. Experience precision last-mile dispatch, end-to-end doorstep tracking, and automated delivery rescheduling.`,
      content: `
        ${detailRows([
          ['Registered Email', escapeHtml(email)],
          ['Account Role', 'Customer'],
          ['Platform Access', 'Full Dashboard & Tracking'],
        ])}

        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f8f9fa; border: 1px solid #e2e8f0; border-radius: 4px; margin: 0 0 24px 0;">
          <tr>
            <td style="padding: 16px 20px;">
              <p style="margin: 0 0 4px 0; font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 11px; font-weight: 600; letter-spacing: 0.06em; text-transform: uppercase; color: #747878;">Getting Started</p>
              <p style="margin: 0; font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 13px; line-height: 1.6; color: #444748;">
                Book your first delivery to experience automated zone routing, real-time agent dispatch, and doorstep verification codes.
              </p>
            </td>
          </tr>
        </table>

        ${ctaButton(loginUrl, 'Sign In to Dashboard')}`,
      footerEmail: email,
    }),
  };
}

