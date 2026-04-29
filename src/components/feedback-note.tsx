import Link from "next/link";

export function FeedbackNote() {
  return (
    <aside className="rounded-2xl border border-brand-clay/20 bg-white p-5 shadow-sm">
      <p className="text-sm font-semibold text-brand-ink">Fehlt dir eine Funktion?</p>
      <p className="mt-2 text-sm leading-6 text-slate-600">
        Melde Vorschlaege direkt aus dem Testbetrieb. So sammeln wir, was Handwerkern im Alltag wirklich hilft.
      </p>
      <Link
        href="/feedback"
        className="mt-4 inline-flex rounded-xl border border-brand-clay/30 bg-brand-sand px-4 py-2 text-sm font-semibold text-brand-moss transition hover:border-brand-clay hover:bg-white"
      >
        Funktionsvorschlag einmelden
      </Link>
    </aside>
  );
}
