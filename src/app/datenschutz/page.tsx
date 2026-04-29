import Link from "next/link";

export default function PrivacyPage() {
  return (
    <main className="mx-auto min-h-screen max-w-3xl px-4 py-12">
      <div className="card">
        <p className="text-sm font-bold uppercase tracking-wide text-brand-clay">Platzhalter</p>
        <h1 className="mt-3 text-4xl font-black text-brand-ink">Datenschutz</h1>
        <p className="mt-5 leading-7 text-slate-700">
          Diese Seite ist strukturell vorbereitet. Vor einem oeffentlichen Deployment muss sie fachlich und rechtlich
          passend fuer Betreiber, Hosting, Speicherort, Cookies, Authentifizierung und Support-Kontakt finalisiert werden.
        </p>
        <div className="mt-6 rounded-2xl bg-brand-sand p-5 text-sm leading-6 text-slate-700">
          <p className="font-black text-brand-ink">MVP-Hinweis</p>
          <p className="mt-2">
            Lokal werden Kunden-, Firmen-, Angebots- und Rechnungsdaten in der Entwicklungsdatenbank gespeichert. Das Tool
            sendet im MVP keine automatischen E-Mails und enthaelt keine Zahlungsintegration.
          </p>
        </div>
        <Link href="/" className="secondary-button mt-8">
          Zurueck
        </Link>
      </div>
    </main>
  );
}
