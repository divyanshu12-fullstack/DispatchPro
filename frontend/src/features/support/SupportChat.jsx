import React, { useState, useRef, useEffect } from 'react';
import { aiApi } from '../../api/ai.api.js';
import { Button } from '../../components/ui/Button.jsx';
import { getErrorMessage } from '../../lib/errors.js';
import { MessageCircle, X, Send, Sparkles, Quote, Copy, Check } from 'lucide-react';

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

export function SupportChat() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content:
        'Hi — I am DispatchPro assistant, grounded on our FAQ. Ask about price, booking, OTP, reschedule/RTO, or why an order is still CREATED.',
      sources: [],
    },
  ]);
  const [isSending, setIsSending] = useState(false);
  const listRef = useRef(null);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, isSending, open]);

  const send = async (override) => {
    const q = (override ?? input).trim();
    if (!q || isSending) return;
    setInput('');
    setMessages((m) => [...m, { role: 'user', content: q }]);
    setIsSending(true);
    try {
      const data = await aiApi.chat({ query: q });
      setMessages((m) => [...m, { role: 'assistant', content: data.answer, sources: data.sources || [], model: data.model }]);
    } catch (err) {
      setMessages((m) => [
        ...m,
        { role: 'assistant', content: getErrorMessage(err, 'Support is busy — try /faq or /quote.'), sources: [], isError: true },
      ]);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <>
      {/* Floating toggle — hidden when panel is open (panel has its own X) */}
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="fixed bottom-5 right-5 z-50 w-12 h-12 rounded-full bg-primary text-on-primary shadow-overlay flex items-center justify-center hover:bg-primary/90 active:scale-[0.98] transition-all cursor-pointer"
          aria-label="Open support chat"
        >
          <MessageCircle className="w-5 h-5" />
        </button>
      )}

      {/* Panel — minimal, respects your deletions (no header title, no LM field) */}
      {open && (
        <div className="fixed bottom-6 right-4 sm:right-5 z-50 w-[92vw] sm:w-[360px] max-h-[68vh] bg-container-lowest hairline rounded-2xl shadow-overlay flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-2">
          {/* Minimal top bar — only close, as you left it */}
          <div className="flex items-center justify-start px-3 pt-3 pb-2 shrink-0">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="w-7 h-7 rounded-full hover:bg-container-low flex items-center justify-center text-ink-variant hover:text-ink transition-colors cursor-pointer"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div ref={listRef} className="flex-1 overflow-y-auto px-4 pb-3 space-y-3.5 bg-surface/20 min-h-[220px]">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[86%] rounded-2xl px-4 py-3 text-[13px] leading-[1.5] shadow-sm ${
                    m.role === 'user'
                      ? 'bg-primary text-on-primary rounded-br-[6px]'
                      : m.isError
                        ? 'bg-danger-soft hairline text-danger rounded-bl-[6px]'
                        : 'bg-white hairline text-ink rounded-bl-[6px]'
                  }`}
                >
                  <div className="whitespace-pre-wrap break-words">{m.content}</div>
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
                  Answering from FAQ…
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
              placeholder="Ask — e.g. how is price calculated?"
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
