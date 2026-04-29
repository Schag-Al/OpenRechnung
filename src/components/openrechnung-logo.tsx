type OpenRechnungLogoProps = {
  compact?: boolean;
  className?: string;
};

export function OpenRechnungLogo({ compact = false, className = "" }: OpenRechnungLogoProps) {
  return (
    <span className={`inline-flex items-center gap-3 ${className}`}>
      <span className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-brand-moss text-white shadow-sm">
        <svg aria-hidden="true" viewBox="0 0 40 40" className="h-10 w-10">
          <rect width="40" height="40" rx="14" fill="#0f3d4a" />
          <path d="M13 10.5h11.5l4.5 4.6v14.4H13z" fill="#ffffff" opacity="0.96" />
          <path d="M24.5 10.5v5h4.5" fill="#d8f3ef" />
          <path d="M17 19h11M17 23h9M17 27h6" stroke="#0f766e" strokeWidth="2" strokeLinecap="round" />
          <circle cx="12.5" cy="12.5" r="4" fill="#c56b35" />
        </svg>
      </span>
      {!compact ? (
        <span className="leading-none">
          <span className="block text-xl font-black tracking-tight text-brand-ink">OpenRechnung</span>
          <span className="mt-1 block text-[11px] font-bold uppercase tracking-[0.2em] text-brand-clay">Angebote & Rechnungen</span>
        </span>
      ) : null}
    </span>
  );
}
