import React from 'react';
import { PackageOpen } from 'lucide-react';
import { Button } from './Button.jsx';

/**
 * Architectural Empty State Component.
 *
 * @param {object} props
 * @param {string} props.title - Editorial headline
 * @param {string} props.description - Descriptive text
 * @param {string} [props.actionLabel] - CTA button text
 * @param {() => void} [props.onAction] - CTA button callback
 * @param {React.ReactNode} [props.icon] - Optional custom icon
 */
export function EmptyState({
  title = 'No records found',
  description = 'There are no active items to display right now.',
  actionLabel,
  onAction,
  icon,
}) {
  return (
    <div className="w-full bg-container-lowest hairline rounded-lg p-12 text-center flex flex-col items-center justify-center max-w-lg mx-auto">
      <div className="w-12 h-12 rounded-full bg-container-low flex items-center justify-center text-ink-variant mb-4">
        {icon || <PackageOpen className="w-6 h-6 stroke-[1.5]" />}
      </div>

      <h3 className="font-display text-xl font-bold text-ink mb-2">{title}</h3>
      <p className="text-sm text-ink-variant max-w-sm mb-6 leading-relaxed">
        {description}
      </p>

      {actionLabel && onAction && (
        <Button onClick={onAction} size="md">
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
