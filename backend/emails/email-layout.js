import { APP_TIMEZONE, SUPPORT_EMAIL, APP_NAME } from '../config/env.js';

// Aurelian Minimalist design tokens for transactional emails
export const COLORS = {
  primary: '#121212',
  primaryHover: '#000000',
  onPrimary: '#ffffff',
  accent: '#c99a2c', // Soft Muted Gold #D4AF37 tone
  surface: '#f8f9fa',
  card: '#ffffff',
  border: '#e2e8f0',
  borderSubtle: '#f1f5f9',
  ink: '#191c1d',
  inkVariant: '#444748',
  muted: '#747878',
};

export const CHIP_TONES = {
  neutral: { bg: '#f3f4f5', border: '#e2e8f0', text: '#191c1d' },
  info:    { bg: '#f1f5f9', border: '#cbd5e1', text: '#334155' },
  gold:    { bg: '#fef9ee', border: '#f3e4be', text: '#735c00' },
  warning: { bg: '#fffbeb', border: '#fde68a', text: '#92400e' },
  danger:  { bg: '#fdf2f2', border: '#fecaca', text: '#ba1a1a' },
  success: { bg: '#f0fdf4', border: '#bbf7d0', text: '#15803d' },
};

export function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

/**
 * Format date in localized human-readable format without UTC forced string.
 * e.g., "25 Aug 2026" or "Tue, 25 Aug 2026"
 */
export function formatDate(value, fallback = 'To be confirmed', timezone = APP_TIMEZONE) {
  if (!value) return fallback;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return fallback;
  try {
    return new Intl.DateTimeFormat('en-IN', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      timeZone: timezone,
    }).format(date);
  } catch {
    return new Intl.DateTimeFormat('en-IN', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(date);
  }
}

/**
 * Format full date and time with clean 12-hour AM/PM localized time.
 * e.g., "Tue, 25 Aug 2026, 01:26 PM"
 */
export function formatDateTime(value, fallback = 'To be confirmed', timezone = APP_TIMEZONE) {
  if (!value) return fallback;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return fallback;
  try {
    return new Intl.DateTimeFormat('en-IN', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZone: timezone,
    }).format(date);
  } catch {
    return new Intl.DateTimeFormat('en-IN', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }).format(date);
  }
}

/**
 * Refined architectural status chip (replaces full-bleed banner stripes).
 */
export function statusChip(label, tone = 'neutral') {
  if (!label) return '';
  const t = CHIP_TONES[tone] ?? CHIP_TONES.neutral;
  return `
    <div style="margin: 0 0 16px 0;">
      <span style="display: inline-block; padding: 4px 10px; background-color: ${t.bg}; border: 1px solid ${t.border}; border-radius: 4px; font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 11px; font-weight: 600; letter-spacing: 0.06em; text-transform: uppercase; color: ${t.text}; line-height: 1.2;">
        ${escapeHtml(label)}
      </span>
    </div>`;
}

/**
 * Clean architectural callout box with 1px border and soft background.
 * Replaces the chunky 4px colored left-ribbon boxes.
 */
export function calloutBox({ label, text, tone = 'neutral' }) {
  const t = CHIP_TONES[tone] ?? CHIP_TONES.neutral;
  return `
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: ${t.bg}; border: 1px solid ${t.border}; border-radius: 4px; margin: 0 0 24px 0;">
      <tr>
        <td style="padding: 16px 20px;">
          ${label ? `<p style="margin: 0 0 4px 0; font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 11px; font-weight: 600; letter-spacing: 0.06em; text-transform: uppercase; color: ${t.text};">${escapeHtml(label)}</p>` : ''}
          <p style="margin: 0; font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 14px; font-weight: 600; color: ${COLORS.ink}; line-height: 1.5;">${escapeHtml(text)}</p>
        </td>
      </tr>
    </table>`;
}

/**
 * Architectural specification table with 1px horizontal hairlines.
 */
export function detailRows(rows) {
  const validRows = (rows || []).filter(([label, value]) => label && value != null);
  if (!validRows.length) return '';

  return `
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse: collapse; margin: 0 0 24px 0;">
      ${validRows
        .map(
          ([label, value], idx) => `
        <tr>
          <td style="padding: 12px 0; ${idx < validRows.length - 1 ? `border-bottom: 1px solid ${COLORS.border};` : ''} font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 11px; font-weight: 600; letter-spacing: 0.06em; text-transform: uppercase; color: ${COLORS.muted}; vertical-align: top; width: 42%;">
            ${escapeHtml(label)}
          </td>
          <td style="padding: 12px 0; ${idx < validRows.length - 1 ? `border-bottom: 1px solid ${COLORS.border};` : ''} font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 14px; font-weight: 600; color: ${COLORS.ink}; text-align: right; vertical-align: top;">
            ${value}
          </td>
        </tr>`
        )
        .join('')}
    </table>`;
}

