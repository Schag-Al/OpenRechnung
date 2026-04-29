import Link from "next/link";
import { OpenRechnungLogo } from "@/components/openrechnung-logo";
import { SupporterNote } from "@/components/supporter-note";
import { isTestModeWithoutLogin } from "@/lib/test-mode";

export default function HomePage() {
  const testMode = isTestModeWithoutLogin();

  return (
    <main className="min-h-screen overflow-hidden">
      <section className="mx-auto grid max-w-7xl gap-10 px-4 py-8 md:grid-cols-[1.2fr_0.8fr] md:items-center md:py-16">
        <div>
          <OpenRechnungLogo className="mb-8" />
          <div className="inline-flex rounded-xl border border-brand-clay/20 bg-white px-4 py-2 text-sm font-bold text-brand-moss shadow-sm">
            Gratis fuer immer. Unterstuetzt durch freiwillige Beitraege.
          </div>
          <h1 className="mt-8 max-w-3xl text-5xl font-black leading-tight tracking-tight text-brand-ink md:text-7xl">
            Kostenlos Angebote und Rechnungen schreiben - einfach fuer Handwerker.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-700">
            Ein schlankes Werkzeug fuer kleine Betriebe: Kunden verwalten, Angebote erstellen, Rechnungen schreiben,
            PDFs herunterladen und offene Zahlungen im Blick behalten.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/register" className="primary-button">
              Kostenlos starten
            </Link>
            <Link href="/login" className="secondary-button">
              Einloggen
            </Link>
            {testMode ? (
              <Link href="/testdashboard" className="secondary-button">
                Testdashboard oeffnen
              </Link>
            ) : null}
          </div>
          <p className="mt-5 text-sm text-slate-500">
            Keine Werbung. Kein Abo-Zwang. Keine Steuerberatung oder Behauptung von vollstaendiger Rechtssicherheit.
          </p>
        </div>

        <div className="relative">
          <div className="absolute -right-10 -top-10 h-56 w-56 rounded-full bg-brand-clay/15 blur-3xl" />
          <div className="relative rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
            <div className="rounded-2xl bg-brand-ink p-5 text-white">
              <p className="text-sm font-semibold text-white/70">Dashboard Vorschau</p>
              <div className="mt-5 grid gap-3">
                {[
                  ["Offene Rechnungen", "3"],
                  ["Offener Betrag", "2.840,00 EUR"],
                  ["Ueberfaellig", "1"]
                ].map(([label, value]) => (
                  <div key={label} className="rounded-xl bg-white/10 p-4">
                    <p className="text-sm text-white/60">{label}</p>
                    <p className="mt-1 text-2xl font-black">{value}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-4 grid gap-3 rounded-2xl bg-brand-sand p-5">
              <p className="font-bold text-brand-ink">Schnellaktionen</p>
              <div className="grid gap-2 sm:grid-cols-2">
                <span className="rounded-xl bg-white px-4 py-3 text-sm font-bold shadow-sm">Neues Angebot</span>
                <span className="rounded-xl bg-white px-4 py-3 text-sm font-bold shadow-sm">Neue Rechnung</span>
              </div>
            </div>
          </div>
        </div>
      </section>
      <section className="mx-auto max-w-7xl px-4 pb-12">
        <SupporterNote />
        <div className="mt-6 flex gap-4 text-sm font-bold text-slate-600">
          <Link href="/datenschutz" className="hover:text-brand-clay">
            Datenschutz
          </Link>
          <Link href="/impressum" className="hover:text-brand-clay">
            Impressum
          </Link>
        </div>
      </section>
    </main>
  );
}
