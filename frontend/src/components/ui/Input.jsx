import React, { forwardRef } from 'react';

/**
 * Aurelian Minimalist Form Input Component.
 *
 * @param {object} props
 * @param {string} [props.label]
 * @param {string} [props.error]
 * @param {string} [props.helperText]
 * @param {React.ReactNode} [props.leftIcon]
 * @param {React.ReactNode} [props.rightElement]
 * @param {boolean} [props.numericOnly=false]
 * @param {string} [props.className='']
 */
export const Input = forwardRef(function Input(
  {
    label,
    error,
    helperText,
    leftIcon,
    rightElement,
    numericOnly = false,
    className = '',
    onChange,
    id,
    ...props
  },
  ref
) {
  const inputId = id || (label ? `input-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined);

  const handleChange = (e) => {
    if (numericOnly) {
      const val = e.target.value;
      if (val !== '' && !/^\d*$/.test(val)) return;
    }
    onChange?.(e);
  };

  return (
    <div className="w-full space-y-1.5">
      {label && (
        <label htmlFor={inputId} className="block label-caps text-ink-variant">
          {label}
        </label>
      )}

      <div className="relative flex items-center">
        {leftIcon && (
          <div className="absolute left-3 text-ink-variant/60 pointer-events-none flex items-center">
            {leftIcon}
          </div>
        )}

        <input
          ref={ref}
          id={inputId}
          onChange={handleChange}
          className={`w-full bg-container-lowest text-ink text-sm rounded hairline py-2.5 transition-colors placeholder:text-ink-variant/40 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary ${
            leftIcon ? 'pl-9' : 'pl-3'
          } ${rightElement ? 'pr-10' : 'pr-3'} ${
            error ? 'border-danger focus:border-danger focus:ring-danger' : 'border-outline-variant'
          } ${className}`}
          {...props}
        />

        {rightElement && (
          <div className="absolute right-3 flex items-center text-ink-variant">
            {rightElement}
          </div>
        )}
      </div>

      {error ? (
        <p className="text-xs text-danger font-medium mt-1">{error}</p>
      ) : helperText ? (
        <p className="text-xs text-ink-variant/70 mt-1">{helperText}</p>
      ) : null}
    </div>
  );
});
