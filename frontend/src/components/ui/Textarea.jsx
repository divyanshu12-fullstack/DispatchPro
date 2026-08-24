import React, { forwardRef } from 'react';

/**
 * Aurelian Minimalist Textarea Component.
 */
export const Textarea = forwardRef(function Textarea(
  {
    label,
    error,
    helperText,
    rows = 3,
    className = '',
    id,
    ...props
  },
  ref
) {
  const textareaId = id || (label ? `textarea-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined);

  return (
    <div className="w-full space-y-1.5">
      {label && (
        <label htmlFor={textareaId} className="block label-caps text-ink-variant">
          {label}
        </label>
      )}

      <textarea
        ref={ref}
        id={textareaId}
        rows={rows}
        className={`w-full bg-container-lowest text-ink text-sm rounded hairline p-3 transition-colors placeholder:text-ink-variant/40 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary ${
          error ? 'border-danger focus:border-danger focus:ring-danger' : 'border-outline-variant'
        } ${className}`}
        {...props}
      />

      {error ? (
        <p className="text-xs text-danger font-medium mt-1">{error}</p>
      ) : helperText ? (
        <p className="text-xs text-ink-variant/70 mt-1">{helperText}</p>
      ) : null}
    </div>
  );
});
