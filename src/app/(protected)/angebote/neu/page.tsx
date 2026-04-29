import { DocumentForm } from "@/components/document-form";
import { Notice } from "@/components/notice";
import { PageHeader } from "@/components/page-header";
import { addDays } from "@/lib/dates";
import { defaultDocumentTexts } from "@/lib/document-texts";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createQuoteAction } from "@/server/actions/documents";

type NewQuotePageProps = {
  searchParams?: Promise<{ error?: string }>;
};

export default async function NewQuotePage({ searchParams }: NewQuotePageProps) {
  const params = await searchParams;
  const user = await requireUser();
  const [customers, company, calculations, templates] = await Promise.all([
    prisma.customer.findMany({ where: { userId: user.id }, orderBy: { name: "asc" } }),
    prisma.companyProfile.findUnique({ where: { userId: user.id } }),
    prisma.materialCalculation.findMany({ where: { userId: user.id }, orderBy: { updatedAt: "desc" } }),
    prisma.itemTemplate.findMany({ where: { userId: user.id, isActive: true }, orderBy: [{ kind: "asc" }, { title: "asc" }] })
  ]);

  return (
    <>
      <PageHeader kicker="Neues Dokument" title="Angebot erstellen" description="Schreibe ein Angebot mit automatischer Angebotsnummer." />
      {params?.error === "items" ? <Notice tone="error">Bitte lege mindestens eine Position mit Beschreibung an.</Notice> : null}
      {params?.error === "customer" ? <Notice tone="error">Bitte gib fuer den neuen Kunden mindestens Firma oder Name an.</Notice> : null}
      {params?.error === "customerEmail" ? <Notice tone="error">Bitte pruefe die E-Mail-Adresse des neuen Kunden.</Notice> : null}
      {params?.error === "customerVatId" ? <Notice tone="error">Bitte pruefe die UID/USt-ID des neuen Kunden.</Notice> : null}
      <DocumentForm
        kind="quote"
        customers={customers}
        action={createQuoteAction}
        defaultTaxRate={company?.defaultTaxRate ?? 20}
        calculations={calculations}
        templates={templates}
        initial={{
          quoteDate: new Date(),
          validUntil: addDays(new Date(), 14),
          status: "DRAFT",
          taxMode: company?.defaultTaxMode ?? "STANDARD",
          introText: company?.quoteIntroText ?? defaultDocumentTexts.quoteIntroText,
          outroText: company?.quoteOutroText ?? defaultDocumentTexts.quoteOutroText
        }}
      />
    </>
  );
}
