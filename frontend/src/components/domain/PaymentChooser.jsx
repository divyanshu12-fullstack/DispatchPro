import React from 'react';
import { formatCurrency } from '../../lib/format.js';
import { Banknote, CreditCard, ShieldCheck } from 'lucide-react';

/**
 * Payment Chooser Component.
 *
 * Supports COD as the active payment method and renders a disabled Prepaid card
 * with "Razorpay Integration Coming Soon" badge per specification.
 *
 * @param {object} props
 * @param {boolean} props.isCOD - Whether COD is selected
 * @param {(isCOD: boolean) => void} props.onChange
 * @param {number} [props.totalAmount=0]
 * @param {string} [props.className='']
 */
export function PaymentChooser({
  isCOD,
  onChange,
  totalAmount = 0,
  className = '',
}) {
  return (
    <div className={`space-y-4 ${className}`}>
      <div className="label-caps text-xs text-ink-variant">Select Payment Mode</div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Cash on Delivery (Active) */}
        <div
          onClick={() => onChange?.(true)}
          className={`p-5 rounded-lg hairline cursor-pointer transition-all flex flex-col justify-between ${
            isCOD
              ? 'bg-container-lowest border-primary ring-1 ring-primary shadow-card'
              : 'bg-container-low hover:bg-container'
          }`}
        >
          <div className="flex items-start justify-between gap-2 mb-3">
            <div className="w-8 h-8 rounded bg-container-low flex items-center justify-center text-primary">
              <Banknote className="w-4 h-4" />
            </div>

            <span className="px-2 py-0.5 rounded bg-accent/20 text-[#735c00] text-[10px] font-bold">
              Available
            </span>
          </div>

          <div>
            <div className="font-display font-bold text-sm text-ink mb-1">
              Cash on Delivery (COD)
            </div>
            <p className="text-xs text-ink-variant leading-relaxed">
              Pay the delivery agent in cash at the time of doorstep handover.
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-hairline flex items-center justify-between text-xs">
            <span className="label-caps text-[10px] text-ink-variant">Amount Due</span>
            <span className="font-bold text-ink tabular">{formatCurrency(totalAmount)}</span>
          </div>
        </div>

        {/* Prepaid / Razorpay (Disabled with "Razorpay Integration Coming Soon") */}
        <div className="p-5 rounded-lg hairline bg-container-low/60 opacity-80 cursor-not-allowed flex flex-col justify-between relative overflow-hidden">
          <div className="flex items-start justify-between gap-2 mb-3">
            <div className="w-8 h-8 rounded bg-container-high flex items-center justify-center text-ink-variant/60">
              <CreditCard className="w-4 h-4" />
            </div>

            <span className="px-2 py-0.5 rounded bg-container-high text-ink-variant text-[10px] font-bold">
              Razorpay Integration Coming Soon
            </span>
          </div>

          <div>
            <div className="font-display font-bold text-sm text-ink-variant mb-1 flex items-center gap-1.5">
              <span>Prepaid (UPI / Cards / NetBanking)</span>
            </div>
            <p className="text-xs text-ink-variant/70 leading-relaxed">
              Instant online payment gateway via Razorpay is under integration.
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-hairline flex items-center gap-1.5 text-[11px] text-ink-variant/60">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Secure 256-bit encrypted checkout</span>
          </div>
        </div>
      </div>
    </div>
  );
}
