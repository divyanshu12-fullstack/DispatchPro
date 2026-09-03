import React, { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { ordersApi } from '../../api/orders.api.js';
import { PriceBreakdown } from '../../components/domain/PriceBreakdown.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Input } from '../../components/ui/Input.jsx';
import { useToast } from '../../components/ui/Toast.jsx';
import { formatCurrency, formatDate } from '../../lib/format.js';
import { ORDER_TYPES, GSTIN_REGEX } from '../../lib/constants.js';
import { getErrorMessage } from '../../lib/errors.js';
import {
  MapPin,
  Box,
  Building,
  CreditCard,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Calendar,
  Copy,
  Check,
  Banknote,
  Scale,
} from 'lucide-react';

function getInitialFormData() {
  const defaultValues = {
    // Shipment Type
    orderType: ORDER_TYPES.B2C,

    // Step 1: Pickup Location
    pickupCompanyName: '',
    pickupGstin: '',
    pickupBuilding: 'Plot 42, 3rd Floor',
    pickupStreet: 'Cyber City, Phase 2',
    pickupCity: 'Gurugram',
    pickupState: 'Haryana',
    pickupPincode: '122001',

    // Step 1: Drop Destination
    dropCompanyName: '',
    dropGstin: '',
    dropBuilding: 'Shop 14, Main Market',
    dropStreet: 'Near Clock Tower',
    dropCity: 'New Delhi',
    dropState: 'Delhi',
    dropPincode: '110001',

    // Step 2: Parcel Specs & Payment
    actualWeightKg: '1.5',
    lengthCm: '20',
    breadthCm: '15',
    heightCm: '10',
    isCOD: true,
    declaredValue: '1500',

    // Step 3: Target Delivery Schedule
    scheduledDeliveryDate: '',
  };

  try {
    const prefill = sessionStorage.getItem('dispatchpro_prefill_quote');
    if (prefill) {
      const parsed = JSON.parse(prefill);
      sessionStorage.removeItem('dispatchpro_prefill_quote');
      return {
        ...defaultValues,
        orderType: parsed.orderType || defaultValues.orderType,
        pickupPincode: parsed.pickupPincode || defaultValues.pickupPincode,
        dropPincode: parsed.dropPincode || defaultValues.dropPincode,
        actualWeightKg: String(parsed.actualWeightKg || defaultValues.actualWeightKg),
        lengthCm: String(parsed.lengthCm || defaultValues.lengthCm),
        breadthCm: String(parsed.breadthCm || defaultValues.breadthCm),
        heightCm: String(parsed.heightCm || defaultValues.heightCm),
        isCOD: Boolean(parsed.isCOD),
        declaredValue: String(parsed.declaredValue || ''),
        pickupCompanyName: parsed.pickupCompanyName || '',
        pickupGstin: parsed.pickupGstin || '',
        dropCompanyName: parsed.dropCompanyName || '',
        dropGstin: parsed.dropGstin || '',
      };
    }
  } catch {
    // ignore
  }

  return defaultValues;
}

function getTomorrowDateString() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split('T')[0];
}

