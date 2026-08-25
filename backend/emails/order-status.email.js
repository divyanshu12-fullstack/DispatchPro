import { FRONTEND_URL } from '../config/env.js';
import {
  emailLayout,
  escapeHtml,
  formatDate,
  formatDateTime,
  deliveryStepper,
  detailRows,
  ctaButton,
} from './email-layout.js';

const STATUS_META = {
  CREATED:          { label: 'Order Placed',        tone: 'neutral', headline: 'Order confirmed & placed' },
  ASSIGNED:         { label: 'Agent Assigned',      tone: 'info',    headline: 'Delivery agent assigned' },
  PICKED_UP:        { label: 'Package Picked Up',   tone: 'info',    headline: 'Package in courier possession' },
  IN_TRANSIT:       { label: 'In Transit',          tone: 'info',    headline: 'Shipment is on the move' },
  OUT_FOR_DELIVERY: { label: 'Out for Delivery',    tone: 'gold',    headline: 'Your package is arriving today' },
  DELIVERED:        { label: 'Delivered',           tone: 'success', headline: 'Package delivered successfully' },
  FAILED:           { label: 'Delivery Failed',     tone: 'danger',  headline: 'Delivery attempt unsuccessful' },
  RESCHEDULED:      { label: 'Rescheduled',         tone: 'neutral', headline: 'Delivery window updated' },
  RETURN_TO_ORIGIN: { label: 'Returning to Origin', tone: 'danger',  headline: 'Shipment returning to origin' },
};

const STEPPER_STATUSES = new Set([
  'CREATED', 'ASSIGNED', 'PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED',
]);

export function orderStatusEmail({ timeline }) {
  const meta = STATUS_META[timeline.toStatus] ?? {
    label: timeline.toStatus,
    tone: 'neutral',
    headline: `Update on order ${timeline.orderNumber}`,
  };
  const fromMeta = STATUS_META[timeline.fromStatus];
  const trackingUrl = `${FRONTEND_URL}/app`;

  const statusColorMap = {
    DELIVERED: '#15803d',
    FAILED: '#ba1a1a',
    OUT_FOR_DELIVERY: '#735c00',
    RETURN_TO_ORIGIN: '#ba1a1a',
  };
  const statusColor = statusColorMap[timeline.toStatus] || '#121212';

  const rows = [
    ['Order Number', escapeHtml(timeline.orderNumber)],
    ['Status', `<span style="color: ${statusColor}; font-weight: 700;">${escapeHtml(meta.label)}</span>`],
    ...(fromMeta ? [['Previous Status', escapeHtml(fromMeta.label)]] : []),
    ...(timeline.scheduledDeliveryDate
      ? [['Scheduled Delivery', escapeHtml(formatDate(timeline.scheduledDeliveryDate))]]
      : []),
    ['Last Updated', escapeHtml(formatDateTime(timeline.changedAt))],
  ];

  return {
    subject: `${timeline.orderNumber} · ${meta.label}`,
    html: emailLayout({
      preheader: `Status update for order ${timeline.orderNumber}: ${meta.label}.`,
      chipLabel: meta.label,
      chipTone: meta.tone,
      title: meta.headline,
      intro:
        timeline.toStatus === 'DELIVERED'
          ? `Order <strong style="color: #121212;">${escapeHtml(timeline.orderNumber)}</strong> has been delivered successfully. Thank you for choosing DispatchPro.`
          : `Shipment <strong style="color: #121212;">${escapeHtml(timeline.orderNumber)}</strong> has reached a new operational milestone. See current progress below.`,
      content: `
        ${STEPPER_STATUSES.has(timeline.toStatus) ? deliveryStepper(timeline.toStatus) : ''}
        ${detailRows(rows)}
        ${ctaButton(trackingUrl, 'Track Order in Dashboard')}`,
      footerEmail: timeline.customerEmail,
    }),
  };
}

