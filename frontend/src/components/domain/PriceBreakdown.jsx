import React from 'react';
import { formatCurrency, formatWeight } from '../../lib/format.js';
import { MapPin, Receipt, ShieldCheck } from 'lucide-react';

/**
 * Invoice-style Freight Price Breakdown Card.
 *
 * @param {object} props
 * @param {object} props.pricing - Pricing object from /orders/quote or Order document
 * @param {string} [props.pricing.tripType] - 'INTRA_ZONE' | 'INTER_ZONE'
 * @param {number} [props.pricing.baseRate]
 * @param {number} [props.pricing.additionalWeightCharge]
 * @param {number} [props.pricing.codSurcharge]
 * @param {number} [props.pricing.totalAmount]
 * @param {number} [props.pricing.actualWeightKg]
 * @param {number} [props.pricing.volumetricWeightKg]
 * @param {number} [props.pricing.billableWeightKg]
 * @param {string} [props.orderType] - 'B2C' | 'B2B'
 * @param {boolean} [props.isCOD]
 * @param {string} [props.className='']
 */
export function PriceBreakdown({
  pricing,
  orderType,
  isCOD,
  className = '',
}) {
  if (!pricing) return null;

  const isIntraZone = pricing.tripType === 'INTRA_ZONE';

  return (
    <div className={`bg-container-lowest hairline rounded-lg shadow-card overflow-hidden ${className}`}>
      {/* Header Bar */}
      <div className="p-4 sm:p-5 bg-surface border-b border-hairline flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded bg-container-lowest hairline flex items-center justify-center text-primary">
            <Receipt className="w-3.5 h-3.5" />
          </div>
          <div>
            <div className="font-display font-bold text-sm text-ink">Rate Calculation</div>
            <div className="label-caps text-[10px] text-ink-variant">
              {orderType || 'Standard'} Shipment
            </div>
          </div>
        </div>

        {/* Trip Type Badge */}
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-container-lowest hairline text-xs text-ink font-medium">
          <MapPin className="w-3 h-3 text-primary" />
          <span className="label-caps text-[10px]">
            {isIntraZone ? 'Intra-Zone (Same Zone)' : 'Inter-Zone (Cross-Zone)'}
          </span>
        </div>
      </div>

      <div className="p-5 sm:p-6 space-y-6">
        {/* Weight Metrics Strip */}
        <div className="grid grid-cols-3 gap-3 p-3 bg-container-low hairline rounded">
          <div>
            <div className="label-caps text-[9px] text-ink-variant">Scale Weight</div>
            <div className="font-display font-bold text-xs sm:text-sm text-ink tabular mt-0.5">
              {formatWeight(pricing.actualWeightKg)}
            </div>
          </div>
          <div>
            <div className="label-caps text-[9px] text-ink-variant">Volumetric</div>
            <div className="font-display font-bold text-xs sm:text-sm text-ink tabular mt-0.5">
              {formatWeight(pricing.volumetricWeightKg)}
            </div>
          </div>
          <div>
            <div className="label-caps text-[9px] text-ink-variant">Billable Weight</div>
            <div className="font-display font-bold text-xs sm:text-sm text-primary tabular mt-0.5">
              {formatWeight(pricing.billableWeightKg)}
            </div>
          </div>
        </div>

        {/* Itemized Charge Rows */}
        <div className="space-y-3 text-xs">
          <div className="flex items-center justify-between text-ink-variant py-1 border-b border-hairline/60">
            <span className="label-caps text-[11px]">Base Rate</span>
            <span className="font-medium text-ink tabular">{formatCurrency(pricing.baseRate)}</span>
          </div>

          <div className="flex items-center justify-between text-ink-variant py-1 border-b border-hairline/60">
            <span className="label-caps text-[11px]">Additional Weight Surcharge</span>
            <span className="font-medium text-ink tabular">
              {formatCurrency(pricing.additionalWeightCharge || 0)}
            </span>
          </div>

          {(pricing.codSurcharge > 0 || isCOD) && (
            <div className="flex items-center justify-between text-ink-variant py-1 border-b border-hairline/60">
              <span className="label-caps text-[11px] flex items-center gap-1.5">
                <span>COD Handling Fee</span>
                <span className="px-1.5 py-0.2 rounded bg-accent/20 text-[#735c00] text-[9px] font-bold">
                  COD
                </span>
              </span>
              <span className="font-medium text-ink tabular">
                {formatCurrency(pricing.codSurcharge || 0)}
              </span>
            </div>
          )}
        </div>

        {/* Total Highlight */}
        <div className="pt-4 border-t border-hairline flex items-baseline justify-between">
          <div>
            <div className="label-caps text-xs text-ink font-bold">Total Estimated Rate</div>
            <div className="text-[11px] text-ink-variant">Inclusive of all applicable zone taxes</div>
          </div>
          <div className="text-right">
            <div className="font-display text-2xl sm:text-3xl font-bold text-ink tabular">
              {formatCurrency(pricing.totalAmount)}
            </div>
          </div>
        </div>

        {isCOD && (
          <div className="flex items-center gap-2 p-2.5 rounded bg-accent-soft/40 hairline text-[11px] text-ink">
            <ShieldCheck className="w-3.5 h-3.5 text-accent shrink-0" />
            <span>Cash will be collected by the field delivery agent at doorstep handover.</span>
          </div>
        )}
      </div>
    </div>
  );
}
