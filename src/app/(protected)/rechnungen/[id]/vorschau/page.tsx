import Link from "next/link";
import { notFound } from "next/navigation";
import { DocumentPreview } from "@/components/document-preview";
import { PageHeader } from "@/components/page-header";
import { requireUser } from "@/lib/auth";
import { formatMoney } from "@/lib/money";
import { prisma } from "@/lib/prisma";

type InvoicePreviewPageProps = {
  params: Promise<{ id: string }>;
};

export default async function InvoicePreviewPage({ params }: InvoicePreviewPageProps) {
  const { id } = await params;
  const user = await requireUser();
  const [invoice, company] = await Promise.all([
    prisma.invoice.findFirst({
      where: { id, userId: user.id },
      include: { customer: true, items: { orderBy: { sortOrder: "asc" } } }
    }),
    prisma.companyProfile.findUnique({ where: { userId: user.id } })
  ]);

  if (!invoice) notFound();

  return (
    <>
      <PageHeader
        kicker="PDF-Vorschau"
        title={invoice.number}
        description={`${invoice.customer.name} - Gesamt ${formatMoney(invoice.totalGrossCents)}`}
        action={
          <>
            <Link href={`/rechnungen/${invoice.id}`} className="secondary-button">
              Zurueck
            </Link>
            <Link href={`/api/invoices/${invoice.id}/pdf`} className="primary-button">
              PDF herunterladen
            </Link>
          </>
        }
      />
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
    </>
  );
}
