import React, { useState } from 'react';
import { Modal } from '../../components/ui/Modal.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Textarea } from '../../components/ui/Textarea.jsx';
import { Input } from '../../components/ui/Input.jsx';
import { useToast } from '../../components/ui/Toast.jsx';
import { ordersApi } from '../../api/orders.api.js';
import { ORDER_STATUS, FAILURE_REASONS, RESCHEDULABLE_REASONS } from '../../lib/constants.js';
import { getErrorMessage } from '../../lib/errors.js';
import { AlertTriangle } from 'lucide-react';

/**
 * Field Courier Report Delivery Failure Modal.
 *
 * @param {object} props
 * @param {boolean} props.isOpen
 * @param {() => void} props.onClose
 * @param {string} props.orderId
 * @param {string} props.orderNumber
 * @param {() => void} [props.onSuccess]
 */
export function ReportFailureModal({
  isOpen,
  onClose,
  orderId,
  orderNumber,
  onSuccess,
}) {
  // Backend validates against display strings ('Customer Unavailable', etc.),
  // not enum keys — see models/constants/StatusTransitions.js.
  const [selectedReason, setSelectedReason] = useState(FAILURE_REASONS[0]);
  const [note, setNote] = useState('');
  const [location, setLocation] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const toast = useToast();

  const handleReportFailure = async (e) => {
    e?.preventDefault();
    setError('');

    if (!selectedReason) {
      setError('Please select a failure reason.');
      return;
    }

    setIsSubmitting(true);
    try {
      await ordersApi.updateStatus(orderId, {
        status: ORDER_STATUS.FAILED,
        failureReason: selectedReason,
        note: note.trim() || undefined,
        location: location.trim() || undefined,
      });

      toast.success(`Delivery attempt logged for waybill ${orderNumber}.`);
      onSuccess?.();
      onClose();
    } catch (err) {
      const msg = getErrorMessage(err, 'Failed to log delivery failure.');
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
      title="Report Delivery Failure"
      maxWidth="max-w-md"
    >
      <form onSubmit={handleReportFailure} className="space-y-5">
        <div className="flex items-start gap-3 p-3 bg-danger-soft/60 hairline border-danger/30 rounded-lg text-xs text-danger">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            Logging a failure will release this shipment from your active queue for waybill <strong className="font-mono text-ink">{orderNumber}</strong>.
          </p>
        </div>

        {/* Reason Selector */}
        <div className="space-y-2">
          <label className="block label-caps text-ink-variant">
            Primary Failure Reason
          </label>
          <div className="space-y-2">
            {FAILURE_REASONS.map((reason) => (
              <label
                key={reason}
                className={`flex items-center gap-3 p-3 rounded-lg hairline cursor-pointer transition-colors text-xs ${
                  selectedReason === reason
                    ? 'bg-container-lowest border-primary ring-1 ring-primary font-semibold text-ink shadow-xs'
                    : 'bg-container-low hover:bg-container text-ink-variant'
                }`}
              >
                <input
                  type="radio"
                  name="failureReason"
                  value={reason}
                  checked={selectedReason === reason}
                  onChange={(e) => setSelectedReason(e.target.value)}
                  className="w-4 h-4 text-primary accent-primary"
                />
                <span>{reason}</span>
              </label>
            ))}
          </div>

          {!RESCHEDULABLE_REASONS.includes(selectedReason) && (
            <p className="text-[11px] text-ink-variant leading-relaxed">
              Note: only "Customer Unavailable" lets the customer reschedule. Any other reason sends the parcel back to origin (RTO).
            </p>
          )}
        </div>

        {/* Optional Notes */}
        <Textarea
          label="Additional Driver Notes (Optional)"
          placeholder="e.g. Called customer 3 times, gate guard confirmed tenant is away..."
          rows={2}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          disabled={isSubmitting}
        />

        {/* Optional Location */}
        <Input
          label="GPS Location / Landmark (Optional)"
          placeholder="e.g. Tower B, Sector 62, Noida"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          disabled={isSubmitting}
        />

        {error && <p className="text-xs text-danger">{error}</p>}

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
            variant="danger"
            size="md"
            isLoading={isSubmitting}
            leftIcon={<AlertTriangle className="w-3.5 h-3.5" />}
          >
            Submit Failure Report
          </Button>
        </div>
      </form>
    </Modal>
  );
}
