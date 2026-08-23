const BRAND = '#165dff';
const INK = '#14213d';
const MUTED = '#667085';
const BORDER = '#e4e7ec';

export function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

export function formatDate(value, fallback = 'To be confirmed') {
  if (!value) return fallback;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return fallback;
  return new Intl.DateTimeFormat('en', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'UTC',
  }).format(date) + ' UTC';
}

export function emailLayout({ preheader = '', eyebrow, title, intro, content, footerEmail }) {
  return `
    <!doctype html>
    <html lang="en">
      <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
      <body style="margin:0;background:#f4f7fb;color:${INK};font-family:Arial,Helvetica,sans-serif;-webkit-font-smoothing:antialiased">
        <div style="display:none;max-height:0;overflow:hidden;opacity:0">${escapeHtml(preheader)}</div>
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f4f7fb;padding:32px 12px">
          <tr><td align="center">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;background:#fff;border:1px solid ${BORDER};border-radius:18px;overflow:hidden">
              <tr><td style="padding:24px 32px;background:${INK}">
                <span style="color:#fff;font-size:20px;font-weight:700;letter-spacing:-.4px">Dispatch<span style="color:#74a7ff">Pro</span></span>
                <span style="float:right;color:#b8c5db;font-size:12px;line-height:28px">DELIVERY, SIMPLIFIED</span>
              </td></tr>
              <tr><td style="padding:40px 40px 16px">
                <p style="margin:0 0 12px;color:${BRAND};font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase">${escapeHtml(eyebrow)}</p>
                <h1 style="margin:0;color:${INK};font-size:30px;line-height:1.15;letter-spacing:-.8px">${title}</h1>
                ${intro ? `<p style="margin:18px 0 0;color:${MUTED};font-size:16px;line-height:1.65">${intro}</p>` : ''}
              </td></tr>
              <tr><td style="padding:8px 40px 36px">${content}</td></tr>
              <tr><td style="padding:22px 40px;background:#f8fafc;border-top:1px solid ${BORDER}">
                <p style="margin:0;color:${MUTED};font-size:12px;line-height:1.6">This message was sent to ${escapeHtml(footerEmail)}. DispatchPro keeps you informed from pickup to doorstep.</p>
              </td></tr>
            </table>
            <p style="margin:18px 0 0;color:#98a2b3;font-size:11px">DispatchPro | Reliable delivery, clearly tracked</p>
          </td></tr>
        </table>
      </body>
    </html>
  `;
}

export const styles = {
  panel: `background:#f8fafc;border:1px solid ${BORDER};border-radius:12px;padding:20px 22px`,
  button: `display:inline-block;background:${BRAND};color:#fff;padding:14px 20px;border-radius:9px;text-decoration:none;font-size:14px;font-weight:700`,
  label: `color:${MUTED};font-size:12px`,
  value: `color:${INK};font-size:15px;font-weight:700`,
};