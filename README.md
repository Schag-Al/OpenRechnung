# OpenRechnung

Kostenloses webbasiertes Angebots- und Rechnungstool fuer kleine Handwerksbetriebe.

Das MVP ist bewusst schlank gehalten: Kunden, Firmendaten, Angebote, Rechnungen, Vorschau vor PDF-Download, offene Rechnungen, Erinnerungstexte, Artikel-/Leistungskatalog, Materialkalkulation, CSV-Export und eine vorbereitete Support-Seite.

## Wichtige Hinweise

- Gratis fuer immer ist das Produktversprechen fuer Nutzer.
- Es gibt im MVP keine Zahlungsintegration.
- Die Seite `/support` ist nur ein Platzhalter fuer freiwillige Unterstuetzerbeitraege.
- Das Tool ersetzt keine Steuerberatung.
- Es wird keine Aussage wie "100 % rechtssicher" getroffen.
- Der Rechnungscheck ist eine technische Plausibilitaetspruefung fuer typische oesterreichische Rechnungsmerkmale.
- Steuerfaelle sind bewusst explizit waehlbar, werden aber nicht automatisch rechtlich bewertet.
- Datenschutz und Impressum sind als Platzhalter vorbereitet und muessen vor einem oeffentlichen Betrieb final geprueft werden.
- Lokale Entwicklung nutzt SQLite.
- Produktion ist fuer PostgreSQL vorbereitet.

## Tech Stack

- Next.js
- TypeScript
- Tailwind CSS
- Prisma
- SQLite lokal
- PostgreSQL in Produktion
- eigene lokale E-Mail/Passwort-Authentifizierung mit Session-Cookie
- PDF-Erzeugung mit PDFKit inklusive Logo/Branding

## Lokaler Start

Voraussetzung: Node.js mit npm ist installiert.

```bash
npm install
npx prisma migrate dev
npm run dev
```

Danach im Browser oeffnen:

```text
http://localhost:3000
```

## Testmodus ohne Login

Fuer den lokalen Testbetrieb ist in `.env` aktuell aktiviert:

```text
TEST_MODE_WITHOUT_LOGIN="true"
```

Damit ist ein bewusst startbares Testdashboard verfuegbar:

- `/` bleibt die normale Startseite mit Login, Registrierung und Testdashboard-Link.
- `/dashboard` zeigt ohne aktive Sitzung eine Auswahl: einloggen, registrieren oder Testdashboard oeffnen.
- `/testdashboard` aktiviert den lokalen Demo-Nutzer `demo@openrechnung.local` und leitet danach ins Dashboard.
- `/login` und `/register` bleiben auch im Testmodus erreichbar.
- Geschuetzte Demo-Bereiche verwenden nach Klick auf `/testdashboard` den lokalen Demo-Nutzer `demo@openrechnung.local`.
- Demo-Firmendaten, Demo-Kunden, Demo-Angebote, Demo-Rechnungen, Demo-Kalkulationen sowie Artikel und Leistungen werden automatisch angelegt.
- PDF-Downloads funktionieren im Testdashboard mit der lokalen Demo-Sitzung.
- Beim ersten Oeffnen einer neuen Browser-Sitzung wird das Testkonto automatisch zurueckgesetzt.
- Aenderungen bleiben innerhalb derselben Browser-Sitzung erhalten. Nach dem Schliessen und erneuten Oeffnen wird wieder frisch geladen.
- Der Reset nutzt `sessionStorage`; technisch passiert das Zuruecksetzen beim naechsten Oeffnen, nicht in dem Moment, in dem der Browser geschlossen wird.

Das Testkonto enthaelt realistische Beispieldaten:

- gefuellte Firmendaten fuer einen Handwerksbetrieb
- B2B- und B2C-Kunden
- Angebote mit Status Entwurf, Gesendet, Angenommen und Abgelehnt
- Rechnungen mit Status Entwurf, Offen, Bezahlt, Ueberfaellig und Storniert
- regulaere Umsatzsteuer und Reverse-Charge-Testfall
- Materialkalkulationen, Artikel und Leistungen

Um echte Authentifizierung wieder zu aktivieren:

```text
TEST_MODE_WITHOUT_LOGIN="false"
```

## Nuetzliche Befehle

```bash
npm run dev
npm run build
npm run vercel-build
npm run typecheck
npm run test:unit
npm run test:smoke
npm run db:studio
```

`npm run test:smoke` erwartet einen laufenden lokalen Server unter `http://127.0.0.1:3000`.

## Manuelle MVP-Teststrecke

Im lokalen Testmodus:

