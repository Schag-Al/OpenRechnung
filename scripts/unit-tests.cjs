const fs = require("node:fs");
const Module = require("node:module");
const path = require("node:path");
const test = require("node:test");
const assert = require("node:assert/strict");
const ts = require("typescript");

const root = path.resolve(__dirname, "..");
const originalResolveFilename = Module._resolveFilename;

require.extensions[".ts"] = function compileTypeScript(module, filename) {
  const source = fs.readFileSync(filename, "utf8");
  const output = ts.transpileModule(source, {
    compilerOptions: {
      esModuleInterop: true,
      jsx: ts.JsxEmit.ReactJSX,
      module: ts.ModuleKind.CommonJS,
      moduleResolution: ts.ModuleResolutionKind.NodeJs,
      target: ts.ScriptTarget.ES2022
    },
    fileName: filename
  }).outputText;
  module._compile(output, filename);
};

Module._resolveFilename = function resolveAlias(request, parent, isMain, options) {
  if (request.startsWith("@/")) {
    return originalResolveFilename.call(this, path.join(root, "src", request.slice(2)), parent, isMain, options);
  }

  return originalResolveFilename.call(this, request, parent, isMain, options);
};

const { parseEuroToCents, centsToEuroInput, formatMoney } = require("../src/lib/money.ts");
const { calculateTotals, parseLineItems } = require("../src/lib/totals.ts");
const { shouldChargeVat, normalizeTaxMode, taxModePdfNote } = require("../src/lib/tax-modes.ts");
const { addDays, isPastDue, parseDate } = require("../src/lib/dates.ts");
const { effectiveInvoiceStatus, normalizeInvoiceStatusForSave } = require("../src/lib/invoice-status.ts");
const { cleanPrefix, highestExistingSequence, nextSequenceNumber, numberFor } = require("../src/lib/numbering.ts");
const { invoiceWarnings, quoteWarnings } = require("../src/lib/document-checks.ts");
const { isPlausibleIban, isPlausibleVatId, isValidEmail, normalizeIban } = require("../src/lib/validation.ts");
const { documentFilename, csvFilename } = require("../src/lib/filenames.ts");
const { buildReminderText } = require("../src/lib/reminders.ts");
const { buildDocumentPdf } = require("../src/lib/pdf.ts");

function formDataFromEntries(entries) {
  const formData = new FormData();
  for (const [key, value] of entries) {
    formData.append(key, value);
  }
  return formData;
}

function daysFromToday(days) {
  const date = new Date();
  date.setHours(12, 0, 0, 0);
  date.setDate(date.getDate() + days);
  return date;
}

function completeCompany(overrides = {}) {
  return {
    companyName: "Muster & Sohn Handwerk GmbH",
    street: "Werkstrasse 12",
    postalCode: "1010",
    city: "Wien",
    vatId: "ATU12345678",
    ...overrides
  };
}

function completeCustomer(overrides = {}) {
  return {
    name: "Bauhof Beispiel GmbH",
    street: "Industriestrasse 4",
    postalCode: "4600",
    city: "Wels",
    vatId: "ATU87654321",
    ...overrides
  };
}

const concreteItems = [
  {
    description: "Elektro-Unterverteilung liefern und montieren",
    quantity: 2,
    unitPriceNetCents: 12500,
    taxRate: 20
  },
  {
    description: "Dichtheitspruefung der Ablaufleitung",
    quantity: 1.5,
    unitPriceNetCents: 8000,
    taxRate: 20
  }
];

const euroAmountPattern = (amount) => new RegExp(`(€\\s*${amount}|${amount}\\s*€)`);

test("Geldwerte werden im deutschen Format korrekt geparst und formatiert", () => {
  assert.equal(parseEuroToCents("1.234,56"), 123456);
  assert.equal(parseEuroToCents("12,345"), 1235);
  assert.equal(parseEuroToCents("ungueltig"), 0);
  assert.equal(centsToEuroInput(123456), "1234,56");
  assert.match(formatMoney(123456), euroAmountPattern("1.234,56"));
});

test("Summen und Umsatzsteuer werden positionsweise und kaufmaennisch gerundet", () => {
  const totals = calculateTotals([
    { quantity: 2, unitPriceNetCents: 10000, taxRate: 20 },
    { quantity: 3, unitPriceNetCents: 333, taxRate: 10 },
    { quantity: 1.5, unitPriceNetCents: 8000, taxRate: 20 }
  ]);

  assert.deepEqual(totals, {
    subtotalNetCents: 32999,
    taxTotalCents: 6500,
    totalGrossCents: 39499
  });
});

