import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { ordersApi } from '../../api/orders.api.js';
import { StatusChip } from '../../components/domain/StatusChip.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { TableSkeleton } from '../../components/ui/Skeleton.jsx';
import { EmptyState } from '../../components/ui/EmptyState.jsx';
import { Pagination } from '../../components/ui/Pagination.jsx';
import { useToast } from '../../components/ui/Toast.jsx';
import { formatCurrency, formatDate, formatDateTime } from '../../lib/format.js';
import { ORDER_STATUS } from '../../lib/constants.js';
import { getErrorMessage } from '../../lib/errors.js';
import { RescheduleModal } from '../customer/RescheduleModal.jsx';
import {
  Layers,
  Search,
  MapPin,
  Calendar,
  ChevronRight,
  Play,
  RefreshCw,
  RotateCcw,
  AlertCircle,
  Filter,
} from 'lucide-react';

const STATUS_FILTERS = [
  { label: 'All Orders', value: 'ALL' },
  { label: 'Created (Queue)', value: ORDER_STATUS.CREATED },
  { label: 'Assigned', value: ORDER_STATUS.ASSIGNED },
  { label: 'Picked Up', value: ORDER_STATUS.PICKED_UP },
  { label: 'In Transit', value: ORDER_STATUS.IN_TRANSIT },
  { label: 'Out for Delivery', value: ORDER_STATUS.OUT_FOR_DELIVERY },
  { label: 'Delivered', value: ORDER_STATUS.DELIVERED },
  { label: 'Failed', value: ORDER_STATUS.FAILED },
  { label: 'RTO', value: ORDER_STATUS.RETURN_TO_ORIGIN },
];

const MAX_FAILED_ATTEMPTS = 2;

const EXCEPTION_FILTERS = [
  { label: 'All Failed', value: 'ALL_FAILED' },
  { label: 'Reschedulable', value: 'RESCHEDULABLE' },
  { label: 'RTO-bound', value: 'RTO_BOUND' },
  { label: 'Needs Attention', value: 'NEEDS_ATTENTION' },
];

