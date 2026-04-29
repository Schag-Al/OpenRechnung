import { parseEuroToCents } from "@/lib/money";
import { shouldChargeVat } from "@/lib/tax-modes";

export type ParsedLineItem = {
  description: string;
  quantity: number;
  unit: string;
  unitPriceNetCents: number;
  taxRate: number;
  materialCostCents: number | null;
  laborHours: number | null;
  sortOrder: number;
};

export type Totals = {
  subtotalNetCents: number;
  taxTotalCents: number;
  totalGrossCents: number;
};

function parseNumber(value: FormDataEntryValue | string | null, fallback = 0): number {
  const normalized = String(value ?? "").replace(",", ".").trim();
  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function parseLineItems(formData: FormData): ParsedLineItem[] {
  const descriptions = formData.getAll("itemDescription");
  const quantities = formData.getAll("itemQuantity");
  const units = formData.getAll("itemUnit");
  const prices = formData.getAll("itemUnitPriceNet");
  const taxRates = formData.getAll("itemTaxRate");
  const materialCosts = formData.getAll("itemMaterialCost");
  const laborHours = formData.getAll("itemLaborHours");

  return descriptions
    .map((description, index) => ({
      description: String(description ?? "").trim(),
      quantity: Math.max(parseNumber(quantities[index], 1), 0),
      unit: String(units[index] ?? "Stk.").trim() || "Stk.",
      unitPriceNetCents: Math.max(parseEuroToCents(prices[index] ?? "0"), 0),
      taxRate: Math.max(parseNumber(taxRates[index], 20), 0),
      materialCostCents:
        String(materialCosts[index] ?? "").trim() === ""
          ? null
          : Math.max(parseEuroToCents(materialCosts[index] ?? "0"), 0),
      laborHours:
        String(laborHours[index] ?? "").trim() === ""
          ? null
          : Math.max(parseNumber(laborHours[index], 0), 0),
      sortOrder: index
    }))
    .filter((item) => item.description.length > 0);
}

export function calculateTotals(
  items: Pick<ParsedLineItem, "quantity" | "unitPriceNetCents" | "taxRate">[],
  taxMode = "STANDARD"
): Totals {
  const chargeVat = shouldChargeVat(taxMode);

  return items.reduce<Totals>(
    (totals, item) => {
      const net = Math.round(item.quantity * item.unitPriceNetCents);
      const tax = chargeVat ? Math.round(net * (item.taxRate / 100)) : 0;

      return {
        subtotalNetCents: totals.subtotalNetCents + net,
        taxTotalCents: totals.taxTotalCents + tax,
        totalGrossCents: totals.totalGrossCents + net + tax
      };
    },
    { subtotalNetCents: 0, taxTotalCents: 0, totalGrossCents: 0 }
  );
}
