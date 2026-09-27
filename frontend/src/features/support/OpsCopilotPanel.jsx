import React, { useState, useRef, useEffect } from 'react';
import { aiApi } from '../../api/ai.api.js';
import { Button } from '../../components/ui/Button.jsx';
import { getErrorMessage } from '../../lib/errors.js';
import { Bot, Send, AlertCircle, Quote, MapPin, Activity, Trash2, Copy, Check, Users } from 'lucide-react';

const QUICK_PROMPTS = [
  'Calculate the success rate',
  'How many orders are stuck right now?',
  'Which couriers are overloaded?',
  'What is RTO and when does it happen?',
];

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1400);
      }}
      className="inline-flex items-center gap-1 text-[11px] font-medium text-ink-variant hover:text-ink transition-colors cursor-pointer"
      title="Copy"
    >
      {copied ? <Check className="w-3 h-3 text-success" /> : <Copy className="w-3 h-3" />}
      {copied ? 'Copied' : 'Copy'}
    </button>
  );
}

export function OpsCopilotPanel() {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content:
        'Ops Copilot is here — read-only. Ask "what is stuck in Gurugram?" or "who is overloaded?" and I will answer from live counts + FAQ. I never change prices, assign couriers, or reveal OTPs.',
      sources: [],
      live: null,
    },
  ]);
  const [input, setInput] = useState('');
  const [zone, setZone] = useState('');
  const [isSending, setIsSending] = useState(false);
  const listRef = useRef(null);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, isSending]);

  const send = async (overrideQuery) => {
    const q = (overrideQuery ?? input).trim();
    if (!q || isSending) return;
    setInput('');
    setMessages((m) => [...m, { role: 'user', content: q }]);
    setIsSending(true);
    try {
      const data = await aiApi.ops({ query: q, zone: zone.trim() || undefined });
      setMessages((m) => [
        ...m,
        {
          role: 'assistant',
          content: data.answer,
          sources: data.sources || [],
          live: data.live || null,
          model: data.model,
        },
      ]);
    } catch (err) {
      setMessages((m) => [
        ...m,
        {
          role: 'assistant',
          content: getErrorMessage(err, 'Ops Copilot is temporarily unavailable. Check /admin/dispatch or /admin/agents directly.'),
          sources: [],
          live: null,
          isError: true,
        },
      ]);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="bg-container-lowest hairline rounded-xl shadow-card overflow-hidden flex flex-col">
      {/* Header */}
      <div className="px-4 sm:px-5 py-3.5 border-b border-hairline flex items-center justify-between gap-3 bg-surface/60">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-primary text-on-primary flex items-center justify-center">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-bold text-ink flex items-center gap-1.5">
              Ops Copilot <span className="px-1.5 py-0.5 rounded bg-container-low text-[10px] font-bold text-ink-variant">ADMIN · read-only</span>
            </div>
            <div className="text-[11px] text-ink-variant">faq.md grounded · live counts · never dispatches</div>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setMessages((m) => m.slice(0, 1))}
          className="inline-flex items-center gap-1 text-[11px] text-ink-variant hover:text-ink cursor-pointer"
          title="Clear"
        >
          <Trash2 className="w-3.5 h-3.5" /> Clear
        </button>
      </div>

      {/* Zone filter */}
      <div className="px-4 sm:px-5 py-2.5 border-b border-hairline flex items-center gap-2 bg-container-lowest">
        <MapPin className="w-3.5 h-3.5 text-ink-variant shrink-0" />
        <input
          value={zone}
          onChange={(e) => setZone(e.target.value)}
          placeholder="Filter by pincode/zone hint (optional, e.g. 122001)"
          className="flex-1 min-w-0 bg-transparent text-xs text-ink placeholder:text-ink-variant/50 focus:outline-none"
        />
        {zone && (
          <button type="button" onClick={() => setZone('')} className="text-[11px] text-ink-variant hover:text-ink cursor-pointer">
            Clear
          </button>
        )}
      </div>

      {/* Quick prompts */}
      <div className="px-4 sm:px-5 py-2.5 flex flex-wrap gap-1.5 border-b border-hairline bg-surface/40">
        {QUICK_PROMPTS.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => send(p)}
            disabled={isSending}
            className="px-2.5 py-1 rounded-full bg-container-low hairline text-[11px] font-medium text-ink-variant hover:text-ink hover:bg-container-lowest disabled:opacity-50 cursor-pointer transition-colors"
          >
            {p}
          </button>
        ))}
      </div>

      {/* Messages */}
      <div ref={listRef} className="flex-1 min-h-[280px] max-h-[420px] overflow-y-auto px-4 sm:px-5 py-4 space-y-4 bg-surface/30">
        {messages.map((m, idx) => (
          <div key={idx} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[92%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed shadow-xs ${
                m.role === 'user'
                  ? 'bg-primary text-on-primary rounded-br-sm'
                  : m.isError
                    ? 'bg-danger-soft hairline text-danger rounded-bl-sm'
                    : 'bg-container-lowest hairline text-ink rounded-bl-sm'
              }`}
            >
              <div className="whitespace-pre-wrap break-words">{m.content}</div>

              {/* Live snapshot strip (ops only) */}
              {m.live && (
                <div className="mt-2.5 flex flex-wrap gap-1.5">
                  {m.live.successRate !== null && m.live.successRate !== undefined && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-success-soft text-success text-[11px] font-bold">
                      <Activity className="w-3 h-3" /> {m.live.successRate}% success
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-container-low hairline text-[11px] font-semibold text-ink">
                    FAILED {m.live.stuckCount}
                  </span>
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-container-low hairline text-[11px] font-semibold text-ink">
                    RTO {m.live.rtoCount}
                  </span>
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-container-low hairline text-[11px] font-semibold text-ink">
                    CREATED {m.live.createdCount}
                  </span>
                  {m.live.fleet && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-container-low hairline text-[11px] font-semibold text-ink">
                      <Users className="w-3 h-3" /> {m.live.fleet.availableAgents}/{m.live.fleet.totalAgents} couriers
                    </span>
                  )}
                  {m.live.needsManualAttention > 0 && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-danger-soft text-danger text-[11px] font-bold">
                      <AlertCircle className="w-3 h-3" /> needs attention {m.live.needsManualAttention}
                    </span>
                  )}
                </div>
              )}

              {/* Courier load (top agents) */}
              {m.live?.courierLoad?.length > 0 && (
                <div className="mt-2 space-y-1">
                  {m.live.courierLoad.slice(0, 3).map((a) => (
                    <div key={a.name} className="flex items-center justify-between text-[11px] text-ink-variant">
                      <span className="truncate max-w-[180px] font-medium text-ink">{a.name}{a.isAvailable ? '' : ' (off-duty)'}</span>
                      <span className="tabular">{a.active}{a.capacity ? `/${a.capacity}` : ''} active</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Citations */}
              {m.sources?.length > 0 && (
                <div className="mt-2 pt-2 border-t border-hairline/60 flex flex-wrap gap-1.5">
                  {m.sources.map((s) => (
                    <span
                      key={s.sourceId}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-surface hairline text-[10px] font-medium text-ink-variant"
                      title={`${s.title} · ${s.score.toFixed(2)}`}
                    >
                      <Quote className="w-3 h-3" />
                      {s.title.slice(0, 44)}
                    </span>
                  ))}
                </div>
              )}

              <div className="mt-1.5 flex items-center justify-between gap-2">
                <span className={`text-[10px] ${m.role === 'user' ? 'text-on-primary/70' : 'text-ink-variant/60'}`}>
                  {m.model ? `· ${m.model}` : ''}
                </span>
                {m.role === 'assistant' && !m.isError && <CopyButton text={m.content} />}
              </div>
            </div>
          </div>
        ))}
        {isSending && (
          <div className="flex justify-start">
            <div className="bg-container-lowest hairline rounded-2xl rounded-bl-sm px-3.5 py-2.5 text-xs text-ink-variant inline-flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              Thinking with live counts + FAQ...
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
        className="p-3 border-t border-hairline bg-container-lowest flex items-end gap-2"
      >
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
          rows={1}
          placeholder="Ask ops... e.g. stuck in 122001?"
          className="flex-1 min-h-[38px] max-h-[88px] resize-none bg-container-low hairline rounded-xl px-3.5 py-2.5 text-xs text-ink placeholder:text-ink-variant/50 focus:outline-none focus:border-primary transition-colors"
        />
        <Button type="submit" variant="primary" size="md" isLoading={isSending} disabled={!input.trim()} leftIcon={<Send className="w-3.5 h-3.5" />}>
          Send
        </Button>
      </form>

      <div className="px-4 py-2 bg-surface border-t border-hairline text-[10px] text-ink-variant/70 text-center">
        Read-only in v1 — never assigns couriers or changes prices. Sources from `faq.md` only.
      </div>
    </div>
  );
}
