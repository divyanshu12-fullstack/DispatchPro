import React, { useState } from 'react';
import { Link } from 'react-router';
import { ordersApi } from '../../api/orders.api.js';
import { QuoteFormFields } from '../../components/domain/QuoteFormFields.jsx';
import { PriceBreakdown } from '../../components/domain/PriceBreakdown.jsx';
import { PaymentChooser } from '../../components/domain/PaymentChooser.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Input } from '../../components/ui/Input.jsx';
import { Textarea } from '../../components/ui/Textarea.jsx';
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
} from 'lucide-react';

function getInitialFormData() {
  const defaultValues = {
    // Step 1: Addresses
    pickupPincode: '110001',
    pickupAddress: '',
    dropPincode: '110018',
    dropAddress: '',

    // Step 2: Parcel Specs
    orderType: ORDER_TYPES.B2C,
    actualWeightKg: '1.5',
    lengthCm: '20',
    breadthCm: '15',
    heightCm: '10',
    isCOD: false,
    declaredValue: '',

    // Step 3: B2B Business Details
    pickupCompanyName: '',
    pickupGstin: '',
    dropCompanyName: '',
    dropGstin: '',

    // Step 4: Schedule & Payment
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

  const handleFieldChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (fieldErrors[field]) {
      setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  // Step 1 Validation: Addresses
  const validateStep1 = () => {
    const errors = {};
    if (!formData.pickupPincode || formData.pickupPincode.length !== 6) {
      errors.pickupPincode = 'Valid 6-digit Delhi NCR origin pincode required';
    }
    if (!formData.pickupAddress.trim() || formData.pickupAddress.trim().length < 5) {
      errors.pickupAddress = 'Full pickup street address is required (min 5 chars)';
    }
    if (!formData.dropPincode || formData.dropPincode.length !== 6) {
      errors.dropPincode = 'Valid 6-digit Delhi NCR destination pincode required';
    }
    if (!formData.dropAddress.trim() || formData.dropAddress.trim().length < 5) {
      errors.dropAddress = 'Full delivery street address is required (min 5 chars)';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return false;
    }
    return true;
  };

  // Step 2 Validation: Parcel Specs
  const validateStep2 = () => {
    const errors = {};
    if (!formData.actualWeightKg || parseFloat(formData.actualWeightKg) <= 0) {
      errors.actualWeightKg = 'Weight must be > 0 kg';
    }
    if (!formData.lengthCm || parseFloat(formData.lengthCm) <= 0) errors.lengthCm = 'Required';
    if (!formData.breadthCm || parseFloat(formData.breadthCm) <= 0) errors.breadthCm = 'Required';
    if (!formData.heightCm || parseFloat(formData.heightCm) <= 0) errors.heightCm = 'Required';
    if (formData.isCOD && (!formData.declaredValue || parseFloat(formData.declaredValue) <= 0)) {
      errors.declaredValue = 'Parcel value required for COD orders';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return false;
    }
    return true;
  };

  // Step 3 Validation: B2B Commercial Details
  const validateStep3 = () => {
    if (formData.orderType !== ORDER_TYPES.B2B) return true;

    const errors = {};
    if (!formData.pickupCompanyName.trim()) {
      errors.pickupCompanyName = 'Pickup company name is required for B2B';
    }
    if (!formData.pickupGstin.trim() || !GSTIN_REGEX.test(formData.pickupGstin.trim())) {
      errors.pickupGstin = 'Valid 15-digit GSTIN is required (e.g. 07AAAAA0000A1Z5)';
    }
    if (!formData.dropCompanyName.trim()) {
      errors.dropCompanyName = 'Recipient company name is required for B2B';
    }
    if (!formData.dropGstin.trim() || !GSTIN_REGEX.test(formData.dropGstin.trim())) {
      errors.dropGstin = 'Valid 15-digit GSTIN is required (e.g. 07BBBBB0000B1Z5)';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return false;
    }
    return true;
  };

  // Fetch live price quote before Step 4 Review
  const fetchReviewQuote = async () => {
    setIsQuoteLoading(true);
    try {
      const payload = {
        orderType: formData.orderType,
        pickupPincode: formData.pickupPincode.trim(),
        dropPincode: formData.dropPincode.trim(),
        actualWeightKg: parseFloat(formData.actualWeightKg),
        lengthCm: parseFloat(formData.lengthCm),
        breadthCm: parseFloat(formData.breadthCm),
        heightCm: parseFloat(formData.heightCm),
        isCOD: Boolean(formData.isCOD),
      };
      if (formData.isCOD && formData.declaredValue) {
        payload.declaredValue = parseFloat(formData.declaredValue);
      }
      if (formData.orderType === ORDER_TYPES.B2B) {
        payload.pickupCompanyName = formData.pickupCompanyName.trim();
        payload.pickupGstin = formData.pickupGstin.trim().toUpperCase();
        payload.dropCompanyName = formData.dropCompanyName.trim();
        payload.dropGstin = formData.dropGstin.trim().toUpperCase();
      }

      const res = await ordersApi.getQuote(payload);
      setQuoteResult(res);
    } catch (err) {
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
      if (formData.orderType === ORDER_TYPES.B2B) {
        setCurrentStep(3);
      } else {
        await fetchReviewQuote();
        setCurrentStep(4);
      }
    } else if (currentStep === 3) {
      if (!validateStep3()) return;
      await fetchReviewQuote();
      setCurrentStep(4);
    }
  };

  const handleBack = () => {
    setFieldErrors({});
    if (currentStep === 4 && formData.orderType !== ORDER_TYPES.B2B) {
      setCurrentStep(2);
    } else if (currentStep > 1) {
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
      const payload = {
        orderType: formData.orderType,
        pickupPincode: formData.pickupPincode.trim(),
        pickupAddress: formData.pickupAddress.trim(),
        dropPincode: formData.dropPincode.trim(),
        dropAddress: formData.dropAddress.trim(),
        actualWeightKg: parseFloat(formData.actualWeightKg),
        lengthCm: parseFloat(formData.lengthCm),
        breadthCm: parseFloat(formData.breadthCm),
        heightCm: parseFloat(formData.heightCm),
        isCOD: Boolean(formData.isCOD),
        scheduledDeliveryDate: new Date(formData.scheduledDeliveryDate).toISOString(),
      };

      if (formData.isCOD && formData.declaredValue) {
        payload.declaredValue = parseFloat(formData.declaredValue);
      }

      if (formData.orderType === ORDER_TYPES.B2B) {
        payload.pickupCompanyName = formData.pickupCompanyName.trim();
        payload.pickupGstin = formData.pickupGstin.trim().toUpperCase();
        payload.dropCompanyName = formData.dropCompanyName.trim();
        payload.dropGstin = formData.dropGstin.trim().toUpperCase();
      }

      const order = await ordersApi.createOrder(payload);
      setCreatedOrder(order);
      toast.success(`Order ${order.orderNumber} placed successfully!`);
    } catch (err) {
      if (err.details && Object.keys(err.details).length > 0) {
        setFieldErrors(err.details);
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
          <div className="bg-container-lowest hairline rounded-xl p-8 sm:p-12 shadow-card text-center space-y-6">
            <div className="w-14 h-14 rounded-full bg-accent/20 text-accent flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8 text-primary" />
            </div>

            <div>
              <div className="label-caps text-xs text-ink-variant mb-1">Booking Confirmed</div>
              <h1 className="font-display text-2xl sm:text-3xl font-bold text-ink">
                Shipment Booked Successfully!
              </h1>
              <p className="text-sm text-ink-variant mt-2 leading-relaxed">
                Your shipment has been registered and scheduled for dispatch. A confirmation email and tracking link have been dispatched.
              </p>
            </div>

            {/* Tracking Number Card */}
            <div className="p-6 bg-container-low hairline rounded-lg flex flex-col items-center justify-center space-y-2">
              <div className="label-caps text-[10px] text-ink-variant">Waybill Tracking Number</div>
              <div className="flex items-center gap-3">
                <span className="font-display text-2xl sm:text-3xl font-bold text-ink tabular tracking-tight">
                  {createdOrder.orderNumber}
                </span>
                <button
                  type="button"
                  onClick={handleCopyOrderNumber}
                  className="p-1.5 rounded hairline bg-container-lowest hover:bg-container text-ink-variant hover:text-ink cursor-pointer transition-colors"
                  title="Copy tracking number"
                >
                  {copied ? <Check className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Summary Details */}
            <div className="grid grid-cols-2 gap-4 text-left p-4 bg-container-lowest hairline rounded-lg text-xs">
              <div>
                <span className="label-caps text-[10px] text-ink-variant">Delivery Target</span>
                <div className="font-semibold text-ink mt-0.5">
                  {formatDate(createdOrder.scheduledDeliveryDate)}
                </div>
              </div>
              <div>
                <span className="label-caps text-[10px] text-ink-variant">Total Amount</span>
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

  // Stepper Definition
  const steps = [
    { num: 1, label: 'Addresses', icon: <MapPin className="w-3.5 h-3.5" /> },
    { num: 2, label: 'Parcel Specs', icon: <Box className="w-3.5 h-3.5" /> },
    ...(formData.orderType === ORDER_TYPES.B2B
      ? [{ num: 3, label: 'Business Details', icon: <Building className="w-3.5 h-3.5" /> }]
      : []),
    { num: 4, label: 'Review & Pay', icon: <CreditCard className="w-3.5 h-3.5" /> },
  ];

  return (
    <div className="min-h-screen bg-surface py-8 sm:py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        {/* Top Header */}
        <div className="mb-8">
          <Link
            to="/app"
            className="inline-flex items-center gap-1 text-xs text-ink-variant hover:text-ink transition-colors mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Dashboard</span>
          </Link>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-ink">
            Book a Shipment
          </h1>
          <p className="text-sm text-ink-variant">
            Complete the 4-step wizard to dispatch parcels across Delhi NCR.
          </p>
        </div>

        {/* Wizard Stepper Progress Bar */}
        <div className="bg-container-lowest hairline rounded-lg p-4 mb-8 shadow-card overflow-x-auto">
          <div className="flex items-center justify-between min-w-[320px]">
            {steps.map((s, idx) => {
              const isActive = currentStep === s.num;
              const isPast = currentStep > s.num;

              return (
                <React.Fragment key={s.num}>
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                        isActive
                          ? 'bg-primary text-on-primary ring-4 ring-container-low'
                          : isPast
                          ? 'bg-primary text-on-primary'
                          : 'bg-container-high text-ink-variant/60'
                      }`}
                    >
                      {isPast ? <Check className="w-3.5 h-3.5 stroke-[2.5]" /> : s.num}
                    </div>
                    <span
                      className={`text-xs font-medium ${
                        isActive ? 'text-ink font-bold' : isPast ? 'text-ink' : 'text-ink-variant/60'
                      }`}
                    >
                      {s.label}
                    </span>
                  </div>

                  {idx < steps.length - 1 && (
                    <div
                      className={`flex-1 h-[2px] mx-3 ${
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
        <div className="bg-container-lowest hairline rounded-xl p-6 sm:p-8 shadow-card">
          {/* STEP 1: Addresses */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="font-display text-lg font-bold text-ink">Origin & Destination</h2>
                <p className="text-xs text-ink-variant">
                  Enter complete pickup and doorstep delivery addresses in Delhi NCR.
                </p>
              </div>

              <div className="space-y-6">
                {/* Pickup Block */}
                <div className="p-4 bg-container-low hairline rounded-lg space-y-4">
                  <div className="label-caps text-xs text-primary font-bold flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5" />
                    <span>Pickup Location</span>
                  </div>

                  <Input
                    label="Pickup Pincode"
                    placeholder="e.g. 110001"
                    value={formData.pickupPincode}
                    onChange={(e) => handleFieldChange('pickupPincode', e.target.value.slice(0, 6))}
                    error={fieldErrors.pickupPincode}
                    numericOnly
                    maxLength={6}
                    helperText="Delhi NCR origin pincode"
                    required
                  />

                  <Textarea
                    label="Pickup Full Address"
                    placeholder="Flat / Building no., Street, Landmark, Area..."
                    rows={2}
                    value={formData.pickupAddress}
                    onChange={(e) => handleFieldChange('pickupAddress', e.target.value)}
                    error={fieldErrors.pickupAddress}
                    required
                  />
                </div>

                {/* Drop Block */}
                <div className="p-4 bg-container-low hairline rounded-lg space-y-4">
                  <div className="label-caps text-xs text-primary font-bold flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5" />
                    <span>Delivery Destination</span>
                  </div>

                  <Input
                    label="Drop Pincode"
                    placeholder="e.g. 110018"
                    value={formData.dropPincode}
                    onChange={(e) => handleFieldChange('dropPincode', e.target.value.slice(0, 6))}
                    error={fieldErrors.dropPincode}
                    numericOnly
                    maxLength={6}
                    helperText="Delhi NCR destination pincode"
                    required
                  />

                  <Textarea
                    label="Drop Full Address"
                    placeholder="House / Unit no., Street, Landmark, Area..."
                    rows={2}
                    value={formData.dropAddress}
                    onChange={(e) => handleFieldChange('dropAddress', e.target.value)}
                    error={fieldErrors.dropAddress}
                    required
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Parcel Dimensions */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="font-display text-lg font-bold text-ink">Parcel Specifications</h2>
                <p className="text-xs text-ink-variant">
                  Define weight, package size, and payment preferences.
                </p>
              </div>

              <QuoteFormFields
                values={formData}
                onChange={handleFieldChange}
                errors={fieldErrors}
                includeB2BFields={false}
              />
            </div>
          )}

          {/* STEP 3: B2B Commercial Invoicing (Conditional) */}
          {currentStep === 3 && formData.orderType === ORDER_TYPES.B2B && (
            <div className="space-y-6">
              <div>
                <h2 className="font-display text-lg font-bold text-ink">Commercial Invoicing</h2>
                <p className="text-xs text-ink-variant">
                  Enter GSTIN details for tax-compliant commercial delivery.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Pickup Company Name"
                  placeholder="Sender Corp Ltd."
                  value={formData.pickupCompanyName}
                  onChange={(e) => handleFieldChange('pickupCompanyName', e.target.value)}
                  error={fieldErrors.pickupCompanyName}
                  required
                />

                <Input
                  label="Pickup GSTIN"
                  placeholder="07AAAAA0000A1Z5"
                  value={formData.pickupGstin}
                  onChange={(e) => handleFieldChange('pickupGstin', e.target.value.toUpperCase())}
                  error={fieldErrors.pickupGstin}
                  helperText="15-digit GSTIN"
                  maxLength={15}
                  required
                />

                <Input
                  label="Drop Company Name"
                  placeholder="Recipient Pvt Ltd."
                  value={formData.dropCompanyName}
                  onChange={(e) => handleFieldChange('dropCompanyName', e.target.value)}
                  error={fieldErrors.dropCompanyName}
                  required
                />

                <Input
                  label="Drop GSTIN"
                  placeholder="07BBBBB0000B1Z5"
                  value={formData.dropGstin}
                  onChange={(e) => handleFieldChange('dropGstin', e.target.value.toUpperCase())}
                  error={fieldErrors.dropGstin}
                  helperText="15-digit GSTIN"
                  maxLength={15}
                  required
                />
              </div>
            </div>
          )}

          {/* STEP 4: Review, Schedule Date & Payment */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <div>
                <h2 className="font-display text-lg font-bold text-ink">Review & Confirmation</h2>
                <p className="text-xs text-ink-variant">
                  Inspect your calculated freight rate and select a delivery schedule.
                </p>
              </div>

              {/* Price Breakdown Preview */}
              {isQuoteLoading ? (
                <div className="p-8 bg-container-low hairline rounded-lg text-center text-xs text-ink-variant">
                  Calculating live shipping rate...
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

              {/* Scheduled Delivery Date Picker */}
              <div className="p-5 bg-container-low hairline rounded-lg space-y-3">
                <div className="label-caps text-xs text-ink font-bold flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-primary" />
                  <span>Target Delivery Date</span>
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

              {/* Payment Mode Chooser */}
              <PaymentChooser
                isCOD={formData.isCOD}
                onChange={(cod) => handleFieldChange('isCOD', cod)}
                totalAmount={quoteResult?.pricing?.totalAmount || 0}
              />
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

            {currentStep < 4 ? (
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
