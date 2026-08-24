import React from 'react';
import { HAPPY_PATH_STEPS, ORDER_STATUS } from '../../lib/constants.js';
import { Check, AlertTriangle, RotateCcw } from 'lucide-react';

/**
 * Honest Lifecycle Stepper.
 *
 * @param {object} props
 * @param {string} props.currentStatus - Active status
 * @param {string} [props.lastFailureReason] - Failure reason when FAILED or RTO
 * @param {string} [props.className='']
 */
export function LifecycleStepper({
  currentStatus,
  lastFailureReason,
  className = '',
}) {
  const isFailed = currentStatus === ORDER_STATUS.FAILED;
  const isRTO = currentStatus === ORDER_STATUS.RETURN_TO_ORIGIN;
  const isRescheduled = currentStatus === ORDER_STATUS.RESCHEDULED;

  // Find index in happy path
  let activeIndex = HAPPY_PATH_STEPS.findIndex((s) => s.status === currentStatus);
  if (activeIndex === -1) {
    if (isFailed || isRTO) {
      // Failed during or right before delivery
      activeIndex = 4; // Out for delivery node
    } else if (isRescheduled) {
      activeIndex = 0; // Back to Placed
    } else {
      activeIndex = 0;
    }
  }

  return (
    <div className={`bg-container-lowest hairline rounded-lg p-6 shadow-card space-y-6 ${className}`}>
      {/* Top Title */}
      <div className="flex items-center justify-between">
        <div className="label-caps text-xs text-ink-variant">Shipment Progress</div>
        {(isFailed || isRTO) && (
          <span className="label-caps text-[10px] text-danger font-bold flex items-center gap-1 bg-danger-soft px-2 py-0.5 rounded">
            <AlertTriangle className="w-3 h-3" />
            {isRTO ? 'Returning to Origin' : 'Delivery Attempt Failed'}
          </span>
        )}
      </div>

      {/* Stepper Horizontal Track */}
      <div className="relative py-2">
        <div className="grid grid-cols-6 gap-2 relative">
          {HAPPY_PATH_STEPS.map((step, idx) => {
            const isCompleted = idx < activeIndex || currentStatus === ORDER_STATUS.DELIVERED;
            const isCurrent = idx === activeIndex && !isFailed && !isRTO && currentStatus !== ORDER_STATUS.DELIVERED;
            const isBroken = (isFailed || isRTO) && idx === activeIndex;

            return (
              <div key={step.status} className="flex flex-col items-center text-center relative group">
                {/* Connecting Line (left side) */}
                {idx > 0 && (
                  <div
                    className={`absolute top-3.5 -left-1/2 w-full h-[2px] -z-0 ${
                      idx <= activeIndex
                        ? isBroken && idx === activeIndex
                          ? 'bg-danger'
                          : 'bg-primary'
                        : 'bg-hairline'
                    }`}
                  />
                )}

                {/* Node Circle */}
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold z-10 transition-colors ${
                    isBroken
                      ? 'bg-danger text-white'
                      : isCompleted
                      ? 'bg-primary text-on-primary'
                      : isCurrent
                      ? 'bg-container-lowest border-2 border-primary text-primary ring-4 ring-container-low'
                      : 'bg-container-high text-ink-variant/60 border border-hairline'
                  }`}
                >
                  {isBroken ? (
                    <AlertTriangle className="w-3.5 h-3.5" />
                  ) : isCompleted ? (
                    <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                  ) : (
                    <span className="tabular text-[11px]">{idx + 1}</span>
                  )}
                </div>

                {/* Step Label */}
                <span
                  className={`label-caps text-[10px] mt-2 leading-tight ${
                    isBroken
                      ? 'text-danger font-bold'
                      : isCurrent
                      ? 'text-primary font-bold'
                      : isCompleted
                      ? 'text-ink font-semibold'
                      : 'text-ink-variant/60'
                  }`}
                >
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Failure or Exception Callout Banner */}
      {isFailed && (
        <div className="p-4 rounded bg-danger-soft/50 hairline border-danger/30 text-xs text-ink space-y-1">
          <div className="font-bold text-danger flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4" />
            <span>Delivery Attempt Unsuccessful</span>
          </div>
          <p className="text-ink-variant leading-relaxed">
            Reason: <strong className="text-ink">{lastFailureReason || 'Customer Unavailable'}</strong>. You can choose a new delivery date below.
          </p>
        </div>
      )}

      {isRTO && (
        <div className="p-4 rounded bg-danger-soft/50 hairline border-danger/30 text-xs text-ink space-y-1">
          <div className="font-bold text-danger flex items-center gap-1.5">
            <RotateCcw className="w-4 h-4" />
            <span>Package is Returning to Origin</span>
          </div>
          <p className="text-ink-variant leading-relaxed">
            Reason: <strong className="text-ink">{lastFailureReason || 'Delivery attempts exceeded'}</strong>. Rescheduling is no longer available.
          </p>
        </div>
      )}
    </div>
  );
}
