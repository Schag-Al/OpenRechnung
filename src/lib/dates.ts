export function dateInputValue(date?: Date | string | null): string {
  if (!date) return "";
  const parsed = typeof date === "string" ? new Date(date) : date;
  if (Number.isNaN(parsed.getTime())) return "";
  return parsed.toISOString().slice(0, 10);
}

export function formatDate(date?: Date | string | null): string {
  if (!date) return "-";
  const parsed = typeof date === "string" ? new Date(date) : date;
  if (Number.isNaN(parsed.getTime())) return "-";
  return new Intl.DateTimeFormat("de-AT").format(parsed);
}

export function parseDate(value: FormDataEntryValue | string | null): Date | null {
  const raw = value ? String(value) : "";
  if (!raw) return null;
  const date = new Date(`${raw}T12:00:00.000Z`);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

export function isPastDue(dueDate: Date, status: string): boolean {
  if (!["OPEN", "OVERDUE"].includes(status)) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueDate);
  due.setHours(0, 0, 0, 0);
  return due < today;
}
