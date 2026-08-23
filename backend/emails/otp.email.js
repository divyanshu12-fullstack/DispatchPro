import { FRONTEND_URL } from '../config/env.js';
import { emailLayout, escapeHtml, formatDate, detailRows, ctaButton } from './email-layout.js';

export function otpEmail({ email, code, purpose, expiresAt }) {
  const purposeText = purpose === 'VERIFY_EMAIL' ? 'verify your email address' : 'log in to your account';

  return {
    subject: `${code} is your DispatchPro verification code`,
    html: emailLayout({
      preheader: `Your secure DispatchPro code expires in 10 minutes.`,
      banner: 'Security verification',
      bannerTone: 'info',
      title: 'Confirm it\u2019s really you',
      intro: `Use the one-time code below to ${purposeText}. This code is valid for <strong>10 minutes</strong>${expiresAt ? ` (until ${escapeHtml(formatDate(expiresAt))})` : ''} and can be used only once.`,
      content: `
        <div style="text-align:center;margin:28px 0 22px">
          <div style="display:inline-block;background:#0f1c33;border-radius:14px;padding:20px 36px">
            <span style="color:#ffffff;font-size:38px;font-weight:800;letter-spacing:12px;line-height:1">${escapeHtml(code)}</span>
          </div>
          <p style="margin:16px 0 0;color:#5b6b83;font-size:13px">Enter this code on the DispatchPro verification screen</p>
        </div>
        ${detailRows([
          ['Purpose', escapeHtml(purposeText)],
          ['Requested by', escapeHtml(email)],
        ])}
        <p style="margin:24px 0 0;color:#5b6b83;font-size:13px;line-height:1.6">
          Didn\u2019t request this code? Someone may have typed your email by mistake — you can safely ignore this message. We will never ask for your password or payment details over email.
        </p>
        ${ctaButton(`${FRONTEND_URL}/verify`, 'Go to verification')}`,
      footerEmail: email,
    }),
  };
}
