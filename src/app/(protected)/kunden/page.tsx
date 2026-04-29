import Link from "next/link";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { PageHeader } from "@/components/page-header";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { deleteCustomerAction } from "@/server/actions/customers";

type CustomersPageProps = {
  searchParams?: Promise<{ error?: string; q?: string }>;
};

export default async function CustomersPage({ searchParams }: CustomersPageProps) {
  const params = await searchParams;
  const user = await requireUser();
  const query = String(params?.q ?? "").trim();
  const customers = await prisma.customer.findMany({
    where: {
      userId: user.id,
      ...(query
        ? {
            OR: [
              { name: { contains: query } },
              { contactPerson: { contains: query } },
              { city: { contains: query } },
              { email: { contains: query } }
            ]
          }
        : {})
    },
    include: {
      _count: {
        select: { quotes: true, invoices: true }
      }
    },
    orderBy: { updatedAt: "desc" }
  });

  return (
    <>
      <PageHeader
        kicker="Kontakte"
        title="Kunden"
        description="Suche Auftraggeber, pruefe Dokument-Historie und lege neue Kunden an."
        action={
          <>
            <Link href="/api/export/customers" className="secondary-button">
              CSV Export
            </Link>
            <Link href="/kunden/neu" className="primary-button">
              Neuer Kunde
            </Link>
          </>
        }
      />
      {params?.error === "used" ? (
        <p className="mb-4 rounded-2xl bg-red-50 p-3 text-sm font-bold text-red-700">
          Dieser Kunde wird bereits in Angeboten oder Rechnungen verwendet und kann deshalb nicht geloescht werden.
        </p>
      ) : null}
      <div className="card">
        <form className="mb-5 flex flex-col gap-3 md:flex-row" action="/kunden">
          <input name="q" defaultValue={query} className="form-input" placeholder="Kunden suchen: Name, Ort, E-Mail ..." />
          <button className="secondary-button md:w-40">Suchen</button>
          {query ? (
            <Link href="/kunden" className="secondary-button md:w-40">
              Zuruecksetzen
            </Link>
          ) : null}
        </form>

        {customers.length === 0 ? (
          <div className="rounded-2xl bg-brand-sand p-6 text-center">
            <p className="font-bold text-brand-ink">{query ? "Keine passenden Kunden gefunden." : "Noch keine Kunden."}</p>
            <p className="mt-2 text-sm text-slate-600">Erstelle den ersten Kunden, dann kannst du Angebote schreiben.</p>
            <Link href="/kunden/neu" className="primary-button mt-4">
              Kunde anlegen
            </Link>
          </div>
        ) : (
          <div className="grid gap-3">
            {customers.map((customer) => (
              <div key={customer.id} className="rounded-2xl border border-slate-100 bg-white p-4 hover:border-brand-clay/30">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="font-black text-brand-ink">{customer.name}</p>
                    <p className="text-sm text-slate-500">
                      {[customer.street, customer.postalCode, customer.city].filter(Boolean).join(", ") || "Keine Adresse hinterlegt"}
                    </p>
                    <p className="mt-2 text-xs font-bold uppercase tracking-wide text-slate-400">
                      {customer._count.quotes} Angebote - {customer._count.invoices} Rechnungen
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Link href={`/kunden/${customer.id}`} className="secondary-button py-2">
                      Details
                    </Link>
                    <form action={deleteCustomerAction}>
                      <input type="hidden" name="id" value={customer.id} />
                      <ConfirmSubmitButton
                        message={`Kunde "${customer.name}" wirklich loeschen? Das geht nur, wenn keine Dokumente damit verknuepft sind.`}
                        className="rounded-xl border border-red-200 bg-white px-4 py-2 text-sm font-bold text-red-700 hover:bg-red-50"
                      >
                        Loeschen
                      </ConfirmSubmitButton>
                    </form>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
