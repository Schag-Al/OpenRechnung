export const quoteStatuses = [
  { value: "DRAFT", label: "Entwurf" },
  { value: "SENT", label: "Gesendet" },
  { value: "ACCEPTED", label: "Angenommen" },
  { value: "REJECTED", label: "Abgelehnt" }
] as const;

export const invoiceStatuses = [
  { value: "DRAFT", label: "Entwurf" },
  { value: "OPEN", label: "Offen" },
  { value: "PAID", label: "Bezahlt" },
  { value: "OVERDUE", label: "Ueberfaellig" },
  { value: "CANCELLED", label: "Storniert" }
] as const;

export function quoteStatusLabel(status: string): string {
  return quoteStatuses.find((item) => item.value === status)?.label ?? status;
}

export function invoiceStatusLabel(status: string): string {
  return invoiceStatuses.find((item) => item.value === status)?.label ?? status;
}

export function statusTone(status: string): string {
  switch (status) {
    case "ACCEPTED":
    case "PAID":
      return "bg-emerald-50 text-emerald-800 ring-emerald-200";
    case "SENT":
    case "OPEN":
      return "bg-sky-50 text-sky-800 ring-sky-200";
    case "REJECTED":
    case "OVERDUE":
    case "CANCELLED":
      return "bg-red-50 text-red-800 ring-red-200";
    default:
      return "bg-slate-100 text-slate-700 ring-slate-200";
  }
}