export function CreateOrderWizardPage() {
  const toast = useToast();

  // Form State
  const [formData, setFormData] = useState(getInitialFormData);
  const [currentStep, setCurrentStep] = useState(1);
  const [fieldErrors, setFieldErrors] = useState({});
  const [quoteResult, setQuoteResult] = useState(null);
  const [isQuoteLoading, setIsQuoteLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Success state on creation
  const [createdOrder, setCreatedOrder] = useState(null);
  const [copied, setCopied] = useState(false);

  const tomorrowStr = getTomorrowDateString();

  // Automatically scroll to top when moving between wizard steps or completing order
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
    if (typeof document !== 'undefined') {
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    }
  }, [currentStep, createdOrder]);

  const handleFieldChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (fieldErrors[field]) {
      setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  // Helper to compose full address string
  const composeAddress = (building, street, city, state) => {
    return [building, street, city, state]
      .map((s) => (s || '').trim())
      .filter(Boolean)
      .join(', ');
  };

  // Step 1 Validation: Addresses & B2B Invoicing
  const validateStep1 = () => {
    const errors = {};

    // Pickup checks
    if (!formData.pickupBuilding.trim()) {
      errors.pickupBuilding = 'House / Building / Floor is required';
    }
    if (!formData.pickupStreet.trim()) {
      errors.pickupStreet = 'Street / Area / Landmark is required';
    }
    if (!formData.pickupCity.trim()) {
      errors.pickupCity = 'City / District is required';
    }
    if (!formData.pickupState.trim()) {
      errors.pickupState = 'State is required';
    }
    if (!formData.pickupPincode || formData.pickupPincode.trim().length !== 6) {
      errors.pickupPincode = 'Valid 6-digit origin pincode required';
    }

    // Drop destination checks
    if (!formData.dropBuilding.trim()) {
      errors.dropBuilding = 'House / Unit / Building is required';
    }
    if (!formData.dropStreet.trim()) {
      errors.dropStreet = 'Street / Area / Landmark is required';
    }
    if (!formData.dropCity.trim()) {
      errors.dropCity = 'City / District is required';
    }
    if (!formData.dropState.trim()) {
      errors.dropState = 'State is required';
    }
    if (!formData.dropPincode || formData.dropPincode.trim().length !== 6) {
      errors.dropPincode = 'Valid 6-digit destination pincode required';
    }

    // B2B Commercial Fields validation
    if (formData.orderType === ORDER_TYPES.B2B) {
      if (!formData.pickupCompanyName.trim()) {
        errors.pickupCompanyName = 'Sender Company Name is required for B2B';
      }
      if (!formData.pickupGstin.trim() || !GSTIN_REGEX.test(formData.pickupGstin.trim())) {
        errors.pickupGstin = 'Valid 15-digit GSTIN is required (e.g. 07AAAAA0000A1Z5)';
      }
      if (!formData.dropCompanyName.trim()) {
        errors.dropCompanyName = 'Recipient Company Name is required for B2B';
      }
      if (!formData.dropGstin.trim() || !GSTIN_REGEX.test(formData.dropGstin.trim())) {
        errors.dropGstin = 'Valid 15-digit GSTIN is required (e.g. 08BBBBB0000B1Z5)';
      }
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return false;
    }
    return true;
  };

  // Step 2 Validation: Parcel Specs & Payment
  const validateStep2 = () => {
    const errors = {};
    const w = parseFloat(formData.actualWeightKg);
    const l = parseFloat(formData.lengthCm);
    const b = parseFloat(formData.breadthCm);
    const h = parseFloat(formData.heightCm);

    if (!formData.actualWeightKg || isNaN(w) || w <= 0) {
      errors.actualWeightKg = 'Weight must be greater than 0 kg';
    }
    if (!formData.lengthCm || isNaN(l) || l <= 0) errors.lengthCm = 'Length is required';
    if (!formData.breadthCm || isNaN(b) || b <= 0) errors.breadthCm = 'Breadth is required';
    if (!formData.heightCm || isNaN(h) || h <= 0) errors.heightCm = 'Height is required';

    if (formData.isCOD) {
      const val = parseFloat(formData.declaredValue);
      if (!formData.declaredValue || isNaN(val) || val <= 0) {
        errors.declaredValue = 'Parcel value is required for Cash on Delivery (COD)';
      }
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return false;
    }
    return true;
  };

  // Fetch live price quote before Step 3 Review
  const fetchReviewQuote = async () => {
    setIsQuoteLoading(true);
    try {
      const payload = {
        orderType: formData.orderType,
        pickupPincode: formData.pickupPincode.trim(),
        dropPincode: formData.dropPincode.trim(),
        actualWeightKg: parseFloat(formData.actualWeightKg),
        dimensions: {
          lengthCm: parseFloat(formData.lengthCm),
          breadthCm: parseFloat(formData.breadthCm),
          heightCm: parseFloat(formData.heightCm),
        },
        isCOD: Boolean(formData.isCOD),
        declaredValue: formData.isCOD ? parseFloat(formData.declaredValue || '1500') : null,
      };

      if (formData.orderType === ORDER_TYPES.B2B) {
        payload.pickupCompanyName = formData.pickupCompanyName.trim();
        payload.pickupGstin = formData.pickupGstin.trim().toUpperCase();
        payload.dropCompanyName = formData.dropCompanyName.trim();
        payload.dropGstin = formData.dropGstin.trim().toUpperCase();
      }

      const res = await ordersApi.getQuote(payload);
      setQuoteResult(res);
    } catch (err) {
      if (err.details && Object.keys(err.details).length > 0) {
        setFieldErrors(err.details);
      }
      toast.error(getErrorMessage(err, 'Could not calculate quote for the given pincodes.'));
    } finally {
      setIsQuoteLoading(false);
    }
  };

  // Step Navigation Handlers
  const handleNext = async () => {
    setFieldErrors({});

    if (currentStep === 1) {
      if (!validateStep1()) return;
      setCurrentStep(2);
    } else if (currentStep === 2) {
      if (!validateStep2()) return;
      await fetchReviewQuote();
      setCurrentStep(3);
    }
  };

  const handleBack = () => {
    setFieldErrors({});
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Final Submission: Create Order
  const handleSubmitOrder = async () => {
    setFieldErrors({});
    if (!formData.scheduledDeliveryDate) {
      setFieldErrors({ scheduledDeliveryDate: 'Please select a scheduled delivery date' });
      return;
    }

    setIsSubmitting(true);
    try {
      const pickupAddress = composeAddress(
        formData.pickupBuilding,
        formData.pickupStreet,
        formData.pickupCity,
        formData.pickupState
      );

      const dropAddress = composeAddress(
        formData.dropBuilding,
        formData.dropStreet,
        formData.dropCity,
        formData.dropState
      );

      const payload = {
        orderType: formData.orderType,
        pickupPincode: formData.pickupPincode.trim(),
        pickupAddress,
        dropPincode: formData.dropPincode.trim(),
        dropAddress,
        actualWeightKg: parseFloat(formData.actualWeightKg),
        dimensions: {
          lengthCm: parseFloat(formData.lengthCm),
          breadthCm: parseFloat(formData.breadthCm),
          heightCm: parseFloat(formData.heightCm),
        },
        isCOD: Boolean(formData.isCOD),
        declaredValue: formData.isCOD ? parseFloat(formData.declaredValue || '1500') : null,
        scheduledDeliveryDate: new Date(formData.scheduledDeliveryDate).toISOString(),
      };

      if (formData.orderType === ORDER_TYPES.B2B) {
        payload.pickupCompanyName = formData.pickupCompanyName.trim();
        payload.pickupGstin = formData.pickupGstin.trim().toUpperCase();
        payload.dropCompanyName = formData.dropCompanyName.trim();
        payload.dropGstin = formData.dropGstin.trim().toUpperCase();
      }

      const order = await ordersApi.createOrder(payload);
      setCreatedOrder(order);
      toast.success(`Shipment ${order.orderNumber} created successfully!`);
    } catch (err) {
      if (err.details && Object.keys(err.details).length > 0) {
        setFieldErrors(err.details);
        const firstErrKey = Object.keys(err.details)[0];
        toast.error(`Validation Failed: ${err.details[firstErrKey]}`);
      } else {
        toast.error(getErrorMessage(err, 'Failed to create shipment order.'));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyOrderNumber = async () => {
    if (!createdOrder?.orderNumber) return;
    try {
      await navigator.clipboard.writeText(createdOrder.orderNumber);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  // If order successfully placed -> render confirmation screen
  if (createdOrder) {
    return (
      <div className="min-h-screen bg-surface py-12 sm:py-16">
        <div className="max-w-2xl mx-auto px-4 sm:px-6">
          <div className="bg-container-lowest hairline rounded-2xl p-8 sm:p-12 shadow-card text-center space-y-6">
            <div className="w-16 h-16 rounded-full bg-accent/20 text-accent flex items-center justify-center mx-auto shadow-sm">
              <CheckCircle2 className="w-10 h-10 text-primary" />
            </div>

            <div>
              <div className="label-caps text-xs text-ink-variant mb-1">Booking Confirmed</div>
              <h1 className="font-display text-2xl sm:text-3xl font-bold text-ink">
                Shipment Booked Successfully!
              </h1>
              <p className="text-sm text-ink-variant mt-2 leading-relaxed max-w-md mx-auto">
                Your consignment has been registered in the dispatch queue. A tracking confirmation email has been dispatched.
              </p>
            </div>

            {/* Tracking Number Card */}
            <div className="p-6 bg-container-low hairline rounded-xl flex flex-col items-center justify-center space-y-2">
              <div className="label-caps text-[10px] text-ink-variant">Waybill Tracking Number</div>
              <div className="flex items-center gap-3">
                <span className="font-display text-2xl sm:text-3xl font-bold text-ink tabular tracking-tight">
                  {createdOrder.orderNumber}
                </span>
                <button
                  type="button"
                  onClick={handleCopyOrderNumber}
                  className="p-2 rounded-lg hairline bg-container-lowest hover:bg-container text-ink-variant hover:text-ink cursor-pointer transition-colors shadow-xs"
                  title="Copy tracking number"
                >
                  {copied ? <Check className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Summary Details */}
            <div className="grid grid-cols-2 gap-4 text-left p-4 bg-container-lowest hairline rounded-xl text-xs">
              <div>
                <span className="label-caps text-[10px] text-ink-variant">Delivery Target</span>
                <div className="font-semibold text-ink mt-0.5">
                  {formatDate(createdOrder.scheduledDeliveryDate)}
                </div>
              </div>
              <div>
                <span className="label-caps text-[10px] text-ink-variant">Total Freight Cost</span>
                <div className="font-bold text-ink tabular mt-0.5">
                  {formatCurrency(createdOrder.pricing?.totalAmount)}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4 border-t border-hairline">
              <Link to={`/app/orders/${createdOrder.id}`} className="w-full sm:w-auto">
                <Button variant="primary" size="lg" className="w-full sm:w-auto" rightIcon={<ArrowRight className="w-4 h-4" />}>
                  Track Shipment Now
                </Button>
              </Link>
              <Link to="/app" className="w-full sm:w-auto">
                <Button variant="secondary" size="lg" className="w-full sm:w-auto">
                  Return to Dashboard
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Stepper Definition (Unified 3-Step Wizard)
  const steps = [
    { num: 1, label: 'Addresses & Invoicing', icon: <MapPin className="w-3.5 h-3.5" /> },
    { num: 2, label: 'Parcel Specs & Payment', icon: <Box className="w-3.5 h-3.5" /> },
    { num: 3, label: 'Review & Schedule', icon: <CreditCard className="w-3.5 h-3.5" /> },
  ];

  // Live volumetric computation for Step 2
  const l = parseFloat(formData.lengthCm) || 0;
  const b = parseFloat(formData.breadthCm) || 0;
  const h = parseFloat(formData.heightCm) || 0;
  const volumetricKg = l > 0 && b > 0 && h > 0 ? ((l * b * h) / 5000).toFixed(2) : '0.00';
  const billableKg = Math.max(parseFloat(formData.actualWeightKg) || 0, parseFloat(volumetricKg) || 0).toFixed(2);

  return (
    <div className="min-h-screen bg-surface py-8 sm:py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        {/* Top Header */}
        <div className="mb-8">
          <Link
            to="/app"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink-variant hover:text-ink transition-colors mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Dashboard</span>
          </Link>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-ink">
            Book a Shipment
          </h1>
          <p className="text-sm text-ink-variant mt-0.5">
            Fill in the shipping details to schedule doorstep pickup and courier delivery.
          </p>
        </div>

        {/* Wizard Stepper Progress Bar */}
        <div className="bg-container-lowest hairline rounded-2xl p-4 mb-8 shadow-card overflow-x-auto">
          <div className="flex items-center justify-between min-w-[320px]">
            {steps.map((s, idx) => {
              const isActive = currentStep === s.num;
              const isPast = currentStep > s.num;

              return (
                <React.Fragment key={s.num}>
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                        isActive
                          ? 'bg-primary text-on-primary ring-4 ring-container-low shadow-sm'
                          : isPast
                          ? 'bg-primary text-on-primary'
                          : 'bg-container-high text-ink-variant/60'
                      }`}
                    >
                      {isPast ? <Check className="w-4 h-4 stroke-[2.5]" /> : s.num}
                    </div>
                    <span
                      className={`text-xs font-semibold ${
                        isActive ? 'text-ink font-bold' : isPast ? 'text-ink' : 'text-ink-variant/60'
                      }`}
                    >
                      {s.label}
                    </span>
                  </div>

                  {idx < steps.length - 1 && (
                    <div
                      className={`flex-1 h-[2px] mx-4 transition-colors ${
                        isPast ? 'bg-primary' : 'bg-hairline'
                      }`}
                    />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* Wizard Step Content Card */}
        <div className="bg-container-lowest hairline rounded-2xl p-6 sm:p-8 shadow-card">
          {/* STEP 1: Addresses & Invoicing */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="font-display text-lg font-bold text-ink">Origin & Destination</h2>
                <p className="text-xs text-ink-variant">
                  Enter structured address details and GSTIN invoicing information.
                </p>
              </div>

              {/* Shipment Type Selector (B2C vs B2B) */}
              <div className="space-y-2">
                <label className="block label-caps text-ink-variant">Shipment Category</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => handleFieldChange('orderType', ORDER_TYPES.B2C)}
                    className={`p-3.5 rounded-xl hairline cursor-pointer transition-all text-left flex items-start gap-3 ${
                      formData.orderType === ORDER_TYPES.B2C
                        ? 'bg-container-lowest border-primary ring-1 ring-primary shadow-xs'
                        : 'bg-container-low hover:bg-container'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-full border flex items-center justify-center mt-0.5 shrink-0 ${
                        formData.orderType === ORDER_TYPES.B2C
                          ? 'border-primary bg-primary text-on-primary'
                          : 'border-outline bg-container-lowest'
                      }`}
                    >
                      {formData.orderType === ORDER_TYPES.B2C && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </div>
                    <div>
                      <div className="font-semibold text-xs text-ink">B2C (Retail / Personal)</div>
                      <div className="text-[11px] text-ink-variant mt-0.5">Direct doorstep delivery to individuals</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleFieldChange('orderType', ORDER_TYPES.B2B)}
                    className={`p-3.5 rounded-xl hairline cursor-pointer transition-all text-left flex items-start gap-3 ${
                      formData.orderType === ORDER_TYPES.B2B
                        ? 'bg-container-lowest border-primary ring-1 ring-primary shadow-xs'
                        : 'bg-container-low hover:bg-container'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-full border flex items-center justify-center mt-0.5 shrink-0 ${
                        formData.orderType === ORDER_TYPES.B2B
                          ? 'border-primary bg-primary text-on-primary'
                          : 'border-outline bg-container-lowest'
                      }`}
                    >
                      {formData.orderType === ORDER_TYPES.B2B && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </div>
                    <div>
                      <div className="font-semibold text-xs text-ink">B2B (Commercial / GST)</div>
                      <div className="text-[11px] text-ink-variant mt-0.5">Business shipment with GSTIN invoicing</div>
                    </div>
                  </button>
                </div>
              </div>

              {/* 1. Pickup Origin Address Card */}
              <div className="p-5 bg-container-low/60 hairline rounded-xl space-y-4">
                <div className="label-caps text-xs text-primary font-bold flex items-center gap-1.5">
                  <MapPin className="w-4 h-4" />
                  <span>Pickup Location (Origin)</span>
                </div>

                {/* B2B Sender Company & GSTIN */}
                {formData.orderType === ORDER_TYPES.B2B && (
                  <div className="p-4 bg-container-lowest hairline rounded-xl space-y-3 border-l-2 border-l-primary">
                    <div className="label-caps text-[10px] text-ink font-bold flex items-center gap-1.5">
                      <Building className="w-3.5 h-3.5 text-primary" />
                      <span>Sender Business Details (B2B)</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <Input
                        label="Sender Company Name"
                        placeholder="e.g. Alpha Exports Pvt Ltd"
                        value={formData.pickupCompanyName}
                        onChange={(e) => handleFieldChange('pickupCompanyName', e.target.value)}
                        error={fieldErrors.pickupCompanyName}
                        required
                      />
                      <Input
                        label="Sender GSTIN"
                        placeholder="07AAAAA0000A1Z5"
                        value={formData.pickupGstin}
                        onChange={(e) => handleFieldChange('pickupGstin', e.target.value.toUpperCase())}
                        error={fieldErrors.pickupGstin}
                        maxLength={15}
                        helperText="15-digit Indian GSTIN"
                        required
                      />
                    </div>
                  </div>
                )}

                {/* Structured Address Fields */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input
                    label="Building / House / Flat No."
                    placeholder="e.g. Plot 42, 3rd Floor"
                    value={formData.pickupBuilding}
                    onChange={(e) => handleFieldChange('pickupBuilding', e.target.value)}
                    error={fieldErrors.pickupBuilding}
                    required
                  />
                  <Input
                    label="Street / Area / Landmark"
                    placeholder="e.g. Cyber City, Phase 2"
                    value={formData.pickupStreet}
                    onChange={(e) => handleFieldChange('pickupStreet', e.target.value)}
                    error={fieldErrors.pickupStreet}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <Input
                    label="City / District"
                    placeholder="e.g. Gurugram"
                    value={formData.pickupCity}
                    onChange={(e) => handleFieldChange('pickupCity', e.target.value)}
                    error={fieldErrors.pickupCity}
                    required
                  />
                  <Input
                    label="State"
                    placeholder="e.g. Haryana"
                    value={formData.pickupState}
                    onChange={(e) => handleFieldChange('pickupState', e.target.value)}
                    error={fieldErrors.pickupState}
                    required
                  />
                  <Input
                    label="Pincode"
                    placeholder="e.g. 122001"
                    value={formData.pickupPincode}
                    onChange={(e) => handleFieldChange('pickupPincode', e.target.value.slice(0, 6))}
                    error={fieldErrors.pickupPincode}
                    numericOnly
                    maxLength={6}
                    required
                  />
                </div>
              </div>

              {/* 2. Drop Destination Address Card */}
              <div className="p-5 bg-container-low/60 hairline rounded-xl space-y-4">
                <div className="label-caps text-xs text-primary font-bold flex items-center gap-1.5">
                  <MapPin className="w-4 h-4" />
                  <span>Delivery Destination (Drop)</span>
                </div>

                {/* B2B Recipient Company & GSTIN */}
                {formData.orderType === ORDER_TYPES.B2B && (
                  <div className="p-4 bg-container-lowest hairline rounded-xl space-y-3 border-l-2 border-l-primary">
                    <div className="label-caps text-[10px] text-ink font-bold flex items-center gap-1.5">
                      <Building className="w-3.5 h-3.5 text-primary" />
                      <span>Recipient Business Details (B2B)</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <Input
                        label="Recipient Company Name"
                        placeholder="e.g. Delta Retailers India Ltd"
                        value={formData.dropCompanyName}
                        onChange={(e) => handleFieldChange('dropCompanyName', e.target.value)}
                        error={fieldErrors.dropCompanyName}
                        required
                      />
                      <Input
                        label="Recipient GSTIN"
                        placeholder="08BBBBB0000B1Z5"
                        value={formData.dropGstin}
                        onChange={(e) => handleFieldChange('dropGstin', e.target.value.toUpperCase())}
                        error={fieldErrors.dropGstin}
                        maxLength={15}
                        helperText="15-digit Indian GSTIN"
                        required
                      />
                    </div>
                  </div>
                )}

                {/* Structured Address Fields */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input
                    label="Building / House / Unit / Shop No."
                    placeholder="e.g. Shop 14, Main Market"
                    value={formData.dropBuilding}
                    onChange={(e) => handleFieldChange('dropBuilding', e.target.value)}
                    error={fieldErrors.dropBuilding}
                    required
                  />
                  <Input
                    label="Street / Area / Landmark"
                    placeholder="e.g. Near Clock Tower"
                    value={formData.dropStreet}
                    onChange={(e) => handleFieldChange('dropStreet', e.target.value)}
                    error={fieldErrors.dropStreet}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <Input
                    label="City / District"
                    placeholder="e.g. Alwar City"
                    value={formData.dropCity}
                    onChange={(e) => handleFieldChange('dropCity', e.target.value)}
                    error={fieldErrors.dropCity}
                    required
                  />
                  <Input
                    label="State"
                    placeholder="e.g. Rajasthan"
                    value={formData.dropState}
                    onChange={(e) => handleFieldChange('dropState', e.target.value)}
                    error={fieldErrors.dropState}
                    required
                  />
                  <Input
                    label="Pincode"
                    placeholder="e.g. 301001"
                    value={formData.dropPincode}
                    onChange={(e) => handleFieldChange('dropPincode', e.target.value.slice(0, 6))}
                    error={fieldErrors.dropPincode}
                    numericOnly
                    maxLength={6}
                    required
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Parcel Specs & Payment */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="font-display text-lg font-bold text-ink">Parcel Specifications & Payment</h2>
                <p className="text-xs text-ink-variant">
                  Define parcel dimensions, weight, and collection method.
                </p>
              </div>

              {/* Weight & Dimensions */}
              <div className="p-5 bg-container-low/60 hairline rounded-xl space-y-4">
                <div className="label-caps text-xs text-primary font-bold flex items-center gap-1.5">
                  <Scale className="w-4 h-4" />
                  <span>Weight & Package Dimensions</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <Input
                    label="Actual Weight (kg)"
                    placeholder="1.5"
                    value={formData.actualWeightKg}
                    onChange={(e) => handleFieldChange('actualWeightKg', e.target.value)}
                    error={fieldErrors.actualWeightKg}
                    helperText="Scale weight in kg"
                    required
                  />

                  <Input
                    label="Length (cm)"
                    placeholder="20"
                    value={formData.lengthCm}
                    onChange={(e) => handleFieldChange('lengthCm', e.target.value)}
                    error={fieldErrors.lengthCm}
                    required
                  />

                  <Input
                    label="Breadth (cm)"
                    placeholder="15"
                    value={formData.breadthCm}
                    onChange={(e) => handleFieldChange('breadthCm', e.target.value)}
                    error={fieldErrors.breadthCm}
                    required
                  />

                  <Input
                    label="Height (cm)"
                    placeholder="10"
                    value={formData.heightCm}
                    onChange={(e) => handleFieldChange('heightCm', e.target.value)}
                    error={fieldErrors.heightCm}
                    required
                  />
                </div>

                {/* Live Volumetric Calculation Meter */}
                <div className="p-3.5 bg-container-lowest hairline rounded-xl flex items-center justify-between text-xs">
                  <div>
                    <span className="text-ink-variant">Volumetric Weight:</span>{' '}
                    <strong className="text-ink tabular">{volumetricKg} kg</strong>{' '}
                    <span className="text-[10px] text-ink-variant/60">(L×B×H / 5000)</span>
                  </div>
                  <div>
                    <span className="text-ink-variant">Billable Weight:</span>{' '}
                    <strong className="text-primary tabular text-sm">{billableKg} kg</strong>
                  </div>
                </div>
              </div>

              {/* Payment Mode Chooser */}
              <div className="p-5 bg-container-low/60 hairline rounded-xl space-y-4">
                <div className="label-caps text-xs text-primary font-bold flex items-center gap-1.5">
                  <Banknote className="w-4 h-4" />
                  <span>Payment Method & COD</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Prepaid / Razorpay Option (Disabled & Unselectable) */}
                  <div
                    className="p-4 rounded-xl hairline bg-container-low/50 opacity-75 cursor-not-allowed flex items-start gap-3 select-none relative"
                    title="Prepaid Razorpay integration is coming soon"
                  >
                    <div className="w-4 h-4 rounded-full border border-outline bg-container-high flex items-center justify-center mt-0.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold text-xs text-ink-variant">Prepaid / Non-COD</span>
                        <span className="px-2 py-0.5 rounded bg-container-high text-ink-variant text-[9px] font-bold shrink-0">
                          Razorpay Integration Coming Soon
                        </span>
                      </div>
                      <p className="text-[11px] text-ink-variant/70 mt-1">
                        Amount settled upfront via UPI/Cards (Coming Soon).
                      </p>
                    </div>
                  </div>

                  {/* Cash on Delivery (COD) Option (Active & Selected) */}
                  <div
                    onClick={() => handleFieldChange('isCOD', true)}
                    className="p-4 rounded-xl hairline bg-container-lowest border-primary ring-1 ring-primary shadow-xs cursor-pointer transition-all flex items-start gap-3"
                  >
                    <div className="w-4 h-4 rounded-full border border-primary bg-primary text-on-primary flex items-center justify-center mt-0.5 shrink-0">
                      <div className="w-1.5 h-1.5 rounded-full bg-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <div className="font-semibold text-xs text-ink flex items-center gap-1.5">
                          <span>Cash on Delivery (COD)</span>
                          <span className="px-1.5 py-0.2 rounded bg-accent/20 text-[#735c00] text-[9px] font-bold">
                            Active
                          </span>
                        </div>
                      </div>
                      <div className="text-[11px] text-ink-variant mt-1">
                        Courier collects cash payment from recipient at handover.
                      </div>
                    </div>
                  </div>
                </div>

                {/* Parcel Value Input for COD */}
                {formData.isCOD && (
                  <div className="p-4 bg-container-lowest hairline rounded-xl space-y-2 border-l-2 border-l-accent">
                    <Input
                      label="Parcel Value (₹)"
                      placeholder="e.g. 1500"
                      value={formData.declaredValue}
                      onChange={(e) => handleFieldChange('declaredValue', e.target.value)}
                      error={fieldErrors.declaredValue}
                      helperText="Amount to collect from the recipient upon doorstep delivery"
                      required
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 3: Review Rate Breakdown & Schedule Date */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div>
                <h2 className="font-display text-lg font-bold text-ink">Review & Confirmation</h2>
                <p className="text-xs text-ink-variant">
                  Inspect your calculated freight tariff and pick a scheduled delivery target date.
                </p>
              </div>

              {/* Price Breakdown Preview */}
              {isQuoteLoading ? (
                <div className="p-8 bg-container-low hairline rounded-xl text-center text-xs text-ink-variant">
                  Calculating live shipping rate from rate cards...
                </div>
              ) : quoteResult ? (
                <PriceBreakdown
                  pricing={{
                    ...quoteResult.pricing,
                    actualWeightKg: parseFloat(formData.actualWeightKg),
                  }}
                  orderType={formData.orderType}
                  isCOD={formData.isCOD}
                />
              ) : null}

              {/* Address Summary Preview */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-4 bg-container-low/60 hairline rounded-xl space-y-1">
                  <div className="label-caps text-[9px] text-primary font-bold">Pickup Origin</div>
                  {formData.orderType === ORDER_TYPES.B2B && (
                    <div className="font-bold text-ink">{formData.pickupCompanyName} (GSTIN: {formData.pickupGstin})</div>
                  )}
                  <div className="text-ink font-medium">
                    {composeAddress(formData.pickupBuilding, formData.pickupStreet, formData.pickupCity, formData.pickupState)}
                  </div>
                  <div className="text-ink-variant text-[11px]">Pincode: {formData.pickupPincode}</div>
                </div>

                <div className="p-4 bg-container-low/60 hairline rounded-xl space-y-1">
                  <div className="label-caps text-[9px] text-primary font-bold">Delivery Destination</div>
                  {formData.orderType === ORDER_TYPES.B2B && (
                    <div className="font-bold text-ink">{formData.dropCompanyName} (GSTIN: {formData.dropGstin})</div>
                  )}
                  <div className="text-ink font-medium">
                    {composeAddress(formData.dropBuilding, formData.dropStreet, formData.dropCity, formData.dropState)}
                  </div>
                  <div className="text-ink-variant text-[11px]">Pincode: {formData.dropPincode}</div>
                </div>
              </div>

              {/* Scheduled Delivery Date Picker */}
              <div className="p-5 bg-container-low/60 hairline rounded-xl space-y-3">
                <div className="label-caps text-xs text-ink font-bold flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-primary" />
                  <span>Target Delivery Schedule</span>
                </div>
                <Input
                  type="date"
                  min={tomorrowStr}
                  value={formData.scheduledDeliveryDate}
                  onChange={(e) => handleFieldChange('scheduledDeliveryDate', e.target.value)}
                  error={fieldErrors.scheduledDeliveryDate}
                  helperText="Deliveries must be scheduled for tomorrow or a future date"
                  required
                />
              </div>
            </div>
          )}

          {/* Bottom Step Actions */}
          <div className="pt-6 mt-8 border-t border-hairline flex items-center justify-between gap-3">
            {currentStep > 1 ? (
              <Button
                type="button"
                variant="secondary"
                size="md"
                onClick={handleBack}
                disabled={isSubmitting}
                leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}
              >
                Back
              </Button>
            ) : (
              <div />
            )}

            {currentStep < 3 ? (
              <Button
                type="button"
                variant="primary"
                size="md"
                onClick={handleNext}
                rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
              >
                Next Step
              </Button>
            ) : (
              <Button
                type="button"
                variant="primary"
                size="lg"
                onClick={handleSubmitOrder}
                isLoading={isSubmitting}
                rightIcon={<CheckCircle2 className="w-4 h-4" />}
              >
                Confirm & Book Shipment
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
