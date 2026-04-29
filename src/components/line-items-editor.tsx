"use client";

import { useMemo, useState } from "react";
import { shouldChargeVat, taxModes } from "@/lib/tax-modes";

export type InitialLineItem = {
  description: string;
  quantity: number;
  unit: string;
  unitPriceNet: string;
  taxRate: number;
  materialCost?: string;
  laborHours?: number | null;
};

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

type LineItemsEditorProps = {
  initialItems?: InitialLineItem[];
  defaultTaxRate?: number;
  initialTaxMode?: string;
  calculations?: CalculationOption[];
  templates?: TemplateOption[];
};

function emptyItem(defaultTaxRate: number): InitialLineItem {
  return {
    description: "",
    quantity: 1,
    unit: "Stk.",
    unitPriceNet: "0,00",
    taxRate: defaultTaxRate,
    materialCost: "",
    laborHours: null
  };
}

function parseAmount(value: string | number | undefined): number {
  const parsed = Number.parseFloat(String(value ?? "0").replace(/\./g, "").replace(",", "."));
  return Number.isFinite(parsed) ? parsed : 0;
}

function centsToInput(cents: number): string {
  return (cents / 100).toFixed(2).replace(".", ",");
}

function euro(value: number): string {
  return value.toLocaleString("de-AT", { style: "currency", currency: "EUR" });
}

function templateKindLabel(kind: string): string {
  return kind === "ARTICLE" ? "Artikel" : "Leistung";
}

