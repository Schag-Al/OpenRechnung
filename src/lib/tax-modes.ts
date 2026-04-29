export type TaxMode = "STANDARD" | "SMALL_BUSINESS" | "REVERSE_CHARGE" | "TAX_EXEMPT" | "INTRA_EU";

export const taxModes: Array<{
  value: TaxMode;
  label: string;
  shortLabel: string;
  description: string;
  pdfNote: string | null;
}> = [
  {
    value: "STANDARD",
    label: "Regulaer steuerpflichtig",
    shortLabel: "Regulaer",
    description: "Umsatzsteuer wird je Position berechnet.",
    pdfNote: null
  },
  {
    value: "SMALL_BUSINESS",
    label: "Kleinunternehmer / keine USt",
    shortLabel: "Kleinunternehmer",
    description: "Keine Umsatzsteuer ausweisen. Bitte die eigene steuerliche Situation pruefen.",
    pdfNote: "Kein Ausweis von Umsatzsteuer aufgrund der Kleinunternehmerregelung."
  },
  {
    value: "REVERSE_CHARGE",
    label: "Reverse Charge",
    shortLabel: "Reverse Charge",
    description: "Keine Umsatzsteuer ausweisen, Steuerschuld geht auf den Leistungsempfaenger ueber.",
    pdfNote: "Uebergang der Steuerschuld auf den Leistungsempfaenger (Reverse Charge)."
  },
  {
    value: "TAX_EXEMPT",
    label: "Steuerfrei",
    shortLabel: "Steuerfrei",
    description: "Keine Umsatzsteuer ausweisen. Grund/Hinweis im Freitext ergaenzen.",
    pdfNote: "Steuerfreie Leistung. Bitte den zutreffenden Befreiungsgrund im Hinweistext ergaenzen."
  },
  {
    value: "INTRA_EU",
    label: "Innergemeinschaftliche Leistung",
    shortLabel: "Innergemeinschaftlich",
    description: "Keine Umsatzsteuer ausweisen. UID und Leistungsort fachlich pruefen.",
    pdfNote: "Innergemeinschaftliche Leistung. Bitte UID, Leistungsort und Steuerhinweis fachlich pruefen."
  }
];

export function normalizeTaxMode(value: FormDataEntryValue | string | null | undefined): TaxMode {
  const raw = String(value ?? "STANDARD");
  return taxModes.some((mode) => mode.value === raw) ? (raw as TaxMode) : "STANDARD";
}

export function taxModeLabel(value: string | null | undefined): string {
  const mode = taxModes.find((item) => item.value === value);
  return mode?.label ?? "Regulaer steuerpflichtig";
}

export function taxModePdfNote(value: string | null | undefined): string | null {
  const mode = taxModes.find((item) => item.value === value);
  return mode?.pdfNote ?? null;
}

export function shouldChargeVat(value: string | null | undefined): boolean {
  return normalizeTaxMode(value) === "STANDARD";
}
