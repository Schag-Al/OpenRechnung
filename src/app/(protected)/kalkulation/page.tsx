import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { Notice } from "@/components/notice";
import { PageHeader } from "@/components/page-header";
import { centsToEuroInput, formatMoney } from "@/lib/money";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createCalculationAction, deleteCalculationAction, updateCalculationAction } from "@/server/actions/calculations";
import { createItemTemplateAction, deleteItemTemplateAction, updateItemTemplateAction } from "@/server/actions/item-templates";

type CalculationPageProps = {
  searchParams?: Promise<{ error?: string; saved?: string }>;
};

function kindLabel(kind: string): string {
  return kind === "ARTICLE" ? "Artikel" : "Leistung";
}

function TemplateForm({
  action,
  template,
  submitLabel
}: {
  action: (formData: FormData) => Promise<void>;
  template?: {
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
    notes: string | null;
    isActive: boolean;
  };
  submitLabel: string;
}) {
  return (
    <form action={action} className="space-y-4">
      {template ? <input type="hidden" name="id" value={template.id} /> : null}
      <div className="grid gap-4 md:grid-cols-2">
        <label>
          <span className="form-label">Art</span>
          <select name="kind" defaultValue={template?.kind ?? "SERVICE"} className="form-input">
            <option value="SERVICE">Leistung</option>
            <option value="ARTICLE">Artikel / Material</option>
          </select>
        </label>
        <label>
          <span className="form-label">Artikelnummer optional</span>
          <input name="sku" defaultValue={template?.sku ?? ""} className="form-input" placeholder="z. B. MAT-001" />
        </label>
        <label>
          <span className="form-label">Name</span>
          <input name="title" required defaultValue={template?.title ?? ""} className="form-input" placeholder="z. B. Montagestunde" />
        </label>
        <label>
          <span className="form-label">Einheit</span>
          <input name="unit" defaultValue={template?.unit ?? "Std."} className="form-input" />
        </label>
      </div>

      <label>
        <span className="form-label">Beschreibung fuer Angebot/Rechnung</span>
        <input
          name="description"
          required
          defaultValue={template?.description ?? ""}
          className="form-input"
          placeholder="z. B. Facharbeit vor Ort"
        />
      </label>

      <div className="grid gap-4 md:grid-cols-4">
        <label>
          <span className="form-label">Einzelpreis netto</span>
          <input
            name="unitPriceNet"
            required
            inputMode="decimal"
            defaultValue={template ? centsToEuroInput(template.unitPriceNetCents) : ""}
            className="form-input"
            placeholder="75,00"
          />
        </label>
        <label>
          <span className="form-label">Steuersatz %</span>
          <input name="taxRate" type="number" min="0" step="0.01" defaultValue={template?.taxRate ?? 20} className="form-input" />
        </label>
        <label>
          <span className="form-label">Materialkosten optional</span>
          <input
            name="materialCost"
            inputMode="decimal"
            defaultValue={template?.materialCostCents === null || template?.materialCostCents === undefined ? "" : centsToEuroInput(template.materialCostCents)}
            className="form-input"
            placeholder="0,00"
          />
        </label>
        <label>
          <span className="form-label">Arbeitszeit optional</span>
          <input name="laborHours" type="number" min="0" step="0.25" defaultValue={template?.laborHours ?? ""} className="form-input" />
        </label>
      </div>

      <label>
        <span className="form-label">Interne Notiz optional</span>
        <textarea name="notes" defaultValue={template?.notes ?? ""} className="form-input min-h-20" />
      </label>

      <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
        <input type="checkbox" name="isActive" value="false" defaultChecked={!template?.isActive} />
        In Auswahl ausblenden
      </label>

      <button className={template ? "secondary-button" : "primary-button"}>{submitLabel}</button>
    </form>
  );
}

