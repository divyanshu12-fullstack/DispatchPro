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
import {
  Layers,
  Search,
  MapPin,
  Calendar,
  ChevronRight,
  Play,
  RefreshCw,
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

export function AdminOrdersPage() {
  const navigate = useNavigate();
  const toast = useToast();

  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchInput, setSearchInput] = useState('');
  const [dispatchingId, setDispatchingId] = useState(null);

  const {
    data,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['admin_all_orders', { page, status: statusFilter }],
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
          ) : filteredOrders.length === 0 ? (
            <div className="py-12 px-6">
              <EmptyState
                title="No shipments found"
                description={
                  searchInput
                    ? 'No orders match your filter criteria.'
                    : 'No orders recorded in this status view.'
                }
                actionLabel="Clear Filters"
                onAction={() => {
                  setSearchInput('');
                  setStatusFilter('ALL');
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
                  {filteredOrders.map((order) => {
                    const isDispatching = dispatchingId === order.id;

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
      </div>
    </div>
  );
}
