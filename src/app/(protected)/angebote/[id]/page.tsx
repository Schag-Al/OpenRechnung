import Link from "next/link";
import { notFound } from "next/navigation";
import { DocumentForm } from "@/components/document-form";
import { DocumentPreview } from "@/components/document-preview";
import { DocumentWarningList } from "@/components/document-warning-list";
import { Notice } from "@/components/notice";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { quoteWarnings } from "@/lib/document-checks";
import { toInitialLineItems } from "@/lib/document-mappers";
import { formatMoney } from "@/lib/money";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { convertQuoteToInvoiceAction, updateQuoteAction } from "@/server/actions/documents";

type QuoteDetailPageProps = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ error?: string; saved?: string }>;
};

export default async function QuoteDetailPage({ params, searchParams }: QuoteDetailPageProps) {
  const { id } = await params;
  const query = await searchParams;
  const user = await requireUser();
  const [quote, customers, company, calculations, templates] = await Promise.all([
    prisma.quote.findFirst({
      where: { id, userId: user.id },
      include: { items: { orderBy: { sortOrder: "asc" } }, customer: true }
    }),
    prisma.customer.findMany({ where: { userId: user.id }, orderBy: { name: "asc" } }),
    prisma.companyProfile.findUnique({ where: { userId: user.id } }),
    prisma.materialCalculation.findMany({ where: { userId: user.id }, orderBy: { updatedAt: "desc" } }),
    prisma.itemTemplate.findMany({ where: { userId: user.id, isActive: true }, orderBy: [{ kind: "asc" }, { title: "asc" }] })
  ]);

  if (!quote) notFound();

  const warnings = quoteWarnings(quote, company, quote.customer);
  const locked = quote.status !== "DRAFT" || Boolean(quote.lockedAt);

  return (
    <>
      <PageHeader
        kicker="Angebot"
        title={quote.number}
        description={`${quote.customer.name} - Gesamt ${formatMoney(quote.totalGrossCents)}`}
        action={
          <>
            <Link href={`/angebote/${quote.id}/vorschau`} className="primary-button">
              Vorschau pruefen
            </Link>
            <Link href={`/api/quotes/${quote.id}/pdf`} className="secondary-button">
              PDF
            </Link>
            <form action={convertQuoteToInvoiceAction}>
              <input type="hidden" name="id" value={quote.id} />
              <button className="secondary-button">In Rechnung umwandeln</button>
            </form>
          </>
        }
      />
      <div className="mb-4">
        <StatusBadge type="quote" status={quote.status} />
      </div>
      {query?.saved ? <Notice tone="success">Angebot gespeichert.</Notice> : null}
      {query?.error === "items" ? <Notice tone="error">Bitte lege mindestens eine Position mit Beschreibung an.</Notice> : null}
      {query?.error === "customer" ? <Notice tone="error">Bitte gib fuer den neuen Kunden mindestens Firma oder Name an.</Notice> : null}
      {query?.error === "customerEmail" ? <Notice tone="error">Bitte pruefe die E-Mail-Adresse des neuen Kunden.</Notice> : null}
      {query?.error === "customerVatId" ? <Notice tone="error">Bitte pruefe die UID/USt-ID des neuen Kunden.</Notice> : null}
      {query?.error === "locked" ? <Notice tone="warning">Dieses Angebot ist bereits gesperrt und kann nicht mehr bearbeitet werden.</Notice> : null}
      {locked ? (
        <Notice tone="info">
          Dieses Angebot ist nicht mehr veraenderbar, weil es bereits versendet, angenommen oder abgelehnt wurde. Nutze die Vorschau und den PDF-Download fuer den Versand.
        </Notice>
      ) : null}
      <DocumentWarningList title="Angebotscheck" warnings={warnings} />
      {locked ? (
        <DocumentPreview
          kind="Angebot"
          number={quote.number}
          company={company}
          customer={quote.customer}
          date={quote.quoteDate}
          secondaryDateLabel="Gueltig bis"
          secondaryDate={quote.validUntil}
          taxMode={quote.taxMode}
          items={quote.items}
          subtotalNetCents={quote.subtotalNetCents}
          taxTotalCents={quote.taxTotalCents}
          totalGrossCents={quote.totalGrossCents}
          introText={quote.introText}
          outroText={quote.outroText}
          note={quote.note}
        />
      ) : (
        <DocumentForm
          kind="quote"
          customers={customers}
          action={updateQuoteAction}
          defaultTaxRate={company?.defaultTaxRate ?? 20}
          calculations={calculations}
          templates={templates}
          initial={{
            id: quote.id,
            customerId: quote.customerId,
            status: quote.status,
            taxMode: quote.taxMode,
            quoteDate: quote.quoteDate,
            validUntil: quote.validUntil,
            introText: quote.introText,
            outroText: quote.outroText,
            note: quote.note,
            items: toInitialLineItems(quote.items)
          }}
        />
      )}
    </>
  );
}
