type CompanyForCheck = {
  companyName?: string | null;
  street?: string | null;
  postalCode?: string | null;
  city?: string | null;
  vatId?: string | null;
};

type CustomerForCheck = {
  name?: string | null;
  street?: string | null;
  postalCode?: string | null;
  city?: string | null;
  vatId?: string | null;
};

type InvoiceForCheck = {
  number?: string | null;
  invoiceDate?: Date | null;
  serviceDate?: Date | null;
  servicePeriod?: string | null;
  dueDate?: Date | null;
  subtotalNetCents?: number;
  totalGrossCents: number;
  taxTotalCents: number;
  taxMode?: string | null;
  items?: LineItemForCheck[];
};

type QuoteForCheck = {
  number?: string | null;
  quoteDate?: Date | null;
  validUntil?: Date | null;
  taxMode?: string | null;
  items?: LineItemForCheck[];
};

type LineItemForCheck = {
  description?: string | null;
  quantity?: number | null;
  unitPriceNetCents?: number | null;
  taxRate?: number | null;
};

function missingAddress(entity?: CompanyForCheck | CustomerForCheck | null): boolean {
  return !entity?.street || !entity.postalCode || !entity.city;
}

function hasVagueDescription(description: string): boolean {
  const normalized = description.trim().toLowerCase();
  if (normalized.length < 6) return true;

  return /^(arbeit|arbeiten|leistung|leistungen|material|diverses|diverse arbeiten|reparatur|montage|service|wartung)$/.test(normalized);
}

function lineItemWarnings(items?: LineItemForCheck[]): string[] {
  const warnings: string[] = [];

  if (!items || items.length === 0) {
    return ["Mindestens eine Position mit konkreter Leistungs- oder Materialbeschreibung fehlt."];
  }

  items.forEach((item, index) => {
    const label = `Position ${index + 1}`;
    const description = item.description?.trim() ?? "";

    if (!description) {
      warnings.push(`${label}: Beschreibung fehlt.`);
    } else if (hasVagueDescription(description)) {
      warnings.push(`${label}: Beschreibung wirkt zu allgemein. Menge, handelsuebliche Bezeichnung bzw. Art und Umfang der Leistung sollten konkret sein.`);
    }

    if ((item.quantity ?? 0) <= 0) {
      warnings.push(`${label}: Menge sollte groesser als 0 sein.`);
    }

    if ((item.unitPriceNetCents ?? 0) < 0) {
      warnings.push(`${label}: Negative Einzelpreise sollten nicht in Rechnungen stehen.`);
    }

    const taxRate = item.taxRate ?? 0;
    if (![0, 10, 13, 20].includes(taxRate)) {
      warnings.push(`${label}: Steuersatz ${taxRate} % ist fuer Oesterreich ungewoehnlich und sollte fachlich geprueft werden.`);
    }
  });

  return warnings;
}

export function invoiceWarnings(
  invoice: InvoiceForCheck,
  company?: CompanyForCheck | null,
  customer?: CustomerForCheck | null
): string[] {
  const warnings: string[] = [];

  if (!company?.companyName || missingAddress(company)) {
    warnings.push("Firmendaten unvollstaendig: Name und Anschrift des leistenden Unternehmens fehlen oder sind unvollstaendig.");
  }

  if (!customer?.name || missingAddress(customer)) {
    warnings.push("Kundendaten unvollstaendig: Name und Anschrift des Leistungsempfaengers fehlen oder sind unvollstaendig.");
  }

  if (invoice.taxMode === "STANDARD" && (invoice.subtotalNetCents ?? invoice.totalGrossCents) > 0 && !company?.vatId) {
    warnings.push("UID/USt-ID des Ausstellers fehlt. Bei regulaeren steuerpflichtigen Rechnungen ist sie grundsaetzlich erforderlich.");
  }

  if (invoice.taxMode === "STANDARD" && (invoice.subtotalNetCents ?? 0) > 0 && invoice.taxTotalCents <= 0) {
    warnings.push("Regulaere Rechnung ohne Umsatzsteuerbetrag: Pruefe Steuersatz und Berechnung.");
  }

  if (invoice.taxMode === "REVERSE_CHARGE" && !customer?.vatId) {
    warnings.push("Reverse Charge: UID/USt-ID des Leistungsempfaengers fehlt.");
  }

  if (invoice.taxMode === "REVERSE_CHARGE" && !company?.vatId) {
    warnings.push("Reverse Charge: UID/USt-ID des Ausstellers fehlt.");
  }

  if (invoice.taxMode && invoice.taxMode !== "STANDARD" && invoice.taxTotalCents > 0) {
    warnings.push("Sonderfall ohne Umsatzsteuerausweis: Es darf kein gesonderter Umsatzsteuerbetrag ausgewiesen werden.");
  } else if (invoice.taxMode && invoice.taxMode !== "STANDARD") {
    warnings.push("Sonderfall ohne Umsatzsteuerausweis: Pruefe den passenden Hinweistext vor dem Versand.");
  }

  if (invoice.totalGrossCents > 1_000_000 && !customer?.vatId) {
    warnings.push("Rechnung ueber 10.000 EUR: UID/USt-ID des unternehmerischen Leistungsempfaengers kann erforderlich sein, falls es sich um B2B handelt.");
  }

  if (!invoice.number) {
    warnings.push("Rechnungsnummer fehlt. Rechnungen muessen fortlaufend und eindeutig nummeriert sein.");
  }

  if (!invoice.invoiceDate) {
    warnings.push("Ausstellungsdatum/Rechnungsdatum fehlt.");
  }

  if (!invoice.serviceDate && !invoice.servicePeriod) {
    warnings.push("Leistungsdatum oder Leistungszeitraum fehlt.");
  }

  if (!invoice.dueDate) {
    warnings.push("Faelligkeitsdatum fehlt. Das ist fuer den Zahlungsfluss wichtig, auch wenn es nicht jedes Rechnungsmerkmal ersetzt.");
  }

  return [...warnings, ...lineItemWarnings(invoice.items)];
}

export function quoteWarnings(quote: QuoteForCheck, company?: CompanyForCheck | null, customer?: CustomerForCheck | null): string[] {
  const warnings: string[] = [];

  if (!company?.companyName || missingAddress(company)) {
    warnings.push("Firmendaten unvollstaendig: Angebote wirken verbindlicher, wenn Name und Anschrift angegeben sind.");
  }

  if (!customer?.name) {
    warnings.push("Kunde fehlt oder ist unvollstaendig.");
  }

  if (!quote.number) {
    warnings.push("Angebotsnummer fehlt.");
  }

  if (!quote.quoteDate) {
    warnings.push("Angebotsdatum fehlt.");
  }

  if (!quote.validUntil) {
    warnings.push("Gueltigkeitsdatum fehlt. Fuer Angebote ist ein klares Gueltigkeitsdatum empfehlenswert.");
  }

  if (quote.taxMode && quote.taxMode !== "STANDARD") {
    warnings.push("Steuerfall ist nicht regulaer. Pruefe den Hinweistext, bevor du das Angebot versendest.");
  }

  return [...warnings, ...lineItemWarnings(quote.items)];
}