1. `/dashboard` oeffnen und Demo-Kennzahlen pruefen.
2. `/kunden` oeffnen und Demo-Kunden pruefen.
3. `/angebote` oeffnen und `ANG-2026-DEMO` anklicken.
4. Angebotsvorschau oeffnen und danach Angebots-PDF herunterladen.
5. Ein neues Angebot erstellen, Steuerfall waehlen und einen Artikel, eine Leistung oder eine Kalkulation als Position uebernehmen.
6. Angebot als gesendet speichern und pruefen, dass es danach gesperrt ist.
7. Angebot in eine Rechnung umwandeln.
8. `/rechnungen` oeffnen, Suche/Statusfilter und CSV-Export pruefen.
9. `RE-2026-DEMO-OFFEN` oeffnen und Erinnerungstexte in mehreren Stufen kopieren.
10. Rechnungsvorschau oeffnen und Rechnungs-PDF herunterladen.
11. Eine Rechnung als bezahlt markieren.
12. `/kunden` oeffnen, Suche und Kundendetail-Historie pruefen.
13. `/kalkulation` oeffnen, neue Artikel, Leistungen und Kalkulationen speichern, bearbeiten und Loeschbestaetigung pruefen.
14. `/datenschutz`, `/impressum` und `/support` oeffnen.

Mit echter Authentifizierung:

1. `TEST_MODE_WITHOUT_LOGIN="false"` setzen.
2. Server neu starten.
3. Account registrieren.
4. Firmendaten und Kunden manuell anlegen.
5. Angebot, Rechnung, PDF und Erinnerungstext wie oben testen.

## Datenschutz- und Architekturannahmen

- Jeder Nutzer sieht nur seine eigenen Daten.
- Alle Kunden, Angebote, Rechnungen, Artikel, Leistungen und Kalkulationen sind an den angemeldeten Nutzer gebunden.
- Passwoerter werden nicht im Klartext gespeichert.
- Sessions werden als HTTP-only Cookie gespeichert.
- Geldwerte werden intern als Cent-Betraege gespeichert, um Rundungsfehler zu reduzieren.
- Nummern werden pro Nutzer und Jahr ueber eigene Nummernkreise erzeugt, standardmaessig `ANG-JAHR-0001` und `RE-JAHR-0001`.
- Dokumente werden nach dem Wechsel aus dem Entwurfsstatus gegen nachtraegliche Bearbeitung gesperrt.
- Logo-Dateien werden im lokalen MVP als Data-URL in SQLite gespeichert. Fuer Produktion sollte Dateispeicher oder Objektspeicher verwendet werden.

## Deployment auf Vercel

Das Projekt ist fuer Vercel + PostgreSQL vorbereitet. Lokal bleibt SQLite aktiv, fuer Vercel wird `prisma/schema.postgres.prisma` verwendet.

Empfohlener Ablauf:

1. Repository bei GitHub hochladen.
2. PostgreSQL-Datenbank bei Neon, Supabase oder Prisma Postgres erstellen.
3. Repository bei Vercel importieren.
4. In Vercel diese Environment-Variablen setzen:

```text
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE?sslmode=require"
TEST_MODE_WITHOUT_LOGIN="false"
```

5. Deployment starten.

Vercel nutzt durch `vercel.json` automatisch:

```bash
npm run vercel-build
```

Dabei wird das PostgreSQL-Schema mit `prisma db push` angewendet, der Prisma Client fuer PostgreSQL erzeugt und danach Next.js gebaut. Fuer ein spaeteres produktives System sollte `db push` durch saubere PostgreSQL-Migrationen ersetzt werden.

## Steuerliche Pruefung im MVP

Die App prueft und zeigt Warnungen fuer typische Rechnungsmerkmale:

- unvollstaendige Firmenanschrift
- unvollstaendige Kundenanschrift
- fehlende UID/USt-ID des Ausstellers bei steuerpflichtigen Rechnungen
- moeglicherweise fehlende Empfaenger-UID bei Rechnungen ueber 10.000 EUR
- fehlendes Leistungsdatum oder fehlender Leistungszeitraum
- fehlendes Rechnungsdatum, Faelligkeitsdatum oder fehlende Nummer

Die PDF-Ausgabe zeigt Netto, Steuer und Brutto. Eine Steueraufschluesselung nach Steuersatz wird nur gezeigt, sofern Umsatzsteuer ausgewiesen wird. Die rechtliche Einordnung eines konkreten Falls muss trotzdem durch den Nutzer oder eine fachkundige Stelle erfolgen.

## Geplante Erweiterungen nach dem MVP

- E-Mail-Versand fuer Rechnungserinnerungen.
- Datei-/Objektspeicher fuer Logos und Anlagen.
- Freiwilliger Support-/Spendenbereich ohne Pflichtabo.
