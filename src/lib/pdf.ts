import PDFDocument from "pdfkit";
import { formatDate } from "@/lib/dates";
import { defaultIntroText, defaultOutroText } from "@/lib/document-texts";
import { formatMoney } from "@/lib/money";
import { shouldChargeVat, taxModePdfNote } from "@/lib/tax-modes";

type PdfCompany = {
  companyName: string;
  ownerName?: string | null;
  street?: string | null;
  postalCode?: string | null;
  city?: string | null;
  country?: string | null;
  email?: string | null;
  phone?: string | null;
  vatId?: string | null;
  taxNumber?: string | null;
  bankName?: string | null;
  iban?: string | null;
  bic?: string | null;
  brandColor?: string | null;
  logoDataUrl?: string | null;
};

type PdfCustomer = {
  name: string;
  contactPerson?: string | null;
  street?: string | null;
  postalCode?: string | null;
  city?: string | null;
  country?: string | null;
  vatId?: string | null;
};

type PdfItem = {
  description: string;
  quantity: number;
  unit: string;
  unitPriceNetCents: number;
  taxRate: number;
};

type PdfInput = {
  kind: "Angebot" | "Rechnung";
  number: string;
  company: PdfCompany | null;
  customer: PdfCustomer;
  date: Date;
  secondaryDateLabel?: string;
  secondaryDate?: Date | null;
  servicePeriod?: string | null;
  items: PdfItem[];
  subtotalNetCents: number;
  taxTotalCents: number;
  totalGrossCents: number;
  introText?: string | null;
  outroText?: string | null;
  note?: string | null;
  paymentDueDate?: Date | null;
  taxMode?: string | null;
};

const page = {
  width: 595.28,
  height: 841.89,
  marginX: 44,
  footerY: 770
};

const colors = {
  ink: "#111827",
  muted: "#64748b",
  line: "#dbe3ec",
  paper: "#f8fafc",
  sand: "#eef6f6",
  clay: "#0f766e",
  white: "#ffffff"
};

function addressLines(input: PdfCompany | PdfCustomer | null): string[] {
  if (!input) return [];
  const isCompany = "companyName" in input;

  return [
    isCompany ? input.companyName : input.name,
    isCompany ? input.ownerName : input.contactPerson,
    input.street,
    [input.postalCode, input.city].filter(Boolean).join(" "),
    input.country
  ].filter(Boolean) as string[];
}

function oneLineAddress(input: PdfCompany | null): string {
  return addressLines(input).join(" - ");
}

function brandColor(input: PdfInput | PdfCompany | null): string {
  const company = input && "kind" in input ? input.company : input;
  const color = company?.brandColor ?? colors.clay;
  return /^#[0-9a-fA-F]{6}$/.test(color) ? color : colors.clay;
}

