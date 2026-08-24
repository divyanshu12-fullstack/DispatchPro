import React, { useState } from 'react';
import { StatusChip } from './StatusChip.jsx';
import { formatDate } from '../../lib/format.js';
import { Copy, Check, Calendar, Hash } from 'lucide-react';

/**
 * Signature Waybill Header Motif.
 *
 * @param {object} props
 * @param {string} props.orderNumber - Tracking number (e.g. 'LM-2026-000001')
 * @param {string} props.status - Current order status
 * @param {string} [props.createdAt] - Creation ISO date
 * @param {string} [props.scheduledDeliveryDate] - Scheduled delivery date
 * @param {string} [props.className='']
 */
export function WaybillHeader({
  orderNumber,
  status,
  createdAt,
  scheduledDeliveryDate,
  className = '',
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!orderNumber) return;
    try {
      await navigator.clipboard.writeText(orderNumber);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  return (
    <div
      className={`bg-container-lowest hairline rounded-lg p-5 sm:p-6 shadow-card flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${className}`}
    >
      {/* Left: Waybill Identifier & Status */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-xs text-ink-variant">
          <Hash className="w-3.5 h-3.5" />
          <span className="label-caps text-[10px]">Waybill Tracking ID</span>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <span className="font-display text-2xl sm:text-3xl font-bold text-ink tabular tracking-tight">
            {orderNumber || 'LM-PENDING'}
          </span>

          <button
            type="button"
            onClick={handleCopy}
            title="Copy tracking ID"
            className="p-1.5 rounded hairline bg-container-low hover:bg-container text-ink-variant hover:text-ink cursor-pointer transition-colors"
          >
            {copied ? (
              <Check className="w-3.5 h-3.5 text-success" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
          </button>

          {status && <StatusChip status={status} />}
        </div>
      </div>

      {/* Right: Key Timestamps */}
      <div className="flex flex-wrap sm:flex-col sm:items-end gap-3 sm:gap-1 text-xs pt-3 sm:pt-0 border-t sm:border-t-0 border-hairline">
        {scheduledDeliveryDate && (
          <div className="flex items-center gap-1.5 text-ink">
            <Calendar className="w-3.5 h-3.5 text-accent" />
            <span className="label-caps text-[10px] text-ink-variant">Delivery Target:</span>
            <span className="font-semibold text-ink">{formatDate(scheduledDeliveryDate)}</span>
          </div>
        )}

        {createdAt && (
          <div className="text-ink-variant/70 text-[11px]">
            <span>Booked: </span>
            <span className="font-medium text-ink-variant">{formatDate(createdAt)}</span>
          </div>
        )}
      </div>
    </div>
  );
}
