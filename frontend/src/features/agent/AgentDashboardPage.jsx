import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { ordersApi } from '../../api/orders.api.js';
import { useAuth } from '../../auth/AuthContext.jsx';
import { StatusChip } from '../../components/domain/StatusChip.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { CardSkeleton } from '../../components/ui/Skeleton.jsx';
import { EmptyState } from '../../components/ui/EmptyState.jsx';
import { DeliverOtpModal } from './DeliverOtpModal.jsx';
import { ReportFailureModal } from './ReportFailureModal.jsx';
import { useToast } from '../../components/ui/Toast.jsx';
import { formatCurrency } from '../../lib/format.js';
import { ORDER_STATUS } from '../../lib/constants.js';
import { getErrorMessage } from '../../lib/errors.js';
import {
  Truck,
  MapPin,
  Search,
  ShieldCheck,
  AlertTriangle,
  RefreshCw,
  ChevronRight,
  PackageCheck,
  Navigation,
  CheckCircle2,
  Compass,
} from 'lucide-react';

const ACTIVE_STATUSES = new Set([
  ORDER_STATUS.ASSIGNED,
  ORDER_STATUS.PICKED_UP,
  ORDER_STATUS.IN_TRANSIT,
  ORDER_STATUS.OUT_FOR_DELIVERY,
]);

