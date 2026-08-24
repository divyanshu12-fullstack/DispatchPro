import React, { forwardRef } from 'react';
import { ChevronDown } from 'lucide-react';

/**
 * Aurelian Minimalist Select Component.
 */
export const Select = forwardRef(function Select(
  {
    label,
    error,
    helperText,
    options = [],
    placeholder = 'Select an option',
    className = '',
    id,
    children,
    ...props
  },
  ref
) {
  const selectId = id || (label ? `select-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined);

  return (
    <div className="w-full space-y-1.5">
      {label && (
        <label htmlFor={selectId} className="block label-caps text-ink-variant">
          {label}
        </label>
      )}

      <div className="relative flex items-center">
        <select
          ref={ref}
          id={selectId}
          className={`w-full appearance-none bg-container-lowest text-ink text-sm rounded hairline py-2.5 pl-3 pr-10 transition-colors focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary ${
            error ? 'border-danger focus:border-danger focus:ring-danger' : 'border-outline-variant'
          } ${className}`}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((opt) => {
            const val = typeof opt === 'object' ? opt.value : opt;
            const lbl = typeof opt === 'object' ? opt.label : opt;
            return (
              <option key={val} value={val}>
                {lbl}
              </option>
            );
          })}
          {children}
        </select>

        <ChevronDown className="absolute right-3 w-4 h-4 text-ink-variant/60 pointer-events-none" />
      </div>

      {error ? (
        <p className="text-xs text-danger font-medium mt-1">{error}</p>
      ) : helperText ? (
        <p className="text-xs text-ink-variant/70 mt-1">{helperText}</p>
      ) : null}
    </div>
  );
});
