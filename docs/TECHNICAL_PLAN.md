# Technische Planung

## MVP-Ziel

Ein kostenloses, webbasiertes Angebots- und Rechnungstool fuer kleine Handwerksbetriebe.

Der Fokus liegt auf schneller Bedienung:

- Registrieren und einloggen
- Firmendaten speichern
- Kunden verwalten
- Angebote schreiben
- Angebote in Rechnungen umwandeln
- Rechnungen als PDF herunterladen
- Dokumente vor PDF-Download als Webvorschau pruefen
- Offene und ueberfaellige Rechnungen sehen
- Erinnerungstexte in mehreren Stufen manuell kopieren
- Artikel-/Leistungskatalog pflegen
- Material- und Arbeitskalkulationen vorbereiten und bearbeiten
- Kunden- und Rechnungsdaten als CSV exportieren
- Support-Hinweis ohne Zahlungsintegration

## Architektur

- Next.js App Router fuer UI, Routing und API-Routen
- TypeScript fuer Wartbarkeit
- Tailwind CSS fuer schnelles, responsives Styling
- Prisma als Datenzugriffsschicht
- SQLite fuer lokale Entwicklung
- spaeterer Wechsel auf PostgreSQL ueber Prisma moeglich
- eigene lokale Auth mit Passwort-Hash und HTTP-only Session-Cookie
- PDF-Erzeugung serverseitig ueber API-Routen

## Datenschutzannahmen

- Jeder Nutzer besitzt seine eigenen Daten.
- Datenzugriffe werden serverseitig immer ueber `userId` eingeschraenkt.
- Passwoerter werden mit PBKDF2 gehasht.
- Sessions liegen als Hash in der Datenbank und als HTTP-only Cookie im Browser.
- Es werden keine Zahlungsdaten verarbeitet.

## Ordnerstruktur

```text
prisma/
  schema.prisma
docs/
  TECHNICAL_PLAN.md
src/
  app/
    (auth)/
      login/
      register/
    (marketing)/
    (protected)/
      dashboard/
      firma/
      kunden/
      angebote/
      rechnungen/
      kalkulation/
    api/
      quotes/[id]/pdf/
      invoices/[id]/pdf/
      export/
    support/
    datenschutz/
    impressum/
    globals.css
    layout.tsx
  components/
  lib/
  server/
    actions/
```

## Datenmodell

Das Prisma-Modell besteht aus:

- `User`
- `Session`
- `CompanyProfile`
- `Customer`
- `Quote`
- `QuoteItem`
- `Invoice`
- `InvoiceItem`
- `MaterialCalculation`
- `NumberSequence`
- `ItemTemplate` fuer Artikel und Leistungen

Geldwerte werden als Cent-Betraege gespeichert, zum Beispiel `totalGrossCents`.

Statuswerte werden fuer SQLite als Strings gespeichert:

- Angebot: `DRAFT`, `SENT`, `ACCEPTED`, `REJECTED`
- Rechnung: `DRAFT`, `OPEN`, `PAID`, `OVERDUE`, `CANCELLED`

Katalogwerte fuer `ItemTemplate.kind`:

- `SERVICE` fuer Leistungen
- `ARTICLE` fuer Material/Artikel

Steuerfaelle werden ebenfalls als Strings gespeichert:

- `STANDARD`
- `SMALL_BUSINESS`
- `REVERSE_CHARGE`
- `TAX_EXEMPT`
- `INTRA_EU`

## Bewusste MVP-Grenzen

- Keine Steuerberatung
- Keine Garantie auf vollstaendige Rechtssicherheit
- Kein automatischer E-Mail-Versand
- Kein Zahlungsanbieter
- Keine Mehrmandanten-/Teamverwaltung
- Keine automatische rechtliche Entscheidung ueber den korrekten Steuerfall
- Logo-Speicherung im MVP lokal in SQLite, nicht als Produktions-Dateispeicher

## Steuerliche Prueflogik fuer Oesterreich

Die App verwendet fuer den lokalen MVP konservative Hinweise auf typische Rechnungsmerkmale, ohne Rechtsberatung zu ersetzen.

Geprueft und technisch unterstuetzt werden:

- Name und Anschrift des leistenden Unternehmens
- Name und Anschrift des Leistungsempfaengers
- fortlaufende Rechnungsnummer
- Ausstellungsdatum
- Leistungsdatum oder Leistungszeitraum
- Beschreibung, Menge, Einheit, Netto-Einzelpreis und Steuersatz je Position
- Steuerbetrag und Bruttobetrag
- Steueraufschluesselung nach Steuersatz im PDF
- explizite Auswahl des Steuerfalls pro Dokument
- Steuerhinweis im PDF bei nicht regulaeren Steuerfaellen
- Hinweis, wenn die UID/USt-ID des Ausstellers bei steuerpflichtigen Rechnungen fehlt
- Hinweis, wenn bei Rechnungen ueber 10.000 EUR die UID/USt-ID des unternehmerischen Empfaengers fehlen kann

Referenzquellen fuer die MVP-Pruefung:

- USP/BMF: Formerfordernisse einer Rechnung: https://www.usp.gv.at/themen/steuern-finanzen/umsatzsteuer-ueberblick/weitere-informationen-zur-umsatzsteuer/vorsteuerabzug-und-rechnung/formerfordernisse.html
- USP/BMF: Rechnung: https://www.usp.gv.at/themen/steuern-finanzen/umsatzsteuer-ueberblick/rechnung.html
- USP/BMF: Kleinbetragsrechnungen: https://www.usp.gv.at/themen/steuern-finanzen/umsatzsteuer-ueberblick/weitere-informationen-zur-umsatzsteuer/vorsteuerabzug-und-rechnung/kleinbetragsrechnungen.html
- USP/BMF: Steuersaetze und Steuerbefreiungen: https://www.usp.gv.at/themen/steuern-finanzen/umsatzsteuer-ueberblick/steuersaetze-und-steuerbefreiungen-der-umsatzsteuer.html

Nicht automatisiert entschieden werden:

- ob ein konkreter Umsatz steuerfrei, reverse-charge-pflichtig, innergemeinschaftlich oder kleinunternehmerbefreit ist
- ob ein konkreter ermaessigter Steuersatz von 10 Prozent oder 13 Prozent angewendet werden darf
- ob branchenspezifische Sonderpflichten bestehen
- ob der konkrete Rechnungsempfaenger als Unternehmer handelt

## Dokumentenschutz und Nummernkreise

- Angebote und Rechnungen erhalten Nummern ueber `NumberSequence` pro Nutzer, Dokumentart und Jahr.
- Die Standardpraefixe sind `ANG` und `RE`, koennen aber in den Firmendaten angepasst werden.
- Beim Wechsel aus `DRAFT` wird `lockedAt` gesetzt.
- Gesperrte Dokumente werden als Vorschau angezeigt und koennen nicht mehr inhaltlich bearbeitet werden.
- Zahlungsstatusaktionen wie "bezahlt markieren" bleiben fuer Rechnungen weiterhin moeglich.

## Exporte und Rechtstexte

- `/api/export/customers` exportiert Kunden als CSV.
- `/api/export/invoices` exportiert Rechnungen als CSV.
- `/datenschutz` und `/impressum` sind Platzhalterseiten fuer ein spaeteres oeffentliches Deployment.
- Diese Platzhalter sind nicht rechtlich final und muessen vor Produktion individuell geprueft werden.
