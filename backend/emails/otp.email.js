import { emailLayout, escapeHtml, styles } from './email-layout.js';

export function otpEmail({ email, code, purpose, expiresAt }) {
  const purposeText = purpose === 'VERIFY_EMAIL' ? 'verify your email' : 'log in';
  return {
    subject: `Your DispatchPro code: ${code}`,
    html: emailLayout({
      preheader: 'Your secure DispatchPro code is valid for the next 10 minutes.',
      eyebrow: 'Security check',
      title: 'Your one-time code',
      intro: `Use this code to ${purposeText}. For your security, this OTP is valid for the next 10 minutes.`,
      content: `<div style="${styles.panel};text-align:center;margin-bottom:24px"><p style="margin:0;color:#165dff;font-size:34px;line-height:1.2;font-weight:700;letter-spacing:8px">${escapeHtml(code)}</p></div><p style="margin:0;color:${styles.label.split(':')[1] || '#667085'};font-size:13px;line-height:1.6">If you did not request this code, you can safely ignore this email.</p>`,
      footerEmail: email,
    }),
  };
}
