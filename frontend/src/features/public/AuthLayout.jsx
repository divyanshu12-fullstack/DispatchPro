import React from 'react';
import { Link } from 'react-router';
import { Truck, Activity, ShieldCheck } from 'lucide-react';

/**
 * Split-screen Auth Layout inspired by DispatchPro design language.
 *
 * Left Panel: Brand identity, value proposition, and trust metrics.
 * Right Panel: Tabbed authentication and onboarding forms.
 */
export function AuthLayout({ children }) {
  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 sm:p-6 md:p-10 bg-surface">
      <div className="max-w-5xl w-full grid grid-cols-1 lg:grid-cols-12 bg-container-lowest hairline rounded-xl shadow-card overflow-hidden">
        {/* Left Brand Panel */}
        <div className="lg:col-span-5 bg-container-low p-8 sm:p-10 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-hairline">
          <div>
            {/* Logo */}
            <Link to="/" className="inline-flex items-center gap-2.5 mb-2 group">
              <div className="w-8 h-8 rounded bg-primary text-on-primary flex items-center justify-center transition-transform group-hover:scale-105">
                <Truck className="w-4 h-4 stroke-[2]" />
              </div>
              <span className="font-display font-bold text-xl tracking-tight text-ink">
                Dispatch<span className="text-accent">Pro</span>
              </span>
            </Link>
            <div className="label-caps text-[10px] text-ink-variant/70 tracking-widest mb-10">
              SHIPPING, DONE RIGHT.
            </div>

            {/* Value Proposition */}
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-ink mb-4 leading-snug">
              Precision Logistics Management
            </h2>
            <p className="text-sm text-ink-variant leading-relaxed mb-8">
              Streamline your fleet operations, monitor shipments in real-time, and leverage advanced analytics to optimize your supply chain. Access your dashboard to stay ahead.
            </p>
          </div>

          {/* Metric Badges */}
          <div className="grid grid-cols-2 gap-3 pt-6 border-t border-hairline">
            <div className="bg-container-lowest hairline rounded-lg p-4">
              <div className="w-7 h-7 rounded bg-container-low flex items-center justify-center text-primary mb-2">
                <Activity className="w-4 h-4" />
              </div>
              <div className="font-display text-xl font-bold text-ink tabular">99.9%</div>
              <div className="label-caps text-[10px] text-ink-variant/80 mt-0.5">Uptime</div>
            </div>

            <div className="bg-container-lowest hairline rounded-lg p-4">
              <div className="w-7 h-7 rounded bg-container-low flex items-center justify-center text-primary mb-2">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div className="font-display text-xl font-bold text-ink">Secure</div>
              <div className="label-caps text-[10px] text-ink-variant/80 mt-0.5">End-to-End</div>
            </div>
          </div>
        </div>

        {/* Right Form Panel */}
        <div className="lg:col-span-7 p-8 sm:p-12 flex flex-col justify-center bg-container-lowest">
          <div className="max-w-md w-full mx-auto">{children}</div>
        </div>
      </div>
    </div>
  );
}
