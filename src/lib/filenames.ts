function slugify(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60)
    .toLowerCase();
}

export function documentFilename(kind: "angebot" | "rechnung", number: string, customerName: string, date: Date): string {
  const datePart = date.toISOString().slice(0, 10);
  const customerPart = slugify(customerName) || "kunde";
  const safeNumber = slugify(number).toUpperCase();
  return `${kind}-${safeNumber}-${customerPart}-${datePart}.pdf`;
}

export function csvFilename(kind: "kunden" | "rechnungen"): string {
  return `${kind}-export-${new Date().toISOString().slice(0, 10)}.csv`;
}
