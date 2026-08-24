import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ordersApi } from '../../api/orders.api.js';
import { Button } from '../../components/ui/Button.jsx';
import { TableSkeleton } from '../../components/ui/Skeleton.jsx';
import { EmptyState } from '../../components/ui/EmptyState.jsx';
import { useToast } from '../../components/ui/Toast.jsx';
import { formatDateTime, formatDate, formatCurrency } from '../../lib/format.js';
import { getErrorMessage } from '../../lib/errors.js';
import {
  Compass,
  AlertTriangle,
  Play,
  RefreshCw,
  MapPin,
  Calendar,
  CheckCircle2,
  Layers,
} from 'lucide-react';

export function AdminDispatchPage() {
  const toast = useToast();
  const [dispatchingId, setDispatchingId] = useState(null);
  const [isBulkDispatching, setIsBulkDispatching] = useState(false);

  // Fetch pending created shipments
  const {
    data,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['admin_dispatch_queue'],
    queryFn: () => ordersApi.listOrders({ status: 'CREATED', limit: 100 }),
    refetchInterval: 10000, // Poll dispatch queue every 10s
  });

  const orders = data?.items || [];
  const needsAttentionOrders = orders.filter((o) => o.needsManualAttention || (o.assignmentAttempts || 0) >= 3);

  const handleDispatchSingle = async (orderId, orderNumber) => {
    setDispatchingId(orderId);
    try {
      const res = await ordersApi.dispatchOrder(orderId);
      toast.success(res.message || `Waybill ${orderNumber} dispatched successfully!`);
      refetch();
    } catch (err) {
      toast.error(getErrorMessage(err, `No available couriers in origin zone for ${orderNumber}.`));
    } finally {
      setDispatchingId(null);
    }
  };

  const handleDispatchAll = async () => {
    if (orders.length === 0) return;
    setIsBulkDispatching(true);
    let successCount = 0;
    let failCount = 0;

    for (const order of orders) {
      try {
        await ordersApi.dispatchOrder(order.id);
        successCount++;
      } catch {
        failCount++;
      }
    }

    setIsBulkDispatching(false);
    if (successCount > 0) {
      toast.success(`Dispatched ${successCount} shipments successfully.`);
    }
    if (failCount > 0) {
      toast.error(`${failCount} shipments could not be assigned (no available couriers in zone).`);
    }
    refetch();
  };

  return (
    <div className="min-h-screen bg-surface py-8 sm:py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="label-caps text-xs text-ink-variant">Automated Logistics Engine</div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-ink">
              Dispatch Control Queue
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="secondary"
              size="md"
              onClick={() => refetch()}
              leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
            >
              Sync Queue
            </Button>

            <Button
              variant="primary"
              size="md"
              disabled={orders.length === 0 || isBulkDispatching}
              isLoading={isBulkDispatching}
              onClick={handleDispatchAll}
              leftIcon={<Play className="w-4 h-4" />}
            >
              Auto-Dispatch All ({orders.length})
            </Button>
          </div>
        </div>

        {/* Metrics Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-container-lowest hairline rounded-xl p-5 shadow-card flex items-center justify-between">
            <div>
              <div className="label-caps text-xs text-ink-variant">Pending In Queue</div>
              <div className="font-display text-2xl sm:text-3xl font-bold text-ink tabular mt-1">
                {orders.length}
              </div>
            </div>
            <div className="w-10 h-10 rounded-full bg-container-low flex items-center justify-center text-primary">
              <Compass className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-container-lowest hairline rounded-xl p-5 shadow-card flex items-center justify-between">
            <div>
              <div className="label-caps text-xs text-ink-variant">Needs Attention</div>
              <div className={`font-display text-2xl sm:text-3xl font-bold tabular mt-1 ${
                needsAttentionOrders.length > 0 ? 'text-danger' : 'text-ink'
              }`}>
                {needsAttentionOrders.length}
              </div>
            </div>
            <div className="w-10 h-10 rounded-full bg-danger-soft text-danger flex items-center justify-center">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-container-lowest hairline rounded-xl p-5 shadow-card flex items-center justify-between">
            <div>
              <div className="label-caps text-xs text-ink-variant">Dispatch Status</div>
              <div className="font-display text-sm font-bold text-success flex items-center gap-1.5 mt-2">
                <CheckCircle2 className="w-4 h-4" />
                <span>Zone Engine Active</span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-full bg-success-soft text-success flex items-center justify-center">
              <Layers className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Queue Table */}
        <div className="bg-container-lowest hairline rounded-lg shadow-card overflow-hidden">
          {isLoading ? (
            <div className="p-6">
              <TableSkeleton rows={5} cols={5} />
            </div>
          ) : isError ? (
            <div className="p-12 text-center">
              <p className="text-xs text-danger mb-3">Failed to load dispatch queue.</p>
              <Button variant="secondary" size="sm" onClick={() => refetch()}>
                Retry
              </Button>
            </div>
          ) : orders.length === 0 ? (
            <div className="py-16 px-6">
              <EmptyState
                title="Dispatch Queue is Empty"
                description="All placed shipments have been successfully assigned to field couriers. No orders waiting for dispatch."
                icon={<Compass className="w-6 h-6" />}
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-surface border-b border-hairline text-ink-variant">
                    <th className="py-3 px-4 sm:px-6 label-caps text-[10px]">Waybill Tracking ID</th>
                    <th className="py-3 px-4 label-caps text-[10px]">Route (Pickup → Drop)</th>
                    <th className="py-3 px-4 label-caps text-[10px]">Delivery Target</th>
                    <th className="py-3 px-4 label-caps text-[10px]">Retry Attempts</th>
                    <th className="py-3 px-4 label-caps text-[10px]">Attention</th>
                    <th className="py-3 px-4 sm:px-6 text-right label-caps text-[10px]">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-hairline">
                  {orders.map((order) => {
                    const isDispatching = dispatchingId === order.id;
                    const isUrgent = order.needsManualAttention || (order.assignmentAttempts || 0) >= 3;

                    return (
                      <tr key={order.id} className="hover:bg-container-low/50 transition-colors">
                        {/* Waybill */}
                        <td className="py-4 px-4 sm:px-6">
                          <div className="font-display font-bold text-sm text-ink tabular">
                            {order.orderNumber}
                          </div>
                          <div className="text-[11px] text-ink-variant/70 mt-0.5">
                            Booked {formatDateTime(order.createdAt)}
                          </div>
                        </td>

                        {/* Route */}
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-1.5 font-medium text-ink">
                            <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
                            <span className="tabular">{order.pickup?.pincode}</span>
                            <span className="text-ink-variant">→</span>
                            <span className="tabular">{order.drop?.pincode}</span>
                          </div>
                          <div className="text-[10px] text-ink-variant/80 mt-0.5">
                            {order.orderType} · {formatCurrency(order.pricing?.totalAmount)}
                          </div>
                        </td>

                        {/* Scheduled Date */}
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-1 text-ink">
                            <Calendar className="w-3.5 h-3.5 text-accent shrink-0" />
                            <span>{formatDate(order.scheduledDeliveryDate)}</span>
                          </div>
                        </td>

                        {/* Retry attempts */}
                        <td className="py-4 px-4">
                          <span className="font-mono text-xs tabular text-ink">
                            {order.assignmentAttempts || 0} attempts
                          </span>
                        </td>

                        {/* Attention Flag */}
                        <td className="py-4 px-4">
                          {isUrgent ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-danger-soft text-danger text-[10px] font-bold">
                              <AlertTriangle className="w-3 h-3" />
                              Needs Attention
                            </span>
                          ) : (
                            <span className="text-ink-variant/60 text-[11px]">Normal</span>
                          )}
                        </td>

                        {/* Action */}
                        <td className="py-4 px-4 sm:px-6 text-right">
                          <Button
                            variant="primary"
                            size="sm"
                            isLoading={isDispatching}
                            disabled={isBulkDispatching}
                            leftIcon={<Play className="w-3.5 h-3.5" />}
                            onClick={() => handleDispatchSingle(order.id, order.orderNumber)}
                          >
                            Dispatch Courier
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
