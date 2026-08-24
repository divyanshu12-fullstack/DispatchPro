import React from 'react';
import { Link, useNavigate } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { ordersApi } from '../../api/orders.api.js';
import { adminApi } from '../../api/admin.api.js';
import { StatusChip } from '../../components/domain/StatusChip.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Skeleton } from '../../components/ui/Skeleton.jsx';
import { formatCurrency, formatDateTime } from '../../lib/format.js';
import { ORDER_STATUS } from '../../lib/constants.js';
import {
  Compass,
  Users,
  Layers,
  Truck,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  RefreshCw,
  MapPin,
  Tag,
} from 'lucide-react';

const IN_FLIGHT_STATUSES = new Set([
  ORDER_STATUS.ASSIGNED,
  ORDER_STATUS.PICKED_UP,
  ORDER_STATUS.IN_TRANSIT,
  ORDER_STATUS.OUT_FOR_DELIVERY,
]);

export function AdminOverviewPage() {
  const navigate = useNavigate();

  // Fetch recent orders
  const {
    data: ordersData,
    isLoading: isOrdersLoading,
    refetch: refetchOrders,
  } = useQuery({
    queryKey: ['admin_overview_orders'],
    queryFn: () => ordersApi.listOrders({ limit: 100 }),
    refetchInterval: 20000,
  });

  // Fetch agents
  const {
    data: agentsData,
    isLoading: isAgentsLoading,
    refetch: refetchAgents,
  } = useQuery({
    queryKey: ['admin_overview_agents'],
    queryFn: () => adminApi.listAgents(),
  });

  const orders = ordersData?.items || [];
  const agents = agentsData?.items || (Array.isArray(agentsData) ? agentsData : []);

  const totalOrdersCount = ordersData?.pagination?.total || orders.length;
  const inFlightCount = orders.filter((o) => IN_FLIGHT_STATUSES.has(o.currentStatus)).length;
  const pendingDispatchCount = orders.filter((o) => o.currentStatus === ORDER_STATUS.CREATED).length;
  const deliveredCount = orders.filter((o) => o.currentStatus === ORDER_STATUS.DELIVERED).length;
  const failedCount = orders.filter(
    (o) => o.currentStatus === ORDER_STATUS.FAILED || o.currentStatus === ORDER_STATUS.RETURN_TO_ORIGIN
  ).length;

  const totalAgentsCount = agents.length;
  const availableAgentsCount = agents.filter((a) => a.isAvailable).length;

  const handleRefreshAll = () => {
    refetchOrders();
    refetchAgents();
  };

  const isLoading = isOrdersLoading || isAgentsLoading;

  return (
    <div className="min-h-screen bg-surface py-8 sm:py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="label-caps text-xs text-ink-variant">Central Command</div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-ink">
              System Operations Overview
            </h1>
          </div>

          <Button
            variant="secondary"
            size="md"
            onClick={handleRefreshAll}
            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
          >
            Sync System KPIs
          </Button>
        </div>

        {/* 5 KPI Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* 1. In-Flight Deliveries */}
          <div className="bg-container-lowest hairline rounded-xl p-5 shadow-card space-y-2">
            <div className="flex items-center justify-between">
              <span className="label-caps text-[10px] text-ink-variant">In-Flight Tasks</span>
              <div className="w-7 h-7 rounded bg-container-low flex items-center justify-center text-primary">
                <Truck className="w-3.5 h-3.5" />
              </div>
            </div>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="font-display text-2xl font-bold text-ink tabular">{inFlightCount}</div>
            )}
            <div className="text-[11px] text-ink-variant/80">Active in delivery transit</div>
          </div>

          {/* 2. Pending Dispatch */}
          <div className="bg-container-lowest hairline rounded-xl p-5 shadow-card space-y-2">
            <div className="flex items-center justify-between">
              <span className="label-caps text-[10px] text-ink-variant">Dispatch Queue</span>
              <div className="w-7 h-7 rounded bg-container-low flex items-center justify-center text-primary">
                <Compass className="w-3.5 h-3.5" />
              </div>
            </div>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className={`font-display text-2xl font-bold tabular ${
                pendingDispatchCount > 0 ? 'text-accent' : 'text-ink'
              }`}>
                {pendingDispatchCount}
              </div>
            )}
            <div className="text-[11px] text-ink-variant/80">Awaiting courier assignment</div>
          </div>

          {/* 3. Delivered Count */}
          <div className="bg-container-lowest hairline rounded-xl p-5 shadow-card space-y-2">
            <div className="flex items-center justify-between">
              <span className="label-caps text-[10px] text-ink-variant">Delivered</span>
              <div className="w-7 h-7 rounded bg-success-soft text-success flex items-center justify-center">
                <CheckCircle2 className="w-3.5 h-3.5" />
              </div>
            </div>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="font-display text-2xl font-bold text-success tabular">{deliveredCount}</div>
            )}
            <div className="text-[11px] text-ink-variant/80">Verified doorstep handovers</div>
          </div>

          {/* 4. Failed / RTO */}
          <div className="bg-container-lowest hairline rounded-xl p-5 shadow-card space-y-2">
            <div className="flex items-center justify-between">
              <span className="label-caps text-[10px] text-ink-variant">Exceptions (Failed/RTO)</span>
              <div className="w-7 h-7 rounded bg-danger-soft text-danger flex items-center justify-center">
                <AlertTriangle className="w-3.5 h-3.5" />
              </div>
            </div>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className={`font-display text-2xl font-bold tabular ${
                failedCount > 0 ? 'text-danger' : 'text-ink'
              }`}>
                {failedCount}
              </div>
            )}
            <div className="text-[11px] text-ink-variant/80">Unsuccessful attempts</div>
          </div>

          {/* 5. Courier Fleet */}
          <div className="bg-container-lowest hairline rounded-xl p-5 shadow-card space-y-2">
            <div className="flex items-center justify-between">
              <span className="label-caps text-[10px] text-ink-variant">Active Fleet</span>
              <div className="w-7 h-7 rounded bg-container-low flex items-center justify-center text-primary">
                <Users className="w-3.5 h-3.5" />
              </div>
            </div>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="font-display text-2xl font-bold text-ink tabular">
                {availableAgentsCount} <span className="text-sm font-normal text-ink-variant">/ {totalAgentsCount}</span>
              </div>
            )}
            <div className="text-[11px] text-ink-variant/80">Available field couriers</div>
          </div>
        </div>

        {/* Operational Control Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Dispatch Control Card */}
          <div className="bg-container-lowest hairline rounded-xl p-6 shadow-card flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-lg bg-container-low flex items-center justify-center text-primary">
                <Compass className="w-5 h-5" />
              </div>
              <h3 className="font-display text-base font-bold text-ink">
                Dispatch Queue
              </h3>
              <p className="text-xs text-ink-variant leading-relaxed">
                Review shipments awaiting courier matching and trigger automated batch dispatch.
              </p>
            </div>

            <Link to="/admin/dispatch">
              <Button
                variant="primary"
                size="md"
                className="w-full justify-between"
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                <span>Dispatch</span>
                {pendingDispatchCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-accent text-on-primary text-[10px] font-bold">
                    {pendingDispatchCount} Pending
                  </span>
                )}
              </Button>
            </Link>
          </div>

          {/* Fleet Management Card */}
          <div className="bg-container-lowest hairline rounded-xl p-6 shadow-card flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-lg bg-container-low flex items-center justify-center text-primary">
                <Users className="w-5 h-5" />
              </div>
              <h3 className="font-display text-base font-bold text-ink">
                Couriers & Fleet
              </h3>
              <p className="text-xs text-ink-variant leading-relaxed">
                Add field delivery agents, adjust capacities, and manage zone allocations.
              </p>
            </div>

            <Link to="/admin/agents">
              <Button
                variant="secondary"
                size="md"
                className="w-full justify-between"
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                <span>Fleet</span>
                <span className="text-xs text-ink-variant font-mono">
                  {totalAgentsCount} Couriers
                </span>
              </Button>
            </Link>
          </div>

          {/* Rate Cards Card */}
          <div className="bg-container-lowest hairline rounded-xl p-6 shadow-card flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-lg bg-container-low flex items-center justify-center text-primary">
                <Tag className="w-5 h-5" />
              </div>
              <h3 className="font-display text-base font-bold text-ink">
                Pricing & Tariffs
              </h3>
              <p className="text-xs text-ink-variant leading-relaxed">
                Configure base freight rates, weight brackets, and COD percentage surcharges.
              </p>
            </div>

            <Link to="/admin/rates">
              <Button
                variant="secondary"
                size="md"
                className="w-full justify-between"
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                <span>Rate Cards</span>
                <span className="text-xs text-ink-variant font-mono">
                  4 Tiers
                </span>
              </Button>
            </Link>
          </div>

          {/* All Shipments Card */}
          <div className="bg-container-lowest hairline rounded-xl p-6 shadow-card flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-lg bg-container-low flex items-center justify-center text-primary">
                <Layers className="w-5 h-5" />
              </div>
              <h3 className="font-display text-base font-bold text-ink">
                Orders Ledger
              </h3>
              <p className="text-xs text-ink-variant leading-relaxed">
                Search, filter, and inspect all shipments placed across Delhi NCR with full audit trails.
              </p>
            </div>

            <Link to="/admin/orders">
              <Button
                variant="secondary"
                size="md"
                className="w-full justify-between"
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                <span>All Orders</span>
                <span className="text-xs text-ink-variant font-mono">
                  {totalOrdersCount} Total
                </span>
              </Button>
            </Link>
          </div>
        </div>

        {/* Live Recent Activity Stream Table */}
        <div className="bg-container-lowest hairline rounded-lg shadow-card overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-hairline flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              <h3 className="font-display font-bold text-sm text-ink">Recent System Shipments</h3>
            </div>

            <Link
              to="/admin/orders"
              className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
            >
              <span>View full ledger</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-surface border-b border-hairline text-ink-variant">
                  <th className="py-3 px-4 sm:px-6 label-caps text-[10px]">Waybill Tracking ID</th>
                  <th className="py-3 px-4 label-caps text-[10px]">Route (Origin → Destination)</th>
                  <th className="py-3 px-4 label-caps text-[10px]">Status</th>
                  <th className="py-3 px-4 label-caps text-[10px] text-right">Amount</th>
                  <th className="py-3 px-4 sm:px-6 text-right label-caps text-[10px]">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-hairline">
                {orders.slice(0, 6).map((order) => (
                  <tr
                    key={order.id}
                    onClick={() => navigate(`/app/orders/${order.id}`)}
                    className="hover:bg-container-low/50 cursor-pointer transition-colors"
                  >
                    <td className="py-3.5 px-4 sm:px-6 font-display font-bold text-ink tabular">
                      {order.orderNumber}
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5 font-medium text-ink">
                        <MapPin className="w-3 h-3 text-primary shrink-0" />
                        <span className="tabular">{order.pickup?.pincode}</span>
                        <span className="text-ink-variant">→</span>
                        <span className="tabular">{order.drop?.pincode}</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <StatusChip status={order.currentStatus} />
                    </td>

                    <td className="py-3.5 px-4 text-right font-bold text-ink tabular">
                      {formatCurrency(order.pricing?.totalAmount)}
                    </td>

                    <td className="py-3.5 px-4 sm:px-6 text-right text-ink-variant/70 tabular">
                      {formatDateTime(order.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
