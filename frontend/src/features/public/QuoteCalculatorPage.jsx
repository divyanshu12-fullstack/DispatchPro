import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { QuoteFormFields } from '../../components/domain/QuoteFormFields.jsx';
import { PriceBreakdown } from '../../components/domain/PriceBreakdown.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { useToast } from '../../components/ui/Toast.jsx';
import { useAuth } from '../../auth/AuthContext.jsx';
import { ordersApi } from '../../api/orders.api.js';
import { ORDER_TYPES } from '../../lib/constants.js';
import { getErrorMessage } from '../../lib/errors.js';
import { formatCurrency } from '../../lib/format.js';
import { Calculator, ArrowRight, Truck, Info, RefreshCw } from 'lucide-react';

export function QuoteCalculatorPage() {
  const [values, setValues] = useState({
    orderType: ORDER_TYPES.B2C,
    pickupPincode: '110001',
    dropPincode: '110018',
    actualWeightKg: '1.5',
    lengthCm: '20',
    breadthCm: '15',
    heightCm: '10',
    isCOD: false,
    declaredValue: '',
  });

  const [fieldErrors, setFieldErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [quoteResult, setQuoteResult] = useState(null);

  const { isAuthenticated } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const handleFieldChange = (field, value) => {
    setValues((prev) => ({ ...prev, [field]: value }));
    if (fieldErrors[field]) {
      setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleCalculate = async (e) => {
    e?.preventDefault();
    setFieldErrors({});

    const errors = {};
    if (!values.pickupPincode || values.pickupPincode.length !== 6) {
      errors.pickupPincode = 'Valid 6-digit Delhi NCR pincode required';
    }
    if (!values.dropPincode || values.dropPincode.length !== 6) {
      errors.dropPincode = 'Valid 6-digit Delhi NCR pincode required';
    }
    if (!values.actualWeightKg || parseFloat(values.actualWeightKg) <= 0) {
      errors.actualWeightKg = 'Weight must be > 0 kg';
    }
    if (!values.lengthCm || parseFloat(values.lengthCm) <= 0) errors.lengthCm = 'Required';
    if (!values.breadthCm || parseFloat(values.breadthCm) <= 0) errors.breadthCm = 'Required';
    if (!values.heightCm || parseFloat(values.heightCm) <= 0) errors.heightCm = 'Required';
    if (values.isCOD && (!values.declaredValue || parseFloat(values.declaredValue) <= 0)) {
      errors.declaredValue = 'Parcel value required for COD';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setIsLoading(true);
    try {
      const payload = {
        orderType: values.orderType,
        pickupPincode: values.pickupPincode.trim(),
        dropPincode: values.dropPincode.trim(),
        actualWeightKg: parseFloat(values.actualWeightKg),
        lengthCm: parseFloat(values.lengthCm),
        breadthCm: parseFloat(values.breadthCm),
        heightCm: parseFloat(values.heightCm),
        isCOD: Boolean(values.isCOD),
      };
      if (values.isCOD && values.declaredValue) {
        payload.declaredValue = parseFloat(values.declaredValue);
      }

      const res = await ordersApi.getQuote(payload);
      setQuoteResult(res);
      toast.success('Rate quote calculated successfully!');
    } catch (err) {
      if (err.details && Object.keys(err.details).length > 0) {
        setFieldErrors(err.details);
      } else {
        toast.error(getErrorMessage(err, 'Failed to calculate rate quote.'));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleShipWithRate = () => {
    // Store quote values in sessionStorage so Customer wizard pre-fills seamlessly
    sessionStorage.setItem(
      'dispatchpro_prefill_quote',
      JSON.stringify({
        ...values,
        quoteResult,
      })
    );

    if (isAuthenticated) {
      navigate('/app/new');
    } else {
      navigate('/register');
    }
  };

  return (
    <div className="min-h-screen bg-surface py-10 sm:py-14">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="max-w-2xl mb-8">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded bg-primary text-on-primary flex items-center justify-center">
              <Calculator className="w-4 h-4" />
            </div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-ink">
              Shipping Rate Calculator
            </h1>
          </div>
          <p className="text-sm text-ink-variant leading-relaxed">
            Get an instant, transparent price quote between any Delhi NCR pincodes. No hidden surcharges.
          </p>
        </div>

        {/* Two-Column Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Form Column */}
          <div className="lg:col-span-7 bg-container-lowest hairline rounded-xl p-6 sm:p-8 shadow-card">
            <form onSubmit={handleCalculate} className="space-y-6">
              <QuoteFormFields
                values={values}
                onChange={handleFieldChange}
                errors={fieldErrors}
                includeB2BFields={false}
                disabled={isLoading}
              />

              <div className="pt-4 border-t border-hairline flex items-center justify-between gap-3">
                <Button
                  type="button"
                  variant="secondary"
                  size="md"
                  leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
                  onClick={() => {
                    setValues({
                      orderType: ORDER_TYPES.B2C,
                      pickupPincode: '',
                      dropPincode: '',
                      actualWeightKg: '',
                      lengthCm: '',
                      breadthCm: '',
                      heightCm: '',
                      isCOD: false,
                      declaredValue: '',
                    });
                    setQuoteResult(null);
                    setFieldErrors({});
                  }}
                >
                  Reset
                </Button>

                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  isLoading={isLoading}
                  leftIcon={<Calculator className="w-4 h-4" />}
                >
                  Calculate Rate
                </Button>
              </div>
            </form>
          </div>

          {/* Right Result Column */}
          <div className="lg:col-span-5 space-y-6">
            {quoteResult ? (
              <div className="space-y-4">
                <PriceBreakdown
                  pricing={{
                    ...quoteResult.pricing,
                    actualWeightKg: parseFloat(values.actualWeightKg),
                  }}
                  orderType={values.orderType}
                  isCOD={values.isCOD}
                />

                {isAuthenticated ? (
                  <Button
                    variant="primary"
                    size="lg"
                    className="w-full"
                    rightIcon={<ArrowRight className="w-4 h-4" />}
                    onClick={handleShipWithRate}
                  >
                    Proceed to Book Shipment
                  </Button>
                ) : (
                  <div className="space-y-3">
                    <Button
                      variant="primary"
                      size="lg"
                      className="w-full"
                      rightIcon={<ArrowRight className="w-4 h-4" />}
                      onClick={handleShipWithRate}
                    >
                      Get Order Shipped
                    </Button>

                    <div className="p-3.5 bg-container-low hairline rounded-lg text-xs space-y-2">
                      <p className="text-ink-variant leading-relaxed">
                        Ready to ship? Create a free account in 30 seconds. Your calculated rate of <strong className="text-ink font-semibold">{quoteResult ? formatCurrency(quoteResult.pricing.totalAmount) : ''}</strong> will be saved and pre-filled automatically.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-container-lowest hairline rounded-xl p-8 shadow-card text-center flex flex-col items-center justify-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-container-low flex items-center justify-center text-ink-variant">
                  <Truck className="w-6 h-6 stroke-[1.5]" />
                </div>
                <h3 className="font-display text-lg font-bold text-ink">
                  Instant Rate Estimate
                </h3>
                <p className="text-xs text-ink-variant leading-relaxed max-w-xs">
                  Fill in your pickup & drop pincodes and parcel dimensions on the left to see full price breakdown and zone tariffs.
                </p>

                <div className="pt-4 border-t border-hairline w-full text-left space-y-2">
                  <div className="flex items-start gap-2 text-xs text-ink-variant">
                    <Info className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                    <span>Intra-zone rates apply when pickup & drop share the same delivery cluster.</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