test("Sondersteuerfaelle weisen keine Umsatzsteuer aus", () => {
  for (const taxMode of ["SMALL_BUSINESS", "REVERSE_CHARGE", "TAX_EXEMPT", "INTRA_EU"]) {
    assert.equal(shouldChargeVat(taxMode), false);
    assert.deepEqual(
      calculateTotals([{ quantity: 2, unitPriceNetCents: 10000, taxRate: 20 }], taxMode),
      { subtotalNetCents: 20000, taxTotalCents: 0, totalGrossCents: 20000 }
    );
  }

  assert.equal(shouldChargeVat("STANDARD"), true);
  assert.equal(normalizeTaxMode("nicht-vorhanden"), "STANDARD");
  assert.match(taxModePdfNote("REVERSE_CHARGE") ?? "", /Uebergang der Steuerschuld/);
  assert.match(taxModePdfNote("SMALL_BUSINESS") ?? "", /Kleinunternehmerregelung/);
});

test("Positionsdaten aus Formularen werden bereinigt und negative Werte verhindert", () => {
  const formData = formDataFromEntries([
    ["itemDescription", ""],
    ["itemQuantity", "5"],
    ["itemUnit", "Std."],
    ["itemUnitPriceNet", "120,00"],
    ["itemTaxRate", "20"],
    ["itemMaterialCost", ""],
    ["itemLaborHours", ""],
    ["itemDescription", "Montage Verteilerkasten"],
    ["itemQuantity", "-3"],
    ["itemUnit", ""],
    ["itemUnitPriceNet", "-10,00"],
    ["itemTaxRate", "-20"],
    ["itemMaterialCost", "-5,00"],
    ["itemLaborHours", "-2"]
  ]);

  const items = parseLineItems(formData);
  assert.equal(items.length, 1);
  assert.deepEqual(items[0], {
    description: "Montage Verteilerkasten",
    quantity: 0,
    unit: "Stk.",
    unitPriceNetCents: 0,
    taxRate: 0,
    materialCostCents: 0,
    laborHours: 0,
    sortOrder: 1
  });
});

test("Nummernlogik erzeugt sichere fortlaufende Dokumentnummern", () => {
  assert.equal(cleanPrefix(" re-2026! ", "RE"), "RE2026");
  assert.equal(cleanPrefix("***", "ANG"), "ANG");
  assert.equal(numberFor("RE", 2026, 7), "RE-2026-0007");
  assert.equal(highestExistingSequence(["RE-2026-0001", "RE-2026-0015", "ANG-2026-9999", "RE-2025-9999"], "RE", 2026), 15);
  assert.equal(highestExistingSequence(["RE-2026-0009", "RE-2026-10001"], "RE", 2026), 10001);
  assert.equal(nextSequenceNumber(4, ["RE-2026-0008"], "RE", 2026), 9);
  assert.equal(nextSequenceNumber(44, ["RE-2026-0008"], "RE", 2026), 44);
});

test("Statuslogik trennt Entwurf, offen, ueberfaellig, bezahlt und storniert", () => {
  assert.equal(effectiveInvoiceStatus("OPEN", daysFromToday(-1)), "OVERDUE");
  assert.equal(effectiveInvoiceStatus("OPEN", daysFromToday(0)), "OPEN");
  assert.equal(effectiveInvoiceStatus("OVERDUE", daysFromToday(5)), "OPEN");
  assert.equal(effectiveInvoiceStatus("PAID", daysFromToday(-30)), "PAID");
  assert.equal(effectiveInvoiceStatus("CANCELLED", daysFromToday(-30)), "CANCELLED");
  assert.equal(effectiveInvoiceStatus("DRAFT", daysFromToday(-30)), "DRAFT");
  assert.equal(normalizeInvoiceStatusForSave("OPEN", daysFromToday(-1)), "OVERDUE");
  assert.equal(normalizeInvoiceStatusForSave("PAID", daysFromToday(-1)), "PAID");
});

test("Datumslogik behandelt Faelligkeit erst nach Ablauf des Tages als ueberfaellig", () => {
  assert.equal(isPastDue(daysFromToday(-1), "OPEN"), true);
  assert.equal(isPastDue(daysFromToday(0), "OPEN"), false);
  assert.equal(isPastDue(daysFromToday(1), "OPEN"), false);
  assert.equal(isPastDue(daysFromToday(-1), "DRAFT"), false);
  assert.equal(parseDate("2026-04-29")?.toISOString().slice(0, 10), "2026-04-29");
  assert.equal(addDays(new Date("2026-04-01T12:00:00.000Z"), 14).toISOString().slice(0, 10), "2026-04-15");
});