export function LineItemsEditor({
  initialItems,
  defaultTaxRate = 20,
  initialTaxMode = "STANDARD",
  calculations = [],
  templates = []
}: LineItemsEditorProps) {
  const [taxMode, setTaxMode] = useState(initialTaxMode);
  const [items, setItems] = useState<InitialLineItem[]>(
    initialItems && initialItems.length > 0 ? initialItems : [emptyItem(defaultTaxRate)]
  );
  const [quickCalc, setQuickCalc] = useState({
    title: "Kalkulierte Position",
    materialCost: "",
    markupPercent: "20",
    laborHours: "1",
    hourlyRate: "",
    travelCost: ""
  });

  const quickCalcTotal = useMemo(() => {
    const materialCost = Math.max(parseAmount(quickCalc.materialCost), 0);
    const markupPercent = Math.max(parseAmount(quickCalc.markupPercent), 0);
    const salePrice = materialCost * (1 + markupPercent / 100);
    const labor = Math.max(parseAmount(quickCalc.laborHours), 0) * Math.max(parseAmount(quickCalc.hourlyRate), 0);
    const travel = Math.max(parseAmount(quickCalc.travelCost), 0);

    return {
      materialCost,
      salePrice,
      labor,
      travel,
      total: salePrice + labor + travel
    };
  }, [quickCalc]);

  const totals = useMemo(() => {
    const chargeVat = shouldChargeVat(taxMode);
    return items.reduce(
      (sum, item) => {
        const net = Math.max(Number(item.quantity) || 0, 0) * Math.max(parseAmount(item.unitPriceNet), 0);
        const tax = chargeVat ? net * ((Number(item.taxRate) || 0) / 100) : 0;

        return {
          net: sum.net + net,
          tax: sum.tax + tax,
          gross: sum.gross + net + tax
        };
      },
      { net: 0, tax: 0, gross: 0 }
    );
  }, [items, taxMode]);

  function updateItem(index: number, key: keyof InitialLineItem, value: string) {
    setItems((current) =>
      current.map((item, itemIndex) =>
        itemIndex === index
          ? {
              ...item,
              [key]: key === "quantity" || key === "taxRate" || key === "laborHours" ? Number(value) : value
            }
          : item
      )
    );
  }

  function addItem(item: InitialLineItem) {
    setItems((current) => [...current, item]);
  }

  function addCalculation(calculation: CalculationOption) {
    addItem({
      description: calculation.title,
      quantity: 1,
      unit: "Pauschale",
      unitPriceNet: centsToInput(calculation.totalNetCents),
      taxRate: defaultTaxRate,
      materialCost: centsToInput(calculation.salePriceCents || calculation.materialCostCents),
      laborHours: calculation.laborHours
    });
  }

  function addTemplate(template: TemplateOption) {
    addItem({
      description: template.description,
      quantity: 1,
      unit: template.unit,
      unitPriceNet: centsToInput(template.unitPriceNetCents),
      taxRate: template.taxRate,
      materialCost: template.materialCostCents === null ? "" : centsToInput(template.materialCostCents),
      laborHours: template.laborHours
    });
  }

  function addQuickCalculation() {
    addItem({
      description: quickCalc.title.trim() || "Kalkulierte Position",
      quantity: 1,
      unit: "Pauschale",
      unitPriceNet: quickCalcTotal.total.toFixed(2).replace(".", ","),
      taxRate: defaultTaxRate,
      materialCost: quickCalcTotal.salePrice.toFixed(2).replace(".", ","),
      laborHours: Math.max(parseAmount(quickCalc.laborHours), 0)
    });
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-slate-200 bg-brand-sand/70 p-4">
        <label>
          <span className="form-label">Steuerfall fuer dieses Dokument</span>
          <select name="taxMode" value={taxMode} onChange={(event) => setTaxMode(event.target.value)} className="form-input">
            {taxModes.map((mode) => (
              <option key={mode.value} value={mode.value}>
                {mode.label}
              </option>
            ))}
          </select>
        </label>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          {taxModes.find((mode) => mode.value === taxMode)?.description}
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-bold text-brand-ink">Positionen</h2>
          <p className="text-sm text-slate-500">Material, Arbeitszeit und Vorlagen sind direkt vorbereitet.</p>
        </div>
        <button
          type="button"
          onClick={() => setItems((current) => [...current, emptyItem(defaultTaxRate)])}
          className="rounded-xl bg-brand-moss px-4 py-3 text-sm font-semibold text-white hover:bg-brand-ink"
        >
          Position hinzufuegen
        </button>
      </div>

      {templates.length > 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <p className="text-sm font-black text-brand-ink">Artikel & Leistungen</p>
          <p className="mt-1 text-sm text-slate-600">Haeufige Positionen mit einem Klick einfuegen.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {templates.map((template) => (
              <button
                key={template.id}
                type="button"
                onClick={() => addTemplate(template)}
                className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-bold text-brand-ink hover:border-brand-clay hover:text-brand-clay"
              >
                {templateKindLabel(template.kind)}: {template.title} - {centsToInput(template.unitPriceNetCents)} EUR
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {calculations.length > 0 ? (
        <div className="rounded-2xl border border-brand-clay/20 bg-brand-sand/70 p-4">
          <p className="text-sm font-black text-brand-ink">Gespeicherte Kalkulation uebernehmen</p>
          <p className="mt-1 text-sm text-slate-600">Fuege eine gespeicherte Materialkalkulation direkt als Position ein.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {calculations.map((calculation) => (
              <button
                key={calculation.id}
                type="button"
                onClick={() => addCalculation(calculation)}
                className="rounded-xl border border-brand-clay/30 bg-white px-3 py-2 text-sm font-bold text-brand-ink hover:border-brand-clay hover:text-brand-clay"
              >
                {calculation.title} - {centsToInput(calculation.totalNetCents)} EUR
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <div className="rounded-2xl border border-slate-200 bg-white p-4">
        <p className="text-sm font-black text-brand-ink">Schnellkalkulation als Position</p>
        <p className="mt-1 text-sm text-slate-600">
          Berechne Material, Aufschlag, Arbeitszeit und Fahrtkosten direkt hier und uebernimm das Ergebnis.
        </p>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <label className="md:col-span-2">
            <span className="form-label">Bezeichnung</span>
            <input
              value={quickCalc.title}
              onChange={(event) => setQuickCalc((current) => ({ ...current, title: event.target.value }))}
              className="form-input"
            />
          </label>
          <div className="rounded-2xl bg-brand-ink p-4 text-white">
            <p className="text-xs uppercase tracking-wide text-white/60">Netto Ergebnis</p>
            <p className="text-xl font-black">{euro(quickCalcTotal.total)}</p>
          </div>
          <label>
            <span className="form-label">Material EK</span>
            <input
              value={quickCalc.materialCost}
              onChange={(event) => setQuickCalc((current) => ({ ...current, materialCost: event.target.value }))}
              className="form-input"
              inputMode="decimal"
              placeholder="0,00"
            />
          </label>
          <label>
            <span className="form-label">Aufschlag %</span>
            <input
              value={quickCalc.markupPercent}
              onChange={(event) => setQuickCalc((current) => ({ ...current, markupPercent: event.target.value }))}
              className="form-input"
              inputMode="decimal"
            />
          </label>
          <label>
            <span className="form-label">Fahrtkosten</span>
            <input
              value={quickCalc.travelCost}
              onChange={(event) => setQuickCalc((current) => ({ ...current, travelCost: event.target.value }))}
              className="form-input"
              inputMode="decimal"
              placeholder="0,00"
            />
          </label>
          <label>
            <span className="form-label">Arbeitszeit h</span>
            <input
              value={quickCalc.laborHours}
              onChange={(event) => setQuickCalc((current) => ({ ...current, laborHours: event.target.value }))}
              className="form-input"
              inputMode="decimal"
            />
          </label>
          <label>
            <span className="form-label">Stundensatz</span>
            <input
              value={quickCalc.hourlyRate}
              onChange={(event) => setQuickCalc((current) => ({ ...current, hourlyRate: event.target.value }))}
              className="form-input"
              inputMode="decimal"
              placeholder="75,00"
            />
          </label>
          <div className="flex items-end">
            <button type="button" onClick={addQuickCalculation} className="primary-button w-full">
              Als Position uebernehmen
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {items.map((item, index) => (
          <div key={index} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="grid gap-3 md:grid-cols-[1.8fr_0.7fr_0.7fr_1fr_0.7fr]">
              <label className="md:col-span-1">
                <span className="form-label">Beschreibung</span>
                <input
                  name="itemDescription"
                  value={item.description}
                  onChange={(event) => updateItem(index, "description", event.target.value)}
                  className="form-input"
                  placeholder="z. B. Montage Waschbecken"
                  required
                />
              </label>
              <label>
                <span className="form-label">Menge</span>
                <input
                  name="itemQuantity"
                  type="number"
                  min="0"
                  step="0.01"
                  value={item.quantity}
                  onChange={(event) => updateItem(index, "quantity", event.target.value)}
                  className="form-input"
                  required
                />
              </label>
              <label>
                <span className="form-label">Einheit</span>
                <input
                  name="itemUnit"
                  value={item.unit}
                  onChange={(event) => updateItem(index, "unit", event.target.value)}
                  className="form-input"
                  required
                />
              </label>
              <label>
                <span className="form-label">Einzelpreis netto</span>
                <input
                  name="itemUnitPriceNet"
                  value={item.unitPriceNet}
                  onChange={(event) => updateItem(index, "unitPriceNet", event.target.value)}
                  className="form-input"
                  inputMode="decimal"
                  required
                />
              </label>
              <label>
                <span className="form-label">Steuer %</span>
                <input
                  name="itemTaxRate"
                  type="number"
                  min="0"
                  step="0.01"
                  value={item.taxRate}
                  onChange={(event) => updateItem(index, "taxRate", event.target.value)}
                  className="form-input"
                  required
                />
              </label>
            </div>
            <div className="mt-3 grid gap-3 md:grid-cols-3">
              <label>
                <span className="form-label">Materialkosten optional</span>
                <input
                  name="itemMaterialCost"
                  value={item.materialCost ?? ""}
                  onChange={(event) => updateItem(index, "materialCost", event.target.value)}
                  className="form-input"
                  inputMode="decimal"
                  placeholder="0,00"
                />
              </label>
              <label>
                <span className="form-label">Arbeitszeit optional</span>
                <input
                  name="itemLaborHours"
                  type="number"
                  min="0"
                  step="0.25"
                  value={item.laborHours ?? ""}
                  onChange={(event) => updateItem(index, "laborHours", event.target.value)}
                  className="form-input"
                  placeholder="0"
                />
              </label>
              <div className="flex items-end justify-between gap-3">
                <p className="pb-3 text-sm font-semibold text-slate-600">
                  Netto: {euro(Math.max(Number(item.quantity) || 0, 0) * Math.max(parseAmount(item.unitPriceNet), 0))}
                </p>
                {items.length > 1 ? (
                  <button
                    type="button"
                    onClick={() => setItems((current) => current.filter((_, itemIndex) => itemIndex !== index))}
                    className="mb-1 rounded-xl border border-red-200 px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-50"
                  >
                    Entfernen
                  </button>
                ) : null}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-3 rounded-2xl bg-brand-ink p-5 text-white md:grid-cols-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-white/60">Netto</p>
          <p className="text-xl font-black">{euro(totals.net)}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-white/60">Steuer</p>
          <p className="text-xl font-black">{euro(totals.tax)}</p>
          {!shouldChargeVat(taxMode) ? <p className="mt-1 text-xs text-white/60">Nicht ausgewiesen</p> : null}
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-white/60">Brutto</p>
          <p className="text-xl font-black">{euro(totals.gross)}</p>
        </div>
      </div>
    </div>
  );
}
