import React, { useState } from 'react';
import { Modal } from '../../components/ui/Modal.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Input } from '../../components/ui/Input.jsx';
import { useToast } from '../../components/ui/Toast.jsx';
import { ordersApi } from '../../api/orders.api.js';
import { getErrorMessage } from '../../lib/errors.js';
import { Calendar, RotateCcw, AlertTriangle, AlertCircle } from 'lucide-react';

function getTomorrowDateString() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split('T')[0];
}

const MAX_FAILED_ATTEMPTS = 2;

/**
 * Modal to reschedule a failed delivery attempt.
 *
 * @param {object} props
 * @param {boolean} props.isOpen
 * @param {() => void} props.onClose
 * @param {string} props.orderId
 * @param {string} props.orderNumber
 * @param {number} [props.failedAttemptCount=0]
 * @param {() => void} [props.onSuccess]
 */
export function RescheduleModal({
  isOpen,
  onClose,
  orderId,
  orderNumber,
  failedAttemptCount = 0,
  onSuccess,
}) {
  const [newDeliveryDate, setNewDeliveryDate] = useState(getTomorrowDateString);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const toast = useToast();
  const tomorrowStr = getTomorrowDateString();

  const isReschedulable = failedAttemptCount < MAX_FAILED_ATTEMPTS;
  const attemptsRemaining = MAX_FAILED_ATTEMPTS - failedAttemptCount;

  const handleReschedule = async (e) => {
    e?.preventDefault();
    setError('');

    if (!isReschedulable) {
      setError('This order has exceeded the maximum reschedule attempts and is marked for Return to Origin.');
      return;
    }

    if (!newDeliveryDate) {
      setError('Please select a valid future delivery date.');
      return;
    }

    setIsSubmitting(true);
    try {
      // Send ISO string in future
      const isoDate = new Date(newDeliveryDate + 'T10:00:00.000Z').toISOString();
      const res = await ordersApi.rescheduleOrder(orderId, {
        newDeliveryDate: isoDate,
      });

      toast.success(res.message || `Order ${orderNumber} rescheduled successfully!`);
      onSuccess?.();
      onClose();
    } catch (err) {
      const msg = getErrorMessage(err, 'Failed to reschedule order.');
      setError(msg);
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Reschedule Failed Delivery"
      maxWidth="max-w-md"
    >
      <form onSubmit={handleReschedule} className="space-y-5">
        <div className="space-y-2">
          <p className="text-xs text-ink-variant leading-relaxed">
            Select a new delivery date for waybill <strong className="text-ink font-mono">{orderNumber}</strong>. The shipment will be re-queued in the dispatch engine and assigned for delivery.
          </p>

          {/* Attempt counter & RTO warning */}
          {!isReschedulable ? (
            <div className="p-3 bg-danger-soft/60 hairline border-danger/30 rounded-lg flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-danger" />
              <div className="text-xs text-danger">
                <strong>Return to Origin initiated:</strong> This order has reached the maximum of {MAX_FAILED_ATTEMPTS} failed attempts and can no longer be rescheduled.
              </div>
            </div>
          ) : failedAttemptCount > 0 ? (
            <div className="p-3 bg-warning-soft/60 hairline border-warning/30 rounded-lg flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-warning" />
              <div className="text-xs text-warning">
                <strong>Attempt {failedAttemptCount} of {MAX_FAILED_ATTEMPTS} used</strong> — {attemptsRemaining} reschedule attempt{attemptsRemaining !== 1 ? 's' : ''} remaining.
              </div>
            </div>
          ) : null}
        </div>

        <div className="p-4 bg-container-low hairline rounded-lg space-y-3">
          <div className="label-caps text-xs text-primary font-bold flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5" />
            <span>Select New Target Date</span>
          </div>

          <Input
            type="date"
            min={tomorrowStr}
            value={newDeliveryDate}
            onChange={(e) => {
              setNewDeliveryDate(e.target.value);
              setError('');
            }}
            error={error}
            helperText="Delivery can be scheduled for tomorrow onwards"
            required
            disabled={!isReschedulable}
          />
        </div>

        <div className="pt-3 border-t border-hairline flex items-center justify-end gap-3">
          <Button
            type="button"
            variant="secondary"
            size="md"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>

          <Button
            type="submit"
            variant="primary"
            size="md"
            isLoading={isSubmitting}
            disabled={!isReschedulable}
            leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
          >
            Confirm Reschedule
          </Button>
        </div>
      </form>
    </Modal>
  );
}
