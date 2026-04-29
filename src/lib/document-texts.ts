export const defaultDocumentTexts = {
  quoteIntroText: "Vielen Dank fuer Ihre Anfrage. Gerne bieten wir Ihnen folgende Leistungen an:",
  quoteOutroText: "Dieses Angebot ist bis zum genannten Datum gueltig. Bei Fragen stehen wir gerne zur Verfuegung.",
  invoiceIntroText: "Fuer die erbrachten Leistungen erlauben wir uns, wie folgt zu verrechnen:",
  invoiceOutroText: ""
} as const;

export function defaultIntroText(kind: "Angebot" | "Rechnung"): string {
  return kind === "Angebot" ? defaultDocumentTexts.quoteIntroText : defaultDocumentTexts.invoiceIntroText;
}

export function defaultOutroText(kind: "Angebot" | "Rechnung"): string {
  return kind === "Angebot" ? defaultDocumentTexts.quoteOutroText : defaultDocumentTexts.invoiceOutroText;
}
