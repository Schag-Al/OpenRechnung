import Link from "next/link";
import { notFound } from "next/navigation";
import { DocumentForm } from "@/components/document-form";
import { DocumentPreview } from "@/components/document-preview";
import { DocumentWarningList } from "@/components/document-warning-list";
import { Notice } from "@/components/notice";
import { PageHeader } from "@/components/page-header";
import { ReminderBox } from "@/components/reminder-box";
import { StatusBadge } from "@/components/status-badge";
import { invoiceWarnings } from "@/lib/document-checks";
import { toInitialLineItems } from "@/lib/document-mappers";
import { effectiveInvoiceStatus } from "@/lib/invoice-status";
import { formatMoney } from "@/lib/money";
import { buildReminderText, type ReminderStage } from "@/lib/reminders";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { markInvoicePaidAction, updateInvoiceAction } from "@/server/actions/documents";

type InvoiceDetailPageProps = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ error?: string; saved?: string }>;
};

export default async function InvoiceDetailPage({ params, searchParams }: InvoiceDetailPageProps) {
  const { id } = await params;
  const query = await searchParams;
  const user = await requireUser();
  const [invoice, customers, company, calculations, templates] = await Promise.all([
    prisma.invoice.findFirst({
      where: { id, userId: user.id },
      include: { items: { orderBy: { sortOrder: "asc" } }, customer: true }
    }),
    prisma.customer.findMany({ where: { userId: user.id }, orderBy: { name: "asc" } }),
    prisma.companyProfile.findUnique({ where: { userId: user.id } }),
    prisma.materialCalculation.findMany({ where: { userId: user.id }, orderBy: { updatedAt: "desc" } }),
    prisma.itemTemplate.findMany({ where: { userId: user.id, isActive: true }, orderBy: [{ kind: "asc" }, { title: "asc" }] })
  ]);

  if (!invoice) notFound();

  const effectiveStatus = effectiveInvoiceStatus(invoice.status, invoice.dueDate);
  const overdue = effectiveStatus === "OVERDUE";
  const warnings = invoiceWarnings(invoice, company, invoice.customer);
  const locked = invoice.status !== "DRAFT" || Boolean(invoice.lockedAt);
  const reminderInput = {
    customerName: invoice.customer.name,
    invoiceNumber: invoice.number,
    invoiceDate: invoice.invoiceDate,
    dueDate: invoice.dueDate,
    amountCents: invoice.totalGrossCents,
    companyName: company?.companyName
  };
  const reminderStages: ReminderStage[] = ["friendly", "second", "final"];
  const reminders = overdue
    ? reminderStages.map((stage) => ({
        stage,
        text: buildReminderText(reminderInput, stage)
      }))
    : [];

  return (
    <>
      <PageHeader
        kicker="Rechnung"
        title={invoice.number}
        description={`${invoice.customer.name} - Gesamt ${formatMoney(invoice.totalGrossCents)}`}
        action={
          <>
            <Link href={`/rechnungen/${invoice.id}/vorschau`} className="primary-button">
              Vorschau pruefen
            </Link>
            <Link href={`/api/invoices/${invoice.id}/pdf`} className="secondary-button">
              PDF
            </Link>
            {invoice.status !== "PAID" ? (
              <form action={markInvoicePaidAction}>
                <input type="hidden" name="id" value={invoice.id} />
                <button className="secondary-button">Bezahlt</button>
              </form>
            ) : null}
          </>
        }
      />
      <div className="mb-4">
        <StatusBadge type="invoice" status={effectiveStatus} />
      </div>
      {query?.saved ? <Notice tone="success">Rechnung gespeichert.</Notice> : null}
      {query?.error === "items" ? <Notice tone="error">Bitte lege mindestens eine Position mit Beschreibung an.</Notice> : null}
      {query?.error === "customer" ? <Notice tone="error">Bitte gib fuer den neuen Kunden mindestens Firma oder Name an.</Notice> : null}
      {query?.error === "customerEmail" ? <Notice tone="error">Bitte pruefe die E-Mail-Adresse des neuen Kunden.</Notice> : null}
      {query?.error === "customerVatId" ? <Notice tone="error">Bitte pruefe die UID/USt-ID des neuen Kunden.</Notice> : null}
      {query?.error === "locked" ? <Notice tone="warning">Diese Rechnung ist bereits gesperrt und kann nicht mehr bearbeitet werden.</Notice> : null}
      {locked ? (
        <Notice tone="info">
          Diese Rechnung ist nicht mehr veraenderbar, weil sie nicht mehr im Entwurf ist. Zahlungsstatus und Erinnerungstexte bleiben weiterhin nutzbar.
        </Notice>
      ) : null}
      <DocumentWarningList title="Rechnungscheck" warnings={warnings} />
      {reminders.length > 0 ? (
        <div className="mb-6">
          <ReminderBox reminders={reminders} />
        </div>
      ) : null}
      {locked ? (
        <DocumentPreview
          kind="Rechnung"
          number={invoice.number}
          company={company}
          customer={invoice.customer}
          date={invoice.invoiceDate}
          secondaryDateLabel="Leistungsdatum"
          secondaryDate={invoice.serviceDate}
          servicePeriod={invoice.servicePeriod}
          paymentDueDate={invoice.dueDate}
          taxMode={invoice.taxMode}
          items={invoice.items}
          subtotalNetCents={invoice.subtotalNetCents}
          taxTotalCents={invoice.taxTotalCents}
          totalGrossCents={invoice.totalGrossCents}
          introText={invoice.introText}
          outroText={invoice.outroText}
          note={invoice.note}
        />
      ) : (
        <DocumentForm
          kind="invoice"
          customers={customers}
          action={updateInvoiceAction}
          defaultTaxRate={company?.defaultTaxRate ?? 20}
          calculations={calculations}
          templates={templates}
          initial={{
            id: invoice.id,
            customerId: invoice.customerId,
            status: effectiveStatus,
            taxMode: invoice.taxMode,
            invoiceDate: invoice.invoiceDate,
            serviceDate: invoice.serviceDate,
            servicePeriod: invoice.servicePeriod,
            dueDate: invoice.dueDate,
            introText: invoice.introText,
            outroText: invoice.outroText,
            note: invoice.note,
            items: toInitialLineItems(invoice.items)
          }}
        />
      )}
    </>
  );
}
