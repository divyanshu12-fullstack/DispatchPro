// Shared design system for all DispatchPro transactional emails.
// Table-based, inline-styled HTML for maximum email-client compatibility.
// Every template composes from these primitives so the brand stays coherent.

export const BRAND = '#165dff';
const BRAND_DARK = '#0e47d3';
const INK = '#0f1c33';
const MUTED = '#5b6b83';
const BORDER = '#e4e7ec';
const BG = '#f2f5fa';
const CARD = '#ffffff';

export const TONES = {
  info:    { bg: '#eef3ff', bar: BRAND,        text: '#12379b' },
  success: { bg: '#e8f7ee', bar: '#0e9f5d',   text: '#086b3f' },
  warning: { bg: '#fff4e5', bar: '#d97706',   text: '#8a4b03' },
  danger:  { bg: '#fdecec', bar: '#dc2626',   text: '#991b1b' },
};

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
  return new Intl.DateTimeFormat('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: 'UTC',
  }).format(date) + ' UTC';
}

// Full-width strip under the header announcing the state of the email.
export function statusBanner(label, tone = 'info') {
  const t = TONES[tone] ?? TONES.info;
  return `
    <tr><td style="background:${t.bg};border-bottom:2px solid ${t.bar};padding:14px 40px">
      <span style="color:${t.text};font-size:13px;font-weight:700;letter-spacing:1.2px;text-transform:uppercase">${escapeHtml(label)}</span>
    </td></tr>`;
}

// Label/value rows used inside detail panels.
export function detailRows(rows) {
  return `<table role="presentation" width="100%" cellspacing="0" cellpadding="0">${rows
    .filter(([label]) => label)
    .map(
      ([label, value]) => `
      <tr>
        <td style="padding:11px 0;border-bottom:1px solid ${BORDER};color:${MUTED};font-size:12px;font-weight:700;letter-spacing:.8px;text-transform:uppercase;width:44%;vertical-align:top">${escapeHtml(label)}</td>
        <td style="padding:11px 0;border-bottom:1px solid ${BORDER};color:${INK};font-size:14px;font-weight:600;text-align:right;vertical-align:top">${value}</td>
      </tr>`
    )
    .join('')}</table>`;
}

// Horizontal progress tracker for the happy-path lifecycle.
export function deliveryStepper(currentStatus) {
  const MILESTONES = [
    { status: 'CREATED', label: 'Placed' },
    { status: 'ASSIGNED', label: 'Assigned' },
    { status: 'PICKED_UP', label: 'Picked up' },
    { status: 'IN_TRANSIT', label: 'In transit' },
    { status: 'OUT_FOR_DELIVERY', label: 'Out for delivery' },
    { status: 'DELIVERED', label: 'Delivered' },
  ];
  const idx = MILESTONES.findIndex((m) => m.status === currentStatus);
  if (idx === -1) return '';

  const dots = MILESTONES.map((m, i) => {
    const done = i <= idx;
    const current = i === idx;
    const color = done ? BRAND : BORDER;
    const dot = `<table role="presentation" cellspacing="0" cellpadding="0" align="center"><tr><td align="center" style="width:26px;height:26px;background:${color};border-radius:50%;color:#fff;font-size:11px;font-weight:700;line-height:26px${current ? `;box-shadow:0 0 0 4px ${BRAND}22` : ''}">${done ? '&#10003;' : i + 1}</td></tr></table>`;
    const labelColor = done ? INK : MUTED;
    return `
      <td align="center" style="padding:0 2px;width:${100 / MILESTONES.length}%">
        ${dot}
        <div style="margin-top:8px;color:${labelColor};font-size:10px;font-weight:${current ? 700 : 600};letter-spacing:.4px;text-transform:uppercase">${m.label}</div>
      </td>`;
  }).join(`<td style="width:8px"><div style="height:2px;background:${BORDER};margin-top:12px"></div></td>`);

  return `
    <div style="margin:26px 0 6px">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr>${dots}</tr></table>
    </div>`;
}

export function ctaButton(url, text) {
  if (!url) return '';
  return `
    <table role="presentation" cellspacing="0" cellpadding="0" style="margin:26px 0 4px"><tr><td align="center" bgcolor="${BRAND}" style="border-radius:10px">
      <a href="${escapeHtml(url)}" style="${`display:inline-block;padding:15px 30px;background:${BRAND};color:#ffffff;border-radius:10px;text-decoration:none;font-size:15px;font-weight:700;letter-spacing:.2px`}">${escapeHtml(text)}</a>
    </td></tr></table>`;
}

export function emailLayout({
  preheader = '',
  banner,
  bannerTone = 'info',
  title,
  intro,
  content,
  footerEmail,
}) {
  return `
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
  </head>
  <body style="margin:0;padding:0;background:${BG};font-family:'Segoe UI',Arial,Helvetica,sans-serif;-webkit-font-smoothing:antialiased">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0">${escapeHtml(preheader)}</div>

    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:${BG}">
      <tr><td align="center" style="padding:36px 12px">

        <!-- Brand header -->
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px">
          <tr><td style="padding:0 8px 18px">
            <span style="color:${INK};font-size:21px;font-weight:800;letter-spacing:-.5px">Dispatch<span style="color:${BRAND}">Pro</span></span>
            <span style="float:right;color:${MUTED};font-size:11px;font-weight:700;letter-spacing:1.6px;line-height:29px;text-transform:uppercase">Last-mile tracking</span>
          </td></tr>
        </table>

        <!-- Card -->
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;background:${CARD};border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(15,28,51,.08)">
          ${banner ? statusBanner(banner, bannerTone) : ''}
          <tr><td style="padding:34px 40px 8px">
            <h1 style="margin:0;color:${INK};font-size:25px;line-height:1.25;letter-spacing:-.5px">${title}</h1>
            ${intro ? `<p style="margin:14px 0 0;color:${MUTED};font-size:15px;line-height:1.65">${intro}</p>` : ''}
          </td></tr>
          <tr><td style="padding:20px 40px 38px">${content}</td></tr>
          <!-- Footer -->
          <tr><td style="padding:20px 40px;background:#f8fafc;border-top:1px solid ${BORDER}">
            <p style="margin:0 0 6px;color:${MUTED};font-size:12px;line-height:1.6">
              Questions about this shipment? Reply to this email or contact support — reference your order number for a faster response.
            </p>
            <p style="margin:0;color:#98a2b3;font-size:11px">Sent to ${escapeHtml(footerEmail)} · DispatchPro · Delivery, simplified.</p>
          </td></tr>
        </table>

        <p style="margin:16px 0 0;color:#98a2b3;font-size:11px">&copy; ${new Date().getFullYear()} DispatchPro. All rights reserved.</p>
      </td></tr>
    </table>
  </body>
</html>`;
}
