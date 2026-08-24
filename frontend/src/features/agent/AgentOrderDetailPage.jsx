import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { ordersApi } from '../../api/orders.api.js';
import { StatusChip } from '../../components/domain/StatusChip.jsx';
import { PincodePair } from '../../components/domain/PincodePair.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Skeleton } from '../../components/ui/Skeleton.jsx';
import { DeliverOtpModal } from './DeliverOtpModal.jsx';
import { ReportFailureModal } from './ReportFailureModal.jsx';
import { useToast } from '../../components/ui/Toast.jsx';
import { formatCurrency, formatWeight, formatDimensions, formatDate } from '../../lib/format.js';
import { ORDER_STATUS } from '../../lib/constants.js';
import { getErrorMessage } from '../../lib/errors.js';
import {
  ArrowLeft,
  MapPin,
  ShieldCheck,
  AlertTriangle,
  Banknote,
  Box,
  CheckCircle2,
  PackageCheck,
  Navigation,
  Truck,
  RotateCcw,
  Compass,
  Copy,
  Check,
} from 'lucide-react';

export function AgentOrderDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [isOtpOpen, setIsOtpOpen] = useState(false);
  const [isFailureOpen, setIsFailureOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  // Fetch Order
  const {
    data: order,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['agent_order_detail', id],
    queryFn: () => ordersApi.getOrder(id),
    enabled: Boolean(id),
  });

  const handleCopyWaybill = () => {
    if (!order?.orderNumber) return;
    navigator.clipboard.writeText(order.orderNumber);
    setIsCopied(true);
    toast.success('Waybill tracking number copied to clipboard');
    setTimeout(() => setIsCopied(false), 2000);
  };

  const openGoogleMaps = (address, pincode) => {
    const query = encodeURIComponent(`${address || ''} ${pincode || ''}`.trim());
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${query}`, '_blank');
  };

  const handleStatusTransition = async (nextStatus) => {
    setIsUpdating(true);
    try {
      await ordersApi.updateStatus(order.id, { status: nextStatus });
      toast.success(`Status updated to ${nextStatus.replace(/_/g, ' ')}!`);
      refetch();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to update order status.'));
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-surface py-6">
        <div className="max-w-xl mx-auto px-4 space-y-4">
          <Skeleton className="h-6 w-28" />
          <Skeleton className="h-32 w-full rounded-2xl" />
          <Skeleton className="h-44 w-full rounded-2xl" />
        </div>
      </div>
    );
  }

  if (isError || !order) {
    return (
      <div className="min-h-screen bg-surface py-16 flex flex-col items-center justify-center text-center px-4">
        <div className="w-12 h-12 rounded-full bg-danger-soft text-danger flex items-center justify-center mb-3">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <h2 className="font-display text-xl font-bold text-ink mb-1">Task Not Found</h2>
        <p className="text-xs text-ink-variant max-w-xs mb-6">
          This delivery task is not assigned to your courier account or does not exist.
        </p>
        <Link to="/agent">
          <Button variant="primary" size="md" leftIcon={<ArrowLeft className="w-4 h-4" />}>
            Back to Queue
          </Button>
        </Link>
      </div>
    );
  }

  const isAssigned = order.currentStatus === ORDER_STATUS.ASSIGNED;
  const isPickedUp = order.currentStatus === ORDER_STATUS.PICKED_UP;
  const isInTransit = order.currentStatus === ORDER_STATUS.IN_TRANSIT;
  const isOutForDelivery = order.currentStatus === ORDER_STATUS.OUT_FOR_DELIVERY;
  const isDelivered = order.currentStatus === ORDER_STATUS.DELIVERED;
  const isFailed = order.currentStatus === ORDER_STATUS.FAILED;
  const isRTO = order.currentStatus === ORDER_STATUS.RETURN_TO_ORIGIN;

  const isCOD = Boolean(order.isCOD);
  const codAmount = order.declaredValue || order.pricing?.totalAmount;

  return (
    <div className="min-h-screen bg-surface py-4 sm:py-8 pb-32">
      <div className="max-w-xl mx-auto px-3 sm:px-6 space-y-4">
        {/* Top Back Navigation Bar */}
        <div className="flex items-center justify-between">
          <Link
            to="/agent"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink-variant hover:text-ink transition-colors p-1"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Delivery Queue</span>
          </Link>

          <span className="text-[11px] text-ink-variant font-medium">
            Delivery: <strong className="text-ink">{formatDate(order.scheduledDeliveryDate)}</strong>
          </span>
        </div>

        {/* Waybill Identifier & Status Banner */}
        <div className="bg-container-lowest hairline rounded-2xl p-4 sm:p-5 shadow-card space-y-3">
          <div className="flex items-center justify-between">
            <span className="label-caps text-[10px] text-ink-variant">Waybill Tracking Number</span>
            <StatusChip status={order.currentStatus} />
          </div>

          <div className="flex items-center justify-between gap-3">
            <span className="font-display text-2xl sm:text-3xl font-bold text-ink tabular tracking-tight">
              {order.orderNumber}
            </span>

            <button
              onClick={handleCopyWaybill}
              className="px-2.5 py-1.5 rounded-lg bg-container-low hover:bg-container hairline text-xs text-ink-variant hover:text-ink transition-colors flex items-center gap-1.5 cursor-pointer shrink-0"
              title="Copy Waybill ID"
            >
              {isCopied ? <Check className="w-3.5 h-3.5 text-success" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{isCopied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
        </div>

        {/* COD Cash Collection Alert Banner */}
        {isCOD && !isDelivered && (
          <div className="bg-accent-soft/60 hairline border-accent/40 rounded-2xl p-4 sm:p-5 shadow-card space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-[#735c00]">
              <Banknote className="w-4 h-4" />
              <span className="label-caps text-[11px]">Doorstep Cash Collection Required</span>
            </div>
            <div className="flex items-baseline justify-between pt-1">
              <span className="text-xs text-ink-variant">Amount to Collect:</span>
              <span className="font-display text-2xl sm:text-3xl font-bold text-ink tabular">
                {formatCurrency(codAmount)}
              </span>
            </div>
            <p className="text-[11px] text-ink-variant leading-relaxed">
              Please collect the cash from the customer before asking for the 6-digit confirmation OTP.
            </p>
          </div>
        )}

        {/* Route Map & Quick Maps Directions */}
        <div className="bg-container-lowest hairline rounded-2xl p-4 sm:p-5 shadow-card space-y-4">
          <div className="flex items-center justify-between border-b border-hairline pb-3">
            <div className="label-caps text-xs text-ink font-bold flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-primary" />
              <span>Route & Addresses</span>
            </div>

            <button
              onClick={() => openGoogleMaps(order.drop?.address, order.drop?.pincode)}
              className="px-3 py-1.5 rounded-xl bg-primary text-on-primary text-xs font-semibold flex items-center gap-1.5 shadow-sm cursor-pointer hover:bg-primary-hover transition-colors"
            >
              <Compass className="w-3.5 h-3.5" />
              <span>Open in Google Maps</span>
            </button>
          </div>

          <PincodePair
            pickup={{
              pincode: order.pickup?.pincode,
              address: order.pickup?.address,
              companyName: order.pickupCompanyName,
            }}
            drop={{
              pincode: order.drop?.pincode,
              address: order.drop?.address,
              companyName: order.dropCompanyName,
            }}
            compact={false}
          />
        </div>

        {/* Package Specs */}
        <div className="bg-container-lowest hairline rounded-2xl p-4 sm:p-5 shadow-card space-y-3">
          <div className="label-caps text-xs text-ink font-bold flex items-center gap-1.5 border-b border-hairline pb-2.5">
            <Box className="w-3.5 h-3.5 text-primary" />
            <span>Parcel Specifications</span>
          </div>

          <div className="grid grid-cols-2 gap-2.5 text-xs">
            <div className="p-3 bg-container-low rounded-xl hairline">
              <div className="label-caps text-[9px] text-ink-variant">Weight</div>
              <div className="font-bold text-ink tabular mt-0.5 text-sm">
                {formatWeight(order.actualWeightKg)}
              </div>
            </div>

            <div className="p-3 bg-container-low rounded-xl hairline">
              <div className="label-caps text-[9px] text-ink-variant">Dimensions (L×B×H)</div>
              <div className="font-bold text-ink tabular mt-0.5 text-sm">
                {formatDimensions(order.dimensions)}
              </div>
            </div>
          </div>
        </div>

        {/* Terminal Status Notices */}
        {isDelivered && (
          <div className="bg-success-soft/50 hairline border-success/30 rounded-2xl p-5 text-center space-y-2">
            <CheckCircle2 className="w-8 h-8 text-success mx-auto" />
            <h3 className="font-display text-base font-bold text-success">
              Delivery Complete
            </h3>
            <p className="text-xs text-ink-variant">
              This shipment was verified and marked as delivered via customer OTP code.
            </p>
          </div>
        )}

        {isFailed && (
          <div className="bg-danger-soft/50 hairline border-danger/30 rounded-2xl p-5 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-danger">
              <AlertTriangle className="w-4 h-4" />
              <span>Delivery Failed</span>
            </div>
            <p className="text-xs text-ink-variant leading-relaxed">
              Reason: <strong className="text-ink">{order.lastFailureReason || 'Customer unavailable'}</strong>. Package has been returned to depot for rescheduling.
            </p>
          </div>
        )}

        {isRTO && (
          <div className="bg-danger-soft/50 hairline border-danger/30 rounded-2xl p-5 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-danger">
              <RotateCcw className="w-4 h-4" />
              <span>Returning to Origin</span>
            </div>
            <p className="text-xs text-ink-variant leading-relaxed">
              Delivery attempts exceeded or package refused. Please return this parcel to the sender hub.
            </p>
          </div>
        )}
      </div>

      {/* Floating Bottom Action Bar for Active Stages - Mobile Thumb Ergonomics */}
      {(isAssigned || isPickedUp || isInTransit || isOutForDelivery) && (
        <div className="fixed bottom-0 left-0 right-0 bg-container-lowest/95 backdrop-blur hairline border-b-0 border-x-0 p-3.5 sm:p-4 shadow-overlay z-40">
          <div className="max-w-xl mx-auto flex items-center justify-between gap-3">
            {isAssigned && (
              <Button
                variant="primary"
                size="lg"
                className="w-full text-sm"
                isLoading={isUpdating}
                leftIcon={<PackageCheck className="w-4 h-4" />}
                onClick={() => handleStatusTransition(ORDER_STATUS.PICKED_UP)}
              >
                Confirm Package Pickup
              </Button>
            )}

            {isPickedUp && (
              <Button
                variant="primary"
                size="lg"
                className="w-full text-sm"
                isLoading={isUpdating}
                leftIcon={<Navigation className="w-4 h-4" />}
                onClick={() => handleStatusTransition(ORDER_STATUS.IN_TRANSIT)}
              >
                Start Transit
              </Button>
            )}

            {isInTransit && (
              <Button
                variant="primary"
                size="lg"
                className="w-full text-sm"
                isLoading={isUpdating}
                leftIcon={<Truck className="w-4 h-4" />}
                onClick={() => handleStatusTransition(ORDER_STATUS.OUT_FOR_DELIVERY)}
              >
                Start Out for Delivery
              </Button>
            )}

            {isOutForDelivery && (
              <div className="flex items-center gap-2.5 w-full">
                <Button
                  type="button"
                  variant="secondary"
                  size="lg"
                  className="flex-1 text-xs"
                  leftIcon={<AlertTriangle className="w-4 h-4 text-danger" />}
                  onClick={() => setIsFailureOpen(true)}
                >
                  Report Failure
                </Button>

                <Button
                  type="button"
                  variant="primary"
                  size="lg"
                  className="flex-1 text-xs"
                  leftIcon={<ShieldCheck className="w-4 h-4" />}
                  onClick={() => setIsOtpOpen(true)}
                >
                  Verify OTP & Deliver
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Deliver OTP Modal */}
      <DeliverOtpModal
        isOpen={isOtpOpen}
        onClose={() => setIsOtpOpen(false)}
        orderId={order.id}
        orderNumber={order.orderNumber}
        onSuccess={refetch}
      />

      {/* Report Failure Modal */}
      <ReportFailureModal
        isOpen={isFailureOpen}
        onClose={() => setIsFailureOpen(false)}
        orderId={order.id}
        orderNumber={order.orderNumber}
        onSuccess={() => {
          refetch();
          navigate('/agent');
        }}
      />
    </div>
  );
}
