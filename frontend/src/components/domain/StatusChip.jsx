import React from 'react';
import { STATUS_META } from '../../lib/constants.js';

/**
 * Aurelian Minimalist Status Chip.
 * Follows the strict dot-language: neutral 1px hairline bordered chip + 6px semantic colored dot.
 *
 * @param {object} props
 * @param {string} props.status - Order status (e.g. 'CREATED', 'IN_TRANSIT', 'DELIVERED', 'FAILED')
 * @param {string} [props.className='']
 */
export function StatusChip({ status, className = '' }) {
  const meta = STATUS_META[status] || {
    label: status || 'Unknown',
    dotColor: 'bg-stone-400',
  };

  return (
    <span
      className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-full hairline bg-container-lowest text-ink text-xs font-medium shrink-0 ${className}`}
      title={meta.description || meta.label}
    >
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${meta.dotColor}`} />
      <span className="label-caps text-[10px] text-ink">{meta.label}</span>
    </span>
  );
}