function CalculationForm({
  action,
  calculation,
  submitLabel
}: {
  action: (formData: FormData) => Promise<void>;
  calculation?: {
    id: string;
    title: string;
    materialCostCents: number;
    markupPercent: number;
    laborHours: number;
    hourlyRateCents: number;
    travelCostCents: number;
  };
  submitLabel: string;
}) {
  return (
    <form action={action} className="space-y-4">
      {calculation ? <input type="hidden" name="id" value={calculation.id} /> : null}
      <label>
        <span className="form-label">Bezeichnung</span>
        <input name="title" required defaultValue={calculation?.title ?? ""} className="form-input" placeholder="z. B. Waschbecken Montagepaket" />
      </label>
      <div className="grid gap-4 md:grid-cols-2">
        <label>
          <span className="form-label">Material Einkaufspreis</span>
          <input
            name="materialCost"
            className="form-input"
            inputMode="decimal"
            defaultValue={calculation ? centsToEuroInput(calculation.materialCostCents) : ""}
            placeholder="0,00"
          />
        </label>
        <label>
          <span className="form-label">Aufschlag in %</span>
          <input name="markupPercent" type="number" min="0" step="0.01" className="form-input" defaultValue={calculation?.markupPercent ?? 20} />
        </label>
        <label>
          <span className="form-label">Arbeitszeit in Stunden</span>
          <input name="laborHours" type="number" min="0" step="0.25" className="form-input" defaultValue={calculation?.laborHours ?? 1} />
        </label>
        <label>
          <span className="form-label">Stundensatz</span>
          <input
            name="hourlyRate"
            className="form-input"
            inputMode="decimal"
            defaultValue={calculation ? centsToEuroInput(calculation.hourlyRateCents) : ""}
            placeholder="75,00"
          />
        </label>
        <label>
          <span className="form-label">Fahrtkosten optional</span>
          <input
            name="travelCost"
            className="form-input"
            inputMode="decimal"
            defaultValue={calculation ? centsToEuroInput(calculation.travelCostCents) : ""}
            placeholder="0,00"
          />
        </label>
      </div>
      <button className={calculation ? "secondary-button" : "primary-button"}>{submitLabel}</button>
    </form>
  );
}