test("Rechnungscheck akzeptiert vollstaendige Standardrechnung ohne offensichtliche Luecken", () => {
  const warnings = invoiceWarnings(
    {
      number: "RE-2026-0001",
      invoiceDate: new Date("2026-04-29T12:00:00.000Z"),
      serviceDate: new Date("2026-04-28T12:00:00.000Z"),
      dueDate: new Date("2026-05-13T12:00:00.000Z"),
      subtotalNetCents: 37000,
      taxTotalCents: 7400,
      totalGrossCents: 44400,
      taxMode: "STANDARD",
      items: concreteItems
    },
    completeCompany(),
    completeCustomer()
  );

  assert.deepEqual(warnings, []);
});

test("Rechnungscheck findet zentrale Pflichtangaben und typische Rechnungsmangel", () => {
  const warnings = invoiceWarnings(
    {
      number: "",
      invoiceDate: null,
      serviceDate: null,
      servicePeriod: null,
      dueDate: null,
      subtotalNetCents: 10000,
      taxTotalCents: 0,
      totalGrossCents: 1200000,
      taxMode: "STANDARD",
      items: [{ description: "Arbeiten", quantity: 1, unitPriceNetCents: 10000, taxRate: 20 }]
    },
    completeCompany({ vatId: null, street: null }),
    completeCustomer({ vatId: null, city: null })
  );

  assert.ok(warnings.some((warning) => warning.includes("Firmendaten unvollstaendig")));
  assert.ok(warnings.some((warning) => warning.includes("Kundendaten unvollstaendig")));
  assert.ok(warnings.some((warning) => warning.includes("UID/USt-ID des Ausstellers fehlt")));
  assert.ok(warnings.some((warning) => warning.includes("Regulaere Rechnung ohne Umsatzsteuerbetrag")));
  assert.ok(warnings.some((warning) => warning.includes("Rechnung ueber 10.000 EUR")));
  assert.ok(warnings.some((warning) => warning.includes("Rechnungsnummer fehlt")));
  assert.ok(warnings.some((warning) => warning.includes("Leistungsdatum oder Leistungszeitraum fehlt")));
  assert.ok(warnings.some((warning) => warning.includes("Beschreibung wirkt zu allgemein")));
});

test("Reverse-Charge-Check verlangt UID-Hinweise und verhindert gesonderten Steuerausweis", () => {
  const warnings = invoiceWarnings(
    {
      number: "RE-2026-0002",
      invoiceDate: new Date("2026-04-29T12:00:00.000Z"),
      servicePeriod: "April 2026",
      dueDate: new Date("2026-05-13T12:00:00.000Z"),
      subtotalNetCents: 96000,
      taxTotalCents: 19200,
      totalGrossCents: 115200,
      taxMode: "REVERSE_CHARGE",
      items: concreteItems
    },
    completeCompany({ vatId: null }),
    completeCustomer({ vatId: null })
  );

  assert.ok(warnings.some((warning) => warning.includes("UID/USt-ID des Leistungsempfaengers fehlt")));
  assert.ok(warnings.some((warning) => warning.includes("UID/USt-ID des Ausstellers fehlt")));
  assert.ok(warnings.some((warning) => warning.includes("kein gesonderter Umsatzsteuerbetrag")));
});

test("Kleinunternehmer- und steuerfreie Rechnungen bleiben netto gleich brutto", () => {
  const totals = calculateTotals(concreteItems, "SMALL_BUSINESS");
  const warnings = invoiceWarnings(
    {
      number: "RE-2026-0003",
      invoiceDate: new Date("2026-04-29T12:00:00.000Z"),
      servicePeriod: "April 2026",
      dueDate: new Date("2026-05-13T12:00:00.000Z"),
      subtotalNetCents: totals.subtotalNetCents,
      taxTotalCents: totals.taxTotalCents,
      totalGrossCents: totals.totalGrossCents,
      taxMode: "SMALL_BUSINESS",
      items: concreteItems
    },
    completeCompany({ vatId: null }),
    completeCustomer({ vatId: null })
  );

  assert.equal(totals.totalGrossCents, totals.subtotalNetCents);
  assert.equal(totals.taxTotalCents, 0);
  assert.ok(warnings.some((warning) => warning.includes("Sonderfall ohne Umsatzsteuerausweis")));
  assert.ok(!warnings.some((warning) => warning.includes("kein gesonderter Umsatzsteuerbetrag")));
});

