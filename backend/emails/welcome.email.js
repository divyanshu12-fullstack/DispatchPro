import { emailLayout, escapeHtml, styles } from './email-layout.js';

export function welcomeEmail({ fullName, email }) {
  const greeting = fullName ? `Welcome, ${escapeHtml(fullName)}` : 'Welcome to DispatchPro';
  return {
    subject: 'Welcome to DispatchPro',
    html: emailLayout({
      preheader: 'Your DispatchPro account is ready.',
      eyebrow: 'Account ready',
      title: greeting,
      intro: 'Your account is ready for its first delivery. Book, follow, and stay in the loop from pickup to doorstep.',
      content: `<div style="${styles.panel}"><p style="margin:0;color:#165dff;font-size:14px;font-weight:700">Everything is connected.</p><p style="margin:8px 0 0;color:#667085;font-size:14px;line-height:1.6">Track live progress and receive clear updates whenever your order changes status.</p></div>`,
      footerEmail: email,
    }),
  };
}
