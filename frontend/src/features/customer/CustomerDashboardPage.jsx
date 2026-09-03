import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { ordersApi } from '../../api/orders.api.js';
import { useAuth } from '../../auth/AuthContext.jsx';
import { StatusChip } from '../../components/domain/StatusChip.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { TableSkeleton } from '../../components/ui/Skeleton.jsx';
import { EmptyState } from '../../components/ui/EmptyState.jsx';
import { Pagination } from '../../components/ui/Pagination.jsx';
import { formatCurrency, formatDate } from '../../lib/format.js';
import { ORDER_STATUS } from '../../lib/constants.js';
import {
  PlusCircle,
  Search,
  Package,
  ShieldAlert,
  ChevronRight,
  MapPin,
  Calendar,
} from 'lucide-react';

const STATUS_FILTERS = [
  { label: 'All Orders', value: 'ALL' },
  { label: 'In Transit', value: ORDER_STATUS.IN_TRANSIT },
  { label: 'Out for Delivery', value: ORDER_STATUS.OUT_FOR_DELIVERY },
  { label: 'Delivered', value: ORDER_STATUS.DELIVERED },
  { label: 'Placed', value: ORDER_STATUS.CREATED },
  { label: 'Assigned', value: ORDER_STATUS.ASSIGNED },
  { label: 'Picked Up', value: ORDER_STATUS.PICKED_UP },
  { label: 'Failed', value: ORDER_STATUS.FAILED },
  { label: 'Returning to Origin', value: ORDER_STATUS.RETURN_TO_ORIGIN },
];

