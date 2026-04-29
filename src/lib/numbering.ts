import { prisma } from "@/lib/prisma";

type NumberKind = "QUOTE" | "INVOICE";

export function cleanPrefix(value: string | null | undefined, fallback: string): string {
  const cleaned = String(value ?? "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 8);
  return cleaned || fallback;
}

export function numberFor(prefix: string, year: number, sequence: number): string {
  return `${prefix}-${year}-${String(sequence).padStart(4, "0")}`;
}

export function highestExistingSequence(numbers: string[], prefix: string, year: number): number {
  const pattern = new RegExp(`^${prefix}-${year}-(\\d{4,})$`);
  return numbers.reduce((highest, number) => {
    const match = number.match(pattern);
    if (!match) return highest;
    return Math.max(highest, Number.parseInt(match[1], 10));
  }, 0);
}

export function nextSequenceNumber(sequenceNext: number | null | undefined, existingNumbers: string[], prefix: string, year: number): number {
  const existingNext = highestExistingSequence(existingNumbers, prefix, year) + 1;
  return Math.max(sequenceNext ?? 1, existingNext);
}

async function nextDocumentNumber(userId: string, kind: NumberKind): Promise<string> {
  const year = new Date().getFullYear();
  const company = await prisma.companyProfile.findUnique({
    where: { userId },
    select: { quotePrefix: true, invoicePrefix: true }
  });
  const prefix = kind === "QUOTE" ? cleanPrefix(company?.quotePrefix, "ANG") : cleanPrefix(company?.invoicePrefix, "RE");

  return prisma.$transaction(async (tx) => {
    const [sequence, existingNumbers] = await Promise.all([
      tx.numberSequence.findUnique({
        where: { userId_kind_year: { userId, kind, year } }
      }),
      kind === "QUOTE"
        ? tx.quote.findMany({
            where: { userId, number: { startsWith: `${prefix}-${year}-` } },
            select: { number: true }
          })
        : tx.invoice.findMany({
            where: { userId, number: { startsWith: `${prefix}-${year}-` } },
            select: { number: true }
          })
    ]);

    const nextNumber = nextSequenceNumber(
      sequence?.nextNumber,
      existingNumbers.map((item) => item.number),
      prefix,
      year
    );

    if (sequence) {
      await tx.numberSequence.update({
        where: { id: sequence.id },
        data: {
          prefix,
          nextNumber: nextNumber + 1
        }
      });
    } else {
      await tx.numberSequence.create({
        data: {
          userId,
          kind,
          year,
          prefix,
          nextNumber: nextNumber + 1
        }
      });
    }

    return numberFor(prefix, year, nextNumber);
  });
}

export function nextQuoteNumber(userId: string): Promise<string> {
  return nextDocumentNumber(userId, "QUOTE");
}

export function nextInvoiceNumber(userId: string): Promise<string> {
  return nextDocumentNumber(userId, "INVOICE");
}
