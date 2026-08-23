import { emailLayout, escapeHtml, formatDate, deliveryStepper } from './email-layout.js';

const STATUS_META = {
  CREATED:          { label: 'Order placed',        tone: 'info' },
  ASSIGNED:         { label: 'Agent assigned',      tone: 'info' },
  PICKED_UP:        { label: 'Picked up',           tone: 'info' },
  IN_TRANSIT:       { label: 'In transit',          tone: 'info' },
  OUT_FOR_DELIVERY: { label: 'Out for delivery',    tone: 'warning' },
  DELIVERED:        { label: 'Delivered',           tone: 'success' },
  FAILED:           { label: 'Delivery failed',     tone: 'danger' },
  RESCHEDULED:      { label: 'Rescheduled',         tone: 'info' },
  RETURN_TO_ORIGIN: { label: 'Returning to origin', tone: 'danger' },
};

// Statuses that follow the normal delivery progression get the stepper.
const STEPPER_STATUSES = new Set([
  'CREATED', 'ASSIGNED', 'PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED',
]);

export function orderStatusEmail({ timeline }) {
  const meta = STATUS_META[timeline.toStatus] ?? { label: timeline.toStatus, tone: 'info' };
  const fromMeta = STATUS_META[timeline.fromStatus];

  const rows = [
    ['Order number', escapeHtml(timeline.orderNumber)],
    ['Status', `<span style="color:${timeline.toStatus === 'DELIVERED' ? '#0e9f5d' : '#165dff'}">${escapeHtml(meta.label)}</span>`],
    ...(fromMeta ? [['Previous status', escapeHtml(fromMeta.label)]] : []),
    ...(timeline.scheduledDeliveryDate ? [['Scheduled delivery', escapeHtml(formatDate(timeline.scheduledDeliveryDate))]] : []),
    ['Last update', escapeHtml(formatDate(timeline.changedAt))],
  ];

  return {
    subject: `${timeline.orderNumber} · ${meta.label}`,
    html: emailLayout({
      preheader: `Order ${timeline.orderNumber} is now ${meta.label.toLowerCase()}.`,
      banner: meta.label,
      bannerTone: meta.tone,
      title: meta.tone === 'success'
        ? 'Your package has been delivered'
        : `Update on order <em style="color:#5b6b83;font-style:normal">${escapeHtml(timeline.orderNumber)}</em>`,
      intro: meta.tone === 'success'
        ? `Great news — order <strong>${escapeHtml(timeline.orderNumber)}</strong> was delivered successfully. Thank you for shipping with DispatchPro.`
        : `Your order <strong>${escapeHtml(timeline.orderNumber)}</strong> has moved forward. Here is where things stand right now.`,
      content: `
        ${STEPPER_STATUSES.has(timeline.toStatus) ? deliveryStepper(timeline.toStatus) : ''}
        <div style="background:#f8fafc;border:1px solid #e4e7ec;border-radius:12px;padding:6px 22px;margin-top:18px">
          ${rows.map(([label, value]) => `
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr>
              <td style="padding:11px 0;border-bottom:1px solid #e4e7ec;color:#5b6b83;font-size:12px;font-weight:700;letter-spacing:.8px;text-transform:uppercase;width:44%;vertical-align:top">${label}</td>
              <td style="padding:11px 0;border-bottom:1px solid #e4e7ec;color:#0f1c33;font-size:14px;font-weight:600;text-align:right;vertical-align:top">${value}</td>
            </tr></table>`).join('')}
        </div>`,
      footerEmail: timeline.customerEmail,
    }),
  };
}
