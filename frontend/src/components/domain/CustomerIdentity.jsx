import React from 'react';
import { Phone } from 'lucide-react';

function getInitials(name) {
  if (!name) return '–';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '–';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Contact identity block for sender / receiver / placer.
 *
 * @param {object} props
 * @param {{ name?: string|null, email?: string|null, phone?: string|null }} props.contact
 * @param {'compact'|'full'} [props.variant='full']
 * @param {boolean} [props.showPhone=true]
 * @param {string} [props.label='']
 */
export function CustomerIdentity({ contact, variant = 'full', showPhone = true, label = '' }) {
  const name = contact?.name?.trim() ? contact.name : null;
  const email = contact?.email?.trim() ? contact.email : null;
  const phone = contact?.phone?.trim() ? contact.phone : null;

  if (!name && !email && !phone) {
    return (
      <div className="text-xs text-ink-variant">
        {label ? <span className="label-caps text-[10px] text-ink-variant block mb-1">{label}</span> : null}
        <span>N/A</span>
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div className="flex items-center gap-2 min-w-0">
        <div className="w-7 h-7 rounded-full bg-container-high text-ink text-[11px] font-bold flex items-center justify-center shrink-0">
          {getInitials(name || email)}
        </div>
        <div className="min-w-0">
          {label ? <div className="label-caps text-[9px] text-ink-variant">{label}</div> : null}
          <div className="text-xs font-semibold text-ink truncate">{name || 'N/A'}</div>
          {email ? <div className="text-[11px] text-ink-variant truncate">{email}</div> : null}
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-2.5">
      <div className="w-9 h-9 rounded-full bg-container-high text-ink text-xs font-bold flex items-center justify-center shrink-0">
        {getInitials(name || email)}
      </div>
      <div className="min-w-0 flex-1">
        {label ? <div className="label-caps text-[10px] text-ink-variant mb-0.5">{label}</div> : null}
        <div className="text-xs font-bold text-ink truncate">{name || 'N/A'}</div>
        {email ? <div className="text-[11px] text-ink-variant truncate mt-0.5">{email}</div> : null}
        {showPhone ? (
          phone ? (
            <a
              href={`tel:${phone.replace(/\s+/g, '')}`}
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary hover:underline mt-1"
              onClick={(e) => e.stopPropagation()}
            >
              <Phone className="w-3 h-3" />
              <span>{phone}</span>
            </a>
          ) : (
            <div className="text-[11px] text-ink-variant/60 mt-1">Phone N/A</div>
          )
        ) : null}
      </div>
    </div>
  );
}
