import React from 'react';
import { Link } from 'react-router';
import { Button } from '../../components/ui/Button.jsx';
import { useAuth } from '../../auth/AuthContext.jsx';
import { ROLE_HOME_MAP } from '../../lib/constants.js';
import {
  Calculator,
  ShieldCheck,
  BellRing,
  Building2,
  ArrowRight,
  TrendingUp,
  MapPin,
} from 'lucide-react';

export function LandingPage() {
  const { isAuthenticated, user } = useAuth();
  const dashboardLink = user ? ROLE_HOME_MAP[user.role] || '/app' : '/register';

  return (
    <div className="flex flex-col min-h-screen bg-surface">
      {/* Hero Section */}
      <section className="relative pt-16 pb-20 sm:pt-20 sm:pb-24 border-b border-hairline bg-surface">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            {/* Headline */}
            <h1 className="font-display text-4xl sm:text-6xl font-bold text-ink tracking-tight leading-[1.15] mb-6">
              Fast, Reliable Delivery <br />
              <span className="text-ink-variant">Across Delhi NCR.</span>
            </h1>

            {/* Subtitle */}
            <p className="text-base sm:text-lg text-ink-variant max-w-2xl leading-relaxed mb-8">
              Send parcels and manage business shipments with complete peace of mind. Get instant transparent rates, real-time tracking, and secure OTP verification at your doorstep.
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap items-center gap-3">
              <Link to="/quote">
                <Button variant="primary" size="lg" leftIcon={<Calculator className="w-4 h-4" />}>
                  Calculate Shipping Rate
                </Button>
              </Link>

              <Link to={isAuthenticated ? dashboardLink : '/login'}>
                <Button
                  variant="secondary"
                  size="lg"
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                >
                  {isAuthenticated ? 'Go to Dashboard' : 'Sign In / Register'}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Highlights Strip */}
      <section className="bg-container-lowest border-b border-hairline py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded bg-container-low flex items-center justify-center text-primary shrink-0">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <div className="font-display text-xl font-bold text-ink tabular">720+ Pincodes</div>
                <div className="text-xs text-ink-variant">Delhi, Noida, Gurgaon & NCR</div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded bg-container-low flex items-center justify-center text-primary shrink-0">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <div className="font-display text-xl font-bold text-ink">Best Rates</div>
                <div className="text-xs text-ink-variant">Transparent weight pricing</div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded bg-container-low flex items-center justify-center text-primary shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <div className="font-display text-xl font-bold text-ink">OTP Handover</div>
                <div className="text-xs text-ink-variant">100% verified deliveries</div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded bg-container-low flex items-center justify-center text-primary shrink-0">
                <BellRing className="w-5 h-5" />
              </div>
              <div>
                <div className="font-display text-xl font-bold text-ink">Live Updates</div>
                <div className="text-xs text-ink-variant">Status at every milestone</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Customer Benefits Section */}
      <section className="py-16 sm:py-20 bg-surface">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-xl mx-auto mb-12">
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-ink mb-3">
              Why Ship with DispatchPro?
            </h2>
            <p className="text-sm text-ink-variant leading-relaxed">
              Designed for businesses and individuals who value speed, accuracy, and zero hassle.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Benefit 1 */}
            <div className="bg-container-lowest hairline rounded-lg p-6 sm:p-8 shadow-card flex items-start gap-4">
              <div className="w-10 h-10 rounded bg-container-low flex items-center justify-center text-primary shrink-0 mt-1">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-display text-lg font-bold text-ink mb-2">
                  Best Pricing Across NCR
                </h3>
                <p className="text-sm text-ink-variant leading-relaxed">
                  Clear and upfront pricing calculated directly from your parcel dimensions and weight. No hidden surcharges, no unexpected extra fees.
                </p>
              </div>
            </div>

            {/* Benefit 2 */}
            <div className="bg-container-lowest hairline rounded-lg p-6 sm:p-8 shadow-card flex items-start gap-4">
              <div className="w-10 h-10 rounded bg-container-low flex items-center justify-center text-primary shrink-0 mt-1">
                <ShieldCheck className="w-5 h-5 text-accent" />
              </div>
              <div>
                <h3 className="font-display text-lg font-bold text-ink mb-2">
                  Doorstep Delivery Security with OTP
                </h3>
                <p className="text-sm text-ink-variant leading-relaxed">
                  Every package requires a unique 6-digit confirmation code sent to you before handover, guaranteeing your parcel is delivered only into the right hands.
                </p>
              </div>
            </div>

            {/* Benefit 3 */}
            <div className="bg-container-lowest hairline rounded-lg p-6 sm:p-8 shadow-card flex items-start gap-4">
              <div className="w-10 h-10 rounded bg-container-low flex items-center justify-center text-primary shrink-0 mt-1">
                <BellRing className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-display text-lg font-bold text-ink mb-2">
                  Notification with Each Update
                </h3>
                <p className="text-sm text-ink-variant leading-relaxed">
                  Stay informed at every stage of the journey. Receive clear email updates and view step-by-step progress from pickup to delivery.
                </p>
              </div>
            </div>

            {/* Benefit 4 */}
            <div className="bg-container-lowest hairline rounded-lg p-6 sm:p-8 shadow-card flex items-start gap-4">
              <div className="w-10 h-10 rounded bg-container-low flex items-center justify-center text-primary shrink-0 mt-1">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-display text-lg font-bold text-ink mb-2">
                  B2B Value & Business Discounts
                </h3>
                <p className="text-sm text-ink-variant leading-relaxed">
                  Get dedicated rates for high-volume commercial shipping, GST-compliant invoicing, and flexible Cash on Delivery (COD) management.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Instant Quote Teaser Card */}
      <section className="pb-20 bg-surface">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-container-lowest hairline rounded-xl p-8 sm:p-10 shadow-card flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h3 className="font-display text-2xl font-bold text-ink mb-2">
                Need an Instant Shipping Estimate?
              </h3>
              <p className="text-sm text-ink-variant max-w-xl">
                Check exact delivery rates between any Delhi NCR pincodes in seconds without needing to create an account first.
              </p>
            </div>
            <Link to="/quote" className="shrink-0">
              <Button variant="primary" size="lg" leftIcon={<Calculator className="w-4 h-4" />}>
                Check Rates Now
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Clean Minimal Footer */}
      <footer className="bg-container-lowest border-t border-hairline py-8 mt-auto">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-display font-bold text-sm text-ink">
              Dispatch<span className="text-accent">Pro</span>
            </span>
            <span className="text-xs text-ink-variant/60 ml-2">
              © {new Date().getFullYear()} DispatchPro. Shipping done right.
            </span>
          </div>

          <div className="flex items-center gap-6 text-xs text-ink-variant">
            <Link to="/quote" className="hover:text-ink transition-colors">
              Rate Calculator
            </Link>
            <Link to="/login" className="hover:text-ink transition-colors">
              Sign In
            </Link>
            <Link to="/register" className="hover:text-ink transition-colors">
              Register
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
