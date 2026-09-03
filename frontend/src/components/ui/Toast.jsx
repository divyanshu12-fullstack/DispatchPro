import React, { createContext, useContext, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    (type, message, duration = 4000) => {
      const id = Date.now().toString() + Math.random().toString(36).slice(2, 6);
      const toast = { id, type, message };

      setToasts((prev) => [...prev, toast]);

      if (duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }
    },
    [removeToast]
  );

  const toast = {
    success: (msg, dur) => addToast('success', msg, dur),
    error: (msg, dur) => addToast('error', msg, dur),
    info: (msg, dur) => addToast('info', msg, dur),
    warning: (msg, dur) => addToast('warning', msg, dur),
  };

  const toasterNode = (
    <div
      aria-live="polite"
      className="fixed top-4 sm:top-auto sm:bottom-6 left-1/2 -translate-x-1/2 z-[9999] flex flex-col items-center gap-2.5 w-[calc(100%-2rem)] sm:w-auto sm:max-w-md pointer-events-none"
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          role="alert"
          className="pointer-events-auto w-full sm:w-auto sm:min-w-[320px] max-w-md bg-container-lowest hairline rounded-xl shadow-overlay p-3.5 flex items-start gap-3 transition-all animate-in fade-in slide-in-from-top-3 sm:slide-in-from-bottom-3 duration-200 border border-hairline/80"
        >
          <div className="shrink-0 mt-0.5">
            {t.type === 'success' && <CheckCircle2 className="w-4 h-4 text-success" />}
            {t.type === 'error' && <AlertCircle className="w-4 h-4 text-danger" />}
            {t.type === 'warning' && <AlertTriangle className="w-4 h-4 text-warning" />}
            {t.type === 'info' && <Info className="w-4 h-4 text-slate" />}
          </div>

          <div className="flex-1 text-xs text-ink font-medium leading-snug">
            {t.message}
          </div>

          <button
            type="button"
            onClick={() => removeToast(t.id)}
            className="text-ink-variant/50 hover:text-ink shrink-0 p-0.5 rounded cursor-pointer transition-colors"
            aria-label="Dismiss toast"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  );

  return (
    <ToastContext.Provider value={toast}>
      {children}
      {typeof document !== 'undefined' ? createPortal(toasterNode, document.body) : null}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
