import React from 'react';
import { MapPin } from 'lucide-react';

/**
 * Line-and-pin Address Visual for Waybills and Order Cards.
 *
 * @param {object} props
 * @param {{ pincode: string, address?: string, zoneName?: string, companyName?: string }} props.pickup
 * @param {{ pincode: string, address?: string, zoneName?: string, companyName?: string }} props.drop
 * @param {boolean} [props.compact=false]
 * @param {string} [props.className='']
 */
export function PincodePair({
  pickup,
  drop,
  compact = false,
  className = '',
}) {
  if (!pickup || !drop) return null;

  return (
    <div className={`flex flex-col space-y-3 ${className}`}>
      {/* Pickup */}
      <div className="flex items-start gap-3">
        <div className="flex flex-col items-center mt-0.5 shrink-0">
          <div className="w-4 h-4 rounded-full border-2 border-primary bg-container-lowest flex items-center justify-center">
            <div className="w-1.5 h-1.5 rounded-full bg-primary" />
          </div>
          <div className="w-[1px] h-6 bg-hairline mt-1" />
        </div>

        <div className="flex-1 text-xs">
          <div className="flex items-center gap-2">
            <span className="label-caps text-[10px] text-ink-variant">Pickup</span>
            <span className="font-display font-bold text-ink tabular">{pickup.pincode}</span>
            {pickup.zoneName && (
              <span className="px-1.5 py-0.5 rounded bg-container-low text-[10px] text-ink-variant">
                {pickup.zoneName}
              </span>
            )}
          </div>
          {pickup.companyName && (
            <div className="font-semibold text-ink text-xs mt-0.5">{pickup.companyName}</div>
          )}
          {!compact && pickup.address && (
            <div className="text-ink-variant/80 text-[11px] mt-0.5 leading-tight line-clamp-2">
              {pickup.address}
            </div>
          )}
        </div>
      </div>

      {/* Drop */}
      <div className="flex items-start gap-3">
        <div className="flex flex-col items-center shrink-0 mt-0.5">
          <div className="w-4 h-4 rounded-full bg-primary flex items-center justify-center text-on-primary">
            <MapPin className="w-2.5 h-2.5" />
          </div>
        </div>

        <div className="flex-1 text-xs">
          <div className="flex items-center gap-2">
            <span className="label-caps text-[10px] text-ink-variant">Destination</span>
            <span className="font-display font-bold text-ink tabular">{drop.pincode}</span>
            {drop.zoneName && (
              <span className="px-1.5 py-0.5 rounded bg-container-low text-[10px] text-ink-variant">
                {drop.zoneName}
              </span>
            )}
          </div>
          {drop.companyName && (
            <div className="font-semibold text-ink text-xs mt-0.5">{drop.companyName}</div>
          )}
          {!compact && drop.address && (
            <div className="text-ink-variant/80 text-[11px] mt-0.5 leading-tight line-clamp-2">
              {drop.address}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
