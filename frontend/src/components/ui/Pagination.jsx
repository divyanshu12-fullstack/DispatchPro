import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

/**
 * Aurelian Minimalist Pagination Control.
 *
 * @param {object} props
 * @param {number} props.page - Current 1-indexed page
 * @param {number} props.pages - Total pages
 * @param {number} props.total - Total records count
 * @param {number} [props.limit=10] - Items per page
 * @param {(page: number) => void} props.onPageChange
 */
export function Pagination({ page = 1, pages = 1, total = 0, limit = 10, onPageChange }) {
  if (pages <= 1 && total <= limit) return null;

  return (
    <div className="flex items-center justify-between py-3 px-4 border-t border-hairline bg-surface text-xs text-ink-variant">
      <div className="label-caps text-ink-variant/80">
        Showing Page <span className="text-ink font-bold tabular">{page}</span> of{' '}
        <span className="text-ink font-bold tabular">{pages || 1}</span> ({total}{' '}
        {total === 1 ? 'order' : 'orders'})
      </div>

      <div className="flex items-center gap-1.5">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => onPageChange?.(page - 1)}
          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded hairline bg-container-lowest text-ink hover:bg-container-low disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          <span className="label-caps text-[10px]">Prev</span>
        </button>

        <button
          type="button"
          disabled={page >= pages}
          onClick={() => onPageChange?.(page + 1)}
          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded hairline bg-container-lowest text-ink hover:bg-container-low disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
        >
          <span className="label-caps text-[10px]">Next</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
