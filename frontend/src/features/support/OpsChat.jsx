import React, { useState, useRef, useEffect } from 'react';
import { aiApi } from '../../api/ai.api.js';
import { Button } from '../../components/ui/Button.jsx';
import { getErrorMessage } from '../../lib/errors.js';
import { Bot, X, Send, Quote, Copy, Check, Activity, AlertCircle, Users } from 'lucide-react';

// App-wide event so Dashboard buttons can open this chat.
export const OPEN_OPS_CHAT_EVENT = 'dispatchpro:open-ops-chat';

function CopyBtn({ text }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1200);
      }}
      className="inline-flex items-center gap-1 text-[11px] text-ink-variant hover:text-ink cursor-pointer"
    >
      {copied ? <Check className="w-3 h-3 text-success" /> : <Copy className="w-3 h-3" />}
      {copied ? 'Copied' : 'Copy'}
    </button>
  );
}

export function OpsChat() {
  const [open, setOpen] = useState(false);
  const [showHint, setShowHint] = useState(true);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content:
        'Ops Copilot here — read-only. Ask "what is stuck?", "success rate?", or mention an LM-... waybill. I ground on live counts + FAQ and never dispatch or change price.',
      sources: [],
      live: null,
    },
  ]);
  const [isSending, setIsSending] = useState(false);
  const listRef = useRef(null);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, isSending, open]);

  // Dashboard buttons open this chat via window event.
  useEffect(() => {
    const handler = () => {
      setOpen(true);
      setShowHint(false);
    };
    window.addEventListener(OPEN_OPS_CHAT_EVENT, handler);
    return () => window.removeEventListener(OPEN_OPS_CHAT_EVENT, handler);
  }, []);

  const send = async (override) => {
    const q = (override ?? input).trim();
    if (!q || isSending) return;
    setInput('');
    setMessages((m) => [...m, { role: 'user', content: q }]);
    setIsSending(true);
    try {
      const data = await aiApi.ops({ query: q });
      setMessages((m) => [
        ...m,
        { role: 'assistant', content: data.answer, sources: data.sources || [], live: data.live || null, model: data.model },
      ]);
    } catch (err) {
      setMessages((m) => [
        ...m,
        {
          role: 'assistant',
          content: getErrorMessage(err, 'Ops Copilot is busy — check /admin/dispatch directly.'),
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
    <>
      {/* Floating toggle — Bot icon + catchy hint pill; hidden while panel open */}
      {!open && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2.5">
          {showHint && (
            <button
              type="button"
              onClick={() => {
                setOpen(true);
                setShowHint(false);
              }}
              className="bg-container-lowest hairline shadow-overlay rounded-full px-3.5 py-2 text-[11px] font-semibold text-ink hover:bg-surface transition-colors cursor-pointer animate-in fade-in slide-in-from-right-2"
            >
              Want me to calculate the success rate? <span aria-hidden>✨</span>
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              setOpen(true);
              setShowHint(false);
            }}
            className="w-12 h-12 rounded-full bg-primary text-on-primary shadow-overlay flex items-center justify-center hover:bg-primary/90 active:scale-[0.98] transition-all cursor-pointer"
            aria-label="Open Ops Copilot"
          >
            <Bot className="w-5 h-5" />
          </button>
        </div>
      )}

      {open && (
        <div className="fixed bottom-6 right-4 sm:right-5 z-50 w-[92vw] sm:w-[380px] max-h-[70vh] bg-container-lowest hairline rounded-2xl shadow-overlay flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-2">
          {/* Minimal top bar — Bot + close */}
          <div className="flex items-center gap-2.5 px-4 pt-3 pb-2 shrink-0">
            <div className="w-7 h-7 rounded-lg bg-primary text-on-primary flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-ink leading-tight">Ops Copilot</div>
              <div className="text-[10px] text-ink-variant leading-tight">read-only · live counts · never dispatches</div>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="ml-auto w-7 h-7 rounded-full hover:bg-container-low flex items-center justify-center text-ink-variant hover:text-ink transition-colors cursor-pointer"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div ref={listRef} className="flex-1 overflow-y-auto px-4 pb-3 space-y-3.5 bg-surface/20 min-h-[240px]">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[88%] rounded-2xl px-4 py-3 text-[13px] leading-[1.5] shadow-sm ${
                    m.role === 'user'
                      ? 'bg-primary text-on-primary rounded-br-[6px]'
                      : m.isError
                        ? 'bg-danger-soft hairline text-danger rounded-bl-[6px]'
                        : 'bg-white hairline text-ink rounded-bl-[6px]'
                  }`}
                >
                  <div className="whitespace-pre-wrap break-words">{m.content}</div>

                  {/* Live tool-result strip */}
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
                          <AlertCircle className="w-3 h-3" /> {m.live.needsManualAttention} need attention
                        </span>
                      )}
                    </div>
                  )}

                  {/* Courier load (top agents) */}
                  {m.live?.courierLoad?.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {m.live.courierLoad.slice(0, 3).map((a) => (
                        <div key={a.name} className="flex items-center justify-between text-[11px] text-ink-variant">
                          <span className="truncate max-w-[150px] font-medium text-ink">{a.name}{a.isAvailable ? '' : ' (off-duty)'}</span>
                          <span className="tabular">{a.active}{a.capacity ? `/${a.capacity}` : ''} active</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {m.sources?.length > 0 && (
                    <div className="mt-2.5 pt-2.5 border-t border-hairline/60 flex flex-wrap gap-1.5">
                      {m.sources.map((s) => (
                        <span
                          key={s.sourceId}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-surface hairline text-[10px] font-medium text-ink-variant"
                        >
                          <Quote className="w-3 h-3 opacity-70" />
                          {s.title.slice(0, 36)}
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="mt-2 flex justify-end">
                    {m.role === 'assistant' && !m.isError && <CopyBtn text={m.content} />}
                  </div>
                </div>
              </div>
            ))}
            {isSending && (
              <div className="flex justify-start">
                <div className="bg-white hairline rounded-2xl rounded-bl-[6px] px-4 py-3 text-xs text-ink-variant inline-flex items-center gap-2.5 shadow-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                  Checking live counts + FAQ…
                </div>
              </div>
            )}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              send();
            }}
            className="px-3 py-3 bg-container-lowest border-t border-hairline flex items-center gap-2 shrink-0"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
              placeholder="Ask ops — e.g. what is stuck?"
              className="flex-1 h-10 bg-container-low hairline rounded-full px-4 text-[13px] text-ink placeholder:text-ink-variant/50 focus:outline-none focus:bg-white focus:border-primary/30 transition-colors"
            />
            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={isSending}
              disabled={!input.trim()}
              leftIcon={<Send className="w-3.5 h-3.5" />}
              className="rounded-full h-10 px-4 shrink-0"
            >
              Send
            </Button>
          </form>
        </div>
      )}
    </>
  );
}
