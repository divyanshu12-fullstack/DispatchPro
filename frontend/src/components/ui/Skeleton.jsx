import React from 'react';

/**
 * Aurelian Minimalist Content Placeholder Skeleton.
 */
export function Skeleton({ className = '', variant = 'rect', ...props }) {
  const variantClasses = {
    rect: 'rounded',
    circle: 'rounded-full',
    text: 'rounded h-4 w-full',
  };

  return (
    <div
      className={`bg-container-high animate-pulse ${variantClasses[variant]} ${className}`}
      {...props}
    />
  );
}

/**
 * Pre-composed table rows skeleton loader.
 */
export function TableSkeleton({ rows = 5, cols = 4 }) {
  return (
    <div className="w-full space-y-3">
      {Array.from({ length: rows }).map((_, r) => (
        <div
          key={r}
          className="flex items-center gap-4 p-4 bg-container-lowest hairline rounded"
        >
          {Array.from({ length: cols }).map((_, c) => (
            <Skeleton
              key={c}
              className={`h-4 ${c === 0 ? 'w-28' : c === 1 ? 'w-48' : 'flex-1'}`}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="p-5 bg-container-lowest hairline rounded-xl space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-5 w-20 rounded-full" />
      </div>
      <Skeleton className="h-12 w-full rounded-lg" />
      <div className="pt-2 border-t border-hairline flex items-center justify-between">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-8 w-28 rounded" />
      </div>
    </div>
  );
}