function companyInitials(companyName: string): string {
  return companyName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function imageBufferFromDataUrl(dataUrl?: string | null): Buffer | null {
  if (!dataUrl || !/^data:image\/(png|jpeg);base64,/.test(dataUrl)) return null;
  const base64 = dataUrl.split(",")[1];
  return base64 ? Buffer.from(base64, "base64") : null;
}

function drawTopRule(doc: PDFKit.PDFDocument, input: PdfInput) {
  doc.rect(0, 0, page.width, 10).fill(brandColor(input));
}

function drawOpenRechnungMark(doc: PDFKit.PDFDocument, y: number) {
  const x = 199;

  doc.font("Helvetica").fontSize(7.2).fillColor(colors.muted).text("Erstellt mit", x, y + 2, { width: 54, align: "right" });
  doc.roundedRect(x + 60, y, 12, 12, 3).fill(colors.clay);
  doc.save();
  doc.fillColor(colors.white);
  doc.roundedRect(x + 63.2, y + 2.5, 5.8, 7.8, 1).fill(colors.white);
  doc.moveTo(x + 64.3, y + 5.2).lineTo(x + 68, y + 5.2).strokeColor(colors.clay).lineWidth(0.8).stroke();
  doc.moveTo(x + 64.3, y + 7.4).lineTo(x + 67.2, y + 7.4).stroke();
  doc.restore();
  doc.font("Helvetica-Bold").fontSize(7.8).fillColor(colors.ink).text("OpenRechnung.at", x + 77, y + 1.5, {
    width: 115
  });
}

function drawFooter(doc: PDFKit.PDFDocument, company: PdfCompany | null) {
  doc.save();
  doc.moveTo(page.marginX, page.footerY - 12).lineTo(page.width - page.marginX, page.footerY - 12).strokeColor(colors.line).lineWidth(0.7).stroke();

  const companyInfo = [
    company?.companyName,
    company?.email ? `E-Mail: ${company.email}` : null,
    company?.phone ? `Telefon: ${company.phone}` : null
  ]
    .filter(Boolean)
    .join(" - ");

  const taxInfo = [
    company?.vatId ? `UID / USt-ID: ${company.vatId}` : null,
    company?.taxNumber ? `Steuernummer: ${company.taxNumber}` : null
  ]
    .filter(Boolean)
    .join(" - ");

  doc.font("Helvetica").fontSize(7.2).fillColor(colors.muted);
  if (companyInfo) doc.text(companyInfo, page.marginX, page.footerY, { width: 507, align: "center" });
  if (taxInfo) doc.text(taxInfo, page.marginX, page.footerY + 11, { width: 507, align: "center" });
  drawOpenRechnungMark(doc, page.footerY + 26);
  doc.restore();
}

function ensureRoom(doc: PDFKit.PDFDocument, input: PdfInput, y: number, needed: number): number {
  if (y + needed < page.footerY - 20) return y;
  drawFooter(doc, input.company);
  doc.addPage();
  drawTopRule(doc, input);
  return 44;
}

function textHeight(doc: PDFKit.PDFDocument, text: string, width: number, fontSize = 9.5, font = "Helvetica", lineGap = 2): number {
  doc.font(font).fontSize(fontSize);
  return doc.heightOfString(text, { width, lineGap });
}

function drawHeader(doc: PDFKit.PDFDocument, input: PdfInput) {
  const companyName = input.company?.companyName ?? "Meine Firma";
  drawTopRule(doc, input);

  const logo = imageBufferFromDataUrl(input.company?.logoDataUrl);
  if (logo) {
    doc.roundedRect(page.marginX, 34, 46, 46, 10).strokeColor(colors.line).lineWidth(0.7).stroke();
    doc.image(logo, page.marginX + 4, 38, { fit: [38, 38], align: "center", valign: "center" });
  } else {
    doc.roundedRect(page.marginX, 34, 46, 46, 10).fill(brandColor(input));
    doc.font("Helvetica-Bold").fontSize(12).fillColor(colors.white).text(companyInitials(companyName) || "OR", page.marginX, 51, {
      width: 46,
      align: "center"
    });
  }

  doc.font("Helvetica-Bold").fontSize(16).fillColor(colors.ink).text(companyName, page.marginX + 62, 38, { width: 290 });
  doc.font("Helvetica").fontSize(8.5).fillColor(colors.muted).text(oneLineAddress(input.company), page.marginX + 62, 60, {
    width: 310,
    lineGap: 2
  });

  doc.font("Helvetica-Bold").fontSize(27).fillColor(colors.ink).text(input.kind, 375, 36, { width: 176, align: "right" });
  doc.font("Helvetica-Bold").fontSize(10.5).fillColor(brandColor(input)).text(input.number, 375, 69, { width: 176, align: "right" });

  doc.moveTo(page.marginX, 100).lineTo(page.width - page.marginX, 100).strokeColor(colors.line).lineWidth(1).stroke();
}

function drawAddressAndMeta(doc: PDFKit.PDFDocument, input: PdfInput, startY: number): number {
  const sender = oneLineAddress(input.company);
  const address = addressLines(input.customer).join("\n") + (input.customer.vatId ? `\nUID / USt-ID: ${input.customer.vatId}` : "");
  const addressLineCount = address.split("\n").filter(Boolean).length;
  const addressBlockHeight = 46 + Math.max(94, addressLineCount * 18 + 28);

  const metaEntries: Array<[string, string]> = [["Ausstellungsdatum", formatDate(input.date)]];
  if (input.kind === "Angebot" && input.secondaryDateLabel && input.secondaryDate) {
    metaEntries.push([input.secondaryDateLabel, formatDate(input.secondaryDate)]);
  }
  if (input.kind === "Rechnung") {
    if (input.servicePeriod) metaEntries.push(["Leistungszeitraum", input.servicePeriod]);
    if (!input.servicePeriod && input.secondaryDateLabel && input.secondaryDate) {
      metaEntries.push([input.secondaryDateLabel, formatDate(input.secondaryDate)]);
    }
    if (input.paymentDueDate) metaEntries.push(["Faellig am", formatDate(input.paymentDueDate)]);
  }

  const metaBlockHeight = 46 + Math.max(94, metaEntries.length * 42 + 28);
  const blockHeight = Math.max(addressBlockHeight, metaBlockHeight);
  const metaX = 368;

  if (sender) {
    doc.font("Helvetica").fontSize(7.2).fillColor(colors.muted).text(sender, page.marginX, startY, { width: 285 });
    doc.moveTo(page.marginX, startY + 11).lineTo(page.marginX + 285, startY + 11).strokeColor(colors.line).lineWidth(0.4).stroke();
  }

  doc.font("Helvetica-Bold").fontSize(8.5).fillColor(colors.muted).text("EMPFAENGER", page.marginX, startY + 31, { width: 120 });
  doc.roundedRect(page.marginX, startY + 46, 285, blockHeight - 46, 10).fill(colors.paper);
  doc.font("Helvetica").fontSize(9.5).fillColor(colors.ink).text(address, page.marginX + 14, startY + 60, { width: 257, lineGap: 4 });

  doc.roundedRect(metaX, startY + 46, 183, blockHeight - 46, 10).fillAndStroke(colors.white, colors.line);
  let y = startY + 62;
  for (const [label, value] of metaEntries) {
    doc.font("Helvetica").fontSize(7.8).fillColor(colors.muted).text(label.toUpperCase(), metaX + 14, y, { width: 155 });
    doc.font("Helvetica-Bold").fontSize(9.5).fillColor(colors.ink).text(value, metaX + 14, y + 11, { width: 155, lineGap: 1 });
    y += 42;
  }

  return startY + blockHeight + 24;
}

function drawParagraph(doc: PDFKit.PDFDocument, input: PdfInput, y: number, text: string, options?: { muted?: boolean; box?: boolean }): number {
  if (!text.trim()) return y;
  const width = options?.box ? 479 : 507;
  const height = textHeight(doc, text, width, 9.5, "Helvetica", 2);
  y = ensureRoom(doc, input, y, height + (options?.box ? 30 : 10));

  if (options?.box) {
    doc.roundedRect(page.marginX, y, 507, height + 24, 10).fillAndStroke(colors.white, colors.line);
    doc.font("Helvetica").fontSize(9.5).fillColor(options.muted ? colors.muted : colors.ink).text(text, page.marginX + 14, y + 12, {
      width,
      lineGap: 2
    });
    return y + height + 40;
  }

  doc.font("Helvetica").fontSize(9.5).fillColor(options?.muted ? colors.muted : colors.ink).text(text, page.marginX, y, {
    width,
    lineGap: 2
  });
  return doc.y + 18;
}

function drawTableHeader(doc: PDFKit.PDFDocument, y: number, chargeVat: boolean) {
  doc.roundedRect(page.marginX, y, 507, 26, 7).fill(colors.ink);
  doc.font("Helvetica-Bold").fontSize(8).fillColor(colors.white);

  if (chargeVat) {
    doc.text("Leistung / Material", page.marginX + 11, y + 9, { width: 215 });
    doc.text("Menge", 282, y + 9, { width: 52, align: "right" });
    doc.text("Einzel netto", 344, y + 9, { width: 70, align: "right" });
    doc.text("USt", 424, y + 9, { width: 42, align: "right" });
    doc.text("Netto", 480, y + 9, { width: 60, align: "right" });
    return;
  }

  doc.text("Leistung / Material", page.marginX + 11, y + 9, { width: 245 });
  doc.text("Menge", 315, y + 9, { width: 58, align: "right" });
  doc.text("Einzel netto", 386, y + 9, { width: 78, align: "right" });
  doc.text("Betrag", 478, y + 9, { width: 62, align: "right" });
}

function drawItems(doc: PDFKit.PDFDocument, input: PdfInput, startY: number): number {
  const chargeVat = shouldChargeVat(input.taxMode);
  let y = ensureRoom(doc, input, startY, 58);
  drawTableHeader(doc, y, chargeVat);
  y += 32;

  input.items.forEach((item, index) => {
    const netCents = Math.round(item.quantity * item.unitPriceNetCents);
    const descriptionWidth = chargeVat ? 215 : 245;
    const rowHeight = Math.max(30, textHeight(doc, item.description, descriptionWidth, 9.2, "Helvetica-Bold", 1) + 18);
    y = ensureRoom(doc, input, y, rowHeight + 10);

    if (y === 44) {
      drawTableHeader(doc, y, chargeVat);
      y += 32;
    }

    if (index % 2 === 0) {
      doc.roundedRect(page.marginX, y - 5, 507, rowHeight, 6).fill(colors.paper);
    }

    doc.font("Helvetica-Bold").fontSize(9.2).fillColor(colors.ink).text(item.description, page.marginX + 11, y + 3, {
      width: descriptionWidth,
      lineGap: 1
    });

    if (chargeVat) {
      doc.font("Helvetica").fontSize(9).fillColor(colors.ink);
      doc.text(`${item.quantity.toLocaleString("de-AT")} ${item.unit}`, 282, y + 3, { width: 52, align: "right" });
      doc.text(formatMoney(item.unitPriceNetCents), 344, y + 3, { width: 70, align: "right" });
      doc.text(`${item.taxRate.toLocaleString("de-AT")} %`, 424, y + 3, { width: 42, align: "right" });
      doc.font("Helvetica-Bold").text(formatMoney(netCents), 480, y + 3, { width: 60, align: "right" });
    } else {
      doc.font("Helvetica").fontSize(9).fillColor(colors.ink);
      doc.text(`${item.quantity.toLocaleString("de-AT")} ${item.unit}`, 315, y + 3, { width: 58, align: "right" });
      doc.text(formatMoney(item.unitPriceNetCents), 386, y + 3, { width: 78, align: "right" });
      doc.font("Helvetica-Bold").text(formatMoney(netCents), 478, y + 3, { width: 62, align: "right" });
    }

    y += rowHeight + 6;
  });

  doc.moveTo(page.marginX, y).lineTo(page.width - page.marginX, y).strokeColor(colors.line).lineWidth(0.8).stroke();
  return y + 18;
}

function taxBreakdown(items: PdfItem[]): Array<{ taxRate: number; netCents: number; taxCents: number }> {
  const grouped = new Map<number, { taxRate: number; netCents: number; taxCents: number }>();
  for (const item of items) {
    const netCents = Math.round(item.quantity * item.unitPriceNetCents);
    const taxCents = Math.round(netCents * (item.taxRate / 100));
    const current = grouped.get(item.taxRate) ?? { taxRate: item.taxRate, netCents: 0, taxCents: 0 };
    current.netCents += netCents;
    current.taxCents += taxCents;
    grouped.set(item.taxRate, current);
  }
  return Array.from(grouped.values()).sort((a, b) => a.taxRate - b.taxRate);
}

function drawTaxNote(doc: PDFKit.PDFDocument, input: PdfInput, y: number): number {
  const note = taxModePdfNote(input.taxMode);
  if (!note) return y;

  const height = textHeight(doc, note, 383, 9, "Helvetica", 2);
  y = ensureRoom(doc, input, y, Math.max(44, height + 24));
  doc.roundedRect(page.marginX, y, 507, Math.max(42, height + 24), 10).fillAndStroke("#fffaf0", colors.line);
  doc.font("Helvetica-Bold").fontSize(9).fillColor(colors.ink).text("Hinweis", page.marginX + 14, y + 13, { width: 82 });
  doc.font("Helvetica").fontSize(9).fillColor(colors.ink).text(note, page.marginX + 104, y + 13, { width: 385, lineGap: 2 });
  return y + Math.max(42, height + 24) + 18;
}

function drawTotals(doc: PDFKit.PDFDocument, input: PdfInput, y: number): number {
  const chargeVat = shouldChargeVat(input.taxMode);
  const breakdown = chargeVat ? taxBreakdown(input.items) : [];
  const showBreakdown = chargeVat && breakdown.length > 1;
  const boxHeight = chargeVat ? 104 : 78;
  y = ensureRoom(doc, input, y, boxHeight + 24);

  if (showBreakdown) {
    doc.font("Helvetica-Bold").fontSize(9).fillColor(colors.ink).text("USt-Aufschluesselung", page.marginX, y + 4, { width: 210 });
    let taxY = y + 21;
    for (const row of breakdown) {
      doc.font("Helvetica").fontSize(8.6).fillColor(colors.muted).text(`${row.taxRate.toLocaleString("de-AT")} % auf ${formatMoney(row.netCents)}`, page.marginX, taxY, {
        width: 165
      });
      doc.text(formatMoney(row.taxCents), page.marginX + 172, taxY, { width: 78, align: "right" });
      taxY += 14;
    }
  }

  const boxX = 340;
  doc.roundedRect(boxX, y, 211, boxHeight, 10).fillAndStroke(colors.paper, colors.line);
  doc.font("Helvetica").fontSize(9.5).fillColor(colors.ink);
  doc.text("Zwischensumme netto", boxX + 14, y + 16, { width: 118 });
  doc.text(formatMoney(input.subtotalNetCents), boxX + 134, y + 16, { width: 60, align: "right" });

  if (chargeVat) {
    doc.text("Umsatzsteuer", boxX + 14, y + 39, { width: 118 });
    doc.text(formatMoney(input.taxTotalCents), boxX + 134, y + 39, { width: 60, align: "right" });
    doc.moveTo(boxX + 14, y + 64).lineTo(boxX + 197, y + 64).strokeColor(colors.line).lineWidth(0.8).stroke();
    doc.font("Helvetica-Bold").fontSize(12).fillColor(colors.ink).text("Gesamt brutto", boxX + 14, y + 75, { width: 105 });
    doc.font("Helvetica-Bold").fontSize(12).fillColor(brandColor(input)).text(formatMoney(input.totalGrossCents), boxX + 122, y + 75, {
      width: 72,
      align: "right"
    });
  } else {
    doc.moveTo(boxX + 14, y + 41).lineTo(boxX + 197, y + 41).strokeColor(colors.line).lineWidth(0.8).stroke();
    doc.font("Helvetica-Bold").fontSize(12).fillColor(colors.ink).text("Gesamtbetrag", boxX + 14, y + 52, { width: 105 });
    doc.font("Helvetica-Bold").fontSize(12).fillColor(brandColor(input)).text(formatMoney(input.totalGrossCents), boxX + 122, y + 52, {
      width: 72,
      align: "right"
    });
  }

  return y + boxHeight + 22;
}

function drawNoteAndPayment(doc: PDFKit.PDFDocument, input: PdfInput, y: number): number {
  if (input.kind === "Rechnung" && input.company && (input.company.bankName || input.company.iban || input.company.bic)) {
    const lines = [
      input.company.bankName ? `Bank: ${input.company.bankName}` : null,
      input.company.iban ? `IBAN: ${input.company.iban}` : null,
      input.company.bic ? `BIC: ${input.company.bic}` : null
    ].filter(Boolean) as string[];
    const text = lines.join("\n");
    const height = textHeight(doc, text, 475, 9.2, "Helvetica", 3);
    y = ensureRoom(doc, input, y, height + 46);
    doc.roundedRect(page.marginX, y, 507, height + 38, 10).fillAndStroke(colors.sand, colors.line);
    doc.font("Helvetica-Bold").fontSize(9.8).fillColor(colors.ink).text("Zahlungsinformationen", page.marginX + 14, y + 12);
    doc.font("Helvetica").fontSize(9.2).fillColor(colors.ink).text(text, page.marginX + 14, y + 29, { width: 475, lineGap: 3 });
    y += height + 56;
  }

  if (input.note) {
    y = drawParagraph(doc, input, y, input.note, { muted: true, box: true });
  }

  return y;
}

export async function buildDocumentPdf(input: PdfInput): Promise<Buffer> {
  const doc = new PDFDocument({ size: "A4", margin: 0, autoFirstPage: true });
  const chunks: Buffer[] = [];

  doc.on("data", (chunk: Buffer) => chunks.push(chunk));
  const done = new Promise<Buffer>((resolve) => {
    doc.on("end", () => resolve(Buffer.concat(chunks)));
  });

  drawHeader(doc, input);
  let y = drawAddressAndMeta(doc, input, 122);
  y = drawParagraph(doc, input, y, input.introText || defaultIntroText(input.kind));
  y = drawItems(doc, input, y);
  y = drawTaxNote(doc, input, y);
  y = drawParagraph(doc, input, y, input.outroText || defaultOutroText(input.kind), { muted: true, box: true });
  y = drawTotals(doc, input, y);
  drawNoteAndPayment(doc, input, y);
  drawFooter(doc, input.company);

  doc.end();
  return done;
}