export function AdminOrdersPage() {
  const navigate = useNavigate();
  const toast = useToast();

  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [exceptionFilter, setExceptionFilter] = useState(null);
  const [searchInput, setSearchInput] = useState('');
  const [dispatchingId, setDispatchingId] = useState(null);
  const [rescheduleOpen, setRescheduleOpen] = useState(false);
  const [rescheduleOrder, setRescheduleOrder] = useState(null);

  const {
    data,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['admin_all_orders', { page, status: statusFilter, exception: exceptionFilter }],
    queryFn: () => {
      const params = { page, limit: 15 };
      if (statusFilter !== 'ALL') params.status = statusFilter;
      return ordersApi.listOrders(params);
    },
  });

  const orders = data?.items || [];
  const pagination = data?.pagination || { total: 0, page: 1, limit: 15, pages: 1 };

  // Client search filter across current page
  const filteredOrders = orders.filter((o) => {
    if (!searchInput.trim()) return true;
    const q = searchInput.trim().toLowerCase();
    const num = (o.orderNumber || '').toLowerCase();
    const pPin = (o.pickup?.pincode || '').toLowerCase();
    const dPin = (o.drop?.pincode || '').toLowerCase();
    return num.includes(q) || pPin.includes(q) || dPin.includes(q);
  });

  // Exception filter for FAILED orders
  const exceptionFilteredOrders = exceptionFilter
    ? filteredOrders.filter((o) => {
        const attempts = o.failedAttemptCount ?? 0;
        const needsAttention = o.needsManualAttention;
        switch (exceptionFilter) {
          case 'RESCHEDULABLE':
            return o.currentStatus === ORDER_STATUS.FAILED && attempts < MAX_FAILED_ATTEMPTS;
          case 'RTO_BOUND':
            return o.currentStatus === ORDER_STATUS.FAILED && attempts >= MAX_FAILED_ATTEMPTS;
          case 'NEEDS_ATTENTION':
            return needsAttention === true;
          case 'ALL_FAILED':
          default:
            return o.currentStatus === ORDER_STATUS.FAILED;
        }
      })
    : filteredOrders;

  const handleForceDispatch = async (e, order) => {
    e.stopPropagation();
    setDispatchingId(order.id);
    try {
      await ordersApi.dispatchOrder(order.id);
      toast.success(`Waybill ${order.orderNumber} dispatched!`);
      refetch();
    } catch (err) {
      toast.error(getErrorMessage(err, `No courier available in zone for ${order.orderNumber}.`));
    } finally {
      setDispatchingId(null);
    }
  };

  const handleReschedule = (e, order) => {
    e.stopPropagation();
    setRescheduleOrder(order);
    setRescheduleOpen(true);
  };

  return (
    <div className="min-h-screen bg-surface py-8 sm:py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="label-caps text-xs text-ink-variant">Central Operations</div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-ink">
              All Shipments
            </h1>
          </div>

          <Button
            variant="secondary"
            size="md"
            onClick={() => refetch()}
            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
          >
            Refresh List
          </Button>
        </div>

        {/* Filter and Search Bar */}
        <div className="bg-container-lowest hairline rounded-lg p-4 shadow-card space-y-3">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-ink-variant/50 pointer-events-none" />
              <input
                type="text"
                placeholder="Search tracking ID or pincode..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full bg-container-low text-xs text-ink placeholder:text-ink-variant/50 rounded pl-9 pr-3 py-2 hairline focus:outline-none focus:bg-container-lowest focus:border-primary transition-colors"
              />
            </div>

            <div className="text-xs text-ink-variant self-center sm:self-auto font-medium">
              Total Recorded: <strong className="text-ink font-semibold tabular">{pagination.total}</strong>
            </div>
          </div>

          {/* Status Filter Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 border-t border-hairline">
            {STATUS_FILTERS.map((f) => (
              <button
                key={f.value}
                onClick={() => {
                  setStatusFilter(f.value);
                  if (f.value !== ORDER_STATUS.FAILED) {
                    setExceptionFilter(null);
                  }
                  setPage(1);
                }}
                className={`px-3 py-1 text-xs rounded font-medium transition-colors shrink-0 cursor-pointer ${
                  statusFilter === f.value
                    ? 'bg-primary text-on-primary font-semibold'
                    : 'bg-container-low text-ink-variant hover:text-ink hover:bg-container'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Exception Filter Chips (only when Failed filter is active) */}
          {statusFilter === ORDER_STATUS.FAILED && (
            <div className="flex items-center gap-2 pt-1 border-t border-hairline">
              <div className="flex items-center gap-1.5 text-ink-variant shrink-0">
                <Filter className="w-3.5 h-3.5" />
                <span className="label-caps text-[10px]">Exceptions</span>
              </div>
              <div className="flex items-center gap-1.5 overflow-x-auto">
                {EXCEPTION_FILTERS.map((f) => (
                  <button
                    key={f.value}
                    onClick={() => setExceptionFilter(exceptionFilter === f.value ? null : f.value)}
                    className={`px-2.5 py-0.5 text-[11px] rounded font-medium transition-colors shrink-0 cursor-pointer ${
                      exceptionFilter === f.value
                        ? 'bg-warning text-on-primary font-semibold'
                        : 'bg-container-low text-ink-variant hover:text-ink hover:bg-container'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Orders Table */}
        <div className="bg-container-lowest hairline rounded-lg shadow-card overflow-hidden">
          {isLoading ? (
            <div className="p-6">
              <TableSkeleton rows={6} cols={6} />
            </div>
          ) : isError ? (
            <div className="p-12 text-center">
              <p className="text-xs text-danger mb-3">Failed to load shipments.</p>
              <Button variant="secondary" size="sm" onClick={() => refetch()}>
                Retry
              </Button>
            </div>
          ) : exceptionFilteredOrders.length === 0 ? (
            <div className="py-12 px-6">
              <EmptyState
                title="No shipments found"
                description={
                  searchInput
                    ? 'No orders match your filter criteria.'
                    : exceptionFilter
                    ? 'No orders match this exception filter.'
                    : 'No orders recorded in this status view.'
                }
                actionLabel="Clear Filters"
                onAction={() => {
                  setSearchInput('');
                  setStatusFilter('ALL');
                  setExceptionFilter(null);
                }}
                icon={<Layers className="w-6 h-6" />}
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
                    <th className="py-3 px-4 label-caps text-[10px]">Status</th>
                    <th className="py-3 px-4 label-caps text-[10px] text-right">Freight</th>
                    <th className="py-3 px-4 sm:px-6 text-right label-caps text-[10px]">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-hairline">
                  {exceptionFilteredOrders.map((order) => {
                    const isDispatching = dispatchingId === order.id;
                    const isFailed = order.currentStatus === ORDER_STATUS.FAILED;
                    const attempts = order.failedAttemptCount ?? 0;
                    const canReschedule = isFailed && attempts < MAX_FAILED_ATTEMPTS;

                    return (
                      <tr
                        key={order.id}
                        onClick={() => navigate(`/app/orders/${order.id}`)}
                        className="hover:bg-container-low/50 cursor-pointer transition-colors group"
                      >
                        {/* Tracking ID */}
                        <td className="py-4 px-4 sm:px-6">
                          <div className="font-display font-bold text-sm text-ink tabular group-hover:text-primary transition-colors">
                            {order.orderNumber}
                          </div>
                          <div className="text-[11px] text-ink-variant/70 mt-0.5">
                            {formatDateTime(order.createdAt)}
                          </div>
                        </td>

                        {/* Route */}
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-1.5 text-xs text-ink font-medium">
                            <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
                            <span className="tabular">{order.pickup?.pincode}</span>
                            <span className="text-ink-variant">→</span>
                            <span className="tabular">{order.drop?.pincode}</span>
                          </div>
                          <div className="text-[10px] text-ink-variant/80 mt-0.5">
                            {order.orderType} · {order.isCOD ? 'COD' : 'Prepaid'}
                            {isFailed && attempts > 0 ? (
                              <span className="ml-2 text-warning font-semibold">
                                · Attempt {attempts}/{MAX_FAILED_ATTEMPTS}
                              </span>
                            ) : null}
                          </div>
                        </td>

                        {/* Scheduled Date */}
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-1 text-ink">
                            <Calendar className="w-3.5 h-3.5 text-accent shrink-0" />
                            <span>{formatDate(order.scheduledDeliveryDate)}</span>
                          </div>
                        </td>

                        {/* Status */}
                        <td className="py-4 px-4">
                          <StatusChip status={order.currentStatus} />
                        </td>

                        {/* Amount */}
                        <td className="py-4 px-4 text-right">
                          <div className="font-bold text-sm text-ink tabular">
                            {formatCurrency(order.pricing?.totalAmount)}
                          </div>
                        </td>

                        {/* Action */}
                        <td className="py-4 px-4 sm:px-6 text-right">
                          {order.currentStatus === ORDER_STATUS.CREATED ? (
                            <Button
                              variant="primary"
                              size="sm"
                              isLoading={isDispatching}
                              leftIcon={<Play className="w-3 h-3" />}
                              onClick={(e) => handleForceDispatch(e, order)}
                            >
                              Dispatch
                            </Button>
                          ) : canReschedule ? (
                            <Button
                              variant="primary"
                              size="sm"
                              leftIcon={<RotateCcw className="w-3 h-3" />}
                              onClick={(e) => handleReschedule(e, order)}
                            >
                              Reschedule
                            </Button>
                          ) : isFailed ? (
                            <span className="text-[10px] text-danger font-semibold inline-flex items-center gap-1">
                              <AlertCircle className="w-3 h-3" />
                              RTO Initiated
                            </span>
                          ) : (
                            <ChevronRight className="w-4 h-4 text-ink-variant/40 group-hover:text-ink transition-colors inline-block" />
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          <Pagination
            page={pagination.page}
            pages={pagination.pages}
            total={pagination.total}
            limit={pagination.limit}
            onPageChange={(newPage) => setPage(newPage)}
          />
        </div>

        {/* Reschedule Modal */}
        {rescheduleOrder && (
          <RescheduleModal
            isOpen={rescheduleOpen}
            onClose={() => {
              setRescheduleOpen(false);
              setRescheduleOrder(null);
            }}
            orderId={rescheduleOrder.id}
            orderNumber={rescheduleOrder.orderNumber}
            failedAttemptCount={rescheduleOrder.failedAttemptCount ?? 0}
            onSuccess={() => {
              setRescheduleOpen(false);
              setRescheduleOrder(null);
              refetch();
            }}
          />
        )}
      </div>
    </div>
  );
}
