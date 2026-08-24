import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '../../api/admin.api.js';
import { Button } from '../../components/ui/Button.jsx';
import { Skeleton } from '../../components/ui/Skeleton.jsx';
import { EmptyState } from '../../components/ui/EmptyState.jsx';
import { EditRateCardModal } from './EditRateCardModal.jsx';
import { formatCurrency, formatWeight } from '../../lib/format.js';
import {
  Tag,
  Edit2,
  RefreshCw,
  Building,
  User,
  Calculator,
  CheckCircle2,
  Info,
} from 'lucide-react';

export function AdminRatesPage() {
  const [editingCard, setEditingCard] = useState(null);

  // Live Simulator state
  const [simOrderType, setSimOrderType] = useState('B2C');
  const [simTripType, setSimTripType] = useState('INTRA_ZONE');
  const [simWeight, setSimWeight] = useState('1.5');
  const [simIsCod, setSimIsCod] = useState(true);
  const [simValue, setSimValue] = useState('1200');

  const {
    data,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['admin_rate_cards'],
    queryFn: () => adminApi.listRateCards(),
  });

  const cards = data?.items || (Array.isArray(data) ? data : []);

  const b2cCards = cards.filter((c) => c.orderType === 'B2C');
  const b2bCards = cards.filter((c) => c.orderType === 'B2B');

  // Compute live test quote based on selected card in simulator
  const activeSimCard = cards.find(
    (c) => c.orderType === simOrderType && c.tripType === simTripType && c.isActive
  );

  const weightNum = parseFloat(simWeight) || 0;
  const valNum = parseFloat(simValue) || 0;

  let simBase = 0;
  let simExtra = 0;
  let simCod = 0;
  let simTotal = 0;

  if (activeSimCard) {
    simBase = activeSimCard.baseRate;
    const extraKg = Math.max(0, weightNum - activeSimCard.baseWeight);
    simExtra = extraKg * activeSimCard.additionalPerKgRate;
    if (simIsCod) {
      simCod = activeSimCard.codSurchargeFixed + (valNum * activeSimCard.codSurchargePercent) / 100;
    }
    simTotal = simBase + simExtra + simCod;
  }

  return (
    <div className="min-h-screen bg-surface py-8 sm:py-10 space-y-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="label-caps text-xs text-ink-variant">Freight & Tariff Management</div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-ink">
              Pricing & Rate Cards
            </h1>
          </div>

          <Button
            variant="secondary"
            size="md"
            onClick={() => refetch()}
            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
          >
            Refresh Tariffs
          </Button>
        </div>

        {/* Informational Alert */}
        <div className="bg-container-lowest hairline rounded-xl p-4 shadow-card flex items-start gap-3 text-xs text-ink-variant">
          <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            Active rate cards control pricing formulas across all 726+ Delhi NCR pincodes. The system dynamically matches shipments by order type (B2B vs B2C), geographic boundary (Intra-zone vs Inter-zone), and billable weight.
          </p>
        </div>

        {/* Rate Cards Matrix */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Skeleton className="h-64 rounded-xl" />
            <Skeleton className="h-64 rounded-xl" />
            <Skeleton className="h-64 rounded-xl" />
            <Skeleton className="h-64 rounded-xl" />
          </div>
        ) : isError ? (
          <div className="p-12 text-center bg-container-lowest hairline rounded-xl">
            <p className="text-xs text-danger mb-3">Failed to load rate cards.</p>
            <Button variant="secondary" size="sm" onClick={() => refetch()}>
              Retry
            </Button>
          </div>
        ) : cards.length === 0 ? (
          <div className="p-12 bg-container-lowest hairline rounded-xl">
            <EmptyState
              title="No rate cards found"
              description="No active tariffs configured in the system."
              icon={<Tag className="w-6 h-6" />}
            />
          </div>
        ) : (
          <div className="space-y-8">
            {/* B2C Retail Group */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-primary" />
                <h2 className="font-display font-bold text-base text-ink">
                  B2C Standard Consumer Tariffs
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {b2cCards.map((card) => (
                  <RateCardItem
                    key={card.id}
                    card={card}
                    onEdit={() => setEditingCard(card)}
                  />
                ))}
              </div>
            </div>

            {/* B2B Commercial Group */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Building className="w-4 h-4 text-primary" />
                <h2 className="font-display font-bold text-base text-ink">
                  B2B Commercial Enterprise Tariffs
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {b2bCards.map((card) => (
                  <RateCardItem
                    key={card.id}
                    card={card}
                    onEdit={() => setEditingCard(card)}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Live Interactive Tariff Simulator */}
        <div className="bg-container-lowest hairline rounded-xl p-6 shadow-card space-y-5">
          <div className="flex items-center justify-between border-b border-hairline pb-4">
            <div className="flex items-center gap-2">
              <Calculator className="w-4 h-4 text-primary" />
              <h3 className="font-display font-bold text-base text-ink">
                Live Tariff Simulator & Verification
              </h3>
            </div>
            <span className="text-[11px] text-ink-variant">
              Simulates rates using active database rules
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 text-xs">
            <div>
              <label className="block label-caps text-[10px] text-ink-variant mb-1">
                Order Type
              </label>
              <select
                value={simOrderType}
                onChange={(e) => setSimOrderType(e.target.value)}
                className="w-full bg-container-low text-ink rounded p-2 hairline focus:outline-none focus:border-primary"
              >
                <option value="B2C">B2C Retail</option>
                <option value="B2B">B2B Commercial</option>
              </select>
            </div>

            <div>
              <label className="block label-caps text-[10px] text-ink-variant mb-1">
                Trip Routing
              </label>
              <select
                value={simTripType}
                onChange={(e) => setSimTripType(e.target.value)}
                className="w-full bg-container-low text-ink rounded p-2 hairline focus:outline-none focus:border-primary"
              >
                <option value="INTRA_ZONE">Intra-Zone (Local)</option>
                <option value="INTER_ZONE">Inter-Zone (Cross NCR)</option>
              </select>
            </div>

            <div>
              <label className="block label-caps text-[10px] text-ink-variant mb-1">
                Billable Weight (kg)
              </label>
              <input
                type="number"
                step="0.1"
                min="0.1"
                value={simWeight}
                onChange={(e) => setSimWeight(e.target.value)}
                className="w-full bg-container-low text-ink rounded p-2 hairline focus:outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="block label-caps text-[10px] text-ink-variant mb-1">
                Payment Mode
              </label>
              <select
                value={simIsCod ? 'COD' : 'PREPAID'}
                onChange={(e) => setSimIsCod(e.target.value === 'COD')}
                className="w-full bg-container-low text-ink rounded p-2 hairline focus:outline-none focus:border-primary"
              >
                <option value="COD">Cash on Delivery (COD)</option>
                <option value="PREPAID">Prepaid</option>
              </select>
            </div>

            {simIsCod && (
              <div>
                <label className="block label-caps text-[10px] text-ink-variant mb-1">
                  Parcel Value (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  value={simValue}
                  onChange={(e) => setSimValue(e.target.value)}
                  className="w-full bg-container-low text-ink rounded p-2 hairline focus:outline-none focus:border-primary"
                />
              </div>
            )}
          </div>

          {/* Simulator Result Breakdown */}
          {activeSimCard ? (
            <div className="p-4 bg-container-low rounded-lg hairline flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
              <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-ink-variant">
                <div>
                  Base Freight: <strong className="text-ink tabular">{formatCurrency(simBase)}</strong>
                </div>
                <div>
                  Extra Weight:{' '}
                  <strong className="text-ink tabular">{formatCurrency(simExtra)}</strong>
                </div>
                {simIsCod && (
                  <div>
                    COD Surcharge:{' '}
                    <strong className="text-ink tabular">{formatCurrency(simCod)}</strong>
                  </div>
                )}
              </div>

              <div className="flex items-baseline gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-hairline">
                <span className="text-ink-variant">Total Calculated Quote:</span>
                <span className="font-display font-bold text-xl text-primary tabular">
                  {formatCurrency(simTotal)}
                </span>
              </div>
            </div>
          ) : (
            <div className="p-3 bg-danger-soft/60 hairline rounded text-xs text-danger text-center">
              No active rate card configured for this criteria.
            </div>
          )}
        </div>

        {/* Edit Modal */}
        {editingCard && (
          <EditRateCardModal
            isOpen={Boolean(editingCard)}
            rateCard={editingCard}
            onClose={() => setEditingCard(null)}
            onSuccess={refetch}
          />
        )}
      </div>
    </div>
  );
}

function RateCardItem({ card, onEdit }) {
  const isIntra = card.tripType === 'INTRA_ZONE';

  return (
    <div className="bg-container-lowest hairline rounded-xl p-5 shadow-card hover:border-primary/50 transition-all flex flex-col justify-between space-y-4">
      {/* Header with Badges */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-display font-bold text-base text-ink">
              {isIntra ? 'Intra-Zone (Local)' : 'Inter-Zone (Cross-Zone)'}
            </span>
          </div>
          <p className="text-[11px] text-ink-variant/80 mt-0.5">
            {isIntra
              ? 'Pickup and drop within same Delhi NCR sector'
              : 'Pickup and drop across different NCR zones'}
          </p>
        </div>

        <div className="flex items-center gap-1.5">
          {card.isActive ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-success-soft text-success text-[10px] font-bold">
              <CheckCircle2 className="w-3 h-3" />
              Active
            </span>
          ) : (
            <span className="px-2 py-0.5 rounded-full bg-container-high text-ink-variant text-[10px] font-bold">
              Inactive
            </span>
          )}
        </div>
      </div>

      {/* Pricing Grid */}
      <div className="grid grid-cols-3 gap-2.5 p-3 bg-container-low rounded-lg hairline text-xs">
        <div>
          <div className="label-caps text-[9px] text-ink-variant">Base Rate</div>
          <div className="font-display font-bold text-sm text-ink tabular mt-0.5">
            {formatCurrency(card.baseRate)}
          </div>
          <div className="text-[10px] text-ink-variant/70">Up to {formatWeight(card.baseWeight)}</div>
        </div>

        <div>
          <div className="label-caps text-[9px] text-ink-variant">Additional Wt</div>
          <div className="font-display font-bold text-sm text-ink tabular mt-0.5">
            +{formatCurrency(card.additionalPerKgRate)}
          </div>
          <div className="text-[10px] text-ink-variant/70">Per extra kg</div>
        </div>

        <div>
          <div className="label-caps text-[9px] text-ink-variant">COD Surcharge</div>
          <div className="font-display font-bold text-sm text-ink tabular mt-0.5">
            {formatCurrency(card.codSurchargeFixed)} + {card.codSurchargePercent}%
          </div>
          <div className="text-[10px] text-ink-variant/70">Fixed + % value</div>
        </div>
      </div>

      {/* Footer Action */}
      <div className="pt-2 border-t border-hairline flex items-center justify-between">
        <span className="text-[10px] text-ink-variant/60">
          Tier ID: <span className="font-mono text-ink-variant">{card.id?.slice(-6)}</span>
        </span>

        <Button
          variant="secondary"
          size="sm"
          onClick={onEdit}
          leftIcon={<Edit2 className="w-3 h-3" />}
        >
          Edit Tariffs
        </Button>
      </div>
    </div>
  );
}
