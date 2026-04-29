import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { formatDate } from "@/lib/dates";
import { effectiveInvoiceStatus } from "@/lib/invoice-status";
import { formatMoney } from "@/lib/money";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { invoiceStatuses } from "@/lib/status";
import { markInvoicePaidAction } from "@/server/actions/documents";

type InvoicesPageProps = {
  searchParams?: Promise<{ q?: string; status?: string }>;
};

export default async function InvoicesPage({ searchParams }: InvoicesPageProps) {
  const params = await searchParams;
  const user = await requireUser();
  const query = String(params?.q ?? "").trim();
  const selectedStatus = String(params?.status ?? "").trim();
  const invoicesRaw = await prisma.invoice.findMany({
    where: {
      userId: user.id,
      ...(query
        ? {
            OR: [{ number: { contains: query } }, { customer: { is: { name: { contains: query } } } }]
          }
        : {})
    },
    include: { customer: true },
    orderBy: { createdAt: "desc" }
  });
  const invoices = selectedStatus
    ? invoicesRaw.filter((invoice) => effectiveInvoiceStatus(invoice.status, invoice.dueDate) === selectedStatus)
    : invoicesRaw;

  return (
    <>
      <PageHeader
        kicker="Zahlungen"
        title="Rechnungen"
        description="Behalte offene, bezahlte und ueberfaellige Rechnungen im Blick."
        action={
          <>
            <Link href="/api/export/invoices" className="secondary-button">
              CSV Export
            </Link>
            <Link href="/rechnungen/neu" className="primary-button">
              Neue Rechnung
            </Link>
          </>
        }
      />
      <div className="card">
        <form className="mb-5 grid gap-3 md:grid-cols-[1fr_220px_auto]" action="/rechnungen">
          <input name="q" defaultValue={query} className="form-input" placeholder="Rechnung oder Kunde suchen ..." />
          <select name="status" defaultValue={selectedStatus} className="form-input">
            <option value="">Alle Status</option>
            {invoiceStatuses.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
          <button className="secondary-button">Filtern</button>
        </form>

        {invoices.length === 0 ? (
          <div className="rounded-2xl bg-brand-sand p-6 text-center">
            <p className="font-bold text-brand-ink">Noch keine passenden Rechnungen.</p>
            <p className="mt-2 text-sm text-slate-600">Du kannst eine Rechnung direkt erstellen oder aus einem Angebot umwandeln.</p>
            <Link href="/rechnungen/neu" className="primary-button mt-4">
              Rechnung erstellen
            </Link>
          </div>
        ) : (
          <div className="grid gap-3">
            {invoices.map((invoice) => {
              const status = effectiveInvoiceStatus(invoice.status, invoice.dueDate);
              const canMarkPaid = !["PAID", "CANCELLED"].includes(invoice.status);
              return (
                <div key={invoice.id} className={`rounded-2xl border bg-white p-4 ${status === "OVERDUE" ? "border-red-200" : "border-slate-100 hover:border-brand-clay/30"}`}>
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <Link href={`/rechnungen/${invoice.id}`} className="block">
                      <p className="font-black text-brand-ink">{invoice.number}</p>
                      <p className="text-sm text-slate-500">
                        {invoice.customer.name} - faellig {formatDate(invoice.dueDate)}
                      </p>
                    </Link>
                    <div className="flex flex-wrap items-center gap-3 md:justify-end">
                      <p className="font-black text-brand-ink">{formatMoney(invoice.totalGrossCents)}</p>
                      <StatusBadge type="invoice" status={status} />
                      <Link href={`/rechnungen/${invoice.id}/vorschau`} className="secondary-button py-2">
                        Vorschau
                      </Link>
                      {canMarkPaid ? (
                        <form action={markInvoicePaidAction}>
                          <input type="hidden" name="id" value={invoice.id} />
                          <button className="rounded-xl bg-brand-moss px-4 py-2 text-sm font-bold text-white hover:bg-brand-ink">
                            Bezahlt
                          </button>
                        </form>
                      ) : null}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