export default async function CalculationPage({ searchParams }: CalculationPageProps) {
  const params = await searchParams;
  const user = await requireUser();
  const [calculations, templates] = await Promise.all([
    prisma.materialCalculation.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" }
    }),
    prisma.itemTemplate.findMany({
      where: { userId: user.id },
      orderBy: [{ isActive: "desc" }, { kind: "asc" }, { title: "asc" }]
    })
  ]);

  const activeTemplates = templates.filter((template) => template.isActive);
  const articleCount = activeTemplates.filter((template) => template.kind === "ARTICLE").length;
  const serviceCount = activeTemplates.filter((template) => template.kind !== "ARTICLE").length;

  return (
    <>
      <PageHeader
        kicker="Katalog"
        title="Artikel, Leistungen & Kalkulationen"
        description="Pflege wiederverwendbare Bausteine, damit Angebote und Rechnungen schnell und einheitlich befuellt werden."
      />
      {params?.saved === "template" ? <Notice tone="success">Artikel oder Leistung gespeichert.</Notice> : null}
      {params?.saved === "calculation" ? <Notice tone="success">Kalkulation gespeichert.</Notice> : null}
      {params?.error ? <Notice tone="error">Bitte pruefe die Pflichtfelder.</Notice> : null}

      <div className="mb-6 grid gap-4 md:grid-cols-3">
        <div className="card">
          <p className="text-sm font-bold text-slate-500">Aktive Leistungen</p>
          <p className="mt-2 text-4xl font-black text-brand-ink">{serviceCount}</p>
        </div>
        <div className="card">
          <p className="text-sm font-bold text-slate-500">Aktive Artikel</p>
          <p className="mt-2 text-4xl font-black text-brand-ink">{articleCount}</p>
        </div>
        <div className="card">
          <p className="text-sm font-bold text-slate-500">Kalkulationen</p>
          <p className="mt-2 text-4xl font-black text-brand-ink">{calculations.length}</p>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <section className="card">
          <h2 className="text-xl font-black text-brand-ink">Artikel oder Leistung anlegen</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Das sind fertige Positionen fuer Angebote und Rechnungen, zum Beispiel Montagestunde, Anfahrt oder Kleinmaterial.
          </p>
          <div className="mt-5">
            <TemplateForm action={createItemTemplateAction} submitLabel="Position speichern" />
          </div>
        </section>

        <section className="card">
          <h2 className="text-xl font-black text-brand-ink">Kalkulation anlegen</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Berechne Verkaufspreise aus Material, Aufschlag, Arbeitszeit und Fahrtkosten. Das Ergebnis kann spaeter als Position uebernommen werden.
          </p>
          <div className="mt-5">
            <CalculationForm action={createCalculationAction} submitLabel="Kalkulation speichern" />
          </div>
        </section>
      </div>

      <section className="card mt-6">
        <h2 className="text-xl font-black text-brand-ink">Gespeicherte Artikel & Leistungen</h2>
        <p className="mt-2 text-sm text-slate-600">Aktive Eintraege erscheinen im Positionseditor von Angeboten und Rechnungen.</p>
        <div className="mt-5 grid gap-3">
          {templates.length === 0 ? (
            <p className="rounded-2xl bg-brand-sand p-5 text-sm text-slate-600">Noch keine Position gespeichert.</p>
          ) : (
            templates.map((template) => (
              <div key={template.id} className={`rounded-2xl border p-4 ${template.isActive ? "border-slate-100 bg-white" : "border-slate-200 bg-slate-50 opacity-80"}`}>
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-xl bg-brand-sand px-3 py-1 text-xs font-black text-brand-ink">{kindLabel(template.kind)}</span>
                      {!template.isActive ? <span className="rounded-xl bg-slate-200 px-3 py-1 text-xs font-black text-slate-600">Ausgeblendet</span> : null}
                      {template.sku ? <span className="text-xs font-bold text-slate-500">{template.sku}</span> : null}
                    </div>
                    <p className="mt-2 font-black text-brand-ink">{template.title}</p>
                    <p className="mt-1 text-sm text-slate-500">{template.description}</p>
                    <p className="mt-1 text-sm font-semibold text-slate-600">
                      {formatMoney(template.unitPriceNetCents)} netto / {template.unit} - {template.taxRate.toLocaleString("de-AT")} % USt
                    </p>
                    {template.notes ? <p className="mt-2 text-xs text-slate-500">Notiz: {template.notes}</p> : null}
                  </div>
                  <form action={deleteItemTemplateAction}>
                    <input type="hidden" name="id" value={template.id} />
                    <ConfirmSubmitButton
                      message={`Position "${template.title}" wirklich loeschen?`}
                      className="text-sm font-bold text-red-700"
                    >
                      Loeschen
                    </ConfirmSubmitButton>
                  </form>
                </div>

                <details className="mt-4 rounded-2xl bg-brand-sand/50 p-4">
                  <summary className="cursor-pointer text-sm font-black text-brand-ink">Bearbeiten</summary>
                  <div className="mt-4">
                    <TemplateForm action={updateItemTemplateAction} template={template} submitLabel="Aenderungen speichern" />
                  </div>
                </details>
              </div>
            ))
          )}
        </div>
      </section>

      <section className="card mt-6">
        <h2 className="text-xl font-black text-brand-ink">Gespeicherte Kalkulationen</h2>
        <p className="mt-2 text-sm text-slate-600">
          Diese Kalkulationen koennen direkt in Angebots- und Rechnungspositionen uebernommen werden.
        </p>
        <div className="mt-5 grid gap-3">
          {calculations.length === 0 ? (
            <p className="rounded-2xl bg-brand-sand p-5 text-sm text-slate-600">Noch keine Kalkulation gespeichert.</p>
          ) : (
            calculations.map((calculation) => (
              <div key={calculation.id} className="rounded-2xl border border-slate-100 bg-white p-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="font-black text-brand-ink">{calculation.title}</p>
                    <p className="mt-1 text-sm text-slate-500">
                      Material VK {formatMoney(calculation.salePriceCents)} - Arbeit {calculation.laborHours} h - Fahrt {formatMoney(calculation.travelCostCents)}
                    </p>
                  </div>
                  <div className="flex flex-col items-start gap-2 md:items-end">
                    <p className="text-2xl font-black text-brand-clay">{formatMoney(calculation.totalNetCents)}</p>
                    <form action={deleteCalculationAction}>
                      <input type="hidden" name="id" value={calculation.id} />
                      <ConfirmSubmitButton
                        message={`Kalkulation "${calculation.title}" wirklich loeschen?`}
                        className="text-sm font-bold text-red-700"
                      >
                        Loeschen
                      </ConfirmSubmitButton>
                    </form>
                  </div>
                </div>

                <details className="mt-4 rounded-2xl bg-brand-sand/50 p-4">
                  <summary className="cursor-pointer text-sm font-black text-brand-ink">Bearbeiten</summary>
                  <div className="mt-4">
                    <CalculationForm action={updateCalculationAction} calculation={calculation} submitLabel="Aenderungen speichern" />
                  </div>
                </details>
              </div>
            ))
          )}
        </div>
      </section>
    </>
  );
}
