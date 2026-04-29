import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { formatDate } from "@/lib/dates";
import { formatMoney } from "@/lib/money";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { quoteStatuses } from "@/lib/status";

type QuotesPageProps = {
  searchParams?: Promise<{ q?: string; status?: string }>;
};

export default async function QuotesPage({ searchParams }: QuotesPageProps) {
  const params = await searchParams;
  const user = await requireUser();
  const query = String(params?.q ?? "").trim();
  const status = String(params?.status ?? "").trim();
  const quotes = await prisma.quote.findMany({
    where: {
      userId: user.id,
      ...(status ? { status } : {}),
      ...(query
        ? {
            OR: [{ number: { contains: query } }, { customer: { is: { name: { contains: query } } } }]
          }
        : {})
    },
    include: { customer: true },
    orderBy: { createdAt: "desc" }
  });

  return (
    <>
      <PageHeader
        kicker="Verkauf"
        title="Angebote"
        description="Suche Angebote, pruefe Status und oeffne zuerst die Vorschau vor dem PDF."
        action={
          <Link href="/angebote/neu" className="primary-button">
            Neues Angebot
          </Link>
        }
      />
      <div className="card">
        <form className="mb-5 grid gap-3 md:grid-cols-[1fr_220px_auto]" action="/angebote">
          <input name="q" defaultValue={query} className="form-input" placeholder="Angebot oder Kunde suchen ..." />
          <select name="status" defaultValue={status} className="form-input">
            <option value="">Alle Status</option>
            {quoteStatuses.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
          <button className="secondary-button">Filtern</button>
        </form>

        {quotes.length === 0 ? (
          <div className="rounded-2xl bg-brand-sand p-6 text-center">
            <p className="font-bold text-brand-ink">Noch keine passenden Angebote.</p>
            <p className="mt-2 text-sm text-slate-600">Sobald ein Kunde angelegt ist, kannst du dein erstes Angebot schreiben.</p>
            <Link href="/angebote/neu" className="primary-button mt-4">
              Angebot erstellen
            </Link>
          </div>
        ) : (
          <div className="grid gap-3">
            {quotes.map((quote) => (
              <div key={quote.id} className="rounded-2xl border border-slate-100 bg-white p-4 hover:border-brand-clay/30">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <Link href={`/angebote/${quote.id}`} className="block">
                    <p className="font-black text-brand-ink">{quote.number}</p>
                    <p className="text-sm text-slate-500">
                      {quote.customer.name} - {formatDate(quote.quoteDate)}
                    </p>
                  </Link>
                  <div className="flex flex-wrap items-center gap-3 md:justify-end">
                    <p className="font-black text-brand-ink">{formatMoney(quote.totalGrossCents)}</p>
                    <StatusBadge type="quote" status={quote.status} />
                    <Link href={`/angebote/${quote.id}/vorschau`} className="secondary-button py-2">
                      Vorschau
                    </Link>
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
