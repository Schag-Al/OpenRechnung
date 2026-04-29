import Link from "next/link";

export function SupporterNote() {
  return (
    <aside className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-semibold text-brand-ink">Dieses Tool bleibt gratis.</p>
      <p className="mt-2 text-sm leading-6 text-slate-600">
        Wenn es dir Zeit spart, kannst du das Projekt freiwillig unterstuetzen.
      </p>
      <Link
        href="/support"
        className="mt-4 inline-flex rounded-xl bg-brand-moss px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-ink"
      >
        Projekt unterstuetzen
      </Link>
    </aside>
  );
}
