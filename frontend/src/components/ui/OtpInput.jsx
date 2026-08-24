import React, { useRef, useEffect } from 'react';

/**
 * 6-Box Controlled OTP Input with auto-advance, paste support, and shake animation.
 *
 * @param {object} props
 * @param {string} props.value - 6 digit string
 * @param {(value: string) => void} props.onChange
 * @param {boolean} [props.hasError=false]
 * @param {boolean} [props.disabled=false]
 * @param {number} [props.length=6]
 */
export function OtpInput({
  value = '',
  onChange,
  hasError = false,
  disabled = false,
  length = 6,
}) {
  const inputRefs = useRef([]);

  // Split value into an array of digits padded with empty strings
  const digits = Array.from({ length }, (_, i) => value[i] || '');

  useEffect(() => {
    // Focus first empty box on initial mount
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  const handleChange = (index, e) => {
    const rawVal = e.target.value;
    const digit = rawVal.replace(/\D/g, '').slice(-1);

    const newDigits = [...digits];
    newDigits[index] = digit;
    const newValue = newDigits.join('');
    onChange?.(newValue);

    if (digit && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace') {
      if (!digits[index] && index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      e.preventDefault();
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < length - 1) {
      e.preventDefault();
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text/plain').replace(/\D/g, '').slice(0, length);
    if (!pastedData) return;

    onChange?.(pastedData);
    const nextIndex = Math.min(pastedData.length, length - 1);
    inputRefs.current[nextIndex]?.focus();
  };

  return (
    <div className={`flex items-center justify-center gap-2 sm:gap-3 ${hasError ? 'animate-shake' : ''}`}>
      {Array.from({ length }).map((_, idx) => (
        <input
          key={idx}
          ref={(el) => (inputRefs.current[idx] = el)}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={1}
          value={digits[idx]}
          disabled={disabled}
          onChange={(e) => handleChange(idx, e)}
          onKeyDown={(e) => handleKeyDown(idx, e)}
          onPaste={handlePaste}
          className={`w-11 h-13 sm:w-12 sm:h-14 text-center font-display text-xl font-bold rounded hairline bg-container-lowest text-ink tabular transition-all focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary disabled:opacity-50 ${
            hasError
              ? 'border-danger text-danger focus:border-danger focus:ring-danger'
              : digits[idx]
              ? 'border-primary'
              : 'border-outline-variant'
          }`}
        />
      ))}
    </div>
  );
}
