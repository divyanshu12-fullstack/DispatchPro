import { FRONTEND_URL } from '../config/env.js';
import {
  emailLayout,
  escapeHtml,
  formatDateTime,
  detailRows,
  ctaButton,
  COLORS,
} from './email-layout.js';

export function otpEmail({ email, code, purpose, expiresAt }) {
  const isVerify = purpose === 'VERIFY_EMAIL';
  const purposeText = isVerify ? 'Verify your email address' : 'Account login authentication';
  const verifyUrl = `${FRONTEND_URL}/verify?email=${encodeURIComponent(email || '')}`;

  return {
    subject: `${code} is your DispatchPro verification code`,
    html: emailLayout({
      preheader: `Your one-time security code is ${code}. Valid for 10 minutes.`,
      chipLabel: 'Security Verification',
      chipTone: 'neutral',
      title: 'Confirm your identity',
      intro: `Use the one-time verification code below to complete your authentication. This security code is valid for <strong>10 minutes</strong> and can only be used once.`,
      content: `
        <!-- Verification Code Display -->
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin: 24px 0 28px 0;">
          <tr>
            <td align="center">
              <table role="presentation" cellspacing="0" cellpadding="0" align="center">
                <tr>
                  <td align="center" bgcolor="${COLORS.primary}" style="border-radius: 4px; background-color: ${COLORS.primary}; padding: 18px 32px;">
                    <span style="font-family: 'Plus Jakarta Sans', Inter, -apple-system, BlinkMacSystemFont, monospace; font-size: 32px; font-weight: 700; letter-spacing: 8px; color: #ffffff; line-height: 1; text-indent: 8px;">
                      ${escapeHtml(code)}
                    </span>
                  </td>
                </tr>
              </table>
              <p style="margin: 12px 0 0 0; font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 12px; font-weight: 500; color: #747878;">
                Enter this code in the verification screen
              </p>
            </td>
          </tr>
        </table>

        ${detailRows([
          ['Account', escapeHtml(email)],
          ['Purpose', escapeHtml(purposeText)],
          ...(expiresAt ? [['Valid Until', escapeHtml(formatDateTime(expiresAt))]] : []),
        ])}

        ${ctaButton(verifyUrl, 'Proceed to Verification')}

        <p style="margin: 20px 0 0 0; font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 12px; line-height: 1.6; color: #747878; text-align: center;">
          If you did not request this verification code, no action is required. Your account remains secure. DispatchPro will never ask for credentials via email.
        </p>`,
      footerEmail: email,
    }),
  };
}

