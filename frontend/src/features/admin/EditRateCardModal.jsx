import React, { useState, useEffect } from 'react';
import { Modal } from '../../components/ui/Modal.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Input } from '../../components/ui/Input.jsx';
import { useToast } from '../../components/ui/Toast.jsx';
import { adminApi } from '../../api/admin.api.js';
import { formatCurrency } from '../../lib/format.js';
import { getErrorMessage } from '../../lib/errors.js';
import { Save, Calculator } from 'lucide-react';

export function EditRateCardModal({ isOpen, onClose, rateCard, onSuccess }) {
  const [formData, setFormData] = useState({
    baseRate: '',
    baseWeight: '',
    additionalPerKgRate: '',
    codSurchargeFixed: '',
    codSurchargePercent: '',
    isActive: true,
  });

  const [fieldErrors, setFieldErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const toast = useToast();

  useEffect(() => {
    if (rateCard && isOpen) {
      setFormData({
        baseRate: String(rateCard.baseRate ?? ''),
        baseWeight: String(rateCard.baseWeight ?? ''),
        additionalPerKgRate: String(rateCard.additionalPerKgRate ?? ''),
        codSurchargeFixed: String(rateCard.codSurchargeFixed ?? ''),
        codSurchargePercent: String(rateCard.codSurchargePercent ?? ''),
        isActive: Boolean(rateCard.isActive),
      });
      setFieldErrors({});
    }
  }, [rateCard, isOpen]);

  const handleFieldChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (fieldErrors[field]) {
      setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    setFieldErrors({});

    const errors = {};
    const baseRate = parseFloat(formData.baseRate);
    const baseWeight = parseFloat(formData.baseWeight);
    const additionalPerKgRate = parseFloat(formData.additionalPerKgRate);
    const codSurchargeFixed = parseFloat(formData.codSurchargeFixed);
    const codSurchargePercent = parseFloat(formData.codSurchargePercent);

    if (isNaN(baseRate) || baseRate < 0) errors.baseRate = 'Base rate must be ≥ 0';
    if (isNaN(baseWeight) || baseWeight <= 0) errors.baseWeight = 'Base weight must be > 0';
    if (isNaN(additionalPerKgRate) || additionalPerKgRate < 0) {
      errors.additionalPerKgRate = 'Additional rate must be ≥ 0';
    }
    if (isNaN(codSurchargeFixed) || codSurchargeFixed < 0) {
      errors.codSurchargeFixed = 'Fixed COD fee must be ≥ 0';
    }
    if (isNaN(codSurchargePercent) || codSurchargePercent < 0 || codSurchargePercent > 100) {
      errors.codSurchargePercent = 'COD percent must be 0–100%';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setIsSubmitting(true);
    try {
      await adminApi.updateRateCard(rateCard.id, {
        baseRate,
        baseWeight,
        additionalPerKgRate,
        codSurchargeFixed,
        codSurchargePercent,
        isActive: formData.isActive,
      });

      toast.success(
        `Rate card for ${rateCard.orderType} ${rateCard.tripType.replace('_', ' ')} updated!`
      );
      onSuccess?.();
      onClose();
    } catch (err) {
      if (err.details && Object.keys(err.details).length > 0) {
        setFieldErrors(err.details);
      } else {
        toast.error(getErrorMessage(err, 'Failed to update rate card.'));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!rateCard) return null;

  // Live simulation for 2kg parcel with ₹1,500 COD
  const simWeight = 2;
  const simValue = 1500;
  const bRate = parseFloat(formData.baseRate) || 0;
  const bWeight = parseFloat(formData.baseWeight) || 0.5;
  const addRate = parseFloat(formData.additionalPerKgRate) || 0;
  const codFix = parseFloat(formData.codSurchargeFixed) || 0;
  const codPct = parseFloat(formData.codSurchargePercent) || 0;

  const extraKg = Math.max(0, simWeight - bWeight);
  const extraCost = extraKg * addRate;
  const codFee = codFix + (simValue * codPct) / 100;
  const totalSim = bRate + extraCost + codFee;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Edit Rate Card: ${rateCard.orderType} ${rateCard.tripType === 'INTRA_ZONE' ? 'Intra-Zone' : 'Inter-Zone'}`}
      maxWidth="max-w-lg"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Tier badge header */}
        <div className="p-3 bg-container-low hairline rounded-lg flex items-center justify-between text-xs">
          <div>
            <span className="label-caps text-[9px] text-ink-variant">Tariff Tier</span>
            <div className="font-display font-bold text-ink mt-0.5">
              {rateCard.orderType} · {rateCard.tripType.replace('_', ' ')}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] text-ink-variant">Card Status:</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => handleFieldChange('isActive', e.target.checked)}
                disabled={isSubmitting}
                className="sr-only peer"
              />
              <div className="w-8 h-4.5 bg-container-high peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-primary" />
            </label>
          </div>
        </div>

        {/* Base Pricing Grid */}
        <div className="space-y-3">
          <div className="label-caps text-xs text-ink-variant">Base Freight & Weight Allowance</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Base Freight Rate (₹)"
              type="number"
              step="0.5"
              min="0"
              placeholder="e.g. 40"
              value={formData.baseRate}
              onChange={(e) => handleFieldChange('baseRate', e.target.value)}
              error={fieldErrors.baseRate}
              helperText="Starting charge for minimum weight"
              disabled={isSubmitting}
              required
            />

            <Input
              label="Base Weight Limit (kg)"
              type="number"
              step="0.1"
              min="0.1"
              placeholder="e.g. 0.5"
              value={formData.baseWeight}
              onChange={(e) => handleFieldChange('baseWeight', e.target.value)}
              error={fieldErrors.baseWeight}
              helperText="Included weight in base rate"
              disabled={isSubmitting}
              required
            />
          </div>
        </div>

        {/* Additional Incremental Rate */}
        <div className="space-y-3 pt-2 border-t border-hairline">
          <div className="label-caps text-xs text-ink-variant">Incremental Weight Charges</div>
          <Input
            label="Additional Rate Per Extra Kg (₹/kg)"
            type="number"
            step="0.5"
            min="0"
            placeholder="e.g. 15"
            value={formData.additionalPerKgRate}
            onChange={(e) => handleFieldChange('additionalPerKgRate', e.target.value)}
            error={fieldErrors.additionalPerKgRate}
            helperText="Billed for each kilogram exceeding base weight limit"
            disabled={isSubmitting}
            required
          />
        </div>

        {/* COD Surcharges */}
        <div className="space-y-3 pt-2 border-t border-hairline">
          <div className="label-caps text-xs text-ink-variant">Cash on Delivery (COD) Surcharges</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Fixed Doorstep COD Fee (₹)"
              type="number"
              step="0.5"
              min="0"
              placeholder="e.g. 30"
              value={formData.codSurchargeFixed}
              onChange={(e) => handleFieldChange('codSurchargeFixed', e.target.value)}
              error={fieldErrors.codSurchargeFixed}
              helperText="Flat fee for cash handling"
              disabled={isSubmitting}
              required
            />

            <Input
              label="COD Value Percent (%)"
              type="number"
              step="0.1"
              min="0"
              max="100"
              placeholder="e.g. 1.5"
              value={formData.codSurchargePercent}
              onChange={(e) => handleFieldChange('codSurchargePercent', e.target.value)}
              error={fieldErrors.codSurchargePercent}
              helperText="% of declared parcel value"
              disabled={isSubmitting}
              required
            />
          </div>
        </div>

        {/* Live Calculation Simulation Box */}
        <div className="p-3.5 bg-container-low rounded-lg hairline text-xs space-y-2">
          <div className="flex items-center gap-1.5 font-semibold text-ink">
            <Calculator className="w-3.5 h-3.5 text-primary" />
            <span>Simulated Tariff (2.0 kg package · ₹1,500 COD value)</span>
          </div>
          <div className="grid grid-cols-3 gap-2 text-[11px] text-ink-variant pt-1 border-t border-hairline">
            <div>
              <span>Base ({bWeight}kg):</span>{' '}
              <strong className="text-ink tabular">{formatCurrency(bRate)}</strong>
            </div>
            <div>
              <span>Extra Wt ({extraKg.toFixed(1)}kg):</span>{' '}
              <strong className="text-ink tabular">{formatCurrency(extraCost)}</strong>
            </div>
            <div>
              <span>COD Fee:</span>{' '}
              <strong className="text-ink tabular">{formatCurrency(codFee)}</strong>
            </div>
          </div>
          <div className="flex items-baseline justify-between pt-1 font-display font-bold text-xs text-ink border-t border-hairline">
            <span>Estimated Total:</span>
            <span className="text-primary tabular text-sm">{formatCurrency(totalSim)}</span>
          </div>
        </div>

        <div className="pt-3 border-t border-hairline flex items-center justify-end gap-3">
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
            type="submit"
            variant="primary"
            size="md"
            isLoading={isSubmitting}
            leftIcon={<Save className="w-4 h-4" />}
          >
            Save Rate Card
          </Button>
        </div>
      </form>
    </Modal>
  );
}
