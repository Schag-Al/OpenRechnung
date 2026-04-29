import Link from "next/link";
import { notFound } from "next/navigation";
import { DocumentPreview } from "@/components/document-preview";
import { PageHeader } from "@/components/page-header";
import { requireUser } from "@/lib/auth";
import { formatMoney } from "@/lib/money";
import { prisma } from "@/lib/prisma";

type QuotePreviewPageProps = {
  params: Promise<{ id: string }>;
};

export default async function QuotePreviewPage({ params }: QuotePreviewPageProps) {
  const { id } = await params;
  const user = await requireUser();
  const [quote, company] = await Promise.all([
    prisma.quote.findFirst({
      where: { id, userId: user.id },
      include: { customer: true, items: { orderBy: { sortOrder: "asc" } } }
    }),
    prisma.companyProfile.findUnique({ where: { userId: user.id } })
  ]);

  if (!quote) notFound();

  return (
    <>
      <PageHeader
        kicker="PDF-Vorschau"
        title={quote.number}
        description={`${quote.customer.name} - Gesamt ${formatMoney(quote.totalGrossCents)}`}
        action={
          <>
            <Link href={`/angebote/${quote.id}`} className="secondary-button">
              Zurueck
            </Link>
            <Link href={`/api/quotes/${quote.id}/pdf`} className="primary-button">
              PDF herunterladen
            </Link>
          </>
        }
      />
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
    </>
  );
}