test("Angebotscheck prueft Basisdaten und Positionen, ohne Rechnungspflichten zu behaupten", () => {
  const warnings = quoteWarnings(
    {
      number: "",
      quoteDate: null,
      validUntil: null,
      taxMode: "INTRA_EU",
      items: [{ description: "Material", quantity: 0, unitPriceNetCents: 5000, taxRate: 99 }]
    },
    completeCompany({ companyName: "" }),
    { name: "" }
  );

  assert.ok(warnings.some((warning) => warning.includes("Firmendaten unvollstaendig")));
  assert.ok(warnings.some((warning) => warning.includes("Kunde fehlt")));
  assert.ok(warnings.some((warning) => warning.includes("Angebotsnummer fehlt")));
  assert.ok(warnings.some((warning) => warning.includes("Steuerfall ist nicht regulaer")));
  assert.ok(warnings.some((warning) => warning.includes("Beschreibung wirkt zu allgemein")));
  assert.ok(warnings.some((warning) => warning.includes("Menge sollte groesser als 0")));
  assert.ok(warnings.some((warning) => warning.includes("ungewoehnlich")));
});

test("Validierung erkennt E-Mail, IBAN und UID/USt-ID plausibel", () => {
  assert.equal(isValidEmail("office@example.at"), true);
  assert.equal(isValidEmail("office.example.at"), false);
  assert.equal(normalizeIban("at61 1904 3002 3457 3201"), "AT611904300234573201");
  assert.equal(isPlausibleIban("AT611904300234573201"), true);
  assert.equal(isPlausibleIban("AT001904300234573201"), false);
  assert.equal(isPlausibleVatId("ATU12345678"), true);
  assert.equal(isPlausibleVatId("123456"), false);
});

test("Dateinamen sind eindeutig lesbar und dateisystemfreundlich", () => {
  assert.equal(
    documentFilename("rechnung", "RE-2026-0004", "Elektro Partner Projektbau KG", new Date("2026-04-29T12:00:00.000Z")),
    "rechnung-RE-2026-0004-elektro-partner-projektbau-kg-2026-04-29.pdf"
  );
  assert.match(csvFilename("kunden"), /^kunden-export-\d{4}-\d{2}-\d{2}\.csv$/);
});

test("Erinnerungstexte bleiben hoeflich und enthalten Rechnungsdaten", () => {
  const text = buildReminderText(
    {
      customerName: "Bauhof Beispiel GmbH",
      invoiceNumber: "RE-2026-0001",
      invoiceDate: new Date("2026-04-01T12:00:00.000Z"),
      dueDate: new Date("2026-04-15T12:00:00.000Z"),
      amountCents: 120000,
      companyName: "Muster & Sohn Handwerk GmbH"
    },
    "final"
  );

  assert.match(text, /RE-2026-0001/);
  assert.match(text, euroAmountPattern("1.200,00"));
  assert.match(text, /weitere Schritte zu pruefen/);
  assert.match(text, /Muster & Sohn Handwerk GmbH/);
});

test("PDF-Erzeugung funktioniert fuer Standard- und Reverse-Charge-Dokumente", async () => {
  const baseInput = {
    kind: "Rechnung",
    number: "RE-2026-0099",
    company: {
      companyName: "Muster & Sohn Handwerk GmbH",
      ownerName: "Thomas Muster",
      street: "Werkstrasse 12",
      postalCode: "1010",
      city: "Wien",
      country: "Oesterreich",
      email: "office@example.at",
      phone: "+43 1 234567",
      vatId: "ATU12345678",
      bankName: "Musterbank Wien",
      iban: "AT611904300234573201",
      bic: "BKAUATWW"
    },
    customer: completeCustomer(),
    date: new Date("2026-04-29T12:00:00.000Z"),
    servicePeriod: "April 2026",
    paymentDueDate: new Date("2026-05-13T12:00:00.000Z"),
    items: concreteItems,
    subtotalNetCents: 37000,
    taxTotalCents: 7400,
    totalGrossCents: 44400,
    taxMode: "STANDARD"
  };

  const standardPdf = await buildDocumentPdf(baseInput);
  const reverseChargePdf = await buildDocumentPdf({
    ...baseInput,
    taxTotalCents: 0,
    totalGrossCents: 37000,
    taxMode: "REVERSE_CHARGE"
  });

  assert.equal(standardPdf.subarray(0, 4).toString("ascii"), "%PDF");
  assert.equal(reverseChargePdf.subarray(0, 4).toString("ascii"), "%PDF");
  assert.ok(standardPdf.length > 1500);
  assert.ok(reverseChargePdf.length > 1500);
});
