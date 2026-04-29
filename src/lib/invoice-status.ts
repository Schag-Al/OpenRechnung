import { isPastDue } from "@/lib/dates";

export function effectiveInvoiceStatus(status: string, dueDate: Date): string {
  if (status === "PAID" || status === "CANCELLED" || status === "DRAFT") {
    return status;
  }

  return isPastDue(dueDate, status) ? "OVERDUE" : status === "OVERDUE" ? "OPEN" : status;
}

export function normalizeInvoiceStatusForSave(status: string, dueDate: Date): string {
  if (status === "PAID" || status === "CANCELLED" || status === "DRAFT") {
    return status;
  }

  return isPastDue(dueDate, "OPEN") ? "OVERDUE" : "OPEN";
}