export function CustomerDashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const urlSearch = searchParams.get('search') || '';

  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchInput, setSearchInput] = useState(urlSearch);

  // Synchronize when URL search param updates (e.g. Navbar search submit)
  React.useEffect(() => {
    setSearchInput(urlSearch);
    setPage(1);
  }, [urlSearch]);

  // Query server for customer orders
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['customer_orders', { page, status: statusFilter, search: searchInput.trim() }],
    queryFn: async () => {
      const params = {
        page,
        limit: 10,
      };
      if (statusFilter !== 'ALL') {
        params.status = statusFilter;
      }
      if (searchInput.trim()) {
        params.search = searchInput.trim();
      }
      return ordersApi.listOrders(params);
    },
  });

  const orders = data?.items || [];
  const pagination = data?.pagination || { total: 0, page: 1, limit: 10, pages: 1 };

  // Orders are filtered server-side with strict customer scoping
  const filteredOrders = orders;

  return (
    <div className="min-h-screen bg-surface py-8 sm:py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Unverified Email Warning Banner */}
        {user && !user.isEmailVerified && (
          <div className="bg-warning-soft/60 hairline rounded-lg p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-ink">
            <div className="flex items-center gap-2.5">
              <ShieldAlert className="w-4 h-4 text-warning shrink-0" />
              <span>
                Your email address is unverified. Verify your email to receive doorstep OTP codes and tracking updates.
              </span>
            </div>
            <Link to="/verify" className="shrink-0">
              <Button variant="secondary" size="sm" className="bg-container-lowest">
                Verify Email Now
              </Button>
            </Link>
          </div>
        )}

        {/* Dashboard Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-ink">
              My Shipments
            </h1>
            <p className="text-xs text-ink-variant mt-0.5">
              Track, search, and manage your outgoing courier deliveries.
            </p>
          </div>

          <Link to="/app/new">
            <Button variant="primary" size="md" leftIcon={<PlusCircle className="w-4 h-4" />}>
              Book New Shipment
            </Button>
          </Link>
        </div>

        {/* Filter and Search Bar */}
        <div className="bg-container-lowest hairline rounded-lg p-3 sm:p-4 shadow-card space-y-3">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-ink-variant/50 pointer-events-none" />
              <input
                type="text"
                placeholder="Filter by tracking ID or pincode..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full bg-container-low text-xs text-ink placeholder:text-ink-variant/50 rounded pl-9 pr-3 py-2 hairline focus:outline-none focus:bg-container-lowest focus:border-primary transition-colors"
              />
            </div>

            <div className="text-xs text-ink-variant self-center sm:self-auto font-medium">
              Total: <strong className="text-ink font-semibold tabular">{pagination.total}</strong> {pagination.total === 1 ? 'Shipment' : 'Shipments'}
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

        {/* Orders Table Container */}
        <div className="bg-container-lowest hairline rounded-lg shadow-card overflow-hidden">
          {isLoading ? (
            <div className="p-6">
              <TableSkeleton rows={5} cols={5} />
            </div>
          ) : isError ? (
            <div className="p-12 text-center">
              <p className="text-xs text-danger mb-3">Failed to load shipments.</p>
              <Button variant="secondary" size="sm" onClick={() => refetch()}>
                Retry Loading
              </Button>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="py-12 px-6">
              <EmptyState
                title="No shipments found"
                description={
                  searchInput
                    ? 'No orders match your search query. Try clearing your search or status filters.'
                    : "You haven't placed any shipment orders yet. Get an instant quote and book your first delivery."
                }
                actionLabel={searchInput ? 'Clear Filters' : 'Book Your First Shipment'}
                onAction={() => {
                  if (searchInput || statusFilter !== 'ALL') {
                    setSearchInput('');
                    setStatusFilter('ALL');
                  } else {
                    navigate('/app/new');
                  }
                }}
                icon={<Package className="w-6 h-6" />}
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-surface border-b border-hairline text-ink-variant">
                    <th className="py-3 px-4 sm:px-6 label-caps text-[10px]">Waybill Tracking ID</th>
                    <th className="py-3 px-4 label-caps text-[10px]">Route (Origin → Drop)</th>
                    <th className="py-3 px-4 label-caps text-[10px]">Target Delivery</th>
                    <th className="py-3 px-4 label-caps text-[10px]">Status</th>
                    <th className="py-3 px-4 label-caps text-[10px] text-right">Amount</th>
                    <th className="py-3 px-4 sm:px-6 text-right"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-hairline">
                  {filteredOrders.map((order) => (
                    <tr
                      key={order.id}
                      onClick={() => navigate(`/app/orders/${order.id}`)}
                      className="hover:bg-container-low/60 cursor-pointer transition-colors group"
                    >
                      {/* Tracking ID */}
                      <td className="py-4 px-4 sm:px-6">
                        <div className="font-display font-bold text-sm text-ink tabular group-hover:text-primary transition-colors">
                          {order.orderNumber}
                        </div>
                        <div className="text-[11px] text-ink-variant/70 mt-0.5">
                          Booked {formatDate(order.createdAt)}
                        </div>
                      </td>

                      {/* Origin & Drop */}
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-1.5 text-xs text-ink font-medium">
                          <MapPin className="w-3.5 h-3.5 text-ink-variant shrink-0" />
                          <span className="tabular">{order.pickup?.pincode}</span>
                          <span className="text-ink-variant">→</span>
                          <span className="tabular">{order.drop?.pincode}</span>
                        </div>
                        <div className="text-[10px] text-ink-variant/80 mt-0.5 uppercase tracking-wider font-semibold">
                          {order.orderType} · {order.isCOD ? 'COD' : 'Prepaid'}
                        </div>
                      </td>

                      {/* Scheduled Date */}
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-1 text-xs text-ink">
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
                        {order.isCOD && (
                          <span className="text-[10px] text-[#735c00] bg-accent/20 px-1 py-0.2 rounded font-bold">
                            COD
                          </span>
                        )}
                      </td>

                      {/* Action Chevron */}
                      <td className="py-4 px-4 sm:px-6 text-right">
                        <ChevronRight className="w-4 h-4 text-ink-variant/40 group-hover:text-ink transition-colors inline-block" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Server Pagination Bar */}
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
