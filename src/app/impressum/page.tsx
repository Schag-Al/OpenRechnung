import Link from "next/link";

export default function ImprintPage() {
  return (
    <main className="mx-auto min-h-screen max-w-3xl px-4 py-12">
      <div className="card">
        <p className="text-sm font-bold uppercase tracking-wide text-brand-clay">Platzhalter</p>
        <h1 className="mt-3 text-4xl font-black text-brand-ink">Impressum</h1>
        <p className="mt-5 leading-7 text-slate-700">
          Diese Seite ist als Platzhalter vorbereitet. Vor einem oeffentlichen Deployment muessen Betreiberangaben,
          Kontakt, Unternehmensdaten, Aufsichtsbehoerden und weitere Pflichtinformationen passend ergaenzt werden.
        </p>
        <div className="mt-6 rounded-2xl bg-brand-sand p-5 text-sm leading-6 text-slate-700">
          <p className="font-black text-brand-ink">Noch nicht final</p>
          <p className="mt-2">
            Der Inhalt ist keine Rechtsberatung und ersetzt keine individuelle Pruefung fuer den konkreten Betreiber.
          </p>
        </div>
        <Link href="/" className="secondary-button mt-8">
          Zurueck
        </Link>
      </div>
    </main>
  );
}
