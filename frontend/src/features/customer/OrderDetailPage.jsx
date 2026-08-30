import React, { useState } from 'react';
import { useParams, Link } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { ordersApi } from '../../api/orders.api.js';
import { WaybillHeader } from '../../components/domain/WaybillHeader.jsx';
import { LifecycleStepper } from '../../components/domain/LifecycleStepper.jsx';
import { PincodePair } from '../../components/domain/PincodePair.jsx';
import { PriceBreakdown } from '../../components/domain/PriceBreakdown.jsx';
import { StatusChip } from '../../components/domain/StatusChip.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Skeleton } from '../../components/ui/Skeleton.jsx';
import { RescheduleModal } from './RescheduleModal.jsx';
import { formatDateTime, formatWeight, formatDimensions, formatCurrency } from '../../lib/format.js';
import { ORDER_STATUS } from '../../lib/constants.js';
import {
  ArrowLeft,
  RefreshCw,
  MapPin,
  Building,
  ShieldCheck,
  RotateCcw,
  AlertTriangle,
  Clock,
  User,
  Box,
  Truck,
} from 'lucide-react';

export function OrderDetailPage() {
  const { id } = useParams();
  const [isRescheduleOpen, setIsRescheduleOpen] = useState(false);

  // Fetch Order
  const {
    data: order,
    isLoading: isOrderLoading,
    isError: isOrderError,
    refetch: refetchOrder,
  } = useQuery({
    queryKey: ['order_detail', id],
    queryFn: () => ordersApi.getOrder(id),
    enabled: Boolean(id),
  });

  // Fetch Timeline
  const {
    data: timelineData,
    isLoading: isTimelineLoading,
    refetch: refetchTimeline,
  } = useQuery({
    queryKey: ['order_timeline', id],
    queryFn: () => ordersApi.getOrderTimeline(id),
    enabled: Boolean(id),
  });

  const timelineItems = timelineData?.items || [];

  const handleRefreshAll = () => {
    refetchOrder();
    refetchTimeline();
  };

  if (isOrderLoading) {
    return (
      <div className="min-h-screen bg-surface py-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-6">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-28 w-full rounded-lg" />
          <Skeleton className="h-28 w-full rounded-lg" />
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <Skeleton className="lg:col-span-7 h-96 rounded-lg" />
            <Skeleton className="lg:col-span-5 h-96 rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  if (isOrderError || !order) {
    return (
      <div className="min-h-screen bg-surface py-16 flex flex-col items-center justify-center text-center px-4">
        <div className="w-12 h-12 rounded-full bg-danger-soft text-danger flex items-center justify-center mb-3">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <h2 className="font-display text-xl font-bold text-ink mb-1">Shipment Not Found</h2>
        <p className="text-xs text-ink-variant max-w-sm mb-6">
          The requested waybill tracking record could not be loaded or you do not have permission to view it.
        </p>
        <Link to="/app">
          <Button variant="primary" size="md" leftIcon={<ArrowLeft className="w-4 h-4" />}>
            Back to My Shipments
          </Button>
        </Link>
      </div>
    );
  }

  const isFailed = order.currentStatus === ORDER_STATUS.FAILED;
  const isOutForDelivery = order.currentStatus === ORDER_STATUS.OUT_FOR_DELIVERY;

  return (
    <div className="min-h-screen bg-surface py-8 sm:py-10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Top Breadcrumb & Actions */}
        <div className="flex items-center justify-between gap-4">
          <Link
            to="/app"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink-variant hover:text-ink transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Shipments</span>
          </Link>

          <Button
            variant="secondary"
            size="sm"
            onClick={handleRefreshAll}
            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
          >
            Refresh Status
          </Button>
        </div>

        {/* 1. Signature Waybill Header */}
        <WaybillHeader
          orderNumber={order.orderNumber}
          status={order.currentStatus}
          createdAt={order.createdAt}
          scheduledDeliveryDate={order.scheduledDeliveryDate}
        />

        {/* 2. Lifecycle Stepper */}
        <LifecycleStepper
          currentStatus={order.currentStatus}
          lastFailureReason={order.lastFailureReason}
        />

        {/* 3. Out For Delivery OTP Alert Banner */}
        {isOutForDelivery && (
          <div className="bg-container-lowest hairline rounded-lg p-5 shadow-card flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-accent/40">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-full bg-accent/20 text-accent flex items-center justify-center shrink-0 mt-0.5">
                <ShieldCheck className="w-5 h-5 text-primary" />
              </div>
              <div>
                <div className="font-display font-bold text-sm text-ink flex items-center gap-2">
                  <span>Out for Delivery Today</span>
                  <span className="px-2 py-0.5 rounded bg-accent text-on-primary text-[10px] font-bold">
                    Active
                  </span>
                </div>
                <p className="text-xs text-ink-variant mt-1 leading-relaxed max-w-xl">
                  Your field courier is en route with your package. A secure 6-digit confirmation code has been dispatched to your email. Please share this code upon arrival to confirm handover.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 4. Reschedule Action Callout Banner (If FAILED) */}
        {isFailed && (
          <div className="bg-container-lowest hairline border-danger/30 rounded-lg p-5 shadow-card flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-full bg-danger-soft text-danger flex items-center justify-center shrink-0 mt-0.5">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <div className="font-display font-bold text-sm text-danger">
                  Delivery Attempt Unsuccessful
                </div>
                <p className="text-xs text-ink-variant mt-0.5 leading-relaxed max-w-lg">
                  Reason: <strong className="text-ink">{order.lastFailureReason || 'Customer was unavailable'}</strong>. You can choose a new convenient date for another delivery attempt.
                </p>
              </div>
            </div>

            <Button
              variant="primary"
              size="md"
              leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
              onClick={() => setIsRescheduleOpen(true)}
              className="shrink-0"
            >
              Reschedule Delivery
            </Button>
          </div>
        )}

        {/* 5. Main 2-Column Content */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Route Details & Audit Timeline */}
          <div className="lg:col-span-7 space-y-6">
            {/* Address & Route Card */}
            <div className="bg-container-lowest hairline rounded-lg p-6 shadow-card space-y-6">
              <div className="flex items-center justify-between border-b border-hairline pb-3">
                <div className="label-caps text-xs text-ink font-bold flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-primary" />
                  <span>Route & Address Details</span>
                </div>
                <span className="px-2 py-0.5 rounded bg-container-low hairline text-[10px] font-bold text-ink-variant">
                  {order.orderType} Shipment
                </span>
              </div>

              {/* Origin / Drop Line-and-Pin */}
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

              {/* B2B Commercial Invoicing details */}
              {order.orderType === 'B2B' && (
                <div className="pt-4 border-t border-hairline space-y-3">
                  <div className="label-caps text-[10px] text-ink-variant flex items-center gap-1">
                    <Building className="w-3 h-3 text-primary" />
                    <span>Commercial GSTIN Invoicing</span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-xs bg-container-low p-3 rounded hairline">
                    <div>
                      <div className="label-caps text-[9px] text-ink-variant">Pickup GSTIN</div>
                      <div className="font-mono font-bold text-ink mt-0.5">
                        {order.pickupGstin || 'N/A'}
                      </div>
                    </div>
                    <div>
                      <div className="label-caps text-[9px] text-ink-variant">Drop GSTIN</div>
                      <div className="font-mono font-bold text-ink mt-0.5">
                        {order.dropGstin || 'N/A'}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Immutable Audit Timeline Stream */}
            <div className="bg-container-lowest hairline rounded-lg p-6 shadow-card space-y-5">
              <div className="flex items-center justify-between border-b border-hairline pb-3">
                <div className="label-caps text-xs text-ink font-bold flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-primary" />
                  <span>Immutable Audit Timeline</span>
                </div>
                <span className="text-[11px] text-ink-variant tabular">
                  {timelineItems.length} {timelineItems.length === 1 ? 'Event' : 'Events'}
                </span>
              </div>

              {isTimelineLoading ? (
                <div className="py-6 text-center text-xs text-ink-variant">
                  Loading timeline events...
                </div>
              ) : timelineItems.length === 0 ? (
                <div className="py-6 text-center text-xs text-ink-variant">
                  No lifecycle transitions recorded yet.
                </div>
              ) : (
                <div className="space-y-4 relative pl-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-[2px] before:bg-hairline">
                  {timelineItems.map((evt, idx) => (
                    <div key={evt.id || idx} className="relative pl-4 space-y-1">
                      {/* Node Bullet */}
                      <div className="absolute -left-[14px] top-1 w-2.5 h-2.5 rounded-full bg-primary ring-4 ring-container-lowest" />

                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <StatusChip status={evt.toStatus} />
                          {evt.actorRole && (
                            <span className="px-1.5 py-0.5 rounded bg-container-low text-[9px] font-mono text-ink-variant">
                              by {evt.actorRole}
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-ink-variant/70 tabular">
                          {formatDateTime(evt.changedAt)}
                        </span>
                      </div>

                      {evt.note && (
                        <p className="text-xs text-ink leading-relaxed mt-1">{evt.note}</p>
                      )}

                      {evt.failureReason && (
                        <div className="text-xs text-danger font-medium mt-1">
                          Failure Reason: {evt.failureReason}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Freight Invoicing & Parcel Specifications */}
          <div className="lg:col-span-5 space-y-6">
            {/* Price Breakdown */}
            <PriceBreakdown
              pricing={{
                ...order.pricing,
                actualWeightKg: order.actualWeightKg,
              }}
              orderType={order.orderType}
              isCOD={order.isCOD}
            />

            {/* Parcel Dimensions & Specs */}
            <div className="bg-container-lowest hairline rounded-lg p-5 shadow-card space-y-4">
              <div className="label-caps text-xs text-ink font-bold flex items-center gap-1.5">
                <Box className="w-3.5 h-3.5 text-primary" />
                <span>Parcel Specifications</span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-container-low rounded hairline">
                  <div className="label-caps text-[9px] text-ink-variant">Scale Weight</div>
                  <div className="font-display font-bold text-ink tabular mt-0.5">
                    {formatWeight(order.actualWeightKg)}
                  </div>
                </div>

                <div className="p-3 bg-container-low rounded hairline">
                  <div className="label-caps text-[9px] text-ink-variant">Dimensions (L×B×H)</div>
                  <div className="font-display font-bold text-ink tabular mt-0.5">
                    {formatDimensions(order.dimensions)}
                  </div>
                </div>
              </div>

              {order.isCOD && (
                <div className="p-3 bg-accent-soft/40 hairline rounded text-xs flex items-center justify-between">
                  <span className="label-caps text-[10px] text-ink-variant">Cash Collection Due</span>
                  <span className="font-bold text-ink tabular">
                    {formatCurrency(order.declaredValue || order.pricing?.totalAmount)}
                  </span>
                </div>
              )}
            </div>

            {/* Courier Assignment Card */}
            <div className="bg-container-lowest hairline rounded-lg p-5 shadow-card space-y-3">
              <div className="label-caps text-xs text-ink font-bold flex items-center gap-1.5">
                <Truck className="w-3.5 h-3.5 text-primary" />
                <span>Courier Assignment</span>
              </div>

              {order.assignedAgent ? (
                <div className="flex items-center gap-3 p-3 bg-container-low rounded hairline text-xs">
                  <div className="w-8 h-8 rounded-full bg-primary text-on-primary flex items-center justify-center font-bold">
                    <User className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-semibold text-ink">Field Delivery Agent Assigned</div>
                    <div className="text-[11px] text-ink-variant">Assigned for local zone dispatch</div>
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-container-low rounded hairline text-xs text-ink-variant">
                  {order.currentStatus === ORDER_STATUS.CREATED
                    ? 'Pending automated dispatch assignment to zone courier.'
                    : 'No courier currently assigned.'}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Reschedule Modal */}
        <RescheduleModal
          isOpen={isRescheduleOpen}
          onClose={() => setIsRescheduleOpen(false)}
          orderId={order.id}
          orderNumber={order.orderNumber}
          failedAttemptCount={order.failedAttemptCount ?? 0}
          onSuccess={handleRefreshAll}
        />
      </div>
    </div>
  );
}
