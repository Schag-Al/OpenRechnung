import type { InitialLineItem } from "@/components/line-items-editor";
import { centsToEuroInput } from "@/lib/money";

export function toInitialLineItems(
  items: Array<{
    description: string;
    quantity: number;
    unit: string;
    unitPriceNetCents: number;
    taxRate: number;
    materialCostCents: number | null;
    laborHours: number | null;
  }>
): InitialLineItem[] {
  return items.map((item) => ({
    description: item.description,
    quantity: item.quantity,
    unit: item.unit,
    unitPriceNet: centsToEuroInput(item.unitPriceNetCents),
    taxRate: item.taxRate,
    materialCost: item.materialCostCents === null ? "" : centsToEuroInput(item.materialCostCents),
    laborHours: item.laborHours
  }));
}
