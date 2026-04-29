export type FieldIssue = {
  field: string;
  message: string;
};

export function isValidEmail(value: string | null | undefined): boolean {
  if (!value) return true;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export function normalizeIban(value: string | null | undefined): string | null {
  const normalized = String(value ?? "").replace(/\s+/g, "").toUpperCase();
  return normalized.length > 0 ? normalized : null;
}

export function isPlausibleIban(value: string | null | undefined): boolean {
  const iban = normalizeIban(value);
  if (!iban) return true;
  if (!/^[A-Z]{2}[0-9A-Z]{13,32}$/.test(iban)) return false;

  const rearranged = `${iban.slice(4)}${iban.slice(0, 4)}`;
  let remainder = 0;

  for (const char of rearranged) {
    const code = char >= "A" && char <= "Z" ? String(char.charCodeAt(0) - 55) : char;
    for (const digit of code) {
      remainder = (remainder * 10 + Number(digit)) % 97;
    }
  }

  return remainder === 1;
}

export function isPlausibleVatId(value: string | null | undefined): boolean {
  const vatId = String(value ?? "").replace(/\s+/g, "").toUpperCase();
  if (!vatId) return true;
  return /^[A-Z]{2}[A-Z0-9]{6,12}$/.test(vatId);
}

export function validationSummary(issues: FieldIssue[]): string {
  return issues.map((issue) => issue.message).join(" ");
}