export function AgentDashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const [activeTab, setActiveTab] = useState('ACTIVE'); // 'ACTIVE' | 'HISTORY'
  const [searchInput, setSearchInput] = useState('');

  // Modals state
  const [otpModalOrder, setOtpModalOrder] = useState(null);
  const [failureModalOrder, setFailureModalOrder] = useState(null);
  const [isUpdatingId, setIsUpdatingId] = useState(null);

  // Fetch Agent's assigned orders
  const {
    data,
    isLoading,
    isError,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ['agent_orders'],
    queryFn: () => ordersApi.listOrders({ limit: 100 }),
    refetchInterval: 12000, // auto-refresh active task queue every 12s
  });

  const orders = data?.items || [];

  const activeOrders = orders.filter((o) => ACTIVE_STATUSES.has(o.currentStatus));
  const historyOrders = orders.filter((o) => !ACTIVE_STATUSES.has(o.currentStatus));

  const currentList = activeTab === 'ACTIVE' ? activeOrders : historyOrders;

  // Filter by search query
  const filteredList = currentList.filter((o) => {
    if (!searchInput.trim()) return true;
    const q = searchInput.trim().toLowerCase();
    return (
      (o.orderNumber || '').toLowerCase().includes(q) ||
      (o.pickup?.pincode || '').includes(q) ||
      (o.drop?.pincode || '').includes(q) ||
      (o.drop?.address || '').toLowerCase().includes(q)
    );
  });

  // Quick Status Transition Handler
  const handleQuickAdvance = async (e, order, nextStatus) => {
    e.stopPropagation();
    setIsUpdatingId(order.id);
    try {
      await ordersApi.updateStatus(order.id, { status: nextStatus });
      toast.success(`Status updated to ${nextStatus.replace(/_/g, ' ')}!`);
      refetch();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to update status.'));
    } finally {
      setIsUpdatingId(null);
    }
  };

  const openGoogleMaps = (e, address, pincode) => {
    e.stopPropagation();
    const query = encodeURIComponent(`${address || ''} ${pincode || ''}`.trim());
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${query}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-surface py-4 sm:py-8 pb-20">
      <div className="max-w-xl mx-auto px-3 sm:px-6 space-y-4 sm:space-y-6">
        {/* Mobile Header with Courier Status Bar */}
        <div className="bg-container-lowest hairline rounded-2xl p-4 sm:p-5 shadow-card space-y-3.5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full bg-primary text-on-primary flex items-center justify-center font-display font-bold text-sm shadow-sm">
                {user?.fullName?.slice(0, 2).toUpperCase() || 'AG'}
              </div>
              <div>
                <h1 className="font-display font-bold text-base text-ink leading-tight">
                  {user?.fullName || 'Field Courier'}
                </h1>
                <div className="flex items-center gap-1.5 text-xs text-ink-variant mt-0.5">
                  <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
                  <span className="font-medium text-success text-[11px]">On Duty · Mobile Mode</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => refetch()}
              disabled={isFetching}
              className="p-2.5 rounded-xl bg-container-low hover:bg-container hairline text-ink transition-colors cursor-pointer flex items-center justify-center"
              title="Sync Queue"
            >
              <RefreshCw className={`w-4 h-4 text-ink-variant ${isFetching ? 'animate-spin text-primary' : ''}`} />
            </button>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 gap-2.5 pt-2 border-t border-hairline text-xs">
            <div className="p-3 bg-container-low/70 rounded-xl hairline flex items-center justify-between">
              <div>
                <div className="label-caps text-[9px] text-ink-variant">Active Load</div>
                <div className="font-display font-bold text-base text-ink tabular mt-0.5">
                  {activeOrders.length} {activeOrders.length === 1 ? 'Parcel' : 'Parcels'}
                </div>
              </div>
              <Truck className="w-5 h-5 text-primary opacity-80" />
            </div>

            <div className="p-3 bg-container-low/70 rounded-xl hairline flex items-center justify-between">
              <div>
                <div className="label-caps text-[9px] text-ink-variant">Delivered Today</div>
                <div className="font-display font-bold text-base text-success tabular mt-0.5">
                  {historyOrders.filter((o) => o.currentStatus === ORDER_STATUS.DELIVERED).length}
                </div>
              </div>
              <CheckCircle2 className="w-5 h-5 text-success opacity-80" />
            </div>
          </div>
        </div>

        {/* Tab & Search Strip */}
        <div className="space-y-2.5">
          <div className="grid grid-cols-2 gap-1.5 p-1 bg-container-low hairline rounded-xl">
            <button
              onClick={() => setActiveTab('ACTIVE')}
              className={`py-2.5 text-xs font-semibold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === 'ACTIVE'
                  ? 'bg-container-lowest text-ink shadow-xs hairline font-bold'
                  : 'text-ink-variant hover:text-ink'
              }`}
            >
              <span>Pending Tasks</span>
              <span className="px-2 py-0.5 rounded-full bg-primary text-on-primary text-[10px] font-bold">
                {activeOrders.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('HISTORY')}
              className={`py-2.5 text-xs font-semibold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === 'HISTORY'
                  ? 'bg-container-lowest text-ink shadow-xs hairline font-bold'
                  : 'text-ink-variant hover:text-ink'
              }`}
            >
              <span>Completed</span>
              <span className="px-2 py-0.5 rounded-full bg-container-high text-ink text-[10px] font-bold">
                {historyOrders.length}
              </span>
            </button>
          </div>

          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-variant/50 pointer-events-none" />
            <input
              type="text"
              placeholder="Search tracking ID, address, or pincode..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full bg-container-lowest text-xs text-ink placeholder:text-ink-variant/50 rounded-xl pl-10 pr-4 py-3 hairline focus:outline-none focus:border-primary shadow-xs transition-colors"
            />
          </div>
        </div>

        {/* Task Cards List */}
        <div className="space-y-3.5">
          {isLoading ? (
            <div className="space-y-3">
              <CardSkeleton />
              <CardSkeleton />
              <CardSkeleton />
            </div>
          ) : isError ? (
            <div className="p-8 text-center bg-container-lowest hairline rounded-2xl">
              <p className="text-xs text-danger mb-3">Failed to load assigned tasks.</p>
              <Button variant="secondary" size="sm" onClick={() => refetch()}>
                Retry Sync
              </Button>
            </div>
          ) : filteredList.length === 0 ? (
            <div className="p-8 bg-container-lowest hairline rounded-2xl">
              <EmptyState
                title={activeTab === 'ACTIVE' ? 'No pending deliveries' : 'No history yet'}
                description={
                  activeTab === 'ACTIVE'
                    ? 'Your queue is clear. New assigned shipments will appear here automatically.'
                    : 'Your completed doorstep deliveries will appear here.'
                }
                icon={<Truck className="w-6 h-6" />}
              />
            </div>
          ) : (
            filteredList.map((order) => {
              const isUpdating = isUpdatingId === order.id;
              const isCOD = Boolean(order.isCOD);
              const codAmount = order.declaredValue || order.pricing?.totalAmount;

              return (
                <div
                  key={order.id}
                  onClick={() => navigate(`/agent/orders/${order.id}`)}
                  className="bg-container-lowest hairline rounded-2xl p-4 sm:p-5 shadow-card hover:border-primary/50 transition-all cursor-pointer space-y-3.5 active:scale-[0.99]"
                >
                  {/* Top Bar: Tracking ID + Status */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="font-display font-bold text-sm sm:text-base text-ink tabular tracking-tight">
                        {order.orderNumber}
                      </span>
                      <div className="text-[11px] text-ink-variant mt-0.5 flex items-center gap-1.5">
                        <span>{order.orderType} Shipment</span>
                        <span>·</span>
                        <span>{order.actualWeightKg} kg</span>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1.5">
                      <StatusChip status={order.currentStatus} />
                      {isCOD ? (
                        <span className="px-2 py-0.5 rounded bg-accent/20 text-[#735c00] text-[10px] font-bold tracking-tight">
                          COD {formatCurrency(codAmount)}
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded bg-container-low text-ink-variant text-[10px] font-medium">
                          Prepaid
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Destination Address Card with Quick Maps Button */}
                  <div className="p-3 bg-container-low/80 rounded-xl hairline text-xs space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2 flex-1">
                        <MapPin className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                        <div>
                          <div className="label-caps text-[9px] text-ink-variant">
                            Drop: {order.drop?.pincode}
                          </div>
                          <p className="text-ink font-semibold line-clamp-2 mt-0.5 text-xs">
                            {order.drop?.address || 'Delivery Address'}
                          </p>
                        </div>
                      </div>

                      {/* Google Maps Quick Direction Button */}
                      <button
                        onClick={(e) => openGoogleMaps(e, order.drop?.address, order.drop?.pincode)}
                        className="px-2.5 py-1.5 rounded-lg bg-container-lowest hover:bg-container hairline text-primary text-[11px] font-semibold flex items-center gap-1 shrink-0 cursor-pointer shadow-xs transition-colors"
                        title="Open in Google Maps"
                      >
                        <Compass className="w-3.5 h-3.5" />
                        <span>Maps</span>
                      </button>
                    </div>

                    {isCOD && order.currentStatus === ORDER_STATUS.OUT_FOR_DELIVERY && (
                      <div className="pt-1.5 border-t border-hairline flex items-center justify-between text-[11px] text-[#735c00] font-bold">
                        <span>Collect Cash at Door:</span>
                        <span className="tabular font-display text-xs">{formatCurrency(codAmount)}</span>
                      </div>
                    )}
                  </div>

                  {/* Action Row - Mobile Ergonomic Touch Targets */}
                  <div className="pt-1 flex items-center justify-between gap-2">
                    <div className="text-[11px] text-ink-variant flex items-center gap-1 font-medium">
                      <span>Order Details</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </div>

                    {/* Stage Transition Actions */}
                    {order.currentStatus === ORDER_STATUS.ASSIGNED && (
                      <Button
                        variant="primary"
                        size="md"
                        isLoading={isUpdating}
                        leftIcon={<PackageCheck className="w-4 h-4" />}
                        onClick={(e) => handleQuickAdvance(e, order, ORDER_STATUS.PICKED_UP)}
                      >
                        Confirm Pickup
                      </Button>
                    )}

                    {order.currentStatus === ORDER_STATUS.PICKED_UP && (
                      <Button
                        variant="primary"
                        size="md"
                        isLoading={isUpdating}
                        leftIcon={<Navigation className="w-4 h-4" />}
                        onClick={(e) => handleQuickAdvance(e, order, ORDER_STATUS.IN_TRANSIT)}
                      >
                        Start Transit
                      </Button>
                    )}

                    {order.currentStatus === ORDER_STATUS.IN_TRANSIT && (
                      <Button
                        variant="primary"
                        size="md"
                        isLoading={isUpdating}
                        leftIcon={<Truck className="w-4 h-4" />}
                        onClick={(e) => handleQuickAdvance(e, order, ORDER_STATUS.OUT_FOR_DELIVERY)}
                      >
                        Start Out for Delivery
                      </Button>
                    )}

                    {order.currentStatus === ORDER_STATUS.OUT_FOR_DELIVERY && (
                      <div className="flex items-center gap-2">
                        <Button
                          variant="secondary"
                          size="md"
                          leftIcon={<AlertTriangle className="w-3.5 h-3.5 text-danger" />}
                          onClick={(e) => {
                            e.stopPropagation();
                            setFailureModalOrder(order);
                          }}
                        >
                          Failed
                        </Button>

                        <Button
                          variant="primary"
                          size="md"
                          leftIcon={<ShieldCheck className="w-4 h-4" />}
                          onClick={(e) => {
                            e.stopPropagation();
                            setOtpModalOrder(order);
                          }}
                        >
                          Deliver (OTP)
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Deliver OTP Modal */}
        {otpModalOrder && (
          <DeliverOtpModal
            isOpen={Boolean(otpModalOrder)}
            onClose={() => setOtpModalOrder(null)}
            orderId={otpModalOrder.id}
            orderNumber={otpModalOrder.orderNumber}
            onSuccess={refetch}
          />
        )}

        {/* Report Failure Modal */}
        {failureModalOrder && (
          <ReportFailureModal
            isOpen={Boolean(failureModalOrder)}
            onClose={() => setFailureModalOrder(null)}
            orderId={failureModalOrder.id}
            orderNumber={failureModalOrder.orderNumber}
            onSuccess={refetch}
          />
        )}
      </div>
    </div>
  );
}
