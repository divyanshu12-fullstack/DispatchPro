import React, { useState } from 'react';
import { Modal } from '../../components/ui/Modal.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { OtpInput } from '../../components/ui/OtpInput.jsx';
import { useToast } from '../../components/ui/Toast.jsx';
import { ordersApi } from '../../api/orders.api.js';
import { ORDER_STATUS } from '../../lib/constants.js';
import { getErrorMessage } from '../../lib/errors.js';
import { ShieldCheck, CheckCircle2 } from 'lucide-react';

/**
 * Deliver with Customer Handover OTP Modal.
 *
 * @param {object} props
 * @param {boolean} props.isOpen
 * @param {() => void} props.onClose
 * @param {string} props.orderId
 * @param {string} props.orderNumber
 * @param {() => void} [props.onSuccess]
 */
export function DeliverOtpModal({
  isOpen,
  onClose,
  orderId,
  orderNumber,
  onSuccess,
}) {
  const [otp, setOtp] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const toast = useToast();

  const handleDeliver = async (codeToSubmit) => {
    const code = codeToSubmit || otp;
    if (!code || code.length !== 6) {
      setHasError(true);
      setErrorMessage('Please enter the full 6-digit confirmation code.');
      return;
    }

    setIsSubmitting(true);
    setHasError(false);
    setErrorMessage('');

    try {
      await ordersApi.updateStatus(orderId, {
        status: ORDER_STATUS.DELIVERED,
        deliveryOtp: code,
      });

      toast.success(`Waybill ${orderNumber} marked as Delivered!`);
      setOtp('');
      onSuccess?.();
      onClose();
    } catch (err) {
      setHasError(true);
      const msg = getErrorMessage(err, 'Incorrect OTP code. Handover cannot be completed.');
      setErrorMessage(msg);
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOtpComplete = (completedOtp) => {
    setOtp(completedOtp);
    handleDeliver(completedOtp);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        setOtp('');
        setHasError(false);
        setErrorMessage('');
        onClose();
      }}
      title="Doorstep OTP Handover"
      maxWidth="max-w-md"
    >
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-full bg-accent/20 text-accent flex items-center justify-center mx-auto">
            <ShieldCheck className="w-6 h-6 text-primary" />
          </div>
          <h3 className="font-display text-base font-bold text-ink">
            Verify Customer Handover
          </h3>
          <p className="text-xs text-ink-variant leading-relaxed max-w-xs mx-auto">
            Ask the recipient for the 6-digit confirmation code sent to their registered email address for waybill <strong className="font-mono text-ink">{orderNumber}</strong>.
          </p>
        </div>

        {/* 6-box OTP Input */}
        <div className="flex flex-col items-center justify-center space-y-2">
          <OtpInput
            value={otp}
            onChange={(val) => {
              setOtp(val);
              if (hasError) {
                setHasError(false);
                setErrorMessage('');
              }
            }}
            onComplete={handleOtpComplete}
            hasError={hasError}
            disabled={isSubmitting}
            autoFocus
          />

          {errorMessage && (
            <p className="text-xs text-danger font-medium text-center animate-in fade-in">
              {errorMessage}
            </p>
          )}
        </div>

        <div className="pt-4 border-t border-hairline flex items-center justify-end gap-3">
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
            type="button"
            variant="primary"
            size="md"
            onClick={() => handleDeliver(otp)}
            isLoading={isSubmitting}
            disabled={otp.length !== 6}
            leftIcon={<CheckCircle2 className="w-4 h-4" />}
          >
            Verify & Complete Delivery
          </Button>
        </div>
      </div>
    </Modal>
  );
}
