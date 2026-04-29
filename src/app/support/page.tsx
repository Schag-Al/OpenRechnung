import Link from "next/link";

const supportIdeas = [
  {
    title: "Einmalig Danke sagen",
    description: "Spaeter denkbar fuer Nutzer, die mit OpenRechnung Zeit sparen und freiwillig etwas zur Entwicklung beitragen moechten."
  },
  {
    title: "Regelmaessiger Projektbeitrag",
    description: "Optionaler Beitrag fuer Menschen oder Betriebe, die das kostenlose Grundversprechen langfristig unterstuetzen wollen."
  },
  {
    title: "Feedback und Empfehlungen",
    description: "Schon jetzt wertvoll: Fehler melden, Wuensche sammeln und das Tool an andere Handwerker weiterempfehlen."
  }
];

const principles = [
  "Die Nutzung bleibt gratis.",
  "Keine Werbung im Produkt.",
  "Keine Pflicht-Abos.",
  "Keine Zahlungsfunktion im MVP.",
  "Keine Weitergabe von Zahlungsdaten, weil noch keine erhoben werden."
];

export default function SupportPage() {
  return (
    <main className="min-h-screen bg-brand-sand">
      <section className="mx-auto max-w-6xl px-4 py-10 md:py-16">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-soft md:p-10">
          <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div>
              <p className="text-sm font-black uppercase tracking-wide text-brand-clay">OpenRechnung unterstuetzen</p>
              <h1 className="mt-4 max-w-3xl text-4xl font-black tracking-tight text-brand-ink md:text-6xl">
                Kostenlos fuer Handwerker. Getragen durch freiwillige Unterstuetzung.
              </h1>
              <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-700">
                OpenRechnung soll ein einfaches, verlaessliches Werkzeug bleiben: Angebote schreiben, Rechnungen erstellen,
                PDFs herunterladen und offene Zahlungen im Blick behalten, ohne Abo-Druck.
              </p>
              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <Link href="/dashboard" className="primary-button">
                  Zur App
                </Link>
                <Link href="/" className="secondary-button">
                  Zur Startseite
                </Link>
              </div>
            </div>

            <div className="rounded-2xl border border-brand-clay/20 bg-brand-sand p-5">
              <p className="text-sm font-black uppercase tracking-wide text-brand-moss">Aktueller Stand</p>
              <div className="mt-4 rounded-xl bg-white p-5 shadow-sm">
                <p className="text-2xl font-black text-brand-ink">Zahlungen sind noch nicht aktiv.</p>
                <p className="mt-3 leading-7 text-slate-600">
                  Diese Seite bereitet nur den Bereich vor. Es gibt keine Zahlungsintegration, keine Zahlungslinks und keine
                  Erfassung von Zahlungsdaten.
                </p>
              </div>
              <div className="mt-4 rounded-xl border border-dashed border-brand-clay/40 bg-white/70 p-4 text-sm font-bold text-brand-moss">
                Platzhalter fuer spaeter: freiwillige Projektunterstuetzung
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <section className="card">
            <p className="text-sm font-black uppercase tracking-wide text-brand-clay">Versprechen</p>
            <h2 className="mt-3 text-2xl font-black text-brand-ink">Was unveraendert bleiben soll</h2>
            <ul className="mt-5 space-y-3">
              {principles.map((item) => (
                <li key={item} className="rounded-xl border border-slate-200 bg-brand-paper p-3 text-sm font-semibold text-slate-700">
                  {item}
                </li>
              ))}
            </ul>
          </section>

          <section className="card">
            <p className="text-sm font-black uppercase tracking-wide text-brand-clay">Spaeter moeglich</p>
            <h2 className="mt-3 text-2xl font-black text-brand-ink">Unterstuetzerbereich ohne Druck</h2>
            <div className="mt-5 grid gap-3">
              {supportIdeas.map((idea) => (
                <div key={idea.title} className="rounded-xl border border-slate-200 bg-white p-4">
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                      <p className="font-black text-brand-ink">{idea.title}</p>
                      <p className="mt-2 text-sm leading-6 text-slate-600">{idea.description}</p>
                    </div>
                    <span className="rounded-xl bg-slate-100 px-3 py-2 text-xs font-black text-slate-600">Noch nicht aktiv</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-soft md:p-8">
          <div className="grid gap-6 md:grid-cols-3">
            <div>
              <p className="text-sm font-black uppercase tracking-wide text-brand-clay">Warum</p>
              <h2 className="mt-3 text-2xl font-black text-brand-ink">Fokus auf kleine Betriebe</h2>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                Viele Handwerker brauchen keine schwere Buchhaltungssoftware, sondern ein schnelles Werkzeug fuer saubere Dokumente.
              </p>
            </div>
            <div>
              <p className="text-sm font-black uppercase tracking-wide text-brand-clay">Wofuer</p>
              <h2 className="mt-3 text-2xl font-black text-brand-ink">Entwicklung und Betrieb</h2>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                Freiwillige Beitraege koennten spaeter Hosting, Wartung, PDF-Qualitaet, Datenschutz und neue Funktionen mittragen.
              </p>
            </div>
            <div>
              <p className="text-sm font-black uppercase tracking-wide text-brand-clay">Transparenz</p>
              <h2 className="mt-3 text-2xl font-black text-brand-ink">Keine versteckten Kosten</h2>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                Wenn spaeter Unterstuetzung moeglich wird, soll sie freiwillig, klar beschriftet und jederzeit ohne Einfluss auf die Nutzung sein.
              </p>
            </div>
          </div>
        </section>
      </section>
    </main>
  );
}
