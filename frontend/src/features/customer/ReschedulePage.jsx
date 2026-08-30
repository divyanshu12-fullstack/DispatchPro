import React, { useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { ordersApi } from '../../api/orders.api.js';
import { Button } from '../../components/ui/Button.jsx';
import { Input } from '../../components/ui/Input.jsx';
import { useToast } from '../../components/ui/Toast.jsx';
import { getErrorMessage } from '../../lib/errors.js';
import { Calendar, RotateCcw, ArrowLeft, AlertTriangle, AlertCircle } from 'lucide-react';

function getTomorrowDateString() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split('T')[0];
}

const MAX_FAILED_ATTEMPTS = 2;

export function ReschedulePage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const toast = useToast();

  const orderNumberParam = searchParams.get('order') || '';
  const [orderQuery, setOrderQuery] = useState(orderNumberParam);
  const [newDeliveryDate, setNewDeliveryDate] = useState(getTomorrowDateString);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const tomorrowStr = getTomorrowDateString();

  // Server-side lookup by orderNumber
  const { data: orderData, isLoading: isLookupLoading } = useQuery({
    queryKey: ['find_failed_order_by_number', orderQuery],
    queryFn: () => ordersApi.lookupByOrderNumber(orderQuery.trim()),
    enabled: Boolean(orderQuery.trim()),
    retry: false,
  });

  // Derive matching order and lookup error directly from query state.
  const matchingOrder = orderData?.data || null;
  const lookupMessage = !isLookupLoading && !matchingOrder && orderQuery.trim()
    ? `No failed delivery matching "${orderQuery}" was found under your account.`
    : '';

  const isReschedulable = matchingOrder?.currentStatus === 'FAILED' &&
    (matchingOrder?.failedAttemptCount ?? 0) < MAX_FAILED_ATTEMPTS;

  const attemptsRemaining = MAX_FAILED_ATTEMPTS - (matchingOrder?.failedAttemptCount ?? 0);

  const handleReschedule = async (e) => {
    e?.preventDefault();
    setSubmitError('');

    if (!matchingOrder) {
      setSubmitError('Please select or specify a valid failed order number.');
      return;
    }

    if (!isReschedulable) {
      setSubmitError('This order has exceeded the maximum reschedule attempts and is marked for Return to Origin.');
      return;
    }

    if (!newDeliveryDate) {
      setSubmitError('Please choose a valid future delivery date.');
      return;
    }

    setIsSubmitting(true);
    try {
      const isoDate = new Date(newDeliveryDate + 'T10:00:00.000Z').toISOString();
      const res = await ordersApi.rescheduleOrder(matchingOrder.id, {
        newDeliveryDate: isoDate,
      });

      toast.success(res.message || `Order ${matchingOrder.orderNumber} rescheduled successfully!`);
      navigate(`/app/orders/${matchingOrder.id}`);
    } catch (err) {
      const msg = getErrorMessage(err, 'Failed to reschedule order.');
      setSubmitError(msg);
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface py-10 sm:py-14">
      <div className="max-w-xl mx-auto px-4 sm:px-6">
        <Link
          to="/app"
          className="inline-flex items-center gap-1 text-xs text-ink-variant hover:text-ink transition-colors mb-4"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Dashboard</span>
        </Link>

        <div className="bg-container-lowest hairline rounded-xl p-6 sm:p-8 shadow-card space-y-6">
          <div>
            <div className="label-caps text-xs text-ink-variant">Delivery Recovery</div>
            <h1 className="font-display text-2xl font-bold text-ink">
              Reschedule Failed Delivery
            </h1>
            <p className="text-xs text-ink-variant mt-1 leading-relaxed">
              Select a new date to re-dispatch a package that could not be delivered previously.
            </p>
          </div>

          <form onSubmit={handleReschedule} className="space-y-5">
            {/* Tracking ID input */}
            <Input
              label="Waybill Tracking Number"
              placeholder="e.g. LM-2026-000001"
              value={orderQuery}
              onChange={(e) => {
                setOrderQuery(e.target.value);
                setSubmitError('');
              }}
              helperText="Enter the tracking ID of your failed shipment"
              required
            />

            {/* If matching order found */}
            {matchingOrder ? (
              <div className="p-4 bg-container-low hairline rounded-lg space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-display font-bold text-ink">{matchingOrder.orderNumber}</span>
                  <span className="text-danger font-semibold">Delivery Failed</span>
                </div>
                <p className="text-ink-variant">
                  Reason: {matchingOrder.lastFailureReason || 'Customer unavailable at doorstep'}
                </p>
                <div className="text-[11px] text-ink-variant/70">
                  Route: {matchingOrder.pickup?.pincode} → {matchingOrder.drop?.pincode}
                </div>

                {/* Attempt counter & RTO warning */}
                {!isReschedulable ? (
                  <div className="mt-2 p-3 bg-danger-soft/60 hairline border-danger/30 rounded-lg flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-danger" />
                    <div className="text-xs text-danger">
                      <strong>Return to Origin initiated:</strong> This order has reached the maximum of {MAX_FAILED_ATTEMPTS} failed attempts and can no longer be rescheduled.
                    </div>
                  </div>
                ) : matchingOrder.failedAttemptCount > 0 ? (
                  <div className="mt-2 p-3 bg-warning-soft/60 hairline border-warning/30 rounded-lg flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0 text-warning" />
                    <div className="text-xs text-warning">
                      <strong>Attempt {matchingOrder.failedAttemptCount} of {MAX_FAILED_ATTEMPTS} used</strong> — {attemptsRemaining} reschedule attempt{attemptsRemaining !== 1 ? 's' : ''} remaining.
                    </div>
                  </div>
                ) : null}
              </div>
            ) : orderQuery && !isLookupLoading ? (
              <div className="p-3.5 bg-danger-soft/60 hairline border-danger/30 rounded-lg text-xs text-danger flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{lookupMessage || `No failed delivery matching "${orderQuery}" was found under your account.`}</span>
              </div>
            ) : null}

            {/* New Date Picker */}
            <div className="p-4 bg-container-low hairline rounded-lg space-y-3">
              <div className="label-caps text-xs text-primary font-bold flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                <span>Select New Delivery Date</span>
              </div>

              <Input
                type="date"
                min={tomorrowStr}
                value={newDeliveryDate}
                onChange={(e) => setNewDeliveryDate(e.target.value)}
                error={submitError}
                helperText="Deliveries must be scheduled for tomorrow or a future date"
                required
                disabled={!isReschedulable}
              />
            </div>

            <div className="pt-4 border-t border-hairline flex items-center justify-between gap-3">
              <Link to="/app">
                <Button type="button" variant="secondary" size="md">
                  Cancel
                </Button>
              </Link>

              <Button
                type="submit"
                variant="primary"
                size="md"
                isLoading={isSubmitting}
                disabled={!matchingOrder || !isReschedulable}
                leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
              >
                Confirm Reschedule
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