/**
 * Centered call-to-action button adhering strictly to Aurelian Minimalist specs.
 * Uses solid charcoal (#121212), sharp 4px corners, and centered table wrapper.
 */
export function ctaButton(url, text) {
  if (!url || !text) return '';
  return `
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin: 28px 0 12px 0;">
      <tr>
        <td align="center">
          <table role="presentation" cellspacing="0" cellpadding="0" align="center" style="margin: 0 auto;">
            <tr>
              <td align="center" bgcolor="${COLORS.primary}" style="border-radius: 4px; background-color: ${COLORS.primary};">
                <a href="${escapeHtml(url)}" target="_blank" style="display: inline-block; padding: 14px 32px; font-family: 'Plus Jakarta Sans', Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 14px; font-weight: 600; color: ${COLORS.onPrimary}; text-decoration: none; border-radius: 4px; letter-spacing: 0.02em; text-align: center;">
                  ${escapeHtml(text)}
                </a>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>`;
}

/**
 * Architectural milestone stepper for order progression.
 */
export function deliveryStepper(currentStatus) {
  const MILESTONES = [
    { status: 'CREATED', label: 'Placed' },
    { status: 'ASSIGNED', label: 'Assigned' },
    { status: 'PICKED_UP', label: 'Picked' },
    { status: 'IN_TRANSIT', label: 'In Transit' },
    { status: 'OUT_FOR_DELIVERY', label: 'Out' },
    { status: 'DELIVERED', label: 'Delivered' },
  ];

  const idx = MILESTONES.findIndex((m) => m.status === currentStatus);
  if (idx === -1) return '';

  const cells = MILESTONES.map((m, i) => {
    const isDone = i <= idx;
    const isCurrent = i === idx;
    const dotBg = isDone ? COLORS.primary : '#e2e8f0';
    const dotText = isDone ? COLORS.onPrimary : COLORS.muted;
    const labelColor = isCurrent ? COLORS.ink : isDone ? COLORS.inkVariant : COLORS.muted;
    const labelWeight = isCurrent ? '700' : '600';

    return `
      <td align="center" style="width: ${100 / MILESTONES.length}%; vertical-align: top; padding: 0 2px;">
        <table role="presentation" cellspacing="0" cellpadding="0" align="center">
          <tr>
            <td align="center" style="width: 22px; height: 22px; background-color: ${dotBg}; border-radius: 50%; color: ${dotText}; font-family: Inter, sans-serif; font-size: 10px; font-weight: 700; line-height: 22px; text-align: center;">
              ${isDone ? '&#10003;' : i + 1}
            </td>
          </tr>
        </table>
        <div style="margin-top: 6px; font-family: Inter, sans-serif; font-size: 10px; font-weight: ${labelWeight}; letter-spacing: 0.04em; text-transform: uppercase; color: ${labelColor}; line-height: 1.2;">
          ${m.label}
        </div>
      </td>`;
  }).join(`<td style="width: 6px; vertical-align: top; padding-top: 10px;"><div style="height: 1px; background-color: ${COLORS.border}; width: 100%;"></div></td>`);

  return `
    <div style="margin: 20px 0 24px 0; padding: 16px 12px 14px 12px; background-color: ${COLORS.surface}; border: 1px solid ${COLORS.border}; border-radius: 4px;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
        <tr>${cells}</tr>
      </table>
    </div>`;
}

/**
 * Master responsive email wrapper following Aurelian Minimalist principles.
 */
