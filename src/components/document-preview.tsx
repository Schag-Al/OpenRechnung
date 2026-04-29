import { formatDate } from "@/lib/dates";
import { defaultIntroText, defaultOutroText } from "@/lib/document-texts";
import { formatMoney } from "@/lib/money";
import { shouldChargeVat, taxModePdfNote } from "@/lib/tax-modes";

type PreviewCompany = {
  companyName: string;
  ownerName?: string | null;
  street?: string | null;
  postalCode?: string | null;
  city?: string | null;
  country?: string | null;
  email?: string | null;
  phone?: string | null;
  vatId?: string | null;
  taxNumber?: string | null;
  bankName?: string | null;
  iban?: string | null;
  bic?: string | null;
  brandColor?: string | null;
  logoDataUrl?: string | null;
};

type PreviewCustomer = {
  name: string;
  contactPerson?: string | null;
  street?: string | null;
  postalCode?: string | null;
  city?: string | null;
  country?: string | null;
  vatId?: string | null;
};

type PreviewItem = {
  description: string;
  quantity: number;
  unit: string;
  unitPriceNetCents: number;
  taxRate: number;
};

type DocumentPreviewProps = {
  kind: "Angebot" | "Rechnung";
  number: string;
  company: PreviewCompany | null;
  customer: PreviewCustomer;
  date: Date;
  secondaryDateLabel?: string;
  secondaryDate?: Date | null;
  servicePeriod?: string | null;
  paymentDueDate?: Date | null;
  taxMode?: string | null;
  items: PreviewItem[];
  subtotalNetCents: number;
  taxTotalCents: number;
  totalGrossCents: number;
  introText?: string | null;
  outroText?: string | null;
  note?: string | null;
};

