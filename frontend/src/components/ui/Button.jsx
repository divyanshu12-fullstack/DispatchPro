import React from 'react';
import { Loader2 } from 'lucide-react';

/**
 * Aurelian Minimalist Button Component.
 *
 * @param {object} props
 * @param {'primary' | 'secondary' | 'ghost' | 'danger' | 'accent'} [props.variant='primary']
 * @param {'sm' | 'md' | 'lg'} [props.size='md']
 * @param {boolean} [props.isLoading=false]
 * @param {boolean} [props.disabled=false]
 * @param {React.ReactNode} [props.leftIcon]
 * @param {React.ReactNode} [props.rightIcon]
 * @param {string} [props.className='']
 * @param {React.ReactNode} props.children
 */
export function Button({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled = false,
  leftIcon,
  rightIcon,
  className = '',
  children,
  type = 'button',
  ...props
}) {
  const baseClasses =
    'inline-flex items-center justify-center font-medium transition-colors cursor-pointer select-none disabled:opacity-50 disabled:cursor-not-allowed rounded';

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-xs gap-1.5',
    md: 'px-4 py-2 text-sm gap-2',
    lg: 'px-5 py-2.5 text-base gap-2.5',
  };

  const variantClasses = {
    primary: 'bg-primary text-on-primary hover:bg-black/90 active:bg-black',
    secondary: 'hairline bg-container-lowest text-ink hover:bg-container-low active:bg-container',
    ghost: 'bg-transparent text-ink hover:bg-container-low active:bg-container',
    danger: 'bg-danger text-white hover:bg-red-700 active:bg-red-800',
    accent: 'bg-accent text-primary hover:brightness-95 active:brightness-90 font-semibold',
  };

  return (
    <button
      type={type}
      disabled={disabled || isLoading}
      className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin text-current shrink-0" />
      ) : (
        leftIcon && <span className="shrink-0">{leftIcon}</span>
      )}
      {children}
      {!isLoading && rightIcon && <span className="shrink-0">{rightIcon}</span>}
    </button>
  );
}
