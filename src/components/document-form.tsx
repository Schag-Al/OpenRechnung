import { CustomerPicker, type CustomerPickerOption } from "@/components/customer-picker";
import { LineItemsEditor, type InitialLineItem } from "@/components/line-items-editor";
import { dateInputValue } from "@/lib/dates";
import { invoiceStatuses, quoteStatuses } from "@/lib/status";

type CalculationOption = {
  id: string;
  title: string;
  salePriceCents: number;
  totalNetCents: number;
  laborHours: number;
  materialCostCents: number;
};

type TemplateOption = {
  id: string;
  kind: string;
  sku: string | null;
  title: string;
  description: string;
  unit: string;
  unitPriceNetCents: number;
  taxRate: number;
  materialCostCents: number | null;
  laborHours: number | null;
};

export type DocumentInitial = {
  id?: string;
  customerId?: string;
  status?: string;
  taxMode?: string;
  quoteDate?: Date | null;
  validUntil?: Date | null;
  invoiceDate?: Date | null;
  serviceDate?: Date | null;
  servicePeriod?: string | null;
  dueDate?: Date | null;
  introText?: string | null;
  outroText?: string | null;
  note?: string | null;
  items?: InitialLineItem[];
};

type DocumentFormProps = {
  kind: "quote" | "invoice";
  customers: CustomerPickerOption[];
  action: (formData: FormData) => Promise<void>;
  defaultTaxRate?: number;
  calculations?: CalculationOption[];
  templates?: TemplateOption[];
  initial?: DocumentInitial;
};

export function DocumentForm({ kind, customers, action, defaultTaxRate = 20, calculations = [], templates = [], initial }: DocumentFormProps) {
  const isQuote = kind === "quote";
  const statuses = isQuote ? quoteStatuses : invoiceStatuses;
  const today = dateInputValue(new Date());

  return (
    <form action={action} className="space-y-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
      {initial?.id ? <input type="hidden" name="id" value={initial.id} /> : null}

      <div className="rounded-2xl bg-brand-sand/70 p-4 text-sm leading-6 text-slate-700">
        <p className="font-black text-brand-ink">Schnell erfassen</p>
        <p>
          Waehle einen Kunden, pruefe Datum und Status und fuege mindestens eine Position mit Beschreibung,
          Menge und Netto-Einzelpreis hinzu.
        </p>
      </div>

      <CustomerPicker customers={customers} initialCustomerId={initial?.customerId} />

      <div className="grid gap-4 md:grid-cols-2">
        <label>
          <span className="form-label">Status</span>
          <select name="status" defaultValue={initial?.status ?? "DRAFT"} className="form-input">
            {statuses.map((status) => (
              <option key={status.value} value={status.value}>
                {status.label}
              </option>
            ))}
          </select>
          <span className="mt-1 block text-xs text-slate-500">
            Sobald ein Dokument nicht mehr Entwurf ist, wird es gegen nachtraegliche Bearbeitung gesperrt.
          </span>
        </label>
        {isQuote ? (
          <>
            <label>
              <span className="form-label">Angebotsdatum</span>
              <input name="quoteDate" type="date" defaultValue={dateInputValue(initial?.quoteDate) || today} className="form-input" />
            </label>
            <label>
              <span className="form-label">Gueltig bis</span>
              <input name="validUntil" type="date" defaultValue={dateInputValue(initial?.validUntil)} className="form-input" />
            </label>
          </>
        ) : (
          <>
            <label>
              <span className="form-label">Rechnungsdatum</span>
              <input name="invoiceDate" type="date" defaultValue={dateInputValue(initial?.invoiceDate) || today} className="form-input" />
            </label>
            <label>
              <span className="form-label">Faelligkeitsdatum</span>
              <input name="dueDate" type="date" defaultValue={dateInputValue(initial?.dueDate) || today} className="form-input" />
            </label>
            <label>
              <span className="form-label">Leistungsdatum</span>
              <input name="serviceDate" type="date" defaultValue={dateInputValue(initial?.serviceDate)} className="form-input" />
            </label>
            <label>
              <span className="form-label">Leistungszeitraum optional</span>
              <input name="servicePeriod" defaultValue={initial?.servicePeriod ?? ""} className="form-input" placeholder="z. B. Maerz 2026" />
            </label>
          </>
        )}
      </div>

      <label className="block">
        <span className="form-label">{isQuote ? "Angebotstext vor den Positionen" : "Rechnungstext vor den Positionen"}</span>
        <textarea
          name="introText"
          defaultValue={initial?.introText ?? ""}
          className="form-input min-h-28"
          placeholder={isQuote ? "z. B. Vielen Dank fuer Ihre Anfrage ..." : "z. B. Fuer die erbrachten Leistungen ..."}
        />
      </label>

      <LineItemsEditor
        initialItems={initial?.items}
        defaultTaxRate={defaultTaxRate}
        initialTaxMode={initial?.taxMode}
        calculations={calculations}
        templates={templates}
      />

      <label className="block">
        <span className="form-label">{isQuote ? "Angebotstext nach den Positionen" : "Rechnungstext nach den Positionen"}</span>
        <textarea
          name="outroText"
          defaultValue={initial?.outroText ?? ""}
          className="form-input min-h-28"
          placeholder={isQuote ? "z. B. Dieses Angebot ist gueltig ..." : "z. B. Bitte ueberweisen Sie ..."}
        />
      </label>

      <label className="block">
        <span className="form-label">Freitext / Hinweis</span>
        <textarea
          name="note"
          defaultValue={initial?.note ?? ""}
          className="form-input min-h-28"
          placeholder="z. B. Vielen Dank fuer Ihre Anfrage."
        />
      </label>

      <div className="flex flex-col gap-3 md:flex-row md:justify-end">
        <button className="primary-button">
          Speichern
        </button>
      </div>
    </form>
  );
}
