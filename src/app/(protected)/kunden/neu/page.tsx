import { CustomerForm } from "@/components/customer-form";
import { Notice } from "@/components/notice";
import { PageHeader } from "@/components/page-header";
import { createCustomerAction } from "@/server/actions/customers";

type NewCustomerPageProps = {
  searchParams?: Promise<{ error?: string }>;
};

function errorText(error?: string): string | null {
  if (error === "name") return "Bitte gib einen Namen oder eine Firma an.";
  if (error === "email") return "Bitte pruefe das E-Mail-Format.";
  if (error === "vatId") return "Die UID/USt-ID wirkt nicht plausibel.";
  return null;
}

export default async function NewCustomerPage({ searchParams }: NewCustomerPageProps) {
  const params = await searchParams;
  const error = errorText(params?.error);

  return (
    <>
      <PageHeader kicker="Neuer Kontakt" title="Kunde anlegen" description="Speichere die wichtigsten Kontaktdaten fuer spaetere Dokumente." />
      {error ? <Notice tone="error">{error}</Notice> : null}
      <CustomerForm action={createCustomerAction} />
    </>
  );
}