function addressLines(input: PreviewCompany | PreviewCustomer | null): string[] {
  if (!input) return [];
  const isCompany = "companyName" in input;
  return [
    isCompany ? input.companyName : input.name,
    isCompany ? input.ownerName : input.contactPerson,
    input.street,
    [input.postalCode, input.city].filter(Boolean).join(" "),
    input.country
  ].filter(Boolean) as string[];
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export function DocumentPreview({
  kind,
  number,
  company,
  customer,
  date,
  secondaryDateLabel,
  secondaryDate,
  servicePeriod,
  paymentDueDate,
  taxMode,
  items,
  subtotalNetCents,
  taxTotalCents,
  totalGrossCents,
  introText,
  outroText,
  note
}: DocumentPreviewProps) {
  const brandColor = company?.brandColor ?? "#0f766e";
  const companyName = company?.companyName ?? "Meine Firma";
  const pdfNote = taxModePdfNote(taxMode);
  const resolvedIntroText = introText || defaultIntroText(kind);
  const resolvedOutroText = outroText || defaultOutroText(kind);
  const chargeVat = shouldChargeVat(taxMode);

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-soft md:p-8">
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="h-3" style={{ backgroundColor: brandColor }} />
        <div className="p-5 md:p-8">
          <header className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
            <div className="flex items-start gap-4">
              {company?.logoDataUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={company.logoDataUrl} alt="Firmenlogo" className="h-16 w-16 rounded-xl object-contain ring-1 ring-slate-200" />
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-xl text-lg font-black text-white" style={{ backgroundColor: brandColor }}>
                  {initials(companyName) || "OR"}
                </div>
              )}
              <div>
                <p className="text-xl font-black text-brand-ink">{companyName}</p>
                <p className="mt-1 max-w-xl text-sm leading-6 text-slate-600">{addressLines(company).join(" - ")}</p>
              </div>
            </div>
            <div className="text-left md:text-right">
              <p className="text-3xl font-black text-brand-ink">{kind}</p>
              <p className="mt-1 font-bold" style={{ color: brandColor }}>
                {number}
              </p>
            </div>
          </header>

          <div className="mt-8 grid gap-6 md:grid-cols-[1fr_280px]">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Empfaenger</p>
              <div className="mt-3 whitespace-pre-line rounded-xl bg-brand-sand/50 p-4 text-sm leading-6 text-brand-ink">
                {addressLines(customer).join("\n")}
                {customer.vatId ? `\nUID / USt-ID: ${customer.vatId}` : ""}
              </div>
            </div>
            <dl className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 text-sm">
              <div>
                <dt className="font-bold text-slate-500">Ausstellungsdatum</dt>
                <dd className="font-black text-brand-ink">{formatDate(date)}</dd>
              </div>
              {secondaryDateLabel && secondaryDate ? (
                <div>
                  <dt className="font-bold text-slate-500">{secondaryDateLabel}</dt>
                  <dd className="font-black text-brand-ink">{formatDate(secondaryDate)}</dd>
                </div>
              ) : null}
              {servicePeriod ? (
                <div>
                  <dt className="font-bold text-slate-500">Leistungszeitraum</dt>
                  <dd className="font-black text-brand-ink">{servicePeriod}</dd>
                </div>
              ) : null}
              {paymentDueDate ? (
                <div>
                  <dt className="font-bold text-slate-500">Faellig am</dt>
                  <dd className="font-black text-brand-ink">{formatDate(paymentDueDate)}</dd>
                </div>
              ) : null}
            </dl>
          </div>

          {resolvedIntroText ? (
            <div className="mt-8 whitespace-pre-line rounded-xl border border-slate-200 bg-brand-sand/50 p-4 text-sm leading-6 text-brand-ink">
              {resolvedIntroText}
            </div>
          ) : null}

          <div className="mt-8 space-y-3">
            {items.map((item, index) => {
              const net = Math.round(item.quantity * item.unitPriceNetCents);
              return (
                <div
                  key={`${item.description}-${index}`}
                  className={`grid gap-3 rounded-xl border border-slate-100 bg-brand-paper p-4 text-sm md:items-center ${
                    chargeVat ? "md:grid-cols-[1fr_110px_110px_90px_110px]" : "md:grid-cols-[1fr_110px_110px_110px]"
                  }`}
                >
                  <div>
                    <p className="font-black text-brand-ink">{item.description}</p>
                    <p className="mt-1 text-slate-500">
                      {item.quantity.toLocaleString("de-AT")} {item.unit}
                    </p>
                  </div>
                  <p className="md:text-right">{formatMoney(item.unitPriceNetCents)}</p>
                  {chargeVat ? <p className="md:text-right">{item.taxRate.toLocaleString("de-AT")} % USt</p> : null}
                  <p className="font-bold md:text-right">{chargeVat ? "Netto" : "Betrag"}</p>
                  <p className="font-black text-brand-ink md:text-right">{formatMoney(net)}</p>
                </div>
              );
            })}
          </div>

          {resolvedOutroText ? (
            <div className="mt-5 whitespace-pre-line rounded-xl border border-slate-200 bg-white p-4 text-sm leading-6 text-slate-700">
              {resolvedOutroText}
            </div>
          ) : null}

          <div className="mt-8 grid gap-5 md:grid-cols-[1fr_280px]">
            <div className="space-y-4 text-sm leading-6 text-slate-600">
              {pdfNote ? <p className="rounded-xl bg-amber-50 p-4 font-semibold text-amber-900">{pdfNote}</p> : null}
              {note ? (
                <div>
                  <p className="font-black text-brand-ink">Hinweis</p>
                  <p className="mt-1 whitespace-pre-line">{note}</p>
                </div>
              ) : null}
              {kind === "Rechnung" && company && (company.bankName || company.iban || company.bic) ? (
                <div className="rounded-xl bg-brand-sand/70 p-4">
                  <p className="font-black text-brand-ink">Zahlungsinformationen</p>
                  <p className="mt-1">
                    {[company.bankName ? `Bank: ${company.bankName}` : null, company.iban ? `IBAN: ${company.iban}` : null, company.bic ? `BIC: ${company.bic}` : null]
                      .filter(Boolean)
                      .join(" | ")}
                  </p>
                </div>
              ) : null}
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <div className="flex justify-between gap-3 text-sm">
                <span>Zwischensumme netto</span>
                <strong>{formatMoney(subtotalNetCents)}</strong>
              </div>
              {chargeVat ? (
                <div className="mt-3 flex justify-between gap-3 text-sm">
                  <span>Umsatzsteuer</span>
                  <strong>{formatMoney(taxTotalCents)}</strong>
                </div>
              ) : null}
              <div className="my-4 border-t border-slate-200" />
              <div className="flex justify-between gap-3 text-lg font-black text-brand-ink">
                <span>{chargeVat ? "Gesamt brutto" : "Gesamtbetrag"}</span>
                <span style={{ color: brandColor }}>{formatMoney(totalGrossCents)}</span>
              </div>
            </div>
          </div>

          <footer className="mt-10 flex items-center justify-center gap-2 border-t border-slate-200 pt-4 text-xs text-slate-500">
            <span>Erstellt mit</span>
            <span className="inline-flex h-5 w-5 items-center justify-center rounded-md bg-brand-clay text-[9px] font-black text-white">OR</span>
            <span className="font-black text-brand-ink">OpenRechnung.at</span>
          </footer>
        </div>
      </div>
    </section>
  );
}
