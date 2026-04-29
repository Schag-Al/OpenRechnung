export function parseEuroToCents(value: FormDataEntryValue | string | null): number {
  if (value === null) return 0;
  const normalized = String(value).replace(/\./g, "").replace(",", ".").trim();
  const amount = Number.parseFloat(normalized || "0");
  if (!Number.isFinite(amount)) return 0;
  return Math.round(amount * 100);
}

export function centsToEuroInput(cents?: number | null): string {
  return ((cents ?? 0) / 100).toFixed(2).replace(".", ",");
}

export function formatMoney(cents?: number | null): string {
  return new Intl.NumberFormat("de-AT", {
    style: "currency",
    currency: "EUR"
  }).format((cents ?? 0) / 100);
}
