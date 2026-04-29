import Link from "next/link";
import { DashboardTutorial } from "@/components/dashboard-tutorial";
import { Notice } from "@/components/notice";
import { OpenRechnungLogo } from "@/components/openrechnung-logo";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { formatDate } from "@/lib/dates";
import { effectiveInvoiceStatus } from "@/lib/invoice-status";
import { formatMoney } from "@/lib/money";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isTestModeWithoutLogin } from "@/lib/test-mode";

type DashboardPageProps = {
  searchParams?: Promise<{ demo?: string }>;
};

function DashboardAccessGate() {
  const testMode = isTestModeWithoutLogin();

  return (
    <main className="min-h-screen bg-brand-sand px-4 py-10">
      <section className="mx-auto grid max-w-6xl gap-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-soft md:grid-cols-[1fr_360px] md:p-10">
        <div>
          <OpenRechnungLogo />
          <p className="mt-8 text-sm font-black uppercase tracking-wide text-brand-clay">Dashboard</p>
          <h1 className="mt-3 max-w-2xl text-4xl font-black tracking-tight text-brand-ink md:text-5xl">
            Einloggen, registrieren oder direkt ins Testdashboard.
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">
            Das echte Dashboard ist geschuetzt. Fuer den lokalen Testbetrieb kannst du aber weiterhin ohne Account ein
            vorbereitetes Testkonto mit Beispielkunden, Angeboten und Rechnungen oeffnen.
          </p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <Link href="/login" className="primary-button">
              Einloggen
            </Link>
            <Link href="/register" className="secondary-button">
              Kostenlos registrieren
            </Link>
            {testMode ? (
              <Link href="/testdashboard" className="secondary-button">
                Testdashboard oeffnen
              </Link>
            ) : null}
          </div>
        </div>

        <div className="rounded-2xl border border-brand-clay/20 bg-brand-sand p-5">
          <p className="text-sm font-black uppercase tracking-wide text-brand-moss">Testbetrieb</p>
          <div className="mt-4 space-y-3 text-sm leading-6 text-slate-700">
            <p className="rounded-xl bg-white p-4 shadow-sm">Demo-Daten werden beim neuen Browser-Start frisch geladen.</p>
            <p className="rounded-xl bg-white p-4 shadow-sm">Login und Registrierung bleiben trotzdem normal testbar.</p>
            <p className="rounded-xl bg-white p-4 shadow-sm">Das Testdashboard ist nur lokal fuer die Entwicklung gedacht.</p>
          </div>
        </div>
      </section>
    </main>
  );
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const params = await searchParams;
  const user = await getCurrentUser();
  if (!user) return <DashboardAccessGate />;

  const [invoices, quotes, company] = await Promise.all([
    prisma.invoice.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      include: { customer: true },
      take: 50
    }),
    prisma.quote.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      include: { customer: true },
      take: 5
    }),
    prisma.companyProfile.findUnique({ where: { userId: user.id } })
  ]);

  const openInvoices = invoices.filter((invoice) => ["OPEN", "OVERDUE"].includes(effectiveInvoiceStatus(invoice.status, invoice.dueDate)));
  const overdueInvoices = invoices.filter((invoice) => effectiveInvoiceStatus(invoice.status, invoice.dueDate) === "OVERDUE");
  const openAmount = openInvoices.reduce((sum, invoice) => sum + invoice.totalGrossCents, 0);
  const missingCompanyBasics = !company?.companyName || !company.street || !company.postalCode || !company.city || !company.iban;
  const draftQuotes = quotes.filter((quote) => quote.status === "DRAFT");
  const attentionItems = [
    ...overdueInvoices.slice(0, 3).map((invoice) => ({
      title: `${invoice.number} ist ueberfaellig`,
      description: `${invoice.customer.name} - ${formatMoney(invoice.totalGrossCents)} - faellig ${formatDate(invoice.dueDate)}`,
      href: `/rechnungen/${invoice.id}`,
      tone: "red"
    })),
    ...(missingCompanyBasics
      ? [
          {
            title: "Firmendaten vervollstaendigen",
            description: "Adresse und IBAN machen PDFs und Rechnungen deutlich belastbarer.",
            href: "/firma",
            tone: "amber"
          }
        ]
      : []),
    ...draftQuotes.slice(0, 2).map((quote) => ({
      title: `${quote.number} ist noch Entwurf`,
      description: `${quote.customer.name} - ${formatMoney(quote.totalGrossCents)}`,
      href: `/angebote/${quote.id}`,
      tone: "neutral"
    }))
  ];

  return (
    <>
      {isTestModeWithoutLogin() ? <DashboardTutorial /> : null}

      <div data-tour="dashboard-header">
        <PageHeader
          kicker="Ueberblick"
          title={`Willkommen${company?.companyName ? ` bei ${company.companyName}` : ""}`}
          description="Dein schneller Blick auf offene Rechnungen, letzte Angebote und konkrete Aufgaben."
          action={
            <>
              <Link href="/angebote/neu" data-tour="new-quote" className="primary-button">
                Neues Angebot
              </Link>
              <Link href="/rechnungen/neu" data-tour="new-invoice" className="secondary-button">
                Neue Rechnung
              </Link>
            </>
          }
        />
      </div>
      {params?.demo === "reset" ? (
        <Notice tone="success">
          Testkonto frisch geladen. Aenderungen bleiben nur fuer diese Browser-Sitzung erhalten und werden beim naechsten neuen Oeffnen zurueckgesetzt.
        </Notice>
      ) : null}

      {overdueInvoices.length > 0 ? (
        <section className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-5">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-bold uppercase tracking-wide text-red-700">Dringend</p>
              <h2 className="mt-1 text-2xl font-black text-red-950">{overdueInvoices.length} ueberfaellige Rechnung(en)</h2>
              <p className="mt-1 text-sm text-red-800">Oeffne die Rechnung und erstelle direkt einen passenden Erinnerungstext.</p>
            </div>
            <Link href="/rechnungen?status=OVERDUE" className="rounded-xl bg-red-700 px-5 py-3 font-bold text-white hover:bg-red-900">
              Anzeigen
            </Link>
          </div>
        </section>
      ) : null}

      <div data-tour="dashboard-stats" className="grid gap-4 md:grid-cols-3">
        <div className="card">
          <p className="text-sm font-bold text-slate-500">Offene Rechnungen</p>
          <p className="mt-3 text-4xl font-black text-brand-ink">{openInvoices.length}</p>
        </div>
        <div className="card">
          <p className="text-sm font-bold text-slate-500">Summe offen</p>
          <p className="mt-3 text-4xl font-black text-brand-ink">{formatMoney(openAmount)}</p>
        </div>
        <div className="card">
          <p className="text-sm font-bold text-slate-500">Ueberfaellig</p>
          <p className="mt-3 text-4xl font-black text-red-700">{overdueInvoices.length}</p>
        </div>
      </div>

      <section data-tour="attention-list" className="card mt-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-black text-brand-ink">Was braucht Aufmerksamkeit?</h2>
        </div>
        {attentionItems.length === 0 ? (
          <p className="rounded-2xl bg-emerald-50 p-4 text-sm font-semibold text-emerald-800">Alles ruhig. Keine offenen Warnpunkte im Dashboard.</p>
        ) : (
          <div className="grid gap-3">
            {attentionItems.map((item) => (
              <Link
                key={`${item.href}-${item.title}`}
                href={item.href}
                className={`block rounded-2xl border p-4 ${
                  item.tone === "red"
                    ? "border-red-200 bg-red-50"
                    : item.tone === "amber"
                      ? "border-amber-200 bg-amber-50"
                      : "border-slate-100 bg-white"
                }`}
              >
                <p className="font-black text-brand-ink">{item.title}</p>
                <p className="mt-1 text-sm text-slate-600">{item.description}</p>
              </Link>
            ))}
          </div>
        )}
      </section>

      <div data-tour="recent-documents" className="mt-6 grid gap-6 xl:grid-cols-2">
        <section className="card">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-black text-brand-ink">Letzte Angebote</h2>
            <Link href="/angebote" className="text-sm font-bold text-brand-clay">
              Alle anzeigen
            </Link>
          </div>
          <div className="space-y-3">
            {quotes.length === 0 ? (
              <p className="text-sm text-slate-500">Noch keine Angebote vorhanden.</p>
            ) : (
              quotes.map((quote) => (
                <Link key={quote.id} href={`/angebote/${quote.id}`} className="block rounded-2xl border border-slate-100 p-4 hover:bg-brand-sand/60">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-bold text-brand-ink">{quote.number}</p>
                      <p className="text-sm text-slate-500">{quote.customer.name}</p>
                    </div>
                    <StatusBadge type="quote" status={quote.status} />
                  </div>
                </Link>
              ))
            )}
          </div>
        </section>

        <section className="card">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-black text-brand-ink">Letzte Rechnungen</h2>
            <Link href="/rechnungen" className="text-sm font-bold text-brand-clay">
              Alle anzeigen
            </Link>
          </div>
          <div className="space-y-3">
            {invoices.slice(0, 5).length === 0 ? (
              <p className="text-sm text-slate-500">Noch keine Rechnungen vorhanden.</p>
            ) : (
              invoices.slice(0, 5).map((invoice) => (
                <Link key={invoice.id} href={`/rechnungen/${invoice.id}`} className="block rounded-2xl border border-slate-100 p-4 hover:bg-brand-sand/60">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-bold text-brand-ink">{invoice.number}</p>
                      <p className="text-sm text-slate-500">
                        {invoice.customer.name} - faellig {formatDate(invoice.dueDate)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-black text-brand-ink">{formatMoney(invoice.totalGrossCents)}</p>
                      <StatusBadge type="invoice" status={effectiveInvoiceStatus(invoice.status, invoice.dueDate)} />
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </section>
      </div>
    </>
  );
}
