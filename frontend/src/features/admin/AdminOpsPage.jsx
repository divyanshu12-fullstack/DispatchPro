import React from 'react';
import { OpsCopilotPanel } from '../support/OpsCopilotPanel.jsx';
import { Sparkles } from 'lucide-react';

export function AdminOpsPage() {
  return (
    <div className="min-h-screen bg-surface py-8 sm:py-10">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 space-y-6">
        <div>
          <div className="label-caps text-xs text-ink-variant flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" /> Ops Intelligence
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-ink">Ops Copilot</h1>
          <p className="text-xs text-ink-variant mt-1">
            Read-only copilot — asks live counts (FAILED/RTO/CREATED) + answers from <span className="font-mono">faq.md</span>.
            Never dispatches or changes price. Grounded with citations.
          </p>
        </div>
        <OpsCopilotPanel />
      </div>
    </div>
  );
}