export function emailLayout({
  preheader = '',
  chipLabel = '',
  chipTone = 'neutral',
  title,
  intro,
  content,
  footerEmail,
}) {
  const currentYear = new Date().getFullYear();

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${escapeHtml(title || APP_NAME)}</title>
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@600;700;800&display=swap');
      body, table, td, p, a, li, blockquote {
        -webkit-text-size-adjust: 100%;
        -ms-text-size-adjust: 100%;
      }
      body {
        margin: 0;
        padding: 0;
        width: 100% !important;
        background-color: ${COLORS.surface};
      }
      img {
        border: 0;
        outline: none;
        text-decoration: none;
      }
      a {
        color: ${COLORS.primary};
        text-decoration: underline;
      }
      @media only screen and (max-width: 600px) {
        .email-container {
          width: 100% !important;
          max-width: 100% !important;
        }
        .content-cell {
          padding: 24px 20px !important;
        }
        .header-cell {
          padding: 0 4px 16px 4px !important;
        }
        .footer-cell {
          padding: 20px !important;
        }
        .title-text {
          font-size: 20px !important;
        }
      }
    </style>
  </head>
  <body style="margin: 0; padding: 0; background-color: ${COLORS.surface}; font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
    <!-- Preheader for email clients -->
    <div style="display: none; max-height: 0px; overflow: hidden; opacity: 0; font-size: 1px; line-height: 1px; color: ${COLORS.surface};">
      ${escapeHtml(preheader)}
      ${'&nbsp;&zwnj;'.repeat(10)}
    </div>

    <!-- Outer Canvas Wrapper -->
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: ${COLORS.surface};">
      <tr>
        <td align="center" style="padding: 40px 16px 48px 16px;">

          <!-- Brand Header -->
          <table role="presentation" class="email-container" width="100%" cellspacing="0" cellpadding="0" style="max-width: 580px; margin: 0 auto;">
            <tr>
              <td class="header-cell" style="padding: 0 8px 16px 8px;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                  <tr>
                    <td align="left" style="vertical-align: middle;">
                      <span style="font-family: 'Plus Jakarta Sans', Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 20px; font-weight: 800; letter-spacing: -0.03em; color: ${COLORS.primary};">
                        Dispatch<span style="color: ${COLORS.accent};">Pro</span>
                      </span>
                    </td>
                    <td align="right" style="vertical-align: middle;">
                      <span style="font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 11px; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; color: ${COLORS.muted};">
                        Last-Mile Logistics
                      </span>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>

          <!-- Main Card Container -->
          <table role="presentation" class="email-container" width="100%" cellspacing="0" cellpadding="0" style="max-width: 580px; margin: 0 auto; background-color: ${COLORS.card}; border: 1px solid ${COLORS.border}; border-radius: 8px; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.03); overflow: hidden;">
            <tr>
              <td class="content-cell" style="padding: 36px 36px 28px 36px;">
                <!-- Status Chip -->
                ${chipLabel ? statusChip(chipLabel, chipTone) : ''}

                <!-- Title -->
                <h1 class="title-text" style="margin: 0 0 12px 0; font-family: 'Plus Jakarta Sans', Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 23px; font-weight: 700; line-height: 1.25; letter-spacing: -0.02em; color: ${COLORS.primary};">
                  ${title}
                </h1>

                <!-- Intro text -->
                ${intro ? `<p style="margin: 0 0 24px 0; font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 15px; font-weight: 400; line-height: 1.6; color: ${COLORS.inkVariant};">${intro}</p>` : ''}

                <!-- Main Content Body -->
                <div>
                  ${content}
                </div>
              </td>
            </tr>

            <!-- Card Footer -->
            <tr>
              <td class="footer-cell" style="padding: 20px 36px; background-color: ${COLORS.surface}; border-top: 1px solid ${COLORS.border};">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                  <tr>
                    <td>
                      <p style="margin: 0 0 6px 0; font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 12px; line-height: 1.6; color: ${COLORS.muted};">
                        Questions regarding this delivery? Contact our support team at <a href="mailto:${escapeHtml(SUPPORT_EMAIL)}" style="color: ${COLORS.primary}; font-weight: 600; text-decoration: none;">${escapeHtml(SUPPORT_EMAIL)}</a>.
                      </p>
                      ${footerEmail ? `<p style="margin: 0; font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 11px; color: ${COLORS.muted};">Delivered to ${escapeHtml(footerEmail)} · Reference your order number for expedited assistance.</p>` : ''}
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>

          <!-- Bottom Copyright / Signature -->
          <table role="presentation" class="email-container" width="100%" cellspacing="0" cellpadding="0" style="max-width: 580px; margin: 16px auto 0 auto;">
            <tr>
              <td align="center" style="padding: 0 8px;">
                <p style="margin: 0; font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 11px; color: ${COLORS.muted}; letter-spacing: 0.02em;">
                  &copy; ${currentYear} ${escapeHtml(APP_NAME)}. Minimalist & precision last-mile logistics.
                </p>
              </td>
            </tr>
          </table>

        </td>
      </tr>
    </table>
  </body>
</html>`;
}
