import Link from "next/link";
import { notFound } from "next/navigation";
import { CustomerForm } from "@/components/customer-form";
import { Notice } from "@/components/notice";
import { PageHeader } from "@/components/page-header";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { updateCustomerAction } from "@/server/actions/customers";

type CustomerDetailPageProps = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ error?: string }>;
};

function errorText(error?: string): string | null {
  if (error === "email") return "Bitte pruefe das E-Mail-Format.";
  if (error === "vatId") return "Die UID/USt-ID wirkt nicht plausibel.";
  return null;
}

export default async function CustomerDetailPage({ params, searchParams }: CustomerDetailPageProps) {
  const { id } = await params;
  const query = await searchParams;
  const user = await requireUser();
  const customer = await prisma.customer.findFirst({
    where: { id, userId: user.id },
    include: {
      quotes: { orderBy: { createdAt: "desc" }, take: 20 },
      invoices: { orderBy: { createdAt: "desc" }, take: 20 }
    }
  });

  if (!customer) notFound();
  const error = errorText(query?.error);

  return (
    <>
      <PageHeader kicker="Kontakt bearbeiten" title={customer.name} description="Aktualisiere Kundendaten, ohne bestehende Dokumente zu veraendern." />
      {error ? <Notice tone="error">{error}</Notice> : null}
      <CustomerForm action={updateCustomerAction} customer={customer} />
      <section className="card mt-6">
        <h2 className="text-xl font-black text-brand-ink">Kundenhistorie</h2>
        <p className="mt-2 text-sm text-slate-600">Alle letzten Angebote und Rechnungen zu diesem Kunden auf einen Blick.</p>
        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          <div>
            <h3 className="font-black text-brand-ink">Angebote</h3>
            <div className="mt-3 space-y-2">
              {customer.quotes.length === 0 ? (
                <p className="rounded-2xl bg-brand-sand p-4 text-sm text-slate-600">Noch keine Angebote.</p>
              ) : (
                customer.quotes.map((quote) => (
                  <Link key={quote.id} href={`/angebote/${quote.id}`} className="block rounded-2xl border border-slate-100 p-4 hover:bg-brand-sand/60">
                    <p className="font-bold text-brand-ink">{quote.number}</p>
                    <p className="text-sm text-slate-500">{quote.status}</p>
                  </Link>
                ))
              )}
            </div>
          </div>
          <div>
            <h3 className="font-black text-brand-ink">Rechnungen</h3>
            <div className="mt-3 space-y-2">
              {customer.invoices.length === 0 ? (
                <p className="rounded-2xl bg-brand-sand p-4 text-sm text-slate-600">Noch keine Rechnungen.</p>
              ) : (
                customer.invoices.map((invoice) => (
                  <Link key={invoice.id} href={`/rechnungen/${invoice.id}`} className="block rounded-2xl border border-slate-100 p-4 hover:bg-brand-sand/60">
                    <p className="font-bold text-brand-ink">{invoice.number}</p>
                    <p className="text-sm text-slate-500">{invoice.status}</p>
                  </Link>
                ))
              )}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
