import { FRONTEND_URL } from '../config/env.js';
import { emailLayout, escapeHtml, ctaButton, detailRows } from './email-layout.js';

export function welcomeEmail({ fullName, email }) {
  const firstName = escapeHtml((fullName || '').trim().split(/\s+/)[0] || 'there');

  return {
    subject: 'Welcome to DispatchPro — your deliveries, under control',
    html: emailLayout({
      preheader: 'Your DispatchPro account is ready. Track every shipment from pickup to doorstep.',
      banner: 'Account ready',
      bannerTone: 'success',
      title: `Welcome aboard, ${firstName}`,
      intro: `Your DispatchPro account is verified and ready to go. From here, every shipment you place comes with real-time tracking, proactive status updates straight to your inbox, and flexible rescheduling if a delivery time stops working for you.`,
      content: `
        ${detailRows([
          ['Account', escapeHtml(email)],
          ['Role', 'Customer'],
        ])}
        <p style="margin:24px 0 0;color:#5b6b83;font-size:14px;line-height:1.7">
          <strong style="color:#0f1c33">What happens next?</strong><br>
          Place your first shipment and we will keep you informed at every milestone — assignment, pickup, transit, and the final doorstep handover.
        </p>
        ${ctaButton(`${FRONTEND_URL}/login`, 'Sign in to get started')}`,
      footerEmail: email,
    }),
  };
}
