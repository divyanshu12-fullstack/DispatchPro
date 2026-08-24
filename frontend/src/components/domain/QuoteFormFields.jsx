import React from 'react';
import { Input } from '../ui/Input.jsx';
import { ORDER_TYPES } from '../../lib/constants.js';
import { Box, MapPin, Building, Scale } from 'lucide-react';

/**
 * Shared Quote and Parcel Specification Form Fields.
 * Reused between the public Quote Calculator (/quote) and Customer Wizard (/app/new).
 *
 * @param {object} props
 * @param {object} props.values - Form state values
 * @param {(field: string, value: any) => void} props.onChange - Field update handler
 * @param {Record<string, string>} [props.errors={}] - Validation errors
 * @param {boolean} [props.includeB2BFields=false] - Whether to render B2B company & GSTIN fields
 * @param {boolean} [props.disabled=false]
 */
export function QuoteFormFields({
  values,
  onChange,
  errors = {},
  includeB2BFields = false,
  disabled = false,
}) {
  const {
    orderType = ORDER_TYPES.B2C,
    pickupPincode = '',
    dropPincode = '',
    actualWeightKg = '',
    lengthCm = '',
    breadthCm = '',
    heightCm = '',
    isCOD = false,
    declaredValue = '',
    pickupCompanyName = '',
    pickupGstin = '',
    dropCompanyName = '',
    dropGstin = '',
  } = values;

  // Live volumetric weight helper
  const l = parseFloat(lengthCm) || 0;
  const b = parseFloat(breadthCm) || 0;
  const h = parseFloat(heightCm) || 0;
  const volumetricKg = l > 0 && b > 0 && h > 0 ? ((l * b * h) / 5000).toFixed(2) : '0.00';
  const billableKg = Math.max(parseFloat(actualWeightKg) || 0, parseFloat(volumetricKg) || 0).toFixed(2);

  return (
    <div className="space-y-6">
      {/* 1. Order Type Selection */}
      <div className="space-y-1.5">
        <label className="block label-caps text-ink-variant">Shipment Type</label>
        <div className="grid grid-cols-2 gap-2 p-1 bg-container-low hairline rounded">
          <button
            type="button"
            disabled={disabled}
            onClick={() => onChange('orderType', ORDER_TYPES.B2C)}
            className={`py-2 text-xs font-semibold rounded transition-colors cursor-pointer ${
              orderType === ORDER_TYPES.B2C
                ? 'bg-container-lowest text-ink shadow-xs hairline'
                : 'text-ink-variant hover:text-ink'
            }`}
          >
            B2C (Retail / Personal)
          </button>
          <button
            type="button"
            disabled={disabled}
            onClick={() => onChange('orderType', ORDER_TYPES.B2B)}
            className={`py-2 text-xs font-semibold rounded transition-colors cursor-pointer ${
              orderType === ORDER_TYPES.B2B
                ? 'bg-container-lowest text-ink shadow-xs hairline'
                : 'text-ink-variant hover:text-ink'
            }`}
          >
            B2B (Commercial / Business)
          </button>
        </div>
      </div>

      {/* 2. Pincodes */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="Pickup Pincode"
          placeholder="e.g. 110001"
          value={pickupPincode}
          onChange={(e) => onChange('pickupPincode', e.target.value.slice(0, 6))}
          error={errors.pickupPincode}
          numericOnly
          leftIcon={<MapPin className="w-4 h-4" />}
          helperText="Delhi NCR origin pincode"
          maxLength={6}
          disabled={disabled}
          required
        />

        <Input
          label="Drop Pincode"
          placeholder="e.g. 110018"
          value={dropPincode}
          onChange={(e) => onChange('dropPincode', e.target.value.slice(0, 6))}
          error={errors.dropPincode}
          numericOnly
          leftIcon={<MapPin className="w-4 h-4" />}
          helperText="Delhi NCR destination pincode"
          maxLength={6}
          disabled={disabled}
          required
        />
      </div>

      {/* 3. Weight & Dimensions */}
      <div className="space-y-4 pt-2 border-t border-hairline">
        <div className="flex items-center justify-between">
          <div className="label-caps text-xs text-ink-variant flex items-center gap-1.5">
            <Scale className="w-3.5 h-3.5 text-primary" />
            <span>Weight & Parcel Dimensions</span>
          </div>

          {billableKg > 0 && (
            <span className="text-[11px] text-ink-variant">
              Billable Weight: <strong className="text-ink font-semibold tabular">{billableKg} kg</strong>
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div className="sm:col-span-1">
            <Input
              label="Weight (kg)"
              type="number"
              step="0.1"
              min="0.1"
              max="100"
              placeholder="e.g. 1.5"
              value={actualWeightKg}
              onChange={(e) => onChange('actualWeightKg', e.target.value)}
              error={errors.actualWeightKg}
              disabled={disabled}
              required
            />
          </div>

          <div className="sm:col-span-1">
            <Input
              label="Length (cm)"
              type="number"
              step="1"
              min="1"
              max="300"
              placeholder="L"
              value={lengthCm}
              onChange={(e) => onChange('lengthCm', e.target.value)}
              error={errors.lengthCm}
              disabled={disabled}
              required
            />
          </div>

          <div className="sm:col-span-1">
            <Input
              label="Breadth (cm)"
              type="number"
              step="1"
              min="1"
              max="300"
              placeholder="B"
              value={breadthCm}
              onChange={(e) => onChange('breadthCm', e.target.value)}
              error={errors.breadthCm}
              disabled={disabled}
              required
            />
          </div>

          <div className="sm:col-span-1">
            <Input
              label="Height (cm)"
              type="number"
              step="1"
              min="1"
              max="300"
              placeholder="H"
              value={heightCm}
              onChange={(e) => onChange('heightCm', e.target.value)}
              error={errors.heightCm}
              disabled={disabled}
              required
            />
          </div>
        </div>

        {/* Volumetric calculation indicator */}
        <div className="bg-container-low p-2.5 rounded hairline text-[11px] text-ink-variant flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Box className="w-3.5 h-3.5 text-ink-variant/80" />
            <span>Volumetric Formula: (L × B × H) / 5000</span>
          </div>
          <span className="font-semibold text-ink tabular">{volumetricKg} kg</span>
        </div>
      </div>

      {/* 4. Cash on Delivery Radio Selector */}
      <div className="space-y-3 pt-2 border-t border-hairline">
        <label className="block label-caps text-ink-variant">Payment Mode at Delivery</label>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Prepaid / Standard Option */}
          <div
            onClick={() => !disabled && onChange('isCOD', false)}
            className={`p-3.5 rounded-lg hairline cursor-pointer transition-all flex items-start gap-3 ${
              !isCOD
                ? 'bg-container-lowest border-primary ring-1 ring-primary shadow-xs'
                : 'bg-container-low hover:bg-container'
            }`}
          >
            <div
              className={`w-4 h-4 rounded-full border flex items-center justify-center mt-0.5 shrink-0 ${
                !isCOD ? 'border-primary bg-primary text-on-primary' : 'border-outline bg-container-lowest'
              }`}
            >
              {!isCOD && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
            </div>
            <div>
              <div className="font-semibold text-xs text-ink">Prepaid / Non-COD</div>
              <div className="text-[11px] text-ink-variant mt-0.5">No doorstep cash collection</div>
            </div>
          </div>

          {/* COD Option */}
          <div
            onClick={() => !disabled && onChange('isCOD', true)}
            className={`p-3.5 rounded-lg hairline cursor-pointer transition-all flex items-start gap-3 ${
              isCOD
                ? 'bg-container-lowest border-primary ring-1 ring-primary shadow-xs'
                : 'bg-container-low hover:bg-container'
            }`}
          >
            <div
              className={`w-4 h-4 rounded-full border flex items-center justify-center mt-0.5 shrink-0 ${
                isCOD ? 'border-primary bg-primary text-on-primary' : 'border-outline bg-container-lowest'
              }`}
            >
              {isCOD && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
            </div>
            <div>
              <div className="font-semibold text-xs text-ink flex items-center gap-1.5">
                <span>Cash on Delivery (COD)</span>
                <span className="px-1.5 py-0.2 rounded bg-accent/20 text-[#735c00] text-[9px] font-bold">
                  Active
                </span>
              </div>
              <div className="text-[11px] text-ink-variant mt-0.5">Collect cash at doorstep</div>
            </div>
          </div>
        </div>

        {isCOD && (
          <div className="pt-2 animate-in fade-in slide-in-from-top-1">
            <Input
              label="Parcel Value (₹)"
              type="number"
              min="1"
              max="100000"
              placeholder="e.g. 1500"
              value={declaredValue}
              onChange={(e) => onChange('declaredValue', e.target.value)}
              error={errors.declaredValue}
              helperText="Amount to collect from the recipient upon doorstep delivery"
              disabled={disabled}
              required
            />
          </div>
        )}
      </div>

      {/* 5. Optional B2B Commercial Fields */}
      {includeB2BFields && orderType === ORDER_TYPES.B2B && (
        <div className="space-y-4 pt-2 border-t border-hairline">
          <div className="label-caps text-xs text-ink-variant flex items-center gap-1.5">
            <Building className="w-3.5 h-3.5 text-primary" />
            <span>Commercial B2B Invoicing</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Pickup Company Name"
              placeholder="Sender Corp Ltd."
              value={pickupCompanyName}
              onChange={(e) => onChange('pickupCompanyName', e.target.value)}
              error={errors.pickupCompanyName}
              disabled={disabled}
              required
            />

            <Input
              label="Pickup GSTIN"
              placeholder="07AAAAA0000A1Z5"
              value={pickupGstin}
              onChange={(e) => onChange('pickupGstin', e.target.value.toUpperCase())}
              error={errors.pickupGstin}
              helperText="15-character uppercase GSTIN"
              maxLength={15}
              disabled={disabled}
              required
            />

            <Input
              label="Drop Company Name"
              placeholder="Recipient Pvt Ltd."
              value={dropCompanyName}
              onChange={(e) => onChange('dropCompanyName', e.target.value)}
              error={errors.dropCompanyName}
              disabled={disabled}
              required
            />

            <Input
              label="Drop GSTIN"
              placeholder="07BBBBB0000B1Z5"
              value={dropGstin}
              onChange={(e) => onChange('dropGstin', e.target.value.toUpperCase())}
              error={errors.dropGstin}
              helperText="15-character uppercase GSTIN"
              maxLength={15}
              disabled={disabled}
              required
            />
          </div>
        </div>
      )}
    </div>
  );
}
